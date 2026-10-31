import { transformSync } from "@babel/core";
// removed auto memoization and useCallback wrapping code from react-declassify
import plugin from "react-declassify";
import {
  find,
  map,
  flow,
  reduce,
  isEmpty,
  startsWith,
  includes,
  curry,
  compact,
  overSome,
  first,
  join,
  spread,
  filter,
  isString,
  partialRight,
} from "lodash/fp";
import {
  Project,
  SyntaxKind,
  SourceFile,
  Node,
  ArrowFunction,
  ObjectLiteralExpression,
  StatementStructures,
  SourceFileStructure,
  CallExpression,
  FunctionDeclaration,
  FunctionExpression,
  printStructure,
  VariableDeclaration,
  VariableStatementStructure,
  FunctionDeclarationStructure,
  StructureKind,
  VariableDeclarationKind,
  ParameterDeclaration,
  Statement,
  VariableDeclarationStructure,
  ParameterDeclarationStructure,
  ExpressionStatement,
  ImportDeclarationStructure,
} from "ts-morph";
import {
  filterMap,
  replaceSourceFileText,
  formatSourceFileText,
  runCodeFixesOnSourceFile,
  functionDeclarationToArrowFuncString,
  copyArrowFunction,
} from "./Utilities";
import { addTypeAnnotationsToSourceFile } from "./typing";

const convertFunctionDeclarationIntoArrowFunction = (
  node: FunctionDeclaration,
): VariableStatementStructure => {
  const name = node.getNameOrThrow();
  const struct = node.getStructure();
  if (struct.kind === StructureKind.FunctionOverload) {
    throw new Error("This should never happen");
  }

  const parameters = struct.parameters;
  const statements = struct.statements;
  const arrow: FunctionDeclarationStructure = {
    kind: StructureKind.Function,
    parameters,
    statements,
  };

  const variableDeclaration: VariableDeclarationStructure = {
    name,
    kind: StructureKind.VariableDeclaration,
    initializer: functionDeclarationToArrowFuncString(arrow),
  };

  return {
    kind: StructureKind.VariableStatement,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [variableDeclaration],
  };
};
const convertFunctionExpressionIntoArrowFunction = (
  node: FunctionExpression,
): VariableStatementStructure => {
  const parameters = map(
    (node: ParameterDeclaration): ParameterDeclarationStructure =>
      node.getStructure(),
  )(node.getParameters());
  const statements = map((node: Statement): string => node.getText())(
    node.getStatements(),
  );
  const name = node.getNameOrThrow();
  const arrow: FunctionDeclarationStructure = {
    kind: StructureKind.Function,
    parameters,
    statements,
  };

  const variableDeclaration: VariableDeclarationStructure = {
    name,
    kind: StructureKind.VariableDeclaration,
    initializer: functionDeclarationToArrowFuncString(arrow),
  };

  return {
    kind: StructureKind.VariableStatement,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [variableDeclaration],
  };
};

const convertFunctionExpressionIntoArrowFunctionString = flow([
  convertFunctionExpressionIntoArrowFunction,
  printStructure,
]);
const convertFunctionDeclarationIntoArrowFunctionString = flow([
  convertFunctionDeclarationIntoArrowFunction,
  printStructure,
]);

const replaceFunctionDeclarationWithArrowFunction = (
  node: FunctionDeclaration,
): void => {
  const newStruct = convertFunctionDeclarationIntoArrowFunctionString(node);
  const index = node.getChildIndex();
  const parent = node.getParent();
  if (!Node.isStatemented(parent)) return;
  parent.removeStatement(index);
  parent.insertStatements(index, newStruct);
};

const replaceFunctionExpressionWithArrowFunction = (
  node: FunctionExpression,
): void => {
  const newStruct = convertFunctionExpressionIntoArrowFunctionString(node);
  const parent = node.getFirstAncestorByKindOrThrow(
    SyntaxKind.VariableStatement,
  );
  const file = parent.getParent();
  if (!Node.isStatemented(file)) return;
  const index = parent.getChildIndex();
  file.removeStatement(index);
  file.insertStatements(index, newStruct);
};

const replaceTopLevelFunctionExpressionWithArrowFunction = (
  sourceFile: SourceFile,
): SourceFile => {
  const expr = sourceFile.getFirstDescendantByKindOrThrow(
    SyntaxKind.FunctionExpression,
  );
  replaceFunctionExpressionWithArrowFunction(expr);
  return sourceFile;
};

const replaceFunctionDeclarationsWithArrowFunctions = (
  sourceFile: SourceFile,
): SourceFile => {
  sourceFile.forEachDescendant((node: Node): void => {
    if (Node.isFunctionDeclaration(node)) {
      replaceFunctionDeclarationWithArrowFunction(node);
    }
  });
  return sourceFile;
};

const removeBindAllStatement = (sourceFile: SourceFile): SourceFile => {
  const bindAllExpr: CallExpression | undefined = find(
    (node: CallExpression) => {
      return node.getExpression().getText() === "bindAll";
    },
  )(sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression));

  if (!bindAllExpr) return sourceFile;

  const bindAllExprParent = bindAllExpr.getParent();

  if (!Node.isExpressionStatement(bindAllExprParent)) return sourceFile;

  bindAllExprParent.remove();
  return sourceFile;
};

