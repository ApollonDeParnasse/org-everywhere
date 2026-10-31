import { fc } from "@fast-check/vitest";
import {
  curry,
  over,
  add,
  partialRight,
  flow,
  property,
  join,
  toString,
  shuffle,
  size,
  subtract,
  first,
  merge,
  range,
  take,
  partial,
  zipObject,
  isArray,
} from "lodash/fp";
import { pipe, identity } from "fp-ts/function";
import { mapFst, fst } from "fp-ts/Tuple";
import { map as mapArray } from "fp-ts/Array";
import {
  map,
  chunksOf,
  type ReadonlyNonEmptyArray,
  mapWithIndex,
  intersperse,
  flap,
  head,
} from "fp-ts/ReadonlyNonEmptyArray";
import { match } from "ts-pattern";
import {
  add as addDateUnits,
  differenceInDays,
  differenceInHours,
  addDays,
  addHours,
  type Duration,
} from "date-fns/fp";
import { type MapOf, Map, Record as ImmutableRecord, List } from "immutable";
import type { ColorObject } from "color";
import type {
  OrgTimestampPart,
  RepeaterUnit,
  TimestampUnit,
  RepeaterType,
  DelayType,
  DelayUnit,
  OrgTimestampPartRecord,
  TimestampArgs,
  OrgTableRecord,
  OrgTableCellValue,
  OrgTableRowRecord,
  OrgTableCellRecord,
  OrgTableCell,
  OrgTableRow,
  OrgTable,
} from "../src/Types";
import {
  makeOrgTimestampPartRecord,
  makeOrgTableCellRecord,
  makeOrgTableRowRecord,
  makeOrgTableRecord,
  makeOrgTextRecord
} from "../src/Types";
import {
  unfold,
  curriedUnfold,
  unfoldAndShuffleArray,
  nonZeroBoundedModularAddition,
  minusOne,
  convertRangeSizeAndMinIntoRange,
  convertCharacterCodeIntoCharacter,
  simpleModularArithmetic,
  addOne,
  floorDivision,
  unfoldAndTransformRangeChunkN,
  curriedUnfoldAndShuffleArray,
  intersperseWith,
  mod,
} from "../src/util/transformers";
import {
  getTimestampPartsFromDate,
  addTimestampUnitToDate,
  createNextRepeatTimestampPartObject,
  padTimePart,
} from "../src/lib/timestamps";
import { createHeadingStars } from "../src/lib/org_utils";
import {
  TESTNONSPACESCHARACTERRANGE,
  DOUBLEBETWEENZEROAND1RANGE,
  TESTINBUFFERSETTINGS,
  TESTORGCAPTURETEMPLATES,
  TESTLOWERALPHACHARACTERRANGE,
  TESTUPPERALPHACHARACTERRANGE,
  TESTREPEATERTYPES,
  TESTREPEATERUNITS,
  TESTREPEATERUNITSWITHOUTHOURS,
  TESTDELAYTYPES,
  TESTMINHOURSDIFF,
  TESTMINDAYSDIFF,
  HOURS,
  MINUTES,
  YEARS,
  TESTRANDOMMONTHSRANGE,
  TESTIMESTAMPTYPES,
} from "./Constants";

const baseTestIDCreator = (): (() => number) => {
  let nextId = 1;
  return () => nextId++;
};

const testIDCreator = baseTestIDCreator();

export const randomArrayValue = flow([shuffle, first]);
export const randomArrayIndex = flow([range(0), randomArrayValue]);
export const twoRandomArrayIndices = flow([range(0), shuffle, take(2)]);
export const threeRandomArrayIndices = flow([range(0), shuffle, take(3)]);
export const randomArrayIndexFromOne = flow([range(1), randomArrayValue]);
export const randomArrayIndexMinusLastIndex = flow([
  minusOne,
  range(0),
  randomArrayValue,
]);

export const getRandomIntegerInRange = ([min, max]: [
  number,
  number,
]): number => {
  const minCeiled = Math.ceil(min),
    maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
};

export const randomMinutePart = flow([
  partial(getRandomIntegerInRange, [MINUTES]),
  padTimePart,
]);
export const randomHourPart = flow([
  partial(getRandomIntegerInRange, [HOURS]),
  padTimePart,
]);

export const randomYear = (): string =>
  pipe(getRandomIntegerInRange(YEARS), toString);

// fast-check

export const fcGenRandomBoolean = (fcGen: fc.GeneratorValue): boolean => {
  return fcGen(fc.boolean);
};

// don't use with functions
export const fcShuffledArray = <T>(
  fcGen: fc.GeneratorValue,
  array: ReadonlyNonEmptyArray<T>,
): ReadonlyNonEmptyArray<T> => {
  return fcGen(fc.shuffledSubarray, array, {
    minLength: array.length,
    maxLength: array.length,
  });
};

export const curriedFCShuffledArray =
  (fcGen: fc.GeneratorValue) =>
  <T>(array: Array<T>): Array<T> => {
    return fcGen(fc.shuffledSubarray, array, {
      minLength: array.length,
      maxLength: array.length,
    });
  };

export const fcShuffledSubarray = <T>(
  count: number,
  fcGen: fc.GeneratorValue,
  array: Array<T>,
): Array<T> => {
  return fcGen(fc.shuffledSubarray, array, {
    minLength: count,
    maxLength: count,
  });
};

export const curriedFCShuffledSubarray =
  (count: number) =>
  (fcGen: fc.GeneratorValue) =>
  <T>(array: Array<T>): Array<T> => {
    return fcGen(fc.shuffledSubarray, array, {
      minLength: count,
      maxLength: count,
    });
  };

export const flippedCurriedFCShuffledSubarray =
  <T>(fcGen: fc.GeneratorValue, array: Array<T>) =>
  (count: number): Array<T> => {
    return fcGen(fc.shuffledSubarray, array, {
      minLength: count,
      maxLength: count,
    });
  };

export const curriedFCGenRandomShuffledSubarray =
  <T>(array: Array<T>) =>
  (fcGen: fc.GeneratorValue): Array<T> => {
    return fcGen(fc.shuffledSubarray, array, {
      minLength: 1,
      maxLength: array.length - 1,
    });
  };

export const fcGenRandomItemFromArray = <T>(
  fcGen: fc.GeneratorValue,
  testArray: ReadonlyNonEmptyArray<T>,
): T => {
  return fcGen(fc.constantFrom, ...shuffle(testArray));
};

export const curriedFCRandomItemFromArray =
  <T>(testArray: ReadonlyNonEmptyArray<T>) =>
  (fcGen: fc.GeneratorValue): T => {
    return fcGen(fc.constantFrom, ...shuffle(testArray));
  };

export const flippedFCRandomItemFromArray =
  (fcGen: fc.GeneratorValue) =>
  <T>(testArray: ReadonlyNonEmptyArray<T>): T => {
    return fcGen(fc.constantFrom, ...shuffle(testArray));
  };

export const fcGetTwoRandomItemsFromArray = curriedFCShuffledSubarray(2);

export const fcNRandomArrayIndicesAsIntegers = curry(
  <T>(
    count: number,
    fcGen: fc.GeneratorValue,
    array: Array<T>,
  ): Array<number> => {
    return pipe(
      Object.keys(array),
      (indices: Array<string>): Array<string> => {
        return fcShuffledSubarray(count, fcGen, indices);
      },
      mapArray(parseInt),
    );
  },
);

export const fcGetRandomArrayChunk = curry(
  <T>(
    fcGen: fc.GeneratorValue,
    [testArray, testChunkSize]: [ReadonlyNonEmptyArray<T>, number],
  ): ReadonlyNonEmptyArray<T> => {
    return pipe(
      testArray,
      chunksOf(testChunkSize),
      flippedFCRandomItemFromArray(fcGen),
    );
  },
);

export const fcGenRandomInteger = (fcGen: fc.GeneratorValue) =>
  fcGen(fc.integer);
