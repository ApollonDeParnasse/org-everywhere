import { test, fc } from "@fast-check/vitest";
import { describe, expect, assert } from "vitest";
import { isMap, isRecord, isList, get, getIn } from "immutable";
import {
  forEach,
  overSome,
  spread,
  isDate,
  isObject,
  isEmpty,
  isArray,
  startsWith,
  endsWith,
  isNumber,
  shuffle,
  negate,
  eq,
} from "lodash/fp";
import { pipe } from "fp-ts/function";
import { split } from "fp-ts/string";
import {
  type ReadonlyNonEmptyArray,
  map,
  unzip,
  flap,
} from "fp-ts/ReadonlyNonEmptyArray";
import {
  isWithinInterval,
  isBefore,
  differenceInDays,
  differenceInHours,
} from "date-fns/fp";
import {
  REGULARTIMESTAMPTESTCASES,
  TIMESTAMPSWITHREPEATERTESTCASES,
  TESTREPEATERTYPESSET,
  TESTREPEATERUNITSSET,
  TESTDEADLINEUNITSSET,
  TESTDELAYTYPESSET,
  TESTDELAYUNITSSET,
  TESTLOWERALPHACHARACTERRANGE,
  TESTUPPERALPHACHARACTERRANGE,
  TESTNONSPACESCHARACTERRANGE,
} from "../Constants";
import type {
  OrgTimestampPart,
  RepeaterType,
  OrgTableCellRecord,
  OrgTableRowRecord,
  OrgTableCellValue,
  OrgText
} from "../../src/Types";
import { makeOrgTextRecord } from "../../src/Types";
import {
  convertCharacterIntoCharacterCode,
  getFromRecord,
  curriedGetFromRecord,
  unfold,
  mod,
} from "../../src/util/transformers";
import {
  getHourPartFromDate,
  getMinutePartFromDate,
} from "../../src/lib/timestamps";
import {
  assertIntegerInRangeInclusive,
  convertArraysToSetsAndAssertStrictEqual,
  convertArraysToSetsAndAssertIsSubset,
  assertArrayOfIntegersInRangeInclusive,
  assertIntegerInRangeExclusive,
  assertStrings,
  parseIntAndAssertIntegerInRangeInclusive,
  assertNumbers,
} from "../Asserters";
import {
  fcGenRandomIntegerBetweenZeroAnd,
  fcArrayOfNIntegersInRange,
  fcLinearRangeGenerator,
  fcGenRandomItemFromArray,
  fcGenRandomIntegerInRange,
  fcGenValidJSDateObjectString,
  fcGenValidJSDateObject,
  fcGenRandomCharacterGenerator,
  fcShuffledSubarray,
  fcShuffledArray,
  fcNLengthNonSpaceCharactersArrayGenerator,
  fcGenRandomColorObject,
  fcGenRandomObjectKeyValuePair,
  fcGenTimeRangeParts,
  fcGenOrgTimestampPartRecord,
  fcGenRandomOrgTimestampPartRecord,
  fcGenOrgTimestampPartRecordWithCumulateRepeater,
  fcGenOrgTimestampPartRecordWithCatchupRepeater,
  fcGenOrgTimestampPartRecordWithRestartRepeater,
  fcGenOrgTimestampPartRecordWithRepeater,
  fcGenRandomOrgTimestampPartRecordWithRepeater,
  fcGenValidJSDateObjectRange,
  fcGenValidJSDateObjectInRange,
  randomHourPart,
  randomMinutePart,
  randomYear,
  fcGenRandomImmutableMap,
  fcGenObject,
  fcGenRandomObject,
  fcGenListOfNObjectKeys,
  fcGenRandomListOfObjectKeys,
  fcGenListOfNObjectKeyValuePairs,
  fcGenRandomListOfObjectKeyValuePairs,
  fcGenRandomRepeaterValue,
  fcGenRandomTimeString,
  fcGenRandomImmutableRecord,
  fcGenOrgTableWithoutHlines,
  defaultFCGenRandomOrgTableWithoutHlines,
  fcGenOrgTableWithHlines,
  defaultFCGenRandomOrgTableWithHlines,
  defaultFCGenRandomOrgTable,
  createTestOrgTableCellRecord,
  createTestOrgTableRowRecord,
  fcGenRandomArrayOfUpperAlphaStringsGenerator,
  createTestOrgTableRecord,
  flippedFCRandomItemFromArray,
  fcNLengthLowerAlphaStringArrayGenerator,
  createTestOrgTableStringWithoutHlines,
  createTestOrgTableStringWithHlines,
  fcNLengthArrayOfXGenerator,
  createTestOrgTableHlineString,
  fcNLengthStringGenerator,
  fcArrayOfXNatNumbersWithMaxGenerator,
  fcGenRandomItemFromArrayWithIndex,
  createTestOrgTableRowStrings,
  getColumnWidthsForTestTable,
  nonZeroBoundedModularAdditionForCharacters,
  fcGenRandomIntegerBetweenOneAnd,
  fcNLengthStringGeneratorMV,
  fcNLengthUpperAlphaStringArrayGenerator,
  fcGenRandomArrayOfLowerAlphaStringsGenerator,
  fcGenRandomStringGenerator,
  fcGenRandomAlphaString,
  fcGenRandomLengthLowerAlphaStringGenerator,
  fcGenRandomLengthUpperAlphaStringGenerator,
} from "../TestDataGenerators.ts";

const upperAlpha = /[A-Z]/g;
const lowerAlpha = /[a-z]/g;
const alpha = /[A-z]/g;
const isX = (re: RegExp) => (x: string) => isArray(x.match(re));
const isLowerAlpha = isX(lowerAlpha);
const isUpperAlpha = isX(upperAlpha);
const isAlpha = isX(alpha);

const testCellValueCreator = (
  cellIndex: number,
  _: fc.GeneratorValue,
): [OrgTableCellValue, string] => {
  const testText: OrgText = {
    type: "text",
    contents: cellIndex.toString()
  };
  return [makeOrgTextRecord(testText), cellIndex.toString()];
};

const testRowValues = (
  fcGen: fc.GeneratorValue,
  [expectedRowCount, expectedColumnCount]: [number, number],
): ReadonlyNonEmptyArray<
  ReadonlyNonEmptyArray<[OrgTableCellValue, string]>
> => {
  const testRows = pipe(
    fcNLengthLowerAlphaStringArrayGenerator(fcGen, expectedColumnCount),
    map((str: string): [OrgTableCellValue, string] => [str, str]),
  );

  return unfold(
    (_: number): ReadonlyNonEmptyArray<[OrgTableCellValue, string]> => {
      return shuffle(testRows);
    },
    expectedRowCount,
  );
};

const isRepeaterType = (
  actualVal: any,
  repeaterTypesSet = TESTREPEATERTYPESSET,
): boolean => repeaterTypesSet.has(actualVal);
const isRepeaterUnit = (
  withStartTime: boolean,
  actualVal: any,
  repeaterUnitsSet = TESTREPEATERUNITSSET,
): boolean => {
  if (withStartTime) {
    return repeaterUnitsSet.has(actualVal);
  }
  return repeaterUnitsSet.has(actualVal) && actualVal !== "h";
};

const isDeadlineUnit = (
  withStartTime: boolean,
  actualVal: any,
  deadlineUnitsSet = TESTDEADLINEUNITSSET,
): boolean => {
  if (withStartTime) {
    return deadlineUnitsSet.has(actualVal);
  }
  return deadlineUnitsSet.has(actualVal) && actualVal !== "h";
};

const isDelayType = (
  actualVal: any,
  delayTypesSet = TESTDELAYTYPESSET,
): boolean => delayTypesSet.has(actualVal);