const convertClassComponentIntoFunction = async (
  filePath: string,
): Promise<void> => {
  const project = new Project({});
  const rawSourceFile: SourceFile = project.addSourceFileAtPath(filePath);
  const sourceFile: SourceFile = removeBindAllStatement(rawSourceFile);
  const filename = sourceFile.getBaseName();
  const sourceFileText = sourceFile.getText();
  const result = transformSync(sourceFileText, {
    filename,
    plugins: ["@babel/plugin-syntax-jsx", plugin],
    presets: ["@babel/preset-typescript"],
  });

  if (!result || !result.code) return;

  const { code } = result;
  const newSourceFile = flow([
    replaceSourceFileText,
    replaceFunctionDeclarationsWithArrowFunctions,
    replaceTopLevelFunctionExpressionWithArrowFunction,
  ])(code, sourceFile);
  const formattedSourceFile = await formatSourceFileText(newSourceFile);
  const finalSourceFile = addTypeAnnotationsToSourceFile(formattedSourceFile);
  await finalSourceFile.save();
};

// await convertClassComponentIntoFunction("src/components/OrgFile/components/TimestampEditorModal/components/TimestampEditor/index.tsx")

const maybeReturnOldReduxDispatchLine = (
  node: ExpressionStatement,
): ExpressionStatement | undefined => {
  const dispatcherPropAccessExpr = node
    .getFirstChildByKind(SyntaxKind.CallExpression)
    ?.getFirstChildByKind(SyntaxKind.PropertyAccessExpression);
  if (!dispatcherPropAccessExpr) return;
  if (
    overSome([includes("props.org"), includes("props.base")])(
      dispatcherPropAccessExpr.getText(),
    )
  ) {
    return node;
  }
};

const getOldReduxDispatchLines = (node: Node): Array<ExpressionStatement> => {
  return filterMap(maybeReturnOldReduxDispatchLine)(
    node.getDescendantsOfKind(SyntaxKind.ExpressionStatement),
  );
};

const filterForHandleFunctions = (
  variableDecl: VariableDeclaration,
): boolean => {
  const name = variableDecl.getName();
  if (!startsWith("handle", name)) return false;
  // skip over functions with redux code
  const usesOldReduxDispatch = getOldReduxDispatchLines(variableDecl);
  if (!isEmpty(usesOldReduxDispatch)) return false;
  return true;
};

const simplifyHandleFunction =
  (
    functionSimplifier: (
      name: string,
      func: VariableDeclaration,
    ) => [VariableDeclarationStructure, VariableDeclarationStructure],
  ) =>
  (
    variableDecl: VariableDeclaration,
  ): [string, VariableDeclarationStructure] => {
    const newName = flow([
      (oldName: string) => oldName.slice(6, oldName.length),
      (x: string) => x[0].toLowerCase() + x.slice(1),
    ])(variableDecl.getName());
    const [simplifiedVariableDecl, variableDeclForOtherFile] =
      functionSimplifier(newName, variableDecl);
    variableDecl.set(simplifiedVariableDecl);
    return [newName, variableDeclForOtherFile];
  };

const simplifyHandleFunctionsInComponentFile = (
  functionSimplifier: (
    name: string,
    func: VariableDeclaration,
  ) => [VariableDeclarationStructure, VariableDeclarationStructure],
  sourceFile: SourceFile,
): Array<[string, VariableDeclarationStructure]> => {
  const handleFunctions: Array<VariableDeclaration> = filter(
    filterForHandleFunctions,
    sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration),
  );
  return map(simplifyHandleFunction(functionSimplifier))(handleFunctions);
};

const renameVariableStatement = (
  name: string,
  variableDecl: VariableDeclarationStructure,
): VariableStatementStructure => {
  const variableDeclaration: VariableDeclarationStructure = {
    name,
    kind: StructureKind.VariableDeclaration,
    initializer: variableDecl.initializer,
  };
  return {
    kind: StructureKind.VariableStatement,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [variableDeclaration],
    isExported: true,
  };
};

const renameVariableStatements = map(spread(renameVariableStatement));

const addImportsFromFileToFile = curry(
  (
    namedImports: Array<string>,
    fromFile: SourceFile,
    sourceFile: SourceFile,
  ): SourceFile => {
    const moduleSpecifier =
      sourceFile.getRelativePathAsModuleSpecifierTo(fromFile);
    const importStruct: ImportDeclarationStructure = {
      kind: 16,
      namedImports,
      moduleSpecifier,
    };
    sourceFile.addImportDeclaration(importStruct);
    return sourceFile;
  },
);