export const fcGenRandomIntegerBetweenOneAndMaxSafeInteger = (
  fcGen: fc.GeneratorValue,
) => fcGen(fc.integer, { min: 1 });

export const fcGenRandomIntegerAsString = flow([fcGenRandomInteger, toString]);

export const fcGenRandomIntegerInRange = curry<
  fc.GeneratorValue,
  [number, number],
  number
>(
  (
    fcGen: fc.GeneratorValue,
    [rangeMin, rangeMax]: [number, number],
  ): number => {
    if (rangeMin >= rangeMax) return rangeMin;
    return fcGen(fc.integer, { min: rangeMin, max: minusOne(rangeMax) });
  },
);

export const fcGenRandomIntegerBetweenZeroAnd = curry<
  fc.GeneratorValue,
  number,
  number
>((fcGen: fc.GeneratorValue, rangeMax: number): number => {
  return fcGenRandomIntegerInRange(fcGen, [0, rangeMax]);
});

export const fcGenRandomIntegerBetweenOneAnd = curry<
  fc.GeneratorValue,
  number,
  number
>((fcGen: fc.GeneratorValue, rangeMax: number): number => {
  return fcGenRandomIntegerInRange(fcGen, [1, rangeMax]);
});

export const curriedFCRandomIntegerBetweenOneAnd =
  (rangeMax: number) =>
  (fcGen: fc.GeneratorValue): number => {
    return fcGenRandomIntegerBetweenOneAnd(fcGen, rangeMax);
  };

export const fcGenRandomIntegerBetweenOneAndTen = partialRight(
  fcGenRandomIntegerBetweenOneAnd,
  [10],
);

export const fcGenRandomIntegerBetweenTwoAnd = curry<
  fc.GeneratorValue,
  number,
  number
>((fcGen: fc.GeneratorValue, rangeMax: number): number => {
  return fcGenRandomIntegerInRange(fcGen, [2, rangeMax]);
});

export const fcGenRandomIntegerBetweenTwoAndTen = partialRight(
  fcGenRandomIntegerBetweenTwoAnd,
  [10],
);

export const fcGenRandomIntegerBetween1And25 = partialRight(
  fcGenRandomIntegerInRange,
  [[1, 25]],
);

export const fcGenRandomIntegerBetween2And25 = partialRight(
  fcGenRandomIntegerInRange,
  [[2, 25]],
);

export const fcGenRandomIntegerBetween0And1000 = partialRight(
  fcGenRandomIntegerInRange,
  [[0, 1000]],
);

const defaultConvertFCGenIntoRandomGen =
  <T>(generator: (randomNumber: number, fcGen: fc.GeneratorValue) => T) =>
  (fcGen: fc.GeneratorValue): T => {
    const randomNumber = fcGenRandomIntegerBetween1And25(fcGen);
    return generator(randomNumber, fcGen);
  };

const flippedConvertFCGenIntoRandomGen =
  <T>(generator: (fcGen: fc.GeneratorValue, randomNumber: number) => T) =>
  (fcGen: fc.GeneratorValue): T => {
    const randomNumber = fcGenRandomIntegerBetween1And25(fcGen);
    return generator(fcGen, randomNumber);
  };

export const convertFCGenWithSingleArgIntoRandomGen =
  <A, B>(
    generator: (randomNumber: number, fcGen: fc.GeneratorValue, arg: A) => B,
  ) =>
  (fcGen: fc.GeneratorValue, arg: A): B => {
    const randomNumber = fcGenRandomIntegerBetween1And25(fcGen);
    return generator(randomNumber, fcGen, arg);
  };

export const defaultConvertFCGenIntoRandomGenBasedOnArgLength =
  <A extends object, B>(
    generator: (randomNumber: number, fcGen: fc.GeneratorValue, arg: A) => B,
  ) =>
  (fcGen: fc.GeneratorValue, arg: A): B => {
    const randomNumber = fcGenRandomIntegerBetweenOneAnd(
      fcGen,
      Object.keys(arg).length,
    );
    return generator(randomNumber, fcGen, arg);
  };

// const convertFCGenWithBooleanIntoRandomGen =
//   <T>(generator: (randomBoolean: boolean, fcGen: fc.GeneratorValue) => T) =>
//   (fcGen: fc.GeneratorValue): T => {
//     const randomBoolean = fcGenRandomBoolean(fcGen);
//     return generator(randomBoolean, fcGen);
//   };

export const plusRandomNumberInRange = curry<
  [number, number],
  fc.GeneratorValue,
  number,
  number
>((range: [number, number], fcGen: fc.GeneratorValue, num: number): number => {
  return pipe(fcGenRandomIntegerInRange(fcGen, range), add(num));
});

export const plusRandomNumberBetweenZeroAnd100 = plusRandomNumberInRange([
  0, 100,
]);

export const fcOneRandomArrayIndexAsInteger = curry(
  (fcGen: fc.GeneratorValue, array: ReadonlyNonEmptyArray<any>): number => {
    return pipe(
      array,
      size,
      (arraySize: number): [number, number] => [0, arraySize],
      fcGenRandomIntegerInRange(fcGen),
    );
  },
);

export const fcGenRandomItemFromArrayWithIndex = <T>(
  fcGen: fc.GeneratorValue,
  testArray: ReadonlyNonEmptyArray<T>,
): [T, number] => {
  return pipe(
    testArray,
    fcOneRandomArrayIndexAsInteger(fcGen),
    over([partialRight(property, [testArray]), identity]),
  );
};

export const curriedFCGenRandomItemFromArrayWithIndex =
  <T>(fcGen: fc.GeneratorValue) =>
  (testArray: ReadonlyNonEmptyArray<T>): [T, number] => {
    return pipe(
      testArray,
      fcOneRandomArrayIndexAsInteger(fcGen),
      over([partialRight(property, [testArray]), identity]),
    );
  };

export const fcCallRandomFCGen = <T>(
  arrayOfFCGens: ReadonlyNonEmptyArray<(fcGen: fc.GeneratorValue) => T>,
  fcGen: fc.GeneratorValue,
): T => {
  // shuffledSubarray causes issues when given arrays of functions
  const index: number = fcOneRandomArrayIndexAsInteger(fcGen, arrayOfFCGens);
  return arrayOfFCGens[index](fcGen);
};

export const curriedFCCallRandomFCGen =
  <T>(arrayOfFCGens: ReadonlyNonEmptyArray<(fcGen: fc.GeneratorValue) => T>) =>
  (fcGen: fc.GeneratorValue): T => {
    // shuffledSubarray causes issues when given arrays of functions
    const index: number = fcOneRandomArrayIndexAsInteger(fcGen, arrayOfFCGens);
    return arrayOfFCGens[index](fcGen);
  };

export const fcCallRandomFCGenWithArg = <A, B>(
  arrayOfFCGens: ReadonlyNonEmptyArray<(arg: A, fcGen: fc.GeneratorValue) => B>,
  arg: A,
  fcGen: fc.GeneratorValue,
): B => {
  // shuffledSubarray causes issues when given arrays of functions
  const index: number = fcOneRandomArrayIndexAsInteger(fcGen, arrayOfFCGens);
  return arrayOfFCGens[index](arg, fcGen);
};

export const fcCallRandomFCGenWithTwoArgs = <A, B, C>(
  arrayOfFCGens: ReadonlyNonEmptyArray<
    (argOne: A, argTwo: B, fcGen: fc.GeneratorValue) => C
  >,
  argOne: A,
  argTwo: B,
  fcGen: fc.GeneratorValue,
): C => {
  // shuffledSubarray causes issues when given arrays of functions
  const index: number = fcOneRandomArrayIndexAsInteger(fcGen, arrayOfFCGens);
  return arrayOfFCGens[index](argOne, argTwo, fcGen);
};

export const fcGenRandomArrayChunkSize = curry(
  <T>(fcGen: fc.GeneratorValue, array: ReadonlyNonEmptyArray<T>): number => {
    return fcGenRandomIntegerInRange(fcGen, [1, size(array)]);
  },
);

