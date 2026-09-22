import CodeBlockWriter from "code-block-writer";
import { join, map, forEach, replace } from "lodash/fp";
import { pipe } from "fp-ts/function";
import {
  Project,
  SyntaxKind,
  SourceFile,
  VariableDeclaration,
  ParameterDeclaration,
  TypeParameterDeclaration,
  PropertySignature,
} from "ts-morph";

import { curriedFilterMap, capitalize } from "./Utilities";

const getListOfFunctionNamesFromFile = (
  pred: (arg: string) => boolean,
  fileName: string,
): Array<string> => {
  const project = new Project({});
  const rawSourceFile: SourceFile = project.addSourceFileAtPath(fileName);
  return curriedFilterMap((node: VariableDeclaration) => {
    if (pred(node.getName())) {
      return node.getName();
    }
  })(rawSourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration));
};

const createAListOfFunctions = async (
  functionCreator: (arg: string) => string,
  funcs: Array<string>,
  fileName: string,
): Promise<void> => {
  const project = new Project({});
  const rawSourceFile: SourceFile = project.addSourceFileAtPath(fileName);
  const newFuncs = map(functionCreator)(funcs);
  rawSourceFile.addStatements(newFuncs);
  await rawSourceFile.save();
  return;
};

const funcs = [
  "getYearFromDate",
  "getMonthFromDate",
  "getDayFromDate",
  "getDayNameFromDate",
  "getHourPartFromDate",
  "getMinutePartFromDate",
];

const getFromCurrentDateCreator = (funcName: string): string => {
  const creator = new CodeBlockWriter();
  return creator
    .write(`export const ${replace("Date", "CurrentDate", funcName)} = `)
    .write(`getXFromCurrentDate(${funcName})`)
    .toString();
};

// await createAListOfFunctions(
//   getFromCurrentDateCreator,
//   funcs,
//   "src/lib/timestamps.ts",
// );

const createCurriedVersionsOfArrowFunctions = async (
  file: string,
  funcs: Array<string>,
): Promise<void> => {
  const project = new Project({});
  const sourceFile = project.addSourceFileAtPath(file);
  forEach((func: string): void => {
    const varDef = sourceFile.getVariableStatementOrThrow(func);
    const funcDef = varDef.getFirstDescendantByKindOrThrow(
      SyntaxKind.ArrowFunction,
    );
    const funcParams = funcDef.getParameters();
    const typeParams = map((x: TypeParameterDeclaration): string =>
      x.getText(),
    )(funcDef.getTypeParameters());
    const returnTypeNode = funcDef.getReturnTypeNode()?.getText();
    const index = varDef.getChildIndex();
    const curriedVersionName = pipe(
      func,
      capitalize,
      (x: string) => `curried${x}`,
    );
    const funcParamsWithoutTypes = map(
      (x: ParameterDeclaration): string => x.getStructure().name,
    )(funcParams);
    const curriedReturnStatement = pipe(
      funcParamsWithoutTypes,
      (x: Array<string>): string => `return ${func}(${join(", ", x)})`,
    );
    const funcParamsAsStrings = map((x: ParameterDeclaration): string =>
      x.getText(),
    )(funcParams);
    const curriedParams = pipe(
      funcParamsAsStrings,
      map((x: string) => `(${x})`),
      join(" => "),
    );
    const curriedVersion = new CodeBlockWriter();
    // EXTRACTME
    curriedVersion
      .write(`export const ${curriedVersionName} = `)
      .conditionalWrite(
        typeParams.length > 0,
        () => `<${join(", ", typeParams)}>`,
      )
      .write(curriedParams)
      .conditionalWrite(!!returnTypeNode, () => `: ${returnTypeNode}`)
      .space()
      .write("=>")
      .space()
      .block(() => {
        curriedVersion.write(curriedReturnStatement);
      });
    sourceFile.insertStatements(index + 1, curriedVersion.toString());
  })(funcs);
  await sourceFile.save();
};

const FUNCS = [
  "getFromRecord",
  "setRecord",
  "updateRecord",
  "updateInRecord",
  "getAllFromRecord",
  "setAllForRecord",
  "updateAllForRecord",
];

///await createCurriedVersionsOfArrowFunctions("src/util/transformers.ts", FUNCS)

const FUNCSTOCREATE = [
  "repeaterType",
  "repeaterValue",
  "repeaterUnit",
  "delayType",
  "delayValue",
  "delayUnit",
];

const createSettersForObject = async (
  objectName: string,
  recordName: string,
  file: string,
): Promise<void> => {
  const project = new Project({});
  const sourceFile = project.addSourceFileAtPath(file);
  const typesFile = project.addSourceFileAtPath("src/Types.ts");
  const props = typesFile
    .getTypeAliasOrThrow(objectName)
    .getFirstDescendantByKindOrThrow(SyntaxKind.TypeLiteral)
    .getProperties();
  const keys = map((prop: PropertySignature): string => {
    return prop.getName();
  })(props);

  const newSetters = map((key: string): string => {
    const setter = new CodeBlockWriter();
    return setter
      .write(`export const ${key}Change = curriedSetRecord`)
      .write(`<${objectName}, ${recordName}`)
      .space()
      .quote(key)
      .write(">")
      .write("(")
      .quote(key)
      .write(")")
      .toString();
  })(keys);

  sourceFile.addStatements(newSetters);
  await sourceFile.save();
};

const createGettersForObject = async (
  objectName: string,
  file: string,
): Promise<void> => {
  const project = new Project({});
  const sourceFile = project.addSourceFileAtPath(file);
  const typesFile = project.addSourceFileAtPath("src/Types.ts");
  const props = typesFile
    .getTypeAliasOrThrow(objectName)
    .getFirstDescendantByKindOrThrow(SyntaxKind.TypeLiteral)
    .getProperties();
  const keys = map((prop: PropertySignature): string => {
    return prop.getName();
  })(props);

  const newSetters = map((key: string): string => {
    const setter = new CodeBlockWriter();
    return setter
      .write(`export const get${capitalize(key)} = curriedGetFromRecord`)
      .write(`<${objectName},`)
      .space()
      .quote(key)
      .write(">")
      .write("(")
      .quote(key)
      .write(")")
      .toString();
  })(keys);

  sourceFile.addStatements(newSetters);
  await sourceFile.save();
};

await createGettersForObject("OrgTimestampPart", "src/lib/timestamps.ts");
