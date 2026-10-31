import {
  flow,
  remove,
  eq,
  concat,
  map,
  flatten,
  curry,
  identity,
  add,
  first,
  last,
  split,
  shuffle,
  reduce,
  sum,
  join,
  zipAll,
  zipObject,
  zipWith,
  initial,
  flatMap,
  spread,
  reverse,
  property,
  subtract,
  max,
  findIndex,
  divide,
  min,
  chunk,
  sortBy,
  every,
  size,
  inRange,
  partialRight,
  floor,
  multiply,
  compact,
  filter,
  constant,
  lt,
  clamp,
  isArray,
} from "lodash/fp";
import { addDays, subDays, addWeeks, addMonths, addYears } from "date-fns/fp";
import {
  Record as ImmutableRecord,
  type KeyPath,
  type RetrievePath,
  update,
  updateIn,
  get,
  set,
} from "immutable";
import { type NonEmptyArray } from "fp-ts/NonEmptyArray";
import {
  head,
  tail,
  type ReadonlyNonEmptyArray,
  chainWithIndex,
} from "fp-ts/ReadonlyNonEmptyArray";
import { flap, prepend as prependArray } from "fp-ts/Array";
import { sequenceT } from "fp-ts/Apply";
import { pipe, flip } from "fp-ts/function";
import {
  prepend,
  Applicative as readonlyArrayApplicative,
  map as arrayMap,
  reduceRight,
} from "fp-ts/ReadonlyArray";
import { traverseArray, execute } from "fp-ts/State";

export const over = flip(flap);
export const ensureArray = <T>(obj: T): T | ReadonlyNonEmptyArray<T> => {
  return isArray(obj) ? obj : [obj];
};
export const filterMap = curry(flow([compact, map]));
export const clampAddFromZero = (
  max: number,
  augend: number,
  addend: number,
): number => {
  return clamp(0, max - 1, augend + addend);
};
export const clampSubtractFromZero = (
  max: number,
  minuend: number,
  subtrahend: number,
): number => {
  return clamp(0, max - 1, minuend - subtrahend);
};

export const mapSum = map(sum);

export const floorDivision = curry(
  (divisor: number, dividend: number): number => {
    return Math.floor(dividend / divisor);
  },
);

export const convertToSet = <T>(collection: Array<T>): Set<T> => {
  return new Set(collection);
};

export const convertToList = <T>(object: T): Array<T> => {
  return new Array(object);
};

export const convertArrayChunksIntoSets = flow([chunk, map(convertToSet)]);

export const subString = curry((start: number, end: number, string: string) => {
  const stringer = Function.prototype.call.bind(String.prototype.substring);
  return stringer(string, start, end);
});

export const convertArrayToSetThenGetSize = flow([convertToSet, size]);
export const isEveryIntegerInRange = curry(
  ([start, end]: [number, number], arrayOfIntegers: Array<number>): Boolean => {
    return every(inRange(start, end), arrayOfIntegers);
  },
);

export const sortByIdentity = sortBy(identity);
export const sortTuplesByFirstValueInTuple = sortBy(first);

export const unfold = <T>(
  unfolder: (index: number) => T,
  arraySize: number,
): ReadonlyNonEmptyArray<T> => {
  return Array.from({ length: arraySize }, (_, index: number) =>
    unfolder(index),
  );
};

export const curriedUnfold =
  <T>(unfolder: (index: number) => T) =>
  (arraySize: number): ReadonlyNonEmptyArray<T> => {
    return Array.from({ length: arraySize }, (_, index: number) =>
      unfolder(index),
    );
  };

export const unfoldItemCountTupleIntoArray = curry(
  <T>([item, count]: [T, number]): Array<T> => {
    return Array(count).fill(item);
  },
);

export const unfoldCountStartingIndexIntoRange = curry(
  (count: number, startingIndex: number): Array<number> => {
    return unfold(add(startingIndex), count);
  },
);

export const unfoldIntoObject = flow([unfold, Object.fromEntries]);
export const spreadUnfold = spread(unfold);
export const mapSpreadUnfold = map(spreadUnfold);
export const flatMapSpreadUnfold = flatMap(spreadUnfold);
export const unfoldAndShuffleArray = curry(
  <T>(arraySize: number, unfolder: (index: number) => T): Array<T> => {
    return pipe(unfold(unfolder, arraySize), shuffle);
  },
);

export const curriedUnfoldAndShuffleArray =
  <T>(arraySize: number) =>
  (unfolder: (index: number) => T): ReadonlyNonEmptyArray<T> => {
    const array = unfold<T>(unfolder, arraySize);
    return shuffle(array);
  };