export const fcGenRandomArrayChunkOfRandomSize = curry(
  <T>(fcGen: fc.GeneratorValue, array: ReadonlyNonEmptyArray<T>): number => {
    const chunkSize = fcGenRandomArrayChunkSize(fcGen, array);
    return fcGetRandomArrayChunk(fcGen, [array, chunkSize]);
  },
);

export const fcUnfoldRandomRangeChunk = curry(
  <T>(
    [rangeStart, rangeEnd]: [number, number],
    chunkSize: number,
    unfolder: <T>(index: number) => T,
    fcGen: fc.GeneratorValue,
  ): [ReadonlyNonEmptyArray<T>, number] => {
    const chunkNumber = pipe(
      rangeStart,
      subtract(rangeEnd),
      floorDivision(chunkSize),
      fcGenRandomIntegerBetweenZeroAnd(fcGen),
    );

    return over([
      unfoldAndTransformRangeChunkN(chunkSize, unfolder, [
        rangeStart,
        rangeEnd,
      ]),
      identity,
    ])(chunkNumber) as [ReadonlyNonEmptyArray<T>, number];
  },
);

export const fcUnfoldRandomNaturalNumberRangeChunk = curry(
  <T>(
    rangeMax: number,
    chunkSize: number,
    unfolder: <T>(index: number) => T,
    fcGen: fc.GeneratorValue,
  ): [ReadonlyNonEmptyArray<T>, number] => {
    return fcUnfoldRandomRangeChunk([0, rangeMax], chunkSize, unfolder, fcGen);
  },
);

export const fcNRandomArrayIndicesAsStrings = curry(
  <T>(
    fcGen: fc.GeneratorValue,
    count: number,
    array: ReadonlyNonEmptyArray<T>,
  ): Array<string> => {
    return fcGen(fc.shuffledSubarray, Object.keys(array), {
      minLength: count,
      maxLength: count,
    });
  },
);

export const fcGenRandomNaturalNumber = (fcGen: fc.GeneratorValue): number => {
  return fcGen(fc.nat);
};

export const fcGenRandomNaturalNumberWithMax = curry(
  (max: number, fcGen: fc.GeneratorValue): number => {
    return fcGen(fc.nat, { max });
  },
);

export const fcGenRandomFloatBetweenZeroAndOneInclusive = (
  fcGen: fc.GeneratorValue,
): number => {
  return fcGen(fc.float, {
    noDefaultInfinity: true,
    noNaN: true,
    min: Math.fround(0.1),
    max: Math.fround(1),
  });
};

export const fcGenRandomFloatBetweenZeroAndOneExclusive = (
  fcGen: fc.GeneratorValue,
): number => {
  return fcGen(fc.float, {
    noDefaultInfinity: true,
    noNaN: true,
    min: Math.fround(0.1),
    max: Math.fround(0.99),
  });
};

export const fcArrayOfNFloatsBetweenZeroAndOne = (
  fcGen: fc.GeneratorValue,
  floatCount: number,
): ReadonlyNonEmptyArray<number> => {
  return unfold(
    (_: number) => fcGenRandomFloatBetweenZeroAndOneExclusive(fcGen),
    floatCount,
  );
};

export const fcGenRandomDoubleInRange = curry(
  ([min, max]: [number, number], fcGen: fc.GeneratorValue): number => {
    return fcGen(fc.double, {
      maxExcluded: true,
      noDefaultInfinity: true,
      noNaN: true,
      min,
      max,
    });
  },
);

export const fcGenRandomDoubleBetweenZeroAndOne = fcGenRandomDoubleInRange(
  DOUBLEBETWEENZEROAND1RANGE,
);

export const fcNLengthArrayOfDoublesInRange = curry<
  [number, number],
  number,
  fc.GeneratorValue,
  ReadonlyNonEmptyArray<number>
>(
  (
    range: [number, number],
    arrayLength: number,
    fcGen: fc.GeneratorValue,
  ): ReadonlyNonEmptyArray<number> => {
    return unfold(
      (_: number) => fcGenRandomDoubleInRange(range, fcGen),
      arrayLength,
    );
  },
);

export const fcArrayOfNIntegersInRange = curry<
  [number, number],
  number,
  fc.GeneratorValue,
  ReadonlyNonEmptyArray<number>
>(
  (
    range: [number, number],
    arrayLength: number,
    fcGen: fc.GeneratorValue,
  ): ReadonlyNonEmptyArray<number> => {
    return unfold(
      (_: number) => fcGenRandomIntegerInRange(fcGen, range),
      arrayLength,
    );
  },
);

export const fcNLengthArrayOfDoublesBetweenZeroAndOne =
  fcNLengthArrayOfDoublesInRange(DOUBLEBETWEENZEROAND1RANGE);

export const fcGenRandomEvenIntegerInRange = curry(
  (
    [rangeMin, rangeMax]: [number, number],
    fcGen: fc.GeneratorValue,
  ): number => {
    const int: number = fcGen(fc.integer, {
      min: rangeMin,
      max: minusOne(rangeMax),
    });
    return int % 2 == 0 ? int : int + 1;
  },
);

export const fcGenRandomCharacterGenerator = curry(
  (range: [number, number], fcGen: fc.GeneratorValue): string => {
    return pipe(
      range,
      fcGenRandomIntegerInRange(fcGen),
      convertCharacterCodeIntoCharacter,
    );
  },
);

export const fcNonSpaceRandomCharacterGenerator = fcGenRandomCharacterGenerator(
  TESTNONSPACESCHARACTERRANGE,
);

export const fcGenRandomUpperAlphaChar = fcGenRandomCharacterGenerator(
  TESTUPPERALPHACHARACTERRANGE,
);

export const fcGenRandomLowerAlphaChar = fcGenRandomCharacterGenerator(
  TESTLOWERALPHACHARACTERRANGE,
);

export const fcLinearRangeGenerator = curry(
  (fcGen: fc.GeneratorValue, rangeSize: number): [number, number] => {
    return pipe(
      fcGen,
      fcGenRandomInteger,
      convertRangeSizeAndMinIntoRange(rangeSize),
    );
  },
);

export const fcTestLinearRangeWithMinimumGenerator = curry(
  (
    fcGen: fc.GeneratorValue,
    [rangeMin, rangeSize]: [number, number],
  ): [number, number] => {
    return pipe(
      convertRangeSizeAndMinIntoRange(rangeSize, rangeMin),
      fcGenRandomIntegerInRange(fcGen),
      convertRangeSizeAndMinIntoRange(rangeSize),
    );
  },
);

// can't curry this
export const fcNLengthUniqueXArrayGenerator = curry(
  <T>(
    valueTransformer: <T>(x: number) => T,
    fcGen: fc.GeneratorValue,
    arraySize: number,
  ): ReadonlyNonEmptyArray<T> => {
    return pipe(
      fcGen,
      fcGenRandomInteger,
      (a: number) => (b: number) => a + b,
      curriedUnfoldAndShuffleArray<number>(arraySize),
      map<number, T>(valueTransformer),
    );
  },
);

export const fcNLengthUniqueIntegerArrayGenerator =
  fcNLengthUniqueXArrayGenerator(identity);

export const fcNLengthUniqueStringIntegerArrayGenerator =
  fcNLengthUniqueXArrayGenerator(toString);

export const fcNLengthUniqueStringNatNumberArrayGenerator =
  fcNLengthUniqueXArrayGenerator(flow([Math.abs, toString]));

export const fcArrayOfXNatNumbersWithMaxGenerator = curry(
  (
    fcGen: fc.GeneratorValue,
    maxValue: number,
    arraySize: number,
  ): ReadonlyNonEmptyArray<number> => {
    const randomNat: number = fcGenRandomNaturalNumberWithMax(maxValue, fcGen);
    return unfoldAndShuffleArray(arraySize)(
      flow([add(randomNat), simpleModularArithmetic(addOne, maxValue)]),
    );
  },
);