const isDelayUnit = (
  withStartTime: boolean,
  actualVal: any,
  delayUnitsSet = TESTDELAYUNITSSET,
): boolean => {
  if (withStartTime) {
    return delayUnitsSet.has(actualVal);
  }
  return delayUnitsSet.has(actualVal) && actualVal !== "h";
};

const isValidDateWithStartTime = (actualDate: Date): void => {
  expect([actualDate.getSeconds(), actualDate.getMilliseconds()]).toStrictEqual(
    [0, 0],
  );
};

const isValidNoStartTimeDate = (actualDate: Date): void => {
  expect([
    actualDate.getHours(),
    actualDate.getMinutes(),
    actualDate.getSeconds(),
    actualDate.getMilliseconds(),
  ]).toStrictEqual([0, 0, 0, 0]);
};

describe("TestDataGenerators test suite", () => {
  describe("non-fast-check generators", () => {
    describe("time", () => {
      test.prop([fc.gen()])("randomHourPart", (_) => {
        const actualHour: string = randomHourPart();
        assert.isString(actualHour);
        assert.lengthOf(actualHour, 2);
        parseIntAndAssertIntegerInRangeInclusive([0, 24], actualHour);
      });

      test.prop([fc.gen()])("randomMinutePart", (_) => {
        const actualMinute: string = randomMinutePart();
        assert.isString(actualMinute);
        assert.lengthOf(actualMinute, 2);
        parseIntAndAssertIntegerInRangeInclusive([0, 60], actualMinute);
      });

      test.prop([fc.gen()])("randomYear", (_) => {
        const actualYear: string = randomYear();
        assert.isString(actualYear);
        assert.lengthOf(actualYear, 4);
        parseIntAndAssertIntegerInRangeInclusive([2000, 3000], actualYear);
      });
    });
  });
  describe("for fast-check", () => {
    describe("String generators suite", () => {
      test.prop([fc.string({ minLength: 1, maxLength: 1 })])(
        "convertCharacterIntoCharacterCode",
        (testChar) => {
          const actualCharCode: number =
            convertCharacterIntoCharacterCode(testChar);

          assert.isNumber(actualCharCode);
        },
      );

      test.prop([fc.gen()])(
        "nonZeroBoundedModularAdditionForCharacters",
        (fcGen) => {
          const testRange = fcGenRandomItemFromArray(fcGen, [
            TESTNONSPACESCHARACTERRANGE,
            TESTLOWERALPHACHARACTERRANGE,
            TESTUPPERALPHACHARACTERRANGE,
          ]);

          const testCurrentNumber: number = fcGenRandomIntegerBetweenZeroAnd(
            fcGen,
            testRange.length,
          );
          const testStandardIncrease: number = fcGenRandomIntegerBetweenOneAnd(
            fcGen,
            testRange.length - 1,
          );

          const testGenerator =
            nonZeroBoundedModularAdditionForCharacters(testRange);
          const actualString = testGenerator(
            testStandardIncrease,
            testCurrentNumber,
          );
          assert.isString(actualString);
          assert.lengthOf(actualString, 1);
          expect(actualString).not.toBe(" ");
        },
      );
      test.prop([fc.gen(), fc.integer({ min: 2, max: 25 })])(
        "fcNLengthStringGeneratorMV",
        (fcGen, testLength) => {
          const [actualString, actualStringValues] = fcNLengthStringGeneratorMV(
            testLength,
            fcGen,
          );
          assert.isString(actualString);
          assert.isArray(actualStringValues);
          assert.isString(fcGenRandomItemFromArray(fcGen, actualStringValues));
          assert.lengthOf(actualString, testLength);
          expect(actualString).not.toBe(" ");
          expect(actualString).not.toContain(" ");
        },
      );
      test.prop([fc.gen(), fc.integer({ min: 2, max: 25 })])(
        "fcNLengthStringGenerator",
        (fcGen, testLength) => {
          const actualString = fcNLengthStringGenerator(testLength, fcGen);
          assert.isString(actualString);
          assert.lengthOf(actualString, testLength);
          expect(actualString).not.toBe(" ");
          expect(actualString).not.toContain(" ");
        },
      );
      test.prop([fc.gen()])(
        "fcGenRandomLengthLowerAlphaStringGenerator",
        (fcGen) => {
          const actualString =
            fcGenRandomLengthLowerAlphaStringGenerator(fcGen);

          expect(
            pipe(
              actualString,
              split(""),
              flippedFCRandomItemFromArray(fcGen),
              isLowerAlpha,
            ),
          ).toBeTruthy();
        },
      );

      test.prop([fc.gen()])(
        "fcGenRandomLengthUpperAlphaStringGenerator",
        (fcGen) => {
          const actualString =
            fcGenRandomLengthUpperAlphaStringGenerator(fcGen);
          expect(
            pipe(
              actualString,
              split(""),
              flippedFCRandomItemFromArray(fcGen),
              isUpperAlpha,
            ),
          ).toBeTruthy();
        },
      );

      test.prop([fc.gen()])("fcGenRandomAlphaString", (fcGen) => {
        const actualString = fcGenRandomAlphaString(fcGen);
        expect(
          pipe(
            actualString,
            split(""),
            flippedFCRandomItemFromArray(fcGen),
            isAlpha,
          ),
        ).toBeTruthy();
      });

      test.prop([fc.gen()])("fcGenRandomStringGenerator", (fcGen) => {
        const actualString = fcGenRandomStringGenerator(fcGen);
        expect(
          pipe(
            actualString,
            split(""),
            flippedFCRandomItemFromArray(fcGen),
            negate(eq(" ")),
          ),
        ).toBeTruthy();
      });

      test.prop([
        fc.tuple(
          fc.integer({ min: 1, max: 49 }),
          fc.integer({ min: 50, max: 100 }),
        ),
        fc.gen(),
      ])("fcGenRandomCharacterGenerator", (testUTFRange, fcGen) => {
        const actualCharacter: string = fcGenRandomCharacterGenerator(
          testUTFRange,
          fcGen,
        );
        const actualCharacterCode: number =
          convertCharacterIntoCharacterCode(actualCharacter);
        assertIntegerInRangeInclusive(testUTFRange, actualCharacterCode);
      });
    });

    describe("Date generators", () => {
      describe("fcGenValidJSDateObject", () => {
        test.prop([fc.gen()])("withStartTime", (fcGen) => {
          const actualDate: Date = fcGenValidJSDateObject(fcGen);
          assert.instanceOf(actualDate, Date);
          assert.isNumber(actualDate.getFullYear());
          isValidDateWithStartTime(actualDate);
        });

        test.prop([fc.gen()])("withoutStartTime", (fcGen) => {
          const actualDate: Date = fcGenValidJSDateObject(fcGen, false);
          assert.instanceOf(actualDate, Date);
          assert.isNumber(actualDate.getFullYear());
          isValidNoStartTimeDate(actualDate);
        });
      });

      test.prop([fc.boolean(), fc.gen()])(
        "fcGenValidJSDateObject",
        (withStartTime, fcGen) => {
          const actualDateString: string = fcGenValidJSDateObjectString(
            fcGen,
            withStartTime,
          );
          // Jun 09 2025 = min length
          expect(actualDateString.length).toBeGreaterThan(11);
        },
      );

      describe("fcGenValidJSDateObjectRange", () => {
        test.prop([fc.gen()])("withStartTime", (fcGen) => {
          const [actualStart, actualEnd] = fcGenValidJSDateObjectRange(
            true,
            fcGen,
          );
          expect(isBefore(actualEnd, actualStart)).toBeTruthy();
          // At least two hour difference is needed for repeater tests
          expect(differenceInHours(actualStart, actualEnd)).toBeGreaterThan(1);
          forEach(isValidDateWithStartTime)([actualStart, actualEnd]);
        });

        test.prop([fc.gen()])("withoutStartTime", (fcGen) => {
          const [actualStart, actualEnd] = fcGenValidJSDateObjectRange(
            false,
            fcGen,
          );
          expect(isBefore(actualEnd, actualStart)).toBeTruthy();
          // At least two day difference is needed for repeater tests
          expect(differenceInDays(actualStart, actualEnd)).toBeGreaterThan(1);
          forEach(isValidNoStartTimeDate)([actualStart, actualEnd]);
        });
      });

      describe("fcGenValidJSDateObjectInRange", () => {
        test.prop([fc.gen()])("withStartTime", (fcGen) => {
          const [start, end] = fcGenValidJSDateObjectRange(true, fcGen);
          const actualDate = fcGenValidJSDateObjectInRange(
            true,
            start,
            end,
            fcGen,
          );
          expect(isWithinInterval({ start, end }, actualDate)).toBeTruthy();
          isValidDateWithStartTime(actualDate);
        });

        test.prop([fc.gen()])("withoutStartTime", (fcGen) => {
          const [start, end] = fcGenValidJSDateObjectRange(false, fcGen);
          const actualDate = fcGenValidJSDateObjectInRange(
            false,
            start,
            end,
            fcGen,
          );
          expect(isWithinInterval({ start, end }, actualDate)).toBeTruthy();
          isValidNoStartTimeDate(actualDate);
        });
      });
    });

    describe("Array generators suite", () => {
      test.prop([
        fc.integer({ min: 1, max: 25 }),
        fc.integer({ min: 2, max: 100 }),
        fc.gen(),
      ])(
        "fcNLengthArrayOfXGenerator",
        (testArraySize, testRangeSize, fcGen) => {
          const testRange: [number, number] = fcLinearRangeGenerator(
            fcGen,
            testRangeSize,
          );
          const [, rangeMax] = testRange;
          const actualArray = fcNLengthArrayOfXGenerator(
            mod(rangeMax),
            testRange,
          )(fcGen, testArraySize);
          assert.lengthOf(actualArray, testArraySize);
        },
      );

      test.prop([fc.array(fc.string(), { minLength: 1 }), fc.gen()])(
        "fcShuffledSubarray",
        (testArray, fcGen) => {
          const testLength = fcGenRandomIntegerInRange(fcGen, [
            1,
            testArray.length,
          ]);
          const actualShuffledSubarray: Array<string> = fcShuffledSubarray(
            testLength,
            fcGen,
            testArray,
          );
          convertArraysToSetsAndAssertIsSubset([
            actualShuffledSubarray,
            testArray,
          ]);
        },
      );

      test.prop([fc.array(fc.string(), { minLength: 1 }), fc.gen()])(
        "fcShuffledArray",
        (testArray, fcGen) => {
          const actualShuffledArray: ReadonlyNonEmptyArray<string> =
            fcShuffledArray(fcGen, testArray);
          convertArraysToSetsAndAssertStrictEqual([
            actualShuffledArray,
            testArray,
          ]);
        },
      );

      test.prop([
        fc.integer({ min: 1 }),
        fc.integer({ min: 1, max: 20 }),
        fc.gen(),
      ])("fcArrayOfNIntegersInRange", (testRangeSize, testCount, fcGen) => {
        const testRange: [number, number] = fcLinearRangeGenerator(
          fcGen,
          testRangeSize,
        );
        const actualArray: ReadonlyNonEmptyArray<number> =
          fcArrayOfNIntegersInRange(testRange, testCount, fcGen);
        const actualRandomValue: number = fcGenRandomItemFromArray(
          fcGen,
          actualArray,
        );
        assert.lengthOf(actualArray, testCount);
        assertIntegerInRangeExclusive(testRange, actualRandomValue);
      });

      test.prop([fc.integer({ min: 1, max: 100 }), fc.gen()])(
        "fcNLengthNonSpaceCharactersArrayGenerator",
        (testLength, fcGen) => {
          const actualStringArray: ReadonlyNonEmptyArray<string> =
            fcNLengthNonSpaceCharactersArrayGenerator(fcGen, testLength);
          expect(actualStringArray.length).toEqual(testLength);
          assert.isString(fcGenRandomItemFromArray(fcGen, actualStringArray));
        },
      );
      test.prop([fc.integer({ min: 1, max: 100 }), fc.gen()])(
        "fcNLengthLowerAlphaStringArrayGenerator",
        (testLength, fcGen) => {
          const actualStringArray: ReadonlyNonEmptyArray<string> =
            fcNLengthLowerAlphaStringArrayGenerator(fcGen, testLength);
          expect(actualStringArray.length).toEqual(testLength);
          expect(
            pipe(
              actualStringArray,
              flippedFCRandomItemFromArray(fcGen),
              isLowerAlpha,
            ),
          ).toBeTruthy();
        },
      );

      test.prop([fc.integer({ min: 1, max: 100 }), fc.gen()])(
        "fcNLengthUpperAlphaStringArrayGenerator",
        (testLength, fcGen) => {
          const actualStringArray: ReadonlyNonEmptyArray<string> =
            fcNLengthUpperAlphaStringArrayGenerator(fcGen, testLength);
          expect(actualStringArray.length).toEqual(testLength);
          expect(
            pipe(
              actualStringArray,
              flippedFCRandomItemFromArray(fcGen),
              isUpperAlpha,
            ),
          ).toBeTruthy();
        },
      );

      test.prop([fc.gen()])(
        "fcGenRandomArrayOfLowerAlphaStringsGenerator",
        (fcGen) => {
          const actualStringArray: ReadonlyNonEmptyArray<string> =
            fcGenRandomArrayOfLowerAlphaStringsGenerator(fcGen);
          assert.isArray(actualStringArray);
          assert.isString(fcGenRandomItemFromArray(fcGen, actualStringArray));
        },
      );

      test.prop([fc.gen()])(
        "fcGenRandomArrayOfUpperAlphaStringsGenerator",
        (fcGen) => {
          const actualStringArray: ReadonlyNonEmptyArray<string> =
            fcGenRandomArrayOfUpperAlphaStringsGenerator(fcGen);
          assert.isArray(actualStringArray);
          assert.isString(fcGenRandomItemFromArray(fcGen, actualStringArray));
        },
      );
    });

    describe("Object generators suite", () => {
      test.prop([fc.gen(), fc.integer({ min: 1, max: 25 })])(
        "fcGenObject",
        (fcGen, testKeysCount) => {
          const actualObj = fcGenObject(testKeysCount, fcGen);
          expect(isObject(actualObj)).toBeTruthy();
          assert.lengthOf(Object.keys(actualObj), testKeysCount);
        },
      );
      test.prop([fc.gen()])("fcGenRandomObject", (fcGen) => {
        const actualObj = fcGenRandomObject(fcGen);
        expect(isObject(actualObj)).toBeTruthy();
        expect(Object.keys(actualObj).length).toBeGreaterThan(0);
      });

      test.prop([fc.gen()])("fcGenRandomObjectKeyValuePair", (fcGen) => {
        const testObj: Record<string, any> = fcGenRandomObject(fcGen);
        const [actualKey, actualValue] = fcGenRandomObjectKeyValuePair(
          fcGen,
          testObj,
        );
        expect(testObj[actualKey]).toBe(actualValue);
      });

      test.prop([fc.gen(), fc.integer({ min: 1, max: 25 })])(
        "fcGenListOfNObjectKeys",
        (fcGen, testKeysCount) => {
          const testObj = fcGenObject(testKeysCount, fcGen);
          const testCount: number = fcGenRandomIntegerInRange(fcGen, [
            1,
            testKeysCount,
          ]);
          const actualKeys = fcGenListOfNObjectKeys(testCount, fcGen, testObj);
          const actualKey = fcGenRandomItemFromArray(fcGen, actualKeys);

          assert.lengthOf(actualKeys, testCount);
          expect(testObj.hasOwnProperty(actualKey)).toBeTruthy();
        },
      );

      test.prop([fc.gen()])("fcGenRandomListOfObjectKeys", (fcGen) => {
        const testObj = fcGenRandomObject(fcGen);
        const actualKeys = fcGenRandomListOfObjectKeys(fcGen, testObj);
        const actualRandomKey = fcGenRandomItemFromArray(fcGen, actualKeys);
        expect(testObj.hasOwnProperty(actualRandomKey)).toBeTruthy();
      });

      test.prop([fc.gen(), fc.integer({ min: 1, max: 25 })])(
        "fcGenListOfNObjectKeyValuePairs",
        (fcGen, testKeysCount) => {
          const testObj = fcGenObject(testKeysCount, fcGen);
          const testCount: number = fcGenRandomIntegerInRange(fcGen, [
            1,
            testKeysCount,
          ]);
          const actualPairs = fcGenListOfNObjectKeyValuePairs(
            testCount,
            fcGen,
            testObj,
          );
          const [actualKey, actualValue] = fcGenRandomItemFromArray(
            fcGen,
            actualPairs,
          );

          assert.lengthOf(actualPairs, testCount);
          expect(testObj[actualKey]).toStrictEqual(actualValue);
        },
      );

      test.prop([fc.gen()])(
        "fcGenRandomListOfObjectKeyValuePairs",
        (fcGen) => {
          const testObj = fcGenRandomObject(fcGen);
          const actualPairs = fcGenRandomListOfObjectKeyValuePairs(
            fcGen,
            testObj,
          );

          const [actualKey, actualValue] = fcGenRandomItemFromArray(
            fcGen,
            actualPairs,
          );

          expect(testObj[actualKey]).toBe(actualValue);
        },
      );
    });

    describe("Immutable Object generators suite", () => {
      test.prop([fc.gen()])("fcGenRandomImmutableMap", (fcGen) => {
        const [actualMap, actualObj] = fcGenRandomImmutableMap(fcGen);
        expect(isMap(actualMap)).toBeTruthy();
        expect(actualMap.isEmpty()).toBe(false);
        expect(isObject(actualObj)).toBeTruthy();
        expect(isEmpty(actualObj)).toBe(false);
      });
      test.prop([fc.gen()])("fcGenRandomImmutableRecord", (fcGen) => {
        const [actualRecord, actualObj] = fcGenRandomImmutableRecord(fcGen);
        expect(isRecord(actualRecord)).toBeTruthy();
        expect(isObject(actualObj)).toBeTruthy();
        expect(isEmpty(actualObj)).toBe(false);
      });
    });

    describe("Color generators suite", () => {
      test.prop([fc.gen()])("fcGenRandomColorObject", (fcGen) => {
        const {
          r: actualR,
          g: actualG,
          b: actualB,
          alpha: actualAlpha,
        } = fcGenRandomColorObject(fcGen);
        assertArrayOfIntegersInRangeInclusive(
          [0, 255],
          [actualR, actualG, actualB],
        );
        assertIntegerInRangeExclusive(
          [0, 1],
          (isNumber(actualAlpha) && actualAlpha) || -1,
        );
      });
    });

    describe("Timestamp generators suite", () => {
      test.prop([fc.gen()])("fcGenTimeRangeParts", (fcGen) => {
        const testDate = fcGenValidJSDateObject(fcGen);
        const testTimeRangeStartParts: ReadonlyNonEmptyArray<string> = flap(
          testDate,
        )([getHourPartFromDate, getMinutePartFromDate]);
        const actualTimeRangeParts = fcGenTimeRangeParts(
          testTimeRangeStartParts,
          fcGen,
        );

        expect(actualTimeRangeParts[0]).toBe(testTimeRangeStartParts[0]);
        expect(actualTimeRangeParts[1]).toBe(testTimeRangeStartParts[1]);

        const testAsserters: ReadonlyNonEmptyArray<
          (
            startHour: number,
            startMinute: number,
            endHour: number,
            endMinute: number,
          ) => boolean
        > = [
          (
            startHour: number,
            _startMinute: number,
            endHour: number,
            _endMinute: number,
          ): boolean => endHour > startHour,
          (
            startHour: number,
            startMinute: number,
            endHour: number,
            endMinute: number,
          ): boolean => endHour === startHour && endMinute > startMinute,
          (
            startHour: number,
            startMinute: number,
            endHour: number,
            endMinute: number,
          ): boolean => endHour === startHour && endMinute === startMinute,
        ];

        const asserter = (actualValues: ReadonlyNonEmptyArray<string>) => {
          return pipe(
            actualValues,
            map(parseInt),
            overSome(map(spread)(testAsserters)),
          );
        };

        expect(asserter(actualTimeRangeParts)).toBeTruthy();
      });

      test.prop([fc.gen()])("fcGenRandomTimeString", (fcGen) => {
        const actualTime = fcGenRandomTimeString(fcGen);
        const [actualHour, actualMinute] = split(":")(actualTime);
        parseIntAndAssertIntegerInRangeInclusive([0, 23], actualHour);
        parseIntAndAssertIntegerInRangeInclusive([0, 59], actualMinute);
      });

      test.prop([fc.boolean(), fc.gen()])(
        "fcGenRandomRepeaterValue",
        (withStartTime, fcGen) => {
          const actualRepeaterValue = fcGenRandomRepeaterValue(
            withStartTime,
            fcGen,
          );
          assert.isNumber(actualRepeaterValue);
        },
      );

      describe("Individual repeater types suite", () => {
        describe("fcGenOrgTimestampPartRecordWithCumulateRepeater", () => {
          test.prop([fc.boolean(), fc.gen()])(
            "withDeadline",
            (withStartTime, fcGen) => {
              const [
                testTimestampPartRecord,
                testCurrentDate,
                expectedNextRepeatTimestampPartObject,
              ] = fcGenOrgTimestampPartRecordWithCumulateRepeater(
                { withStartTime, withDeadline: true },
                fcGen,
              );

              forEach((actualTimestampPartObject: OrgTimestampPart) => {
                expect(actualTimestampPartObject).toMatchObject({
                  isActive: true,
                  withStartTime,
                  year: expect.any(String),
                  month: expect.any(String),
                  day: expect.any(String),
                  dayName: expect.any(String),
                  endHour: undefined,
                  endMinute: undefined,
                  repeaterType: "+",
                  repeaterValue: expect.any(String),
                  repeaterUnit: expect.any(String),
                  repeaterDeadlineValue: expect.any(String),
                  repeaterDeadlineUnit: expect.any(String),
                });

                expect(
                  isRepeaterUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterUnit,
                  ),
                ).toBeTruthy();
                expect(
                  isDeadlineUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterDeadlineUnit,
                  ),
                ).toBeTruthy();
              })([
                testTimestampPartRecord.toJS(),
                expectedNextRepeatTimestampPartObject,
              ]);

              expect(testCurrentDate).toEqual(expect.any(Date));
            },
          );

          test.prop([fc.boolean(), fc.gen()])(
            "withoutDeadline",
            (withStartTime, fcGen) => {
              const [
                testTimestampPartRecord,
                testCurrentDate,
                expectedNextRepeatTimestampPartObject,
              ] = fcGenOrgTimestampPartRecordWithCumulateRepeater(
                { withStartTime, withDeadline: false },
                fcGen,
              );

              forEach((actualTimestampPartObject: OrgTimestampPart) => {
                expect(actualTimestampPartObject).toMatchObject({
                  isActive: true,
                  withStartTime,
                  year: expect.any(String),
                  month: expect.any(String),
                  day: expect.any(String),
                  dayName: expect.any(String),
                  endHour: undefined,
                  endMinute: undefined,
                  repeaterType: "+",
                  repeaterValue: expect.any(String),
                  repeaterUnit: expect.any(String),
                  repeaterDeadlineValue: undefined,
                  repeaterDeadlineUnit: undefined,
                });

                expect(
                  isRepeaterUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterUnit,
                  ),
                ).toBeTruthy();
              })([
                testTimestampPartRecord.toJS(),
                expectedNextRepeatTimestampPartObject,
              ]);

              expect(testCurrentDate).toEqual(expect.any(Date));
            },
          );
        });

        describe("fcGenOrgTimestampPartRecordWithCatchupRepeater", () => {
          test.prop([fc.boolean(), fc.gen()])(
            "withDeadline",
            (withStartTime, fcGen) => {
              const [
                testTimestampPartRecord,
                testCurrentDate,
                expectedNextRepeatTimestampPartObject,
              ] = fcGenOrgTimestampPartRecordWithCatchupRepeater(
                { withStartTime, withDeadline: true },
                fcGen,
              );

              forEach((actualTimestampPartObject: OrgTimestampPart) => {
                expect(actualTimestampPartObject).toMatchObject({
                  isActive: true,
                  withStartTime,
                  year: expect.any(String),
                  month: expect.any(String),
                  day: expect.any(String),
                  dayName: expect.any(String),
                  endHour: undefined,
                  endMinute: undefined,
                  repeaterType: "++",
                  repeaterValue: expect.any(String),
                  repeaterUnit: expect.any(String),
                  repeaterDeadlineValue: expect.any(String),
                  repeaterDeadlineUnit: expect.any(String),
                });

                expect(
                  isRepeaterUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterUnit,
                  ),
                ).toBeTruthy();
                expect(
                  isDeadlineUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterDeadlineUnit,
                  ),
                ).toBeTruthy();
              })([
                testTimestampPartRecord.toJS(),
                expectedNextRepeatTimestampPartObject,
              ]);

              expect(testCurrentDate).toEqual(expect.any(Date));
            },
          );

          test.prop([fc.boolean(), fc.gen()])(
            "withoutDeadline",
            (withStartTime, fcGen) => {
              const [
                testTimestampPartRecord,
                testCurrentDate,
                expectedNextRepeatTimestampPartObject,
              ] = fcGenOrgTimestampPartRecordWithCatchupRepeater(
                { withStartTime, withDeadline: false },
                fcGen,
              );

              forEach((actualTimestampPartObject: OrgTimestampPart) => {
                expect(actualTimestampPartObject).toMatchObject({
                  isActive: true,
                  withStartTime,
                  year: expect.any(String),
                  month: expect.any(String),
                  day: expect.any(String),
                  dayName: expect.any(String),
                  endHour: undefined,
                  endMinute: undefined,
                  repeaterType: "++",
                  repeaterValue: expect.any(String),
                  repeaterUnit: expect.any(String),
                  repeaterDeadlineValue: undefined,
                  repeaterDeadlineUnit: undefined,
                });

                expect(
                  isRepeaterUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterUnit,
                  ),
                ).toBeTruthy();
              })([
                testTimestampPartRecord.toJS(),
                expectedNextRepeatTimestampPartObject,
              ]);

              expect(testCurrentDate).toEqual(expect.any(Date));
            },
          );
        });
        describe("fcGenOrgTimestampPartRecordWithCatchupRepeater", () => {
          test.prop([fc.boolean(), fc.gen()])(
            "withDeadline",
            (withStartTime, fcGen) => {
              const [
                testTimestampPartRecord,
                testCurrentDate,
                expectedNextRepeatTimestampPartObject,
              ] = fcGenOrgTimestampPartRecordWithCatchupRepeater(
                { withStartTime, withDeadline: true },
                fcGen,
              );

              forEach((actualTimestampPartObject: OrgTimestampPart) => {
                expect(actualTimestampPartObject).toMatchObject({
                  isActive: true,
                  withStartTime,
                  year: expect.any(String),
                  month: expect.any(String),
                  day: expect.any(String),
                  dayName: expect.any(String),
                  endHour: undefined,
                  endMinute: undefined,
                  repeaterType: "++",
                  repeaterValue: expect.any(String),
                  repeaterUnit: expect.any(String),
                  repeaterDeadlineValue: expect.any(String),
                  repeaterDeadlineUnit: expect.any(String),
                });

                expect(
                  isRepeaterUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterUnit,
                  ),
                ).toBeTruthy();
                expect(
                  isDeadlineUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterDeadlineUnit,
                  ),
                ).toBeTruthy();
              })([
                testTimestampPartRecord.toJS(),
                expectedNextRepeatTimestampPartObject,
              ]);

              expect(testCurrentDate).toEqual(expect.any(Date));
            },
          );

          test.prop([fc.boolean(), fc.gen()])(
            "withoutDeadline",
            (withStartTime, fcGen) => {
              const [
                testTimestampPartRecord,
                testCurrentDate,
                expectedNextRepeatTimestampPartObject,
              ] = fcGenOrgTimestampPartRecordWithCatchupRepeater(
                { withStartTime, withDeadline: false },
                fcGen,
              );

              forEach((actualTimestampPartObject: OrgTimestampPart) => {
                expect(actualTimestampPartObject).toMatchObject({
                  isActive: true,
                  withStartTime,
                  year: expect.any(String),
                  month: expect.any(String),
                  day: expect.any(String),
                  dayName: expect.any(String),
                  endHour: undefined,
                  endMinute: undefined,
                  repeaterType: "++",
                  repeaterValue: expect.any(String),
                  repeaterUnit: expect.any(String),
                  repeaterDeadlineValue: undefined,
                  repeaterDeadlineUnit: undefined,
                });

                expect(
                  isRepeaterUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterUnit,
                  ),
                ).toBeTruthy();
              })([
                testTimestampPartRecord.toJS(),
                expectedNextRepeatTimestampPartObject,
              ]);

              expect(testCurrentDate).toEqual(expect.any(Date));
            },
          );
        });

        describe("fcGenOrgTimestampPartRecordWithRestartRepeater", () => {
          test.prop([fc.boolean(), fc.gen()])(
            "withDeadline",
            (withStartTime, fcGen) => {
              const [
                testTimestampPartRecord,
                testCurrentDate,
                expectedNextRepeatTimestampPartObject,
              ] = fcGenOrgTimestampPartRecordWithRestartRepeater(
                { withStartTime, withDeadline: true },
                fcGen,
              );

              forEach((actualTimestampPartObject: OrgTimestampPart) => {
                expect(actualTimestampPartObject).toMatchObject({
                  isActive: true,
                  withStartTime,
                  year: expect.any(String),
                  month: expect.any(String),
                  day: expect.any(String),
                  dayName: expect.any(String),
                  endHour: undefined,
                  endMinute: undefined,
                  repeaterType: ".+",
                  repeaterValue: expect.any(String),
                  repeaterUnit: expect.any(String),
                  repeaterDeadlineValue: expect.any(String),
                  repeaterDeadlineUnit: expect.any(String),
                });

                expect(
                  isRepeaterUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterUnit,
                  ),
                ).toBeTruthy();
                expect(
                  isDeadlineUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterDeadlineUnit,
                  ),
                ).toBeTruthy();
              })([
                testTimestampPartRecord.toJS(),
                expectedNextRepeatTimestampPartObject,
              ]);

              expect(testCurrentDate).toEqual(expect.any(Date));
            },
          );

          test.prop([fc.boolean(), fc.gen()])(
            "withoutDeadline",
            (withStartTime, fcGen) => {
              const [
                testTimestampPartRecord,
                testCurrentDate,
                expectedNextRepeatTimestampPartObject,
              ] = fcGenOrgTimestampPartRecordWithRestartRepeater(
                { withStartTime, withDeadline: false },
                fcGen,
              );

              forEach((actualTimestampPartObject: OrgTimestampPart) => {
                expect(actualTimestampPartObject).toMatchObject({
                  isActive: true,
                  withStartTime,
                  year: expect.any(String),
                  month: expect.any(String),
                  day: expect.any(String),
                  dayName: expect.any(String),
                  endHour: undefined,
                  endMinute: undefined,
                  repeaterType: ".+",
                  repeaterValue: expect.any(String),
                  repeaterUnit: expect.any(String),
                  repeaterDeadlineValue: undefined,
                  repeaterDeadlineUnit: undefined,
                });

                expect(
                  isRepeaterUnit(
                    withStartTime,
                    actualTimestampPartObject.repeaterUnit,
                  ),
                ).toBeTruthy();
              })([
                testTimestampPartRecord.toJS(),
                expectedNextRepeatTimestampPartObject,
              ]);

              expect(testCurrentDate).toEqual(expect.any(Date));
            },
          );
        });
      });

      describe("fcGenOrgTimestampPartRecord", () => {
        const testRunner =
          (fcGen: fc.GeneratorValue) =>
          (timestampArgs: Record<string, boolean>) => {
            const [actualTimestamp, actualDate, actualText] =
              fcGenOrgTimestampPartRecord(timestampArgs, fcGen);

            const {
              isActive = false,
              withStartTime = false,
              withEndTime = false,
              withRepeater = false,
              withDeadline = false,
              withDelay = false,
            } = timestampArgs;

            expect(actualDate).toEqual(expect.any(Date));
            assert.isString(actualText);
            const actualTimestampObject = actualTimestamp.toJS();

            expect(actualTimestampObject).toMatchObject({
              isActive,
              withStartTime,
              year: expect.any(String),
              month: expect.any(String),
              day: expect.any(String),
              dayName: expect.any(String),
              startHour: expect.any(String),
              startMinute: expect.any(String),
            });

            // Ugly but honest
            if (withRepeater) {
              expect(
                isRepeaterType(actualTimestampObject.repeaterType),
              ).toBeTruthy();
              expect(
                isRepeaterUnit(
                  withStartTime,
                  actualTimestampObject.repeaterUnit,
                ),
              ).toBeTruthy();
              assert.isString(actualTimestampObject.repeaterValue);
            }

            if (withDeadline) {
              expect(
                isDeadlineUnit(
                  withStartTime,
                  actualTimestampObject.repeaterDeadlineUnit,
                ),
              ).toBeTruthy();
              assert.isString(actualTimestampObject.repeaterDeadlineValue);
            }

            if (withDelay) {
              expect(isDelayType(actualTimestampObject.delayType)).toBeTruthy();
              expect(
                isDelayUnit(withStartTime, actualTimestampObject.delayUnit),
              ).toBeTruthy();
              assert.isString(actualTimestampObject.delayValue);
            }

            if (withEndTime) {
              assertStrings([
                actualTimestampObject.endHour,
                actualTimestampObject.endMinute,
              ]);
            }
          };

        test.prop([fc.gen()])("runner", (fcGen) => {
          forEach(testRunner(fcGen))(REGULARTIMESTAMPTESTCASES);
        });
      });

      test.prop([fc.gen()])(
        "fcGenRandomOrgTimestampPartRecord",
        (fcGen) => {
          const [actualTimestamp, actualDate, actualText] =
            fcGenRandomOrgTimestampPartRecord(fcGen);
          expect(actualDate).toEqual(expect.any(Date));
          assert.isString(actualText);

          expect(actualTimestamp.toJS()).toMatchObject({
            isActive: expect.any(Boolean),
            withStartTime: expect.any(Boolean),
            year: expect.any(String),
            month: expect.any(String),
            day: expect.any(String),
            dayName: expect.any(String),
          });
        },
      );

      describe("fcGenOrgTimestampPartRecordWithRepeater", () => {
        const testRunner =
          (fcGen: fc.GeneratorValue) =>
          (timestampArgs: {
            repeaterType: RepeaterType;
            withStartTime: boolean;
            withDeadline: boolean;
          }) => {
            const [
              testTimestampPartRecord,
              testCurrentDate,
              expectedNextRepeatTimestampPartObject,
            ] = fcGenOrgTimestampPartRecordWithRepeater(timestampArgs, fcGen);

            const { repeaterType, withStartTime, withDeadline } = timestampArgs;

            forEach((actualTimestampPartObject: OrgTimestampPart) => {
              expect(actualTimestampPartObject).toMatchObject({
                isActive: expect.any(Boolean),
                withStartTime,
                year: expect.any(String),
                month: expect.any(String),
                day: expect.any(String),
                dayName: expect.any(String),
                endHour: undefined,
                endMinute: undefined,
                repeaterType,
                repeaterValue: expect.any(String),
                repeaterUnit: expect.any(String),
                delayType: undefined,
                delayValue: undefined,
                delayUnit: undefined,
              });
              if (withDeadline) {
                expect(actualTimestampPartObject).toMatchObject({
                  repeaterDeadlineValue: expect.any(String),
                  repeaterDeadlineUnit: expect.any(String),
                });
              }
            })([
              testTimestampPartRecord.toJS(),
              expectedNextRepeatTimestampPartObject,
            ]);

            expect(isDate(testCurrentDate)).toBeTruthy();
          };

        test.prop([fc.gen()])("runner", (fcGen) => {
          forEach(testRunner(fcGen))(TIMESTAMPSWITHREPEATERTESTCASES);
        });
      });

      test.prop([fc.gen()])(
        "fcGenRandomOrgTimestampPartWithRepeater",
        (fcGen) => {
          const [
            testTimestampPartRecord,
            testCurrentDate,
            expectedNextRepeatTimestampPartObject,
          ] = fcGenRandomOrgTimestampPartRecordWithRepeater(fcGen);

          forEach((actualTimestampPartObject: OrgTimestampPart) => {
            expect(actualTimestampPartObject).toMatchObject({
              isActive: expect.any(Boolean),
              withStartTime: expect.any(Boolean),
              year: expect.any(String),
              month: expect.any(String),
              day: expect.any(String),
              dayName: expect.any(String),
              endHour: undefined,
              endMinute: undefined,
              repeaterType: expect.any(String),
              repeaterValue: expect.any(String),
              repeaterUnit: expect.any(String),
            });
          })([
            testTimestampPartRecord.toJS(),
            expectedNextRepeatTimestampPartObject,
          ]);

          expect(testCurrentDate).toEqual(expect.any(Date));
        },
      );
    });

    describe("Table generators suite", () => {
      describe("Table sub-element", () => {
        describe("createTestOrgTableCellRecord", () => {
          test.prop([fc.gen()])("basic test", (fcGen) => {
            const [testValue] = fcGenRandomAlphaString(fcGen);
	    const testTextObject: OrgText = {
	      type: "text",
	      contents: testValue
	    }
            const actualCell = createTestOrgTableCellRecord([
              makeOrgTextRecord(testTextObject),
              testValue,
            ]);
            expect(isRecord(actualCell)).toBeTruthy();
            expect(actualCell.toJS()).toStrictEqual({
              id: expect.any(Number),
              type: "table-cell",
              contents: [testTextObject],
              rawContents: testValue,
            });
          });
        });

        describe("createTestOrgTableRowRecord", () => {
          test.prop([fc.gen()])("with strings", (fcGen) => {
            const testValues =
              fcGenRandomArrayOfUpperAlphaStringsGenerator(fcGen);
            const [testCells, expectedCells] = pipe(
              testValues,
              map((testVal: string) => {
		const testTextObject: OrgText = {
		  type: "text",
		  contents: testVal
		}
                const testCell = createTestOrgTableCellRecord([
                  makeOrgTextRecord(testTextObject),
                  testVal,
                ]);
                return [testCell, testCell.toJS()];
              }),
              unzip<OrgTableCellRecord, Object>,
            );
            const actualRow = createTestOrgTableRowRecord(testCells);
            expect(isRecord(actualRow)).toBeTruthy();
            expect(actualRow.toJS()).toStrictEqual({
              id: expect.any(Number),
              type: "table-row",
              contents: expectedCells,
            });
          });
          test.prop([fc.gen()])("hline", (_) => {
            const actualRow = createTestOrgTableRowRecord("hline");
            expect(isRecord(actualRow)).toBeTruthy();
            expect(actualRow.toJS()).toStrictEqual({
              id: expect.any(Number),
              type: "table-row",
              contents: "hline",
            });
          });
        });
      });

      describe("createTestOrgTableRecord", () => {
        describe("just strings", () => {
          test.prop([fc.gen(), fc.string()])("withoutHlines", (fcGen, testString) => {
            const testValues =
              fcGenRandomArrayOfUpperAlphaStringsGenerator(fcGen);
            const testCells = map((testVal: string) => {
	      const testTextObject: OrgText = {
		type: "text",
		contents: testVal
	      }
              return createTestOrgTableCellRecord([makeOrgTextRecord(testTextObject), testVal]);
            })(testValues);

            const testRow = createTestOrgTableRowRecord(testCells);
            const testRows: ReadonlyNonEmptyArray<OrgTableRowRecord> = [
              testRow,
            ];
            const expectedRows = [testRow.toJS()];

            const actualTable = createTestOrgTableRecord(testRows, testString);
            expect(isRecord(actualTable)).toBeTruthy();
	    const actualTableObject = actualTable.toJS();
            expect(actualTableObject).toStrictEqual({
              id: expect.any(Number),
              type: "table",
              contents: expectedRows,
              columnProperties: [],
	      rawContents: expect.any(String)
            });

          });
          test.prop([fc.gen(), fc.string()])("withHlines", (fcGen, testString) => {
            const testValues =
              fcGenRandomArrayOfUpperAlphaStringsGenerator(fcGen);
            const testCells = map((testVal: string) => {
	      const testTextObject: OrgText = {
		type: "text",
		contents: testVal
	      }
              return createTestOrgTableCellRecord([makeOrgTextRecord(testTextObject), testVal]);
            })(testValues);

            const testRow = createTestOrgTableRowRecord(testCells);
            const testHline = createTestOrgTableRowRecord("hline");
            const testRows: ReadonlyNonEmptyArray<OrgTableRowRecord> = [
              testRow,
              testHline,
              testRow,
            ];

            const actualTable = createTestOrgTableRecord(testRows, testString);
            expect(isRecord(actualTable)).toBeTruthy();
            const actualTableObject = actualTable.toJS();
            expect(actualTableObject).toMatchObject({
              id: expect.any(Number),
              type: "table",
              columnProperties: [],
            });
            const [actualFirstRow, actualSecondRow, actualThirdRow] =
              getFromRecord("contents", actualTable).toJS();
            expect(actualFirstRow).toStrictEqual(testRow.toJS());
            expect(actualSecondRow).toStrictEqual({
              id: expect.any(Number),
              type: "table-row",
              contents: "hline",
            });
            expect(actualThirdRow).toStrictEqual(testRow.toJS());
          });
        });
      });

      describe("Table strings", () => {
        describe("helpers", () => {
          test.prop([
            fc.gen(),
            fc.tuple(
              fc.integer({ min: 1, max: 10 }),
              fc.integer({ min: 2, max: 10 }),
            ),
          ])(
            "getColumnWidthsForTestTable",
            (fcGen, testRowColumnCountTuple) => {
              const [, testColumnCount] = testRowColumnCountTuple;
              const testValues = testRowValues(fcGen, testRowColumnCountTuple);
              const actualWidths: ReadonlyNonEmptyArray<number> =
                getColumnWidthsForTestTable(testValues);
              assert.lengthOf(actualWidths, testColumnCount);
              const [testRowIndex, testColumnIndex] = map((x: number): number =>
                fcGenRandomIntegerBetweenZeroAnd(fcGen, x),
              )(testRowColumnCountTuple);
              const expectedRandomValue =
                testValues[testRowIndex][testColumnIndex];
              const actualColumnWidth = actualWidths[testColumnIndex];
              expect(actualColumnWidth).toBeGreaterThan(
                expectedRandomValue.length,
              );
              expect(expectedRandomValue.length + 1).toBeLessThanOrEqual(
                actualColumnWidth,
              );
            },
          );
          test.prop([
            fc.gen(),
            fc.tuple(
              fc.integer({ min: 1, max: 10 }),
              fc.integer({ min: 2, max: 10 }),
            ),
          ])(
            "createTestOrgTableRowStrings",
            (fcGen, testRowColumnCountTuple) => {
              const [expectedRowCount] = testRowColumnCountTuple;

              const testValues = testRowValues(fcGen, testRowColumnCountTuple);
              const testColumnWidths = getColumnWidthsForTestTable(testValues);
              const actualRows = createTestOrgTableRowStrings(
                testValues,
                testColumnWidths,
              );

              assert.lengthOf(actualRows, expectedRowCount);
              const [testRowIndex, testColumnIndex] = map((x: number): number =>
                fcGenRandomIntegerBetweenZeroAnd(fcGen, x),
              )(testRowColumnCountTuple);
              const expectedRandomValue =
                testValues[testRowIndex][testColumnIndex][1];
              const actualRandomValue = pipe(
                actualRows,
                (x: ReadonlyNonEmptyArray<string>): string => x[testRowIndex],
                (x: string): string => x.slice(1, x.length - 1),
                split("|"),
                (x: ReadonlyNonEmptyArray<string>): string =>
                  x[testColumnIndex],
              );

              expect(actualRandomValue.trim()).toBe(expectedRandomValue);
            },
          );

          test.prop([fc.integer({ min: 2, max: 20 }), fc.gen()])(
            "createTestOrgTableHlineString",
            (testColumnCount, fcGen) => {
              const testColumnWidths: ReadonlyNonEmptyArray<number> =
                fcArrayOfNIntegersInRange([2, 100], testColumnCount, fcGen);
              const actualHline = createTestOrgTableHlineString(testColumnWidths);
              expect(startsWith("|", actualHline)).toBeTruthy();
              expect(endsWith("|", actualHline)).toBeTruthy();
              const [expectedLength, expectedIndex] =
                fcGenRandomItemFromArrayWithIndex(fcGen, testColumnWidths);
              const actualRandomSplitHlinePart = pipe(
                actualHline,
                (x: string): string => x.slice(1, x.length - 1),
                split("+"),
                (x: ReadonlyNonEmptyArray<string>): string => x[expectedIndex],
              );
              assert.lengthOf(actualRandomSplitHlinePart, expectedLength);
            },
          );
        });

        describe("createTestOrgTableStringWithoutHlines", () => {
          test.prop([
            fc.gen(),
            fc.tuple(
              fc.integer({ min: 1, max: 10 }),
              fc.integer({ min: 2, max: 10 }),
            ),
          ])("just strings", (fcGen, testRowColumnCountTuple) => {
            const [expectedRowCount, expectedColumnCount] =
              testRowColumnCountTuple;

            const testValues = testRowValues(fcGen, testRowColumnCountTuple);

            const actualTable =
              createTestOrgTableStringWithoutHlines(testValues);

            const actualSplitTable: ReadonlyNonEmptyArray<string> =
              split("\n")(actualTable);

            assert.lengthOf(actualSplitTable, expectedRowCount);

            const actualRandomRowValue = pipe(
              actualSplitTable,
              flippedFCRandomItemFromArray(fcGen),
              (x: string): string => x.slice(1, x.length - 1),
              split("|"),
            );

            assert.lengthOf(actualRandomRowValue, expectedColumnCount);
          });
        });
        describe("createTestOrgTableStringWithHlines", () => {
          test.prop([
            fc.gen(),
            fc.tuple(
              fc.integer({ min: 1, max: 10 }),
              fc.integer({ min: 2, max: 10 }),
            ),
          ])("string", (fcGen, testRowColumnCountTuple) => {
            const [expectedRowCount, expectedColumnCount] =
              testRowColumnCountTuple;

            const testRows = pipe(
              fcNLengthUpperAlphaStringArrayGenerator(
                fcGen,
                expectedColumnCount,
              ),
              map((str: string): [OrgTableCellValue, string] => [str, str]),
            );
            const testValues: ReadonlyNonEmptyArray<
              ReadonlyNonEmptyArray<[OrgTableCellValue, string]>
            > = unfold(
              (
                _: number,
              ): ReadonlyNonEmptyArray<[OrgTableCellValue, string]> => {
                return testRows;
              },
              expectedRowCount,
            );

            const actualTable = createTestOrgTableStringWithHlines(testValues);

            const actualSplitTable: ReadonlyNonEmptyArray<string> =
              split("\n")(actualTable);

            expect(actualSplitTable.length).toBeGreaterThanOrEqual(
              expectedRowCount,
            );
          });
        });
      });

      describe("Without hlines", () => {
        test.prop([
          fc.gen(),
          fc.tuple(
            fc.integer({ min: 1, max: 10 }),
            fc.integer({ min: 2, max: 10 }),
          ),
        ])("fcGenOrgTableWithoutHlines", (fcGen, testRowColumnCountTuple) => {
          const [expectedRowCount, expectedColumnCount] =
            testRowColumnCountTuple;
          const [actualTable, actualTableRecord, actualTableValues] =
            fcGenOrgTableWithoutHlines(
              testCellValueCreator,
              testRowColumnCountTuple,
              fcGen,
            );

          expect(startsWith("|", actualTable)).toBeTruthy();
          expect(endsWith("|", actualTable)).toBeTruthy();

          expect(isRecord(actualTableRecord)).toBeTruthy();
          const actualTableObject = actualTableRecord.toJS();
          expect(actualTableObject).toStrictEqual({
            id: expect.any(Number),
            type: "table",
            contents: expect.any(Array),
            columnProperties: [],
	    rawContents: expect.any(String)
          });

          const actualContentsValue = get(actualTableRecord, "contents");
          const actualContents =
            isList(actualContentsValue) && actualContentsValue.toArray();
          expect(
            isArray(actualContents) && actualContents.includes("hline"),
          ).toBeFalsy();
          expect(isArray(actualContents) && actualContents.length).toEqual(
            expectedRowCount,
          );
          assert.lengthOf(actualTableValues, expectedRowCount);
          assert.lengthOf(
            fcGenRandomItemFromArray(fcGen, actualTableValues),
            expectedColumnCount,
          );
        });

        test.prop([fc.gen()])(
          "defaultFCGenRandomOrgTableWithoutHlines",
          (fcGen) => {
            const [
              actualTable,
              actualTableRecord,
              actualTableValues,
              actualRowCount,
              actualColumnCount,
            ] = defaultFCGenRandomOrgTableWithoutHlines(fcGen);

            assert.isString(actualTable);
            expect(isRecord(actualTableRecord)).toBeTruthy();
            const actualTableObject = actualTableRecord.toJS();
            expect(actualTableObject).toStrictEqual({
              id: expect.any(Number),
              type: "table",
              contents: expect.anything(),
              columnProperties: [],
	      rawContents: expect.any(String)
            });

            assertNumbers([actualRowCount, actualColumnCount]);
            assert.isArray(actualTableValues);
          },
        );
      });
      describe("With hlines", () => {
        test.prop([
          fc.gen(),
          fc.tuple(
            fc.integer({ min: 1, max: 10 }),
            fc.integer({ min: 2, max: 10 }),
          ),
        ])("fcGenOrgTableWithHlines", (fcGen, testRowColumnCountTuple) => {
          const [expectedRowCount] = testRowColumnCountTuple;
          const [actualTable, actualTableRecord, actualTableValues] =
            fcGenOrgTableWithHlines(
              testCellValueCreator,
              testRowColumnCountTuple,
              fcGen,
            );

          const actualSplitTable: ReadonlyNonEmptyArray<string> =
            split("\n")(actualTable);

          expect(startsWith("|", actualTable)).toBeTruthy();
          expect(endsWith("|", actualTable)).toBeTruthy();
          expect(actualSplitTable.length).toBeGreaterThanOrEqual(
            expectedRowCount,
          );

          expect(isRecord(actualTableRecord)).toBeTruthy();
          const actualTableObject = actualTableRecord.toJS();
          expect(actualTableObject).toStrictEqual({
            id: expect.any(Number),
            type: "table",
            contents: expect.any(Array),
            columnProperties: [],
	    rawContents: expect.any(String)
          });

          const actualContentsValue = get(actualTableRecord, "contents");
          const actualContents =
            isList(actualContentsValue) && actualContentsValue.toArray();

          assert.isArray(actualContents);

          expect(
            isArray(actualContents) && actualContents.length,
          ).toBeGreaterThanOrEqual(expectedRowCount);

          expect(actualTableValues.length).toBeGreaterThanOrEqual(
            expectedRowCount,
          );

          assert.lengthOf(actualTableValues, expectedRowCount);
        });

        test.prop([fc.gen()])(
          "defaultFCGenRandomOrgTableWithHlines",
          (fcGen) => {
            const [
              actualTable,
              actualTableRecord,
              actualTableValues,
              actualRowCount,
              actualColumnCount,
            ] = defaultFCGenRandomOrgTableWithHlines(fcGen);

            assert.isString(actualTable);
            expect(isRecord(actualTableRecord)).toBeTruthy();
            const actualTableObject = actualTableRecord.toJS();
            expect(actualTableObject).toStrictEqual({
              id: expect.any(Number),
              type: "table",
              contents: expect.anything(),
              columnProperties: [],
	      rawContents: expect.any(String)
            });

            assertNumbers([actualRowCount, actualColumnCount]);
            assert.isArray(actualTableValues);
          },
        );
      });
      test.prop([fc.gen()])("defaultFCGenRandomOrgTable", (fcGen) => {
        const [
          actualTable,
          actualTableRecord,
          actualTableValues,
          actualRowCount,
          actualColumnCount,
        ] = defaultFCGenRandomOrgTable(fcGen);

        assert.isString(actualTable);
        expect(startsWith("|", actualTable)).toBeTruthy();
        expect(endsWith("|", actualTable)).toBeTruthy();
        expect(isRecord(actualTableRecord)).toBeTruthy();
        const actualTableObject = actualTableRecord.toJS();
        expect(actualTableObject).toStrictEqual({
          id: expect.any(Number),
          type: "table",
          contents: expect.anything(),
          columnProperties: [],
	  rawContents: expect.any(String)
        });
        assertNumbers([actualRowCount, actualColumnCount]);
        assert.isArray(actualTableValues);
      });
    });
  });
});