export const unfoldItemCountTuplesIntoTupleOfArrays = map(
  unfoldItemCountTupleIntoArray,
);

export const unfoldItemCountTuplesIntoMixedArray = flatMap(
  unfoldItemCountTupleIntoArray,
);

export const unfoldBooleanCountTuplesIntoArrayOfBooleans = flow([
  unfoldItemCountTuplesIntoMixedArray,
  map(Boolean),
]);

export const unfoldBooleanCountTuplesIntoShuffledArrayOfBooleans = flow([
  unfoldBooleanCountTuplesIntoArrayOfBooleans,
  shuffle,
]);

export const unfoldAndTransformRangeChunkN = curry(
  <T>(
    chunkSize: number,
    transformer: <T>(index: number) => T,
    [rangeStart]: [number, number],
    chunkNumber: number,
  ): ReadonlyNonEmptyArray<T> => {
    return flow([
      multiply(chunkSize),
      add(rangeStart),
      (valueToAdd: number) =>
        unfold(flow([add(valueToAdd), transformer]), chunkSize),
    ])(chunkNumber);
  },
);

export const prependAllWith =
  <A>(middle: () => A) =>
  (as: ReadonlyArray<A>): NonEmptyArray<A> => {
    const out: NonEmptyArray<A> = [middle(), as[0]];
    for (let i = 1; i < as.length; i++) {
      out.push(middle(), as[i]);
    }
    return out;
  };

export const intersperseWith =
  <A>(middle: () => A) =>
  (as: ReadonlyNonEmptyArray<A>): NonEmptyArray<A> => {
    const rest = tail(as);
    return pipe(rest, prependAllWith(middle), prependArray(head(as)));
  };

// const zipObject = <K extends string, A>(keys: ReadonlyArray<K>, values: ReadonlyArray<A>): _.ReadonlyRecord<K, A> =>
//   _.fromFoldableMap(Se.last<A>(), RA.Foldable)(RA.zip(keys, values), identity)

export const spreadZipObject = spread(zipObject);
export const zipAdd = zipWith<number, number, number>(add);

export const zipChunk = zipWith(chunk);
export const spreadZipChunk = spread(zipChunk);

export const zipAllAndTransformXArrayWithY = curry(
  <T, V>(
    [getter, transformer]: [
      (arg: ReadonlyNonEmptyArray<T>) => T,
      (arg: ReadonlyNonEmptyArray<T>) => V,
    ],
    array: Array<Array<T>>,
  ): V => {
    return flow([zipAll, getter, transformer])(array);
  },
);

export const zipAllAndGetFirstArray = zipAllAndTransformXArrayWithY([
  first,
  identity,
]);
export const zipAllAndGetInitial = zipAllAndTransformXArrayWithY([
  initial,
  identity,
]);
export const zipAllAndGetSecondArray = zipAllAndTransformXArrayWithY([
  property([1]),
  identity,
]);
export const zipAllAndGetLastArray = zipAllAndTransformXArrayWithY([
  last,
  identity,
]);

export const zipAllAndGetSumOfFirstArray = zipAllAndTransformXArrayWithY([
  first,
  sum,
]);
export const zipAllAndGetSumOfSecondArray = zipAllAndTransformXArrayWithY([
  property([1]),
  sum,
]);
export const zipAllAndGetSumOfLastArray = zipAllAndTransformXArrayWithY([
  last,
  sum,
]);

export const zipAllAndGetMinOfFirstArray = zipAllAndTransformXArrayWithY([
  first,
  min,
]);
export const zipAllAndGetMinOfSecondArray = zipAllAndTransformXArrayWithY([
  property([1]),
  min,
]);
export const zipAllAndGetMinOfLastArray = zipAllAndTransformXArrayWithY([
  last,
  min,
]);

export const zipAllAndGetSizeOfFirstArray = zipAllAndTransformXArrayWithY([
  first,
  size,
]);

export const zipAllAndGetFirstArrayAsSet = zipAllAndTransformXArrayWithY([
  first,
  convertToSet,
]);

export const convertConcatenatedArraysIntoSet = flow([concat, convertToSet]);
export const convertFlattenedArrayIntoSet = flow([flatten, convertToSet]);
export const convertArrayOfArraysToArrayOfSets = map(convertToSet);
export const convertArrayOfIntegersIntoArrayOfStrings = map(toString);
export const convertArrayOfStringsIntoArrayOfIntegers = map(parseInt);
export const calculateTheSumOfArrayOfStringIntegers = flow([
  convertArrayOfStringsIntoArrayOfIntegers,
  sum,
]);