export const fcNLengthArrayOfXGenerator =
  <T>(unfolder: (index: number) => T, range: [number, number]) =>
  (fcGen: fc.GeneratorValue, arraySize: number): ReadonlyNonEmptyArray<T> => {
    const randomStart = fcGenRandomIntegerInRange(fcGen, range);
    const values = unfold(
      (index: number): T => unfolder(index + randomStart),
      arraySize,
    );
    return fcShuffledArray(fcGen, values);
  };

export const nonZeroBoundedModularAdditionForCharacters =
  (range: [number, number]) =>
  (standardIncrease: number, currentNumber: number) => {
    const nextChar = nonZeroBoundedModularAddition(
      range,
      1,
      standardIncrease + currentNumber,
    );
    return convertCharacterCodeIntoCharacter(nextChar);
  };

export const nonZeroBoundedModularAdditionForTESTNONSPACESCHARACTERRANGE =
  nonZeroBoundedModularAdditionForCharacters(TESTNONSPACESCHARACTERRANGE);
export const nonZeroBoundedModularAdditionForLOWERALPHACHARACTERRANGE =
  nonZeroBoundedModularAdditionForCharacters(TESTLOWERALPHACHARACTERRANGE);
export const nonZeroBoundedModularAdditionForUPPERALPHACHARACTERRANGE =
  nonZeroBoundedModularAdditionForCharacters(TESTUPPERALPHACHARACTERRANGE);

export const fcNLengthNonSpaceCharactersArrayGenerator = (
  fcGen: fc.GeneratorValue,
  count: number,
): ReadonlyNonEmptyArray<string> => {
  return fcNLengthArrayOfXGenerator(
    (index: number): string =>
      nonZeroBoundedModularAdditionForTESTNONSPACESCHARACTERRANGE(1, index),
    TESTNONSPACESCHARACTERRANGE,
  )(fcGen, count);
};

export const fcNLengthLowerAlphaStringArrayGenerator = (
  fcGen: fc.GeneratorValue,
  count: number,
): ReadonlyNonEmptyArray<string> => {
  return fcNLengthArrayOfXGenerator(
    (index: number): string =>
      nonZeroBoundedModularAdditionForLOWERALPHACHARACTERRANGE(1, index),
    TESTLOWERALPHACHARACTERRANGE,
  )(fcGen, count);
};

export const fcNLengthUpperAlphaStringArrayGenerator = (
  fcGen: fc.GeneratorValue,
  count: number,
): ReadonlyNonEmptyArray<string> => {
  return fcNLengthArrayOfXGenerator(
    (index: number): string =>
      nonZeroBoundedModularAdditionForUPPERALPHACHARACTERRANGE(1, index),
    TESTUPPERALPHACHARACTERRANGE,
  )(fcGen, count);
};

export const fcNLengthStringGeneratorMV = (
  stringLength: number,
  fcGen: fc.GeneratorValue,
): [string, ReadonlyNonEmptyArray<string>] => {
  const strings = fcNLengthNonSpaceCharactersArrayGenerator(
    fcGen,
    stringLength,
  );
  return [join("", strings), strings];
};

export const fcNLengthStringGenerator = (
  stringLength: number,
  fcGen: fc.GeneratorValue,
): string => {
  return pipe(fcNLengthStringGeneratorMV(stringLength, fcGen), fst);
};

export const fcGenRandomStringGenerator = defaultConvertFCGenIntoRandomGen(
  fcNLengthStringGenerator,
);

export const fcGenRandomArrayOfLowerAlphaStringsGenerator =
  flippedConvertFCGenIntoRandomGen(fcNLengthLowerAlphaStringArrayGenerator);

export const fcGenRandomLengthLowerAlphaStringGenerator = flow([
  fcGenRandomArrayOfLowerAlphaStringsGenerator,
  join(""),
]);

export const fcGenRandomArrayOfUpperAlphaStringsGenerator =
  flippedConvertFCGenIntoRandomGen(fcNLengthUpperAlphaStringArrayGenerator);

export const fcGenRandomLengthUpperAlphaStringGenerator = flow([
  fcGenRandomArrayOfUpperAlphaStringsGenerator,
  join(""),
]);

export const fcGenRandomAlphaString = curriedFCCallRandomFCGen([
  fcGenRandomLengthUpperAlphaStringGenerator,
  fcGenRandomLengthLowerAlphaStringGenerator,
]);

// Objects
export const fcGenRandomObjectKey = curry(
  <T>(fcGen: fc.GeneratorValue, object: Record<string, T>): string => {
    return pipe(object, Object.keys, flippedFCRandomItemFromArray(fcGen));
  },
);

export const fcGenRandomObjectValue = curry(
  <T>(fcGen: fc.GeneratorValue, object: Record<string, T>): T => {
    return pipe(object, Object.values, flippedFCRandomItemFromArray(fcGen));
  },
);

export const fcGenRandomObjectKeyValuePair = curry(
  <T>(fcGen: fc.GeneratorValue, object: Record<string, T>): [string, T] => {
    return pipe(object, Object.entries, flippedFCRandomItemFromArray(fcGen));
  },
);

export const fcGenListOfNObjectKeys = curry(
  <T>(
    pairs: number,
    fcGen: fc.GeneratorValue,
    object: Record<string, T>,
  ): Array<string> => {
    return pipe(Object.keys(object), curriedFCShuffledSubarray(pairs)(fcGen));
  },
);

export const fcGenRandomListOfObjectKeys =
  defaultConvertFCGenIntoRandomGenBasedOnArgLength(fcGenListOfNObjectKeys);

export const fcGenListOfNObjectKeyValuePairs = curry(
  <T>(
    pairs: number,
    fcGen: fc.GeneratorValue,
    object: Record<string, T>,
  ): Array<[string, T]> => {
    return pipe(
      Object.entries(object),
      curriedFCShuffledSubarray(pairs)(fcGen),
    );
  },
);

export const fcGenRandomListOfObjectKeyValuePairs =
  defaultConvertFCGenIntoRandomGenBasedOnArgLength(
    fcGenListOfNObjectKeyValuePairs,
  );

export const fcGenObject = (
  keysCount: number,
  fcGen: fc.GeneratorValue,
): Record<string, any> => {
  const keys = fcNLengthNonSpaceCharactersArrayGenerator(fcGen, keysCount);
  const values = fcGen(fc.array, fc.anything(), {
    minLength: keysCount,
    maxLength: keysCount,
  });
  return zipObject(keys, values);
};

export const fcGenRandomObject = defaultConvertFCGenIntoRandomGen(fcGenObject);
export const fcGenRandomImmutableMap = (
  fcGen: fc.GeneratorValue,
): [MapOf<Record<string, any>>, Record<string, any>] => {
  return pipe(
    fcGenRandomObject(fcGen),
    (x: Record<string, any>): [Record<string, any>, Record<string, any>] => [
      identity(x),
      identity(x),
    ],
    mapFst((x: Record<string, any>): MapOf<Record<string, any>> => Map(x)),
  );
};

export const fcGenRandomImmutableRecord = (
  fcGen: fc.GeneratorValue,
): [ImmutableRecord<Record<string, any>>, Record<string, any>] => {
  // is there a better way to do this?
  const recordMaker = (
    object: Record<string, any>,
  ): ImmutableRecord<Record<string, any>> => {
    const defaultMaker = ImmutableRecord(object);
    return defaultMaker(object);
  };
  return pipe(
    fcGenRandomObject(fcGen),
    (x: Record<string, any>): [Record<string, any>, Record<string, any>] => [
      identity(x),
      identity(x),
    ],
    mapFst(recordMaker),
  );
};

export const fcGenRandomColorObjectArray = (
  fcGen: fc.GeneratorValue,
): [number, number, number] => {
  return [
    fcGenRandomIntegerInRange(fcGen, [0, 255]),
    fcGenRandomIntegerInRange(fcGen, [0, 255]),
    fcGenRandomIntegerInRange(fcGen, [0, 255]),
  ];
};

