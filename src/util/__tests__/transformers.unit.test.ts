import { pipe, over, identity, uniq, zipAll, map, constant } from "lodash/fp";
import { test, fc } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { get, isImmutable } from "immutable";
import {
  fcGenRandomUpperAlphaChar,
  fcGenRandomLowerAlphaChar,
  fcGenRandomStringGenerator,
  fcGenRandomArrayChunkOfRandomSize,
  fcGenRandomItemFromArray,
  fcShuffledArray,
  fcGenRandomImmutableRecord,
  fcGenRandomListOfObjectKeys,
  fcGenRandomListOfObjectKeyValuePairs,
} from "../../../test_helpers/TestDataGenerators";
import { convertArraysToSetsAndAssertStrictEqual } from "../../../test_helpers/Asserters";
import {
  isUpperAlphaCharacter,
  reduceReplaceAll,
  getAllFromRecord,
  setAllForRecord,
  updateAllForRecord,
} from "../transformers";

describe("transformers test suite", () => {
  describe("Strings", () => {
    describe("isUpperAlphaCharacter", () => {
      test.prop([fc.gen()])("true", (fcGen) => {
        const char = fcGenRandomUpperAlphaChar(fcGen);
        expect(isUpperAlphaCharacter(char)).toBeTruthy();
      });

      test.prop([fc.gen()])("false - lowercase", (fcGen) => {
        const char = fcGenRandomLowerAlphaChar(fcGen);
        expect(isUpperAlphaCharacter(char)).toBeFalsy();
      });

      test.prop([fc.nat({ max: 9 })])("false - not a letter", (testNum) => {
        const char = testNum.toString();
        expect(isUpperAlphaCharacter(char)).toBeFalsy();
      });
    });

    describe("reduceReplaceAll", () => {
      test.prop([fc.gen()])("true", (fcGen) => {
        const testStr: string = fcGenRandomStringGenerator(fcGen);
        const [testValuesToReplace, randomValueToReplace] = pipe([
          fcGenRandomArrayChunkOfRandomSize,
          uniq,
          over([identity, fcGenRandomItemFromArray(fcGen)]),
        ])(fcGen, testStr);

        const actualResult = reduceReplaceAll(testValuesToReplace, testStr);
        expect(actualResult).not.toContain(randomValueToReplace);
      });
    });
  });

  // describe("Arrays", () => {
  // })

  describe("for immutable", () => {
    const getActualJSValue = (x: unknown) => {
      return isImmutable(x) ? x.toJS() : x;
    };
    const getActualArrayOfJSValues = map(getActualJSValue);

    test.prop([fc.gen()])("getAllFromRecord", (fcGen) => {
      const [testRecord, testObj] = fcGenRandomImmutableRecord(fcGen);
      const [testKeys, expectedValues] = pipe([
        fcGenRandomListOfObjectKeyValuePairs,
        zipAll,
      ])(fcGen, testObj);
      const actualImmutableValues = getAllFromRecord(testKeys, testRecord);
      const actualValues = getActualArrayOfJSValues(actualImmutableValues);
      convertArraysToSetsAndAssertStrictEqual([actualValues, expectedValues]);
    });

    test.prop([fc.gen()])("setAllForRecord", (fcGen) => {
      const [testRecord, testObj] = fcGenRandomImmutableRecord(fcGen);
      const testSetters = pipe([
        fcGenRandomListOfObjectKeys,
        over([identity, fcShuffledArray(fcGen)]),
        zipAll,
      ])(fcGen, testObj);
      const actualUpdatedMap = setAllForRecord(testSetters, testRecord);
      const [randomKey, expectedValue] = fcGenRandomItemFromArray(
        fcGen,
        testSetters,
      );
      const actualImmutableValue = get(actualUpdatedMap, randomKey);
      expect(getActualJSValue(actualImmutableValue)).toBe(expectedValue);
    });

    test.prop([fc.gen()])("updateAllForRecord", (fcGen) => {
      const [testRecord, testObj] = fcGenRandomImmutableRecord(fcGen);
      const testUpdaters = pipe([
        fcGenRandomListOfObjectKeys,
        over([identity, pipe([fcShuffledArray(fcGen), map(constant)])]),
        zipAll,
      ])(fcGen, testObj);
      const actualUpdatedMap = updateAllForRecord(testUpdaters, testRecord);

      const [randomKey, expectedValueFunc] = fcGenRandomItemFromArray(
        fcGen,
        testUpdaters,
      );
      const actualImmutableValue = get(actualUpdatedMap, randomKey);
      expect(getActualJSValue(actualImmutableValue)).toBe(expectedValueFunc());
    });

    // test.skip.prop([fc.gen()])("updateAllInForRecord", (fcGen) => {
    //   const [testRecord, testObj] = fcGenRandomImmutableRecord(fcGen);
    //   const testUpdaters = pipe([
    //     fcGenRandomListOfObjectKeys,
    //     over([map(ensureArray), pipe([fcShuffledArray(fcGen), map(constant)])]),
    //     zipAll,
    //   ])(fcGen, testObj);
    //   const actualUpdatedMap = updateAllInForRecord(testUpdaters, testRecord);

    //   const [[randomKey], expectedValueFunc] = fcGenRandomItemFromArray(
    //     fcGen,
    //     testUpdaters,
    //   );
    //   const actualImmutableValue = get(actualUpdatedMap, randomKey);
    //   expect(getActualJSValue(actualImmutableValue)).toBe(expectedValueFunc());
    // });
  });
});