export const mapFlatten = map(flatten);
export const convertArrayOfArraysIntoShuffledArray = flow([flatten, shuffle]);

export const convertRangeSizeAndMinIntoRange = curry(
  (rangeSize: number, rangeMin: number): [number, number] => {
    return over([identity, flow([add(rangeSize), add(1)])])(rangeMin) as [
      number,
      number,
    ];
  },
);

export const convertArrayIntoLinearRange = flow([
  Object.keys,
  over([first, last]),
  convertArrayOfStringsIntoArrayOfIntegers,
]);

export const foldArrayOfArraysIntoArrayOfLinearRanges = map(
  convertArrayIntoLinearRange,
);

export const convertObjectKeysIntoSet = flow([Object.keys, convertToSet]);

export const zipDivide = zipWith(divide);
export const spreadZipDivide = spread(zipDivide);
export const spreadDivide = spread(divide);
export const divideByTwo = partialRight(divide, [2]);

export const spreadMultiply = spread(multiply);
export const spreadAdd = spread(add);
export const addOne = add(1);
export const minusOne = add(-1);
export const multiplyByTwo = multiply(2);
export const half = partialRight(divide, [2]);
export const convertIntegerToPercentage = multiply(0.01);
export const convertIntegersToPercentages = map(convertIntegerToPercentage);
export const addMinusOne = curry((intOne: number, intTwo: number) =>
  flow([add, minusOne])(intOne, intTwo),
);
export const addPlusOne = curry((intOne: number, intTwo: number) =>
  flow([add, addOne])(intOne, intTwo),
);
export const spreadThenSubtract = spread(subtract);
export const reverseThenSpreadSubtract = flow([reverse, spreadThenSubtract]);
export const mod = curry<number, number, number>(
  (divisor: number, dividend: number): number => dividend % divisor,
);

export const getBaseLog = curry((baseLog: number, of: number) => {
  return Math.log(of) / Math.log(baseLog);
});

export const accumulate = curry(
  <T>(
    [func, initial]: [Function, T],
    array: ReadonlyNonEmptyArray<T>,
  ): ReadonlyNonEmptyArray<T> => {
    return reduce(
      (
        previous: ReadonlyNonEmptyArray<T>,
        current: T,
      ): ReadonlyNonEmptyArray<T> => {
        return concat(previous, func(current, last(previous) || initial));
      },
      [],
      array,
    );
  },
);

export const getRunningSumOfList = accumulate([add, 0]);
export const multiplyAccumulate = accumulate([multiply, 1]);
export const spreadMultiplyAccumulate = flow([multiplyAccumulate, last]);

export const adjustRangeByPercentage = curry(
  (range: [number, number], percentage: number) => {
    return map(flow([multiply(percentage), floor]))(range);
  },
);

export const normalizeArrayOfNumbers = (
  percentages: Array<number>,
): Array<number> => {
  const sumOfPercentages: number = sum(percentages);
  return map((percent: number): number => percent / sumOfPercentages)(
    percentages,
  );
};

export const weightedMean = curry(
  (arrWeights: Array<number>, arrValues: Array<number>): number => {
    return flow([
      normalizeArrayOfNumbers,
      over([flow([zipWith(multiply, arrValues), sum]), sum]),
      ([totalOfValues, totalOfWeights]: [number, number]) =>
        totalOfValues / totalOfWeights,
    ])(arrWeights);
  },
);

export const weightedRandom = <T>([weights, items]: [
  Array<number>,
  Array<T>,
]): T => {
  return flow([
    normalizeArrayOfNumbers,
    getRunningSumOfList,
    max,
    multiply(Math.random()),
    (randomNumber: number): number =>
      findIndex((weight: number) => weight >= randomNumber)(weights),
    (randomIndex: number): T => items.at(randomIndex),
  ])(weights);
};

export const sumOfAnArithmeticSeries = (lastNumberInSeries: number): number => {
  return lastNumberInSeries * ((lastNumberInSeries + 1) / 2);
};

export const simpleModularArithmetic = curry(
  (
    arithmeticFunction: (arg: number) => number,
    rangeMax: number,
    num: number,
  ): number => {
    return arithmeticFunction(num) % rangeMax;
  },
);

export const modularAddition = simpleModularArithmetic(addOne);
export const modularSubtraction = simpleModularArithmetic(minusOne);