export const fcGenRandomColorObject = (
  fcGen: fc.GeneratorValue,
): ColorObject => {
  const [r, g, b] = fcGenRandomColorObjectArray(fcGen);
  const alpha = fcGenRandomFloatBetweenZeroAndOneExclusive(fcGen);
  return {
    r,
    g,
    b,
    alpha,
  };
};

export const fcNLengthArrayOfRandomColorObjects = curry(
  (
    count: number,
    fcGen: fc.GeneratorValue,
  ): ReadonlyNonEmptyArray<ColorObject> => {
    return unfold(
      (_: number): ColorObject => fcGenRandomColorObject(fcGen),
      count,
    );
  },
);

export const fcTwoRandomColorObjects = fcNLengthArrayOfRandomColorObjects(2);

// Dates

export const fcRandomYear = partialRight(fcGenRandomIntegerInRange, [YEARS]);
export const fcRandomMonthIndex = partialRight(fcGenRandomIntegerInRange, [
  TESTRANDOMMONTHSRANGE,
]);

const cleanTestDate = curry<boolean, Date, Date>(
  (withStartTime: boolean, testDate: Date): Date => {
    if (withStartTime) {
      // no seconds or milliseconds
      return new Date(
        testDate.getFullYear(),
        testDate.getMonth(),
        testDate.getDate(),
        testDate.getHours(),
        testDate.getMinutes(),
      );
    }

    // no hours, minutes, seconds or milliseconds
    return new Date(
      testDate.getFullYear(),
      testDate.getMonth(),
      testDate.getDate(),
    );
  },
);

export const fcGenValidJSDateObject = (
  fcGen: fc.GeneratorValue,
  withStartTime = true,
): Date => {
  const testDate = fcGen(fc.date, {
    min: new Date("2001-01-01T00:00:00.000Z"),
    max: new Date("3000-12-31T23:59:59.999Z"),
    noInvalidDate: true,
  });

  return cleanTestDate(withStartTime, testDate);
};

export const fcGenValidJSDateObjectString = flow([
  fcGenValidJSDateObject,
  (x: Date): string => x.toDateString(),
]);

const fcGenDuration = (
  withStartTime: boolean,
  fcGen: fc.GeneratorValue,
  [minHours, minDays]: [number, number] = [TESTMINHOURSDIFF, TESTMINDAYSDIFF],
): Duration => {
  if (withStartTime) {
    const [days, hours, minutes] = unfold(
      (_: number) => fcGenRandomIntegerBetween0And1000(fcGen),
      3,
    );
    return { days, hours: hours + minHours, minutes };
  }
  const [months, weeks, days] = unfold(
    (_: number) => fcGenRandomIntegerBetween0And1000(fcGen),
    3,
  );
  return { months, weeks, days: days + minDays };
};

export const fcGenValidJSDateObjectRange = (
  withStartTime: boolean,
  fcGen: fc.GeneratorValue,
): ReadonlyNonEmptyArray<Date> => {
  const startDate: Date = fcGenValidJSDateObject(fcGen, withStartTime);
  const durationToAdd = fcGenDuration(withStartTime, fcGen);
  const endDate: Date = addDateUnits(durationToAdd, startDate);
  return map(cleanTestDate(withStartTime))([startDate, endDate]);
};

export const fcGenValidJSDateObjectInRange = (
  withStartTime: boolean,
  start: Date,
  end: Date,
  fcGen: fc.GeneratorValue,
): Date => {
  const [diffFunction, addFunc] = withStartTime
    ? [differenceInHours, addHours]
    : [differenceInDays, addDays];
  const diff = diffFunction(start, end);
  const unitsToAdd = fcGenRandomIntegerBetweenZeroAnd(fcGen, diff);
  const testDate = addFunc(unitsToAdd, start);
  return cleanTestDate(withStartTime, testDate);
};

// OrgElements

// Time
const fcGenRandomMinutes = curriedFCRandomIntegerBetweenOneAnd(60);
const fcGenRandomHours = curriedFCRandomIntegerBetweenOneAnd(24);
const fcGenRandomDays = curriedFCRandomIntegerBetweenOneAnd(30);
const fcGenRandomWeeks = curriedFCRandomIntegerBetweenOneAnd(4);
const fcGenRandomMonths = curriedFCRandomIntegerBetweenOneAnd(12);
const fcGenRandomYears = curriedFCRandomIntegerBetweenOneAnd(10);

export const fcGenRandomRepeaterType =
  curriedFCRandomItemFromArray(TESTREPEATERTYPES);
const fcGenRandomRepeaterUnitWithHours =
  curriedFCRandomItemFromArray(TESTREPEATERUNITS);
const fcGenRandomRepeaterUnitWithoutHours = curriedFCRandomItemFromArray(
  TESTREPEATERUNITSWITHOUTHOURS,
);

export const fcGenRandomOrgTimestampType =
  curriedFCRandomItemFromArray(TESTIMESTAMPTYPES);

export const fcGenRandomRepeaterUnit = (
  withStartTime: boolean,
  fcGen: fc.GeneratorValue,
): RepeaterUnit => {
  return withStartTime
    ? fcGenRandomRepeaterUnitWithHours(fcGen)
    : fcGenRandomRepeaterUnitWithoutHours(fcGen);
};

const fcGenRepeaterValue = (
  repeaterUnit: string,
  fcGen: fc.GeneratorValue,
): number => {
  return match(repeaterUnit)
    .returnType<number>()
    .with("h", (): number => fcGenRandomHours(fcGen))
    .with("d", (): number => fcGenRandomDays(fcGen))
    .with("w", (): number => fcGenRandomWeeks(fcGen))
    .with("m", (): number => fcGenRandomMonths(fcGen))
    .with("y", (): number => fcGenRandomYears(fcGen))
    .run();
};

export const fcGenRandomRepeaterValue = (
  withStartTime: boolean,
  fcGen: fc.GeneratorValue,
): number => {
  return flow([
    fcGenRandomRepeaterUnit,
    (unit: string): number => fcGenRepeaterValue(unit, fcGen),
  ])(withStartTime, fcGen);
};

const fcGenRandomRepeaterDeadlineValue = (
  repeaterValue: string,
  fcGen: fc.GeneratorValue,
): string => {
  const val: number =
    parseInt(repeaterValue) + fcGenRandomIntegerBetweenOneAndTen(fcGen);
  return val.toString();
};

export const fcGenRandomDelayType =
  curriedFCRandomItemFromArray(TESTDELAYTYPES);
export const fcGenRandomDelayUnit = fcGenRandomRepeaterUnit;
export const fcGenDelayValue = fcGenRepeaterValue;

export const fcGenRandomTimeString = flow([
  over([fcGenRandomHours, fcGenRandomMinutes]),
  map(padTimePart),
  join(":"),
]);

export const fcGenRandomTimeStringMV = flow([
  over([fcGenRandomHours, fcGenRandomMinutes]),
  map(padTimePart),
  over([join(":"), identity]),
]);

export const fcGenTimeRangeParts = (
  [startHour, startMinute]: ReadonlyNonEmptyArray<string>,
  fcGen: fc.GeneratorValue,
): ReadonlyNonEmptyArray<string> => {
  const [
    startHourAsNumber,
    startMinuteAsNumber,
  ]: ReadonlyNonEmptyArray<number> = map(parseInt)([startHour, startMinute]);
  const endHourAsNumber: number = fcGenRandomIntegerInRange(fcGen, [
    startHourAsNumber,
    24,
  ]);
  const endMinuteAsNumber: number = ((): number => {
    if (endHourAsNumber > startHourAsNumber) {
      // we can return anything
      return (
        (startMinuteAsNumber + fcGenRandomIntegerBetweenOneAnd(fcGen, 59)) % 60
      );
    }
    // endMinute must be at least equal to startMinute
    return fcGenRandomIntegerInRange(fcGen, [startMinuteAsNumber, 60]);
  })();

  const [endHour, endMinute] = map((timePart: number): string =>
    pipe(timePart, toString, padTimePart),
  )([endHourAsNumber, endMinuteAsNumber]);

  return [startHour, startMinute, endHour, endMinute];
};

