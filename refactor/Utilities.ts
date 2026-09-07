import { map, includes, reduce, isString, compact, curry } from "lodash/fp";
import CodeBlockWriter from "code-block-writer";
import { format } from "prettier";
import {
  Project,
  SyntaxKind,
  SourceFile,
  Node,
  SourceFileStructure,
  ParameterDeclarationStructure,
  StatementStructures,
  printStructure,
  FunctionDeclarationStructure,
  KindToNodeMappings,
} from "ts-morph";

export const capitalize = (x: string) => x[0].toUpperCase() + x.slice(1);

export const filterMap = <A, B>(
  func: (arg: A) => B | undefined,
  array: Array<A>,
): Array<B> => {
  const mapped: Array<B | undefined> = map(func)(array);
  return compact(mapped);
};

export const curriedFilterMap =
  <A, B>(func: (arg: A) => B | undefined) =>
  (array: Array<A>): Array<B> => {
    const mapped: Array<B | undefined> = map(func)(array);
    return compact(mapped);
  };

export const includesAny = includes("any");

export const arrayToSet = <T>(x: Array<T>): Set<T> => new Set(x);
export const setToArray = <T>(x: Set<T>): Array<T> => Array.from(x.values());
export const curriedSetDifference =
  <T>(setB: Set<T>) =>
  (setA: Set<T>): Set<T> => {
    return setA.difference(setB);
  };

export const reduceReplace = (
  replacementTuples: Array<[string, string]>,
  strToEdit: string,
): string => {
  return reduce(
    (
      currStrToEdit: string,
      [valueToReplace, replacement]: [string, string],
    ): string => {
      return currStrToEdit.replace(valueToReplace, replacement);
    },
    strToEdit,
    replacementTuples,
  );
};

export const reduceReplaceAll = (
  valuesToReplace: Array<[string, string]>,
  strToEdit: string,
): string => {
  return reduce(
    (
      currStrToEdit: string,
      [valueToReplace, replacement]: [string, string],
    ): string => {
      return currStrToEdit.replaceAll(valueToReplace, replacement);
    },
    strToEdit,
    valuesToReplace,
  );
};

export const runCodeFixesOnSourceFile = (
  sourceFile: SourceFile,
): SourceFile => {
  sourceFile.fixMissingImports();
  sourceFile.organizeImports();
  return sourceFile;
};

export const functionDeclarationToArrowFuncString = (
  func: FunctionDeclarationStructure,
): string => {
  const arrowFunc = new CodeBlockWriter();
  const params = curriedFilterMap(
    (x: ParameterDeclarationStructure): string | undefined => {
      return x && printStructure(x);
    },
  )(func?.parameters);
  const body = curriedFilterMap(
    (x: string | StatementStructures | undefined): string | undefined => {
      if (isString(x)) return x;
      if (x?.kind) return printStructure(x);
      return;
    },
  )(func.statements);

  const returnTypeNode = func.returnType;
  arrowFunc
    .write(`(${params.join(", ")})`)
    .conditionalWrite(!!returnTypeNode, `: ${returnTypeNode}`)
    .space()
    .write("=>")
    .space()
    .block(() => {
      arrowFunc.write(body.join("\n"));
    });
  console.log(arrowFunc.toString());
  return arrowFunc.toString();
};

export const replaceSourceFileText = (
  newText: string,
  sourceFile: SourceFile,
): SourceFile => {
  const newStruct: SourceFileStructure = {
    ...sourceFile.getStructure(),
    statements: newText,
  };
  sourceFile.set(newStruct);
  return sourceFile;
};

export const formatText = async (text: string): Promise<string> =>
  format(text, { parser: "typescript" });
export const formatSourceFileText = async (
  sourceFile: SourceFile,
): Promise<SourceFile> => {
  const newText = await formatText(sourceFile.getText());
  return replaceSourceFileText(newText, sourceFile);
};

const baseCopyNode = () => {
  const tempProject = new Project({ useInMemoryFileSystem: true });
  return <TKind extends SyntaxKind>(kind: TKind) =>
    (node: Node): KindToNodeMappings[TKind] => {
      const tempFileWithNode = tempProject.createSourceFile(
        "temp",
        node.getText(),
        {
          overwrite: true,
        },
      );
      const copiedNode = tempFileWithNode.getFirstDescendantByKindOrThrow(kind);
      return copiedNode.asKindOrThrow(kind);
    };
};

export const copyNode = baseCopyNode();
export const copyArrowFunction = copyNode(SyntaxKind.ArrowFunction);

const baseCreateNewXExpression = () => {
  const tempProject = new Project({ useInMemoryFileSystem: true });
  return <TKind extends SyntaxKind>(nodeText: string, kind: TKind) =>
    (): KindToNodeMappings[TKind] => {
      const tempFileWithNode = tempProject.createSourceFile("temp", nodeText, {
        overwrite: true,
      });
      const copiedNode = tempFileWithNode.getFirstDescendantByKindOrThrow(kind);
      return copiedNode.asKindOrThrow(kind);
    };
};

const createNewXExpression = baseCreateNewXExpression();
export const createNewObjectLiteralExpression = createNewXExpression(
  "const x = {}",
  SyntaxKind.ObjectLiteralExpression,
);