export const nonZeroBoundedModularAddition = curry(
  (
    [rangeMin, rangeMax]: [number, number],
    standardIncrease: number,
    currentNumber: number,
  ): number => {
    const rangeSize: number = subtract(rangeMax, rangeMin);
    const adjustedIncrease = mod(rangeSize, standardIncrease);
    const currentIndexOfNumber: number = max([
      0,
      subtract(currentNumber, rangeMin),
    ]) as number;
    const indexOfNextNumber: number = mod(
      rangeSize,
      add(currentIndexOfNumber, adjustedIncrease),
    );
    return add(rangeMin, indexOfNextNumber);
  },
);

export const splitOnUnderscores = split("_");
export const joinOnUnderscores = join("_");
export const splitOnUnderscoresAndParseInts = flow([
  splitOnUnderscores,
  convertArrayOfStringsIntoArrayOfIntegers,
]);

export const convertCharacterAtIndexIntoCharacterCode =
  Function.prototype.call.bind(String.prototype.charCodeAt);
export const convertCharacterIntoCharacterCode = (char: string): number =>
  convertCharacterAtIndexIntoCharacterCode(char, 0);

export const convertCharacterCodeIntoCharacter = String.fromCharCode;

export const convertArrayOfIntegersIntoArrayOfCharacters = map(
  convertCharacterIntoCharacterCode,
);

export const addOneDay = addDays(1);
export const subOneDay = subDays(1);
export const addOneWeek = addWeeks(1);
export const addTwoWeeks = addWeeks(2);
export const addOneMonth = addMonths(1);
export const addOneYear = addYears(1);

export const isUpperAlphaCharacter = (x: string): boolean => !!x.match(/[A-Z]/);
export const everyCharacterIsUpperAlpha = every(isUpperAlphaCharacter);

export const reduceReplaceAll = (
  valuesToReplace: ReadonlyNonEmptyArray<string>,
  strToEdit: string,
): string => {
  return reduce(
    (currStrToEdit: string, valueToReplace: string): string => {
      return currStrToEdit.replaceAll(valueToReplace, "");
    },
    strToEdit,
    valuesToReplace,
  );
};

export const liftA2 =
  <A, B, C>(f: (a: A) => (b: B) => C) =>
  (fa: ReadonlyArray<A>) =>
  (fb: ReadonlyArray<B>): ReadonlyArray<C> => {
    return pipe(
      sequenceT(readonlyArrayApplicative)(fa, fb),
      arrayMap(([x, y]) => f(x)(y)),
    );
  };
export const foldr =
  <A, B>(f: (a: A) => (b: B) => B) =>
  (b: B) =>
  (ta: ReadonlyArray<A>): B => {
    return reduceRight(b, (a: A, b: B) => f(a)(b))(ta);
  };

export const filterM = <A>(p: (arg: A) => ReadonlyArray<boolean>) => {
  return foldr(
    (x: A) => (acc: ReadonlyArray<ReadonlyArray<A>>) =>
      liftA2(
        (flg: boolean) => (accx: ReadonlyArray<A>) =>
          flg ? prepend(x)(accx) : accx,
      )(p(x))(acc),
  )([[]]);
};

export const arraySubsets = filterM(constant([true, false]));

export const arrayCombinations = flow([
  arraySubsets,
  filter(flow([size, lt(1)])),
]);

const posixSplitPath = (filename: string): string[] | undefined => {
  // Split a filename into [dir, root, basename, name, ext], unix version
  // 'root' is just a slash, or nothing.
  const splitPathRe =
    /^((\/?)(?:[^\/]*\/)*)((\.{1,2}|[^\/]+?|)(\.[^.\/]*|))[\/]*$/;

  return splitPathRe.exec(filename)?.slice(1);
};

export const pathParse = (
  pathString: string,
): { root: string; dir: string; base: string; ext: string; name: string } => {
  if (typeof pathString !== "string") {
    throw new TypeError(
      "Parameter 'pathString' must be a string, not " + typeof pathString,
    );
  }
  var allParts = posixSplitPath(pathString);
  if (!allParts || allParts.length !== 5) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }

  return {
    root: allParts[1],
    dir: allParts[0].slice(0, -1),
    base: allParts[2],
    ext: allParts[4],
    name: allParts[3],
  };
};

// immutable

export const getFromRecord = <TProps extends object, K extends keyof TProps>(
  key: K,
  record: ImmutableRecord<TProps>,
): TProps[K] => {
  return get(record, key, undefined);
};
export const curriedGetFromRecord =
  <TProps extends object, K extends keyof TProps>(key: K) =>
  (record: ImmutableRecord<TProps>): TProps[K] | undefined => {
    return getFromRecord(key, record);
  };