export const fcGenOrgTimestampPartObject = (
  {
    isActive = false,
    withStartTime = false,
    withEndTime = false,
    withRepeater = false,
    withDeadline = false,
    withDelay = false,
  }: TimestampArgs,
  fcGen: fc.GeneratorValue,
): [OrgTimestampPart, Date, string] => {
  const testDate = fcGenValidJSDateObject(fcGen, withStartTime);
  const [year, month, day, dayName, ...startTimeParts] =
    getTimestampPartsFromDate(testDate);

  const [startHour, startMinute, endHour, endMinute]:
    | [string, string, undefined, undefined]
    | ReadonlyNonEmptyArray<string> = withEndTime
    ? fcGenTimeRangeParts(startTimeParts, fcGen)
    : [startTimeParts[0], startTimeParts[1], undefined, undefined];

  const repeaterType: RepeaterType | undefined = withRepeater
    ? fcGenRandomRepeaterType(fcGen)
    : undefined;
  const repeaterUnit: RepeaterUnit | undefined = withRepeater
    ? fcGenRandomRepeaterUnit(withStartTime, fcGen)
    : undefined;
  const repeaterValue: string | undefined =
    withRepeater && repeaterUnit
      ? fcGenRepeaterValue(repeaterUnit, fcGen).toString()
      : undefined;
  const repeaterDeadlineUnit: RepeaterUnit | undefined = withDeadline
    ? repeaterUnit
    : undefined;
  const repeaterDeadlineValue: string | undefined =
    withDeadline && repeaterValue
      ? fcGenRandomRepeaterDeadlineValue(repeaterValue, fcGen)
      : undefined;
  const delayType: DelayType | undefined = withDelay
    ? fcGenRandomDelayType(fcGen)
    : undefined;
  const delayUnit: DelayUnit | undefined = withDelay
    ? fcGenRandomDelayUnit(withStartTime, fcGen)
    : undefined;
  const delayValue: string | undefined =
    withDelay && delayUnit
      ? fcGenDelayValue(delayUnit, fcGen).toString()
      : undefined;

  const timestamp: OrgTimestampPart = {
    isActive,
    withStartTime,
    year,
    month,
    day,
    dayName,
    startHour,
    startMinute,
    endHour,
    endMinute,
    repeaterType,
    repeaterValue,
    repeaterUnit,
    repeaterDeadlineValue,
    repeaterDeadlineUnit,
    delayType,
    delayValue,
    delayUnit,
  };

  const startBracket: string = isActive ? "<" : "[";
  const endBracket: string = isActive ? ">" : "]";
  const mandatoryPart: string = `${year}-${month}-${day} ${dayName}`;
  const startTime: string = withStartTime ? ` ${startHour}:${startMinute}` : "";
  const endTime: string = withEndTime ? `-${endHour}:${endMinute}` : "";
  const repeaterString: string = withRepeater
    ? ` ${repeaterType}${repeaterValue}${repeaterUnit}`
    : "";
  const repeaterDeadlineString: string = withDeadline
    ? `/${repeaterDeadlineValue}${repeaterDeadlineUnit}`
    : "";
  const delayString: string = withDelay
    ? ` ${delayType}${delayValue}${delayUnit}`
    : "";
  const extra: string = `${startTime}${endTime}${repeaterString}${repeaterDeadlineString}${delayString}`;
  const timestampString: string = `${startBracket}${mandatoryPart}${extra}${endBracket}`;

  return [timestamp, testDate, timestampString];
};

export const fcGenOrgTimestampPartRecord = (
  {
    isActive = false,
    withStartTime = false,
    withEndTime = false,
    withRepeater = false,
    withDeadline = false,
    withDelay = false,
  }: Record<string, boolean>,
  fcGen: fc.GeneratorValue,
): [OrgTimestampPartRecord, Date, string] => {
  const [timestamp, testDate, timestampString] = fcGenOrgTimestampPartObject(
    {
      isActive,
      withStartTime,
      withEndTime,
      withRepeater,
      withDeadline,
      withDelay,
    },
    fcGen,
  );
  return [makeOrgTimestampPartRecord(timestamp), testDate, timestampString];
};

export const fcGenRandomOrgTimestampPartObject = (
  fcGen: fc.GeneratorValue,
): [OrgTimestampPart, Date, string] => {
  const [isActive, withStartTime, withRepeater, withDeadline, withDelay] =
    unfold((_: number) => fcGenRandomBoolean(fcGen), 5);
  return fcGenOrgTimestampPartObject(
    { isActive, withStartTime, withRepeater, withDeadline, withDelay },
    fcGen,
  );
};

export const fcGenRandomOrgTimestampPartRecord = (
  fcGen: fc.GeneratorValue,
): [OrgTimestampPartRecord, Date, string] => {
  const [timestamp, testDate, timestampString] =
    fcGenRandomOrgTimestampPartObject(fcGen);
  return [makeOrgTimestampPartRecord(timestamp), testDate, timestampString];
};

export const fcGenOrgTimestampPartObjectWithRepeaterTypeX = (
  {
    repeaterType,
    withStartTime,
    withDeadline,
  }: {
    repeaterType: RepeaterType;
    withStartTime: boolean;
    withDeadline: boolean;
  },
  fcGen: fc.GeneratorValue,
): [OrgTimestampPart, Date, RepeaterUnit, string, string] => {
  const repeaterUnit: RepeaterUnit = fcGenRandomRepeaterUnit(
    withStartTime,
    fcGen,
  );
  const repeaterValue: string = fcGenRepeaterValue(
    repeaterUnit,
    fcGen,
  ).toString();
  const repeaterDeadlineUnit: RepeaterUnit | undefined = withDeadline
    ? repeaterUnit
    : undefined;
  const repeaterDeadlineValue: string | undefined =
    withDeadline && repeaterValue
      ? fcGenRandomRepeaterDeadlineValue(repeaterValue, fcGen)
      : undefined;

  const [timestamp, date, text] = fcGenOrgTimestampPartObject(
    { withStartTime, isActive: true },
    fcGen,
  );
  const timestampWithRepeater = merge(timestamp, {
    repeaterUnit,
    repeaterType,
    repeaterValue,
    repeaterDeadlineUnit,
    repeaterDeadlineValue,
  });
  return [timestampWithRepeater, date, repeaterUnit, repeaterValue, text];
};

// +
export const fcGenOrgTimestampPartRecordWithCumulateRepeater = (
  {
    withStartTime,
    withDeadline,
  }: { withStartTime: boolean; withDeadline: boolean },
  fcGen: fc.GeneratorValue,
): [OrgTimestampPartRecord, Date, OrgTimestampPart] => {
  const repeaterType: RepeaterType = "+";
  const [timestampWithRepeater, date, repeaterUnit, repeaterValue] =
    fcGenOrgTimestampPartObjectWithRepeaterTypeX(
      { repeaterType, withStartTime, withDeadline },
      fcGen,
    );
  // as current time is always ignored, we just generate whatever here
  const currentDate = fcGenValidJSDateObject(fcGen);

  const expectedRepeatDate = addTimestampUnitToDate(
    repeaterUnit,
    parseInt(repeaterValue),
    date,
  );
  const nextRepeatTimestamp: OrgTimestampPart =
    createNextRepeatTimestampPartObject(
      timestampWithRepeater,
      expectedRepeatDate,
    );

  return [
    makeOrgTimestampPartRecord(timestampWithRepeater),
    currentDate,
    nextRepeatTimestamp,
  ];
};

// adding (repeaterValue * periodsElapsed) to a date is not
// the same thing as recursively incrementing a date
const recursiveAddTimestampUnitToDate = (
  times: number,
  unit: TimestampUnit,
  value: number,
  date: Date,
) => {
  if (times > 0) {
    return recursiveAddTimestampUnitToDate(times - 1, unit, value, date);
  }
  return date;
};