const convertAllHandleFunctionsInFile = async (
  functionSimplifier: (
    name: string,
    func: VariableDeclaration,
  ) => [VariableDeclarationStructure, VariableDeclarationStructure],
  [filePath, fileToAddTo, filePathForTests]: [string, string, string],
): Promise<void> => {
  const project = new Project({});
  const [
    originalFile,
    fileForConvertedFunctions,
    testsFile,
  ]: Array<SourceFile> = map(
    (x: string): SourceFile => project.addSourceFileAtPath(x),
  )([filePath, fileToAddTo, filePathForTests]);
  const handleFunctions: Array<[string, VariableDeclarationStructure]> =
    simplifyHandleFunctionsInComponentFile(functionSimplifier, originalFile);
  const newFunctions: Array<VariableStatementStructure> =
    renameVariableStatements(handleFunctions);
  fileForConvertedFunctions.addStatements(newFunctions);
  const importsToAdd = map<[string, VariableDeclarationStructure], string>(
    first,
  )(handleFunctions);
  const [updatedOriginalFile, updatedTestsFile]: Array<SourceFile> = map(
    addImportsFromFileToFile(importsToAdd, fileForConvertedFunctions),
  )([originalFile, testsFile]);

  await Promise.all(
    map(formatSourceFileText)([
      fileForConvertedFunctions,
      updatedOriginalFile,
      updatedTestsFile,
    ]),
  );
  await Promise.all([
    fileForConvertedFunctions.save(),
    updatedOriginalFile.save(),
    updatedTestsFile.save(),
  ]);
};

const simplifyTimestampEventHandler = (
  newName: string,
  func: VariableDeclaration,
): [VariableDeclarationStructure, VariableDeclarationStructure] => {
  const oldName = func.getName();
  const arrowFunc = func.getFirstDescendantByKindOrThrow(
    SyntaxKind.ArrowFunction,
  );
  const parameters = map(
    (param: ParameterDeclaration): ParameterDeclarationStructure =>
      param.getStructure(),
  )(arrowFunc.getParameters());
  const bodyArrowFunc = arrowFunc
    .getFirstChildByKind(SyntaxKind.ReturnStatement)
    ?.getFirstChildByKind(SyntaxKind.ArrowFunction);
  const statementsForNewFunc: Array<string> = map(
    (node: ExpressionStatement): string => {
      const callExpr = node.getFirstDescendantByKind(SyntaxKind.CallExpression);
      if (!callExpr || callExpr.getExpression().getText() !== "onChange")
        return node.getText();
      const codeToReturn = flow([map((arg: Node) => arg.getText()), join(",")])(
        callExpr.getArguments(),
      );
      return `return ${codeToReturn}`;
    },
  )(func.getDescendantsOfKind(SyntaxKind.ExpressionStatement));

  const onChangeArgs: Array<string> = [
    ...map((struct: ParameterDeclarationStructure): string => struct.name)(
      parameters,
    ),
    "timestamp",
  ];

  const simplifiedStatements: Array<string> = ((): Array<string> => {
    if (!bodyArrowFunc)
      return [`onChange(${newName}(${join(", ", onChangeArgs)}))`];
    const simplifiedBodyArrowFunc = flow([
      copyArrowFunction,
      (x: ArrowFunction): ArrowFunction =>
        x.setBodyText(`onChange(${newName}(${join(", ", onChangeArgs)}))`),
    ])(bodyArrowFunc);
    const simplifiedBodyArrowFuncText: string =
      simplifiedBodyArrowFunc.getText();
    return [simplifiedBodyArrowFuncText];
  })();

  const simplifiedHandler: FunctionDeclarationStructure = {
    kind: StructureKind.Function,
    parameters,
    statements: simplifiedStatements,
    returnType: "void",
  };

  const newParam: ParameterDeclarationStructure = {
    name: "timestamp",
    kind: StructureKind.Parameter,
    type: "MapOf<OrgTimestampPart>",
  };

  const newHandleFunc: FunctionDeclarationStructure = {
    kind: StructureKind.Function,
    parameters: [...parameters, newParam],
    statements: statementsForNewFunc,
    returnType: "MapOf<OrgTimestampPart>",
  };

  const simplifiedVariableDecl: VariableDeclarationStructure = {
    name: oldName,
    kind: StructureKind.VariableDeclaration,
    initializer: functionDeclarationToArrowFuncString(simplifiedHandler),
  };

  const newStruct: VariableDeclarationStructure = {
    name: newName,
    kind: StructureKind.VariableDeclaration,
    initializer: functionDeclarationToArrowFuncString(newHandleFunc),
  };

  return [simplifiedVariableDecl, newStruct];
};

// await convertAllHandleFunctionsInFile(simplifyTimestampEventHandler, [
//   "src/components/OrgFile/components/TimestampEditorModal/TimestampEditor.tsx",
//   "src/lib/timestamps.ts",
//   "src/lib/__tests__/timestamp.unit.test.ts",
// ]);

const project = new Project({});
const rawSourceFile: SourceFile = project.addSourceFileAtPath(
  "src/lib/timestamps.ts",
);
const x = find((node: ObjectLiteralExpression) => {
  return !!node.getProperty("isActive") && !!node.getProperty("delayUnit");
})(rawSourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression));
console.log(map((x) => `${x.getName()}Change`)(x?.getProperties()));