export const setRecord = <
  TProps extends object,
  C extends ImmutableRecord<TProps>,
  K extends keyof TProps,
>(
  key: K,
  value: TProps[K],
  record: C,
): C => {
  return set<TProps, C, K>(record, key, value);
};
export const curriedSetRecord =
  <
    TProps extends object,
    C extends ImmutableRecord<TProps>,
    K extends keyof TProps,
  >(
    key: K,
  ) =>
  (value: TProps[K]) =>
  (record: C): C => {
    return setRecord(key, value, record);
  };

export const updateRecord = <
  TProps extends object,
  C extends ImmutableRecord<TProps>,
  K extends keyof TProps,
>(
  updater: (value: TProps[K]) => TProps[K],
  key: K,
  record: C,
): C => {
  return update(record, key, updater);
};
export const curriedUpdateRecord =
  <
    TProps extends object,
    C extends ImmutableRecord<TProps>,
    K extends keyof TProps,
  >(
    updater: (value: TProps[K]) => TProps[K],
  ) =>
  (key: K) =>
  (record: C): C => {
    return updateRecord(updater, key, record);
  };

export const updateInRecord = <
  TProps extends object,
  C extends ImmutableRecord<TProps>,
  K extends keyof TProps,
>(
  updater: (value: RetrievePath<C, ReadonlyNonEmptyArray<K>>) => unknown,
  keyPath: KeyPath<K>,
  record: C,
): C => {
  return updateIn(record, keyPath, updater);
};
export const curriedUpdateInRecord =
  <
    TProps extends object,
    C extends ImmutableRecord<TProps>,
    K extends keyof TProps,
  >(
    updater: (value: RetrievePath<C, ReadonlyNonEmptyArray<K>>) => unknown,
  ) =>
  (keyPath: KeyPath<K>) =>
  (record: C): C => {
    return updateIn(record, keyPath, updater);
  };

// immutable extensions - types are a nightmare

export const getAllFromRecord = <TProps extends object, K extends keyof TProps>(
  keys: ReadonlyNonEmptyArray<K>,
  record: ImmutableRecord<TProps>,
): [...ReadonlyNonEmptyArray<TProps[K]>] => {
  return [
    ...map((key: K): TProps[K] => getFromRecord<TProps, K>(key, record))(keys),
  ];
};
export const curriedGetAllForRecord =
  <TProps extends object, K extends keyof TProps>(
    keys: ReadonlyNonEmptyArray<K>,
  ) =>
  (record: ImmutableRecord<TProps>): [...ReadonlyNonEmptyArray<TProps[K]>] => {
    return getAllFromRecord(keys, record);
  };

export const setAllForRecord = <
  TProps extends object,
  C extends ImmutableRecord<TProps>,
  K extends keyof TProps,
>(
  keyValuePairs: ReadonlyNonEmptyArray<[K, TProps[K]]>,
  record: C,
): C => {
  const traversalFunc =
    ([key, value]: [K, TProps[K]]) =>
    (rec: C): [K, C] => {
      return [key, setRecord(key, value, rec)];
    };

  const traversal = traverseArray(traversalFunc)(keyValuePairs);
  return execute(record)(traversal);
};
export const curriedSetAllForRecord =
  <
    TProps extends object,
    C extends ImmutableRecord<TProps>,
    K extends keyof TProps,
  >(
    keyValuePairs: ReadonlyNonEmptyArray<[K, TProps[K]]>,
  ) =>
  (record: C): C => {
    return setAllForRecord(keyValuePairs, record);
  };

export const updateAllForRecord = <
  TProps extends object,
  C extends ImmutableRecord<TProps>,
  K extends keyof TProps,
>(
  keyUpdaterPairs: ReadonlyNonEmptyArray<[K, (value: TProps[K]) => TProps[K]]>,
  record: C,
): C => {
  const traversalFunc =
    ([key, updater]: [K, updater: (value: TProps[K]) => TProps[K]]) =>
    (rec: C): [K, C] => {
      return [key, updateRecord(updater, key, rec)];
    };
  const traversal = traverseArray(traversalFunc)(keyUpdaterPairs);
  return execute(record)(traversal);
};
export const curriedUpdateAllForRecord =
  <
    TProps extends object,
    C extends ImmutableRecord<TProps>,
    K extends keyof TProps,
  >(
    keyUpdaterPairs: ReadonlyNonEmptyArray<
      [K, (value: TProps[K]) => TProps[K]]
    >,
  ) =>
  (record: C): C => {
    return updateAllForRecord(keyUpdaterPairs, record);
  };