// ++
export const fcGenOrgTimestampPartRecordWithCatchupRepeater = (
  {
    withStartTime,
    withDeadline,
  }: { withStartTime: boolean; withDeadline: boolean },
  fcGen: fc.GeneratorValue,
): [OrgTimestampPartRecord, Date, OrgTimestampPart] => {
  const repeaterType: RepeaterType = "++";
  const [timestampWithRepeater, date, repeaterUnit, repeaterValue] =
    fcGenOrgTimestampPartObjectWithRepeaterTypeX(
      { repeaterType, withStartTime, withDeadline },
      fcGen,
    );
  const repeaterValueAsInt: number = parseInt(repeaterValue);
  const completeRepeaterPeriodsElapsed: number =
    fcGenRandomIntegerBetween1And25(fcGen);
  const justBeforeNextRepeatDate: Date = recursiveAddTimestampUnitToDate(
    completeRepeaterPeriodsElapsed - 1,
    repeaterUnit,
    repeaterValueAsInt,
    date,
  );
  const nextRepeatDate: Date = addTimestampUnitToDate(
    repeaterUnit,
    repeaterValueAsInt,
    date,
  );
  const currentDate: Date = fcGenValidJSDateObjectInRange(
    withStartTime,
    justBeforeNextRepeatDate,
    nextRepeatDate,
    fcGen,
  );

  const nextRepeatTimestamp: OrgTimestampPart =
    createNextRepeatTimestampPartObject(timestampWithRepeater, nextRepeatDate);

  return [
    makeOrgTimestampPartRecord(timestampWithRepeater),
    currentDate,
    nextRepeatTimestamp,
  ];
};

// .+
export const fcGenOrgTimestampPartRecordWithRestartRepeater = (
  {
    withStartTime,
    withDeadline,
  }: { withStartTime: boolean; withDeadline: boolean },
  fcGen: fc.GeneratorValue,
): [OrgTimestampPartRecord, Date, OrgTimestampPart] => {
  const repeaterType: RepeaterType = ".+";
  const [timestampWithRepeater, date, repeaterUnit, repeaterValue] =
    fcGenOrgTimestampPartObjectWithRepeaterTypeX(
      { repeaterType, withStartTime, withDeadline },
      fcGen,
    );
  const repeaterValueAsInt: number = parseInt(repeaterValue);
  const completeRepeaterPeriodsElapsed: number =
    fcGenRandomIntegerBetween1And25(fcGen);
  const partialRepeaterPeriodElapsed: number =
    fcGenRandomFloatBetweenZeroAndOneInclusive(fcGen) * repeaterValueAsInt;
  const valueToAddToStartDate: number =
    repeaterValueAsInt * completeRepeaterPeriodsElapsed +
    partialRepeaterPeriodElapsed;
  const currentDate: Date = addTimestampUnitToDate(
    repeaterUnit,
    valueToAddToStartDate,
    date,
  );
  const nextRepeatDate: Date = addTimestampUnitToDate(
    repeaterUnit,
    repeaterValueAsInt,
    currentDate,
  );
  const nextRepeatTimestamp: OrgTimestampPart =
    createNextRepeatTimestampPartObject(timestampWithRepeater, nextRepeatDate);

  return [
    makeOrgTimestampPartRecord(timestampWithRepeater),
    currentDate,
    nextRepeatTimestamp,
  ];
};

export const fcGenOrgTimestampPartRecordWithRepeater = (
  {
    repeaterType,
    withStartTime,
    withDeadline = false,
  }: {
    repeaterType: RepeaterType;
    withStartTime: boolean;
    withDeadline: boolean;
  },
  fcGen: fc.GeneratorValue,
): [OrgTimestampPartRecord, Date, OrgTimestampPart] => {
  return match(repeaterType)
    .returnType<[OrgTimestampPartRecord, Date, OrgTimestampPart]>()
    .with("+", (): [OrgTimestampPartRecord, Date, OrgTimestampPart] =>
      fcGenOrgTimestampPartRecordWithCumulateRepeater(
        { withStartTime, withDeadline },
        fcGen,
      ),
    )
    .with("++", (): [OrgTimestampPartRecord, Date, OrgTimestampPart] =>
      fcGenOrgTimestampPartRecordWithCatchupRepeater(
        { withStartTime, withDeadline },
        fcGen,
      ),
    )
    .with(".+", (): [OrgTimestampPartRecord, Date, OrgTimestampPart] =>
      fcGenOrgTimestampPartRecordWithRestartRepeater(
        { withStartTime, withDeadline },
        fcGen,
      ),
    )
    .exhaustive();
};

export const fcGenRandomOrgTimestampPartRecordWithRepeater = (
  fcGen: fc.GeneratorValue,
): [OrgTimestampPartRecord, Date, OrgTimestampPart] => {
  const [withStartTime, withDeadline] = unfold(
    (_: number): boolean => fcGenRandomBoolean(fcGen),
    2,
  );
  const REPEATERFUNCS: ReadonlyNonEmptyArray<
    (
      {
        withStartTime,
        withDeadline,
      }: { withStartTime: boolean; withDeadline: boolean },
      fcGen: fc.GeneratorValue,
    ) => [OrgTimestampPartRecord, Date, OrgTimestampPart]
  > = [
    fcGenOrgTimestampPartRecordWithCumulateRepeater,
    fcGenOrgTimestampPartRecordWithCatchupRepeater,
    fcGenOrgTimestampPartRecordWithRestartRepeater,
  ];

  return fcCallRandomFCGenWithArg(
    REPEATERFUNCS,
    { withStartTime, withDeadline },
    fcGen,
  );
};

export const fcShuffledSubArrayOfTemplateVariables =
  curriedFCGenRandomShuffledSubarray(TESTORGCAPTURETEMPLATES);

export const fcGenCaptureTemplateString = (
  fcGen: fc.GeneratorValue,
): string => {
  return pipe(fcGen, fcShuffledSubArrayOfTemplateVariables, join(" "));
};

export const fcGenCaptureTemplateStringWithCursor = flow([
  fcGenCaptureTemplateString,
  (template: string) => `${template} %?`,
]);

export const fcGenOrgHeadingAsString = curry(
  (headingLevel: number, fcGen: fc.GeneratorValue): [string, string] => {
    const headingStars: string = createHeadingStars(headingLevel);
    const [headingValue] = fcGenRandomStringGenerator(fcGen);
    const heading: string = `${headingStars} ${headingValue}`;
    return [heading, headingValue];
  },
);

export const fcGenRandomOrgHeadingAsString = defaultConvertFCGenIntoRandomGen(
  fcGenOrgHeadingAsString,
);

export const fcGenRandomInBufferSetting = partialRight(fcShuffledSubarray, [
  TESTINBUFFERSETTINGS,
]);

type CellValueCreator = (
  cellIndex: number,
  fcGen: fc.GeneratorValue,
) => [OrgTableCellValue, string];

type TableGenerator = (
  cellValueCreator: CellValueCreator,
  rowColumnCounts: [number, number],
  fcGen: fc.GeneratorValue,
) => [
  string,
  OrgTableRecord,
  ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<[OrgTableCellValue, string]>>,
];

export const createTestOrgTableCellRecord = ([value, rawContents]: [
  OrgTableCellValue,
  string,
]): OrgTableCellRecord => {
  const cellObject: OrgTableCell = {
    id: testIDCreator(),
    type: "table-cell",
    contents: List([value]),
    rawContents,
  };

  return makeOrgTableCellRecord(cellObject);
};

export const createTestOrgTableRowRecord = (
  contents: ReadonlyNonEmptyArray<OrgTableCellRecord> | "hline",
): OrgTableRowRecord => {
  const rowObject: OrgTableRow = {
    id: testIDCreator(),
    type: "table-row",
    contents: isArray(contents) ? List([...contents]) : "hline",
  };

  return makeOrgTableRowRecord(rowObject);
};

export const createTestOrgTableRecord = (
  rows: ReadonlyNonEmptyArray<OrgTableRowRecord>,
  rawContents: string,
): OrgTableRecord => {
  const tableObject: OrgTable = {
    id: testIDCreator(),
    type: "table",
    contents: List(rows),
    rawContents,
    columnProperties: List(),
  };

  return makeOrgTableRecord(tableObject);
};

export const convertCellValuesToRows = (
  columnCount: number,
  cellValues: ReadonlyNonEmptyArray<[OrgTableCellValue, string]>,
): ReadonlyNonEmptyArray<OrgTableRowRecord> => {
  return pipe(
    cellValues,
    map(createTestOrgTableCellRecord),
    chunksOf(columnCount),
    map(createTestOrgTableRowRecord),
  );
};

export const getColumnWidthsForTestTable = (
  values: ReadonlyNonEmptyArray<
    ReadonlyNonEmptyArray<[OrgTableCellValue, string]>
  >,
): ReadonlyNonEmptyArray<number> => {
  const [columnCount, rowCount]: ReadonlyNonEmptyArray<number> = flap(values)([
    (x) => pipe(x, head, size),
    size,
  ]);

  return unfold((columnIndex: number): number => {
    const cellValueSizes = unfold((rowIndex: number): number => {
      return values[rowIndex][columnIndex][1].length;
    }, rowCount);
    return Math.max(...cellValueSizes) + 2;
  }, columnCount);
};

export const createTestOrgTableRowString =
  (columnWidths: ReadonlyNonEmptyArray<number>) =>
  (row: ReadonlyNonEmptyArray<[OrgTableCellValue, string]>): string => {
    return pipe(
      row,
      mapWithIndex(
        (index: number, [, cellValue]: [OrgTableCellValue, string]): string => {
          // center align ony
          const spacesCnt: number =
            (columnWidths[index] - cellValue.length) / 2;
          return pipe(
            spacesCnt,
            curriedUnfold((_: number): string => " "),
            join(""),
            (spaces: string): string => `${spaces}${cellValue}${spaces}`,
          );
        },
      ),
      join("|"),
      (value: string): string => `|${value}|`,
    );
  };

export const createTestOrgTableRowStrings = curry(
  (
    values: ReadonlyNonEmptyArray<
      ReadonlyNonEmptyArray<[OrgTableCellValue, string]>
    >,
    columnWidths: ReadonlyNonEmptyArray<number>,
  ): ReadonlyNonEmptyArray<string> => {
    return map(createTestOrgTableRowString(columnWidths))(values);
  },
);

export const createTestOrgTableHlineString = (
  columnWidths: ReadonlyNonEmptyArray<number>,
): string => {
  return pipe(
    columnWidths,
    map((columnWidth: number): string => {
      return pipe(
        columnWidth,
        curriedUnfold((_: number): string => "-"),
        join(""),
      );
    }),
    join("+"),
    (x: string): string => `|${x}|`,
  );
};

export const createTestOrgTableStringWithoutHlines = (
  values: ReadonlyNonEmptyArray<
    ReadonlyNonEmptyArray<[OrgTableCellValue, string]>
  >,
): string => {
  return pipe(
    values,
    getColumnWidthsForTestTable,
    createTestOrgTableRowStrings(values),
    join("\n"),
  );
};

export const createTestOrgTableStringWithHlines = (
  values: ReadonlyNonEmptyArray<
    ReadonlyNonEmptyArray<[OrgTableCellValue, string]>
  >,
): string => {
  const columnWidths: ReadonlyNonEmptyArray<number> =
    getColumnWidthsForTestTable(values);
  const rowStrings: ReadonlyNonEmptyArray<string> =
    createTestOrgTableRowStrings(values)(columnWidths);

  const hline: string = createTestOrgTableHlineString(columnWidths);
  return pipe(rowStrings, intersperse(hline), join("\n"));
};

export const fcGenOrgTableHelper = (
  cellValueCreator: CellValueCreator,
  [rows, columns]: [number, number],
  fcGen: fc.GeneratorValue,
): [
  ReadonlyNonEmptyArray<OrgTableRowRecord>,
  ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<[OrgTableCellValue, string]>>,
] => {
  const totalCells = rows * columns;
  const cellValues = unfold((index: number): [OrgTableCellValue, string] => {
    return cellValueCreator(index, fcGen);
  }, totalCells);
  const tableRows = convertCellValuesToRows(columns, cellValues);
  return [tableRows, chunksOf(columns)(cellValues)];
};

export const fcGenOrgTableWithoutHlines = (
  cellValueCreator: CellValueCreator,
  rowColumnCountTuple: [number, number],
  fcGen: fc.GeneratorValue,
): [
  string,
  OrgTableRecord,
  ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<[OrgTableCellValue, string]>>,
] => {
  const [tableRows, tableValues] = fcGenOrgTableHelper(
    cellValueCreator,
    rowColumnCountTuple,
    fcGen,
  );
  const table = createTestOrgTableStringWithoutHlines(tableValues);
  const tableRecord = createTestOrgTableRecord(tableRows, table);

  return [table, tableRecord, tableValues];
};

export const fcGenOrgTableWithHlines = (
  cellValueCreator: CellValueCreator,
  rowColumnCountTuple: [number, number],
  fcGen: fc.GeneratorValue,
): [
  string,
  OrgTableRecord,
  ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<[OrgTableCellValue, string]>>,
] => {
  const [tableRows, tableValues] = fcGenOrgTableHelper(
    cellValueCreator,
    rowColumnCountTuple,
    fcGen,
  );
  const table: string = createTestOrgTableStringWithHlines(tableValues);
  const tableRecord: OrgTableRecord = pipe(
    tableRows,
    intersperseWith(
      (): OrgTableRowRecord => createTestOrgTableRowRecord("hline"),
    ),
    (rows: ReadonlyNonEmptyArray<OrgTableRowRecord>): OrgTableRecord => createTestOrgTableRecord(rows, table),
  );

  return [table, tableRecord, tableValues];
};

export const defaultCreateRandomFCGenOrgTableGenerator =
  (tableGenerator: TableGenerator) =>
  (
    fcGen: fc.GeneratorValue,
  ): [
    string,
    OrgTableRecord,
    ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<[OrgTableCellValue, string]>>,
    number,
    number,
  ] => {
    const rowColumnCountTuple: [number, number] = [
      fcGenRandomIntegerBetween2And25(fcGen),
      fcGenRandomIntegerBetween2And25(fcGen),
    ];

    const [, columnCount] = rowColumnCountTuple;

    const cellValues = fcNLengthUpperAlphaStringArrayGenerator(
      fcGen,
      columnCount,
    );

    const cellValueCreator = (
      index: number,
      _: fc.GeneratorValue,
    ): [OrgTableCellValue, string] => {
      return pipe(
        index,
        mod(columnCount),
        (index: number): [OrgTableCellValue, string] => [
          makeOrgTextRecord({
	    contents:cellValues[index],
	    type: "text"
	  }),
          cellValues[index],
        ],
      );
    };

    const result: [
      string,
      OrgTableRecord,
      ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<[OrgTableCellValue, string]>>,
    ] = tableGenerator(cellValueCreator, rowColumnCountTuple, fcGen);
    return [...result, ...rowColumnCountTuple];
  };

export const defaultFCGenRandomOrgTableWithoutHlines =
  defaultCreateRandomFCGenOrgTableGenerator(fcGenOrgTableWithoutHlines);

export const defaultFCGenRandomOrgTableWithHlines =
  defaultCreateRandomFCGenOrgTableGenerator(fcGenOrgTableWithHlines);
export const defaultFCGenRandomOrgTable = curriedFCCallRandomFCGen([
  defaultFCGenRandomOrgTableWithHlines,
  defaultFCGenRandomOrgTableWithoutHlines,
]);
