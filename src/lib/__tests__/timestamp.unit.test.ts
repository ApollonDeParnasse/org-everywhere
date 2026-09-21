import { describe, expect, assert } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { get } from "immutable";
import {
  addHours,
  addMinutes,
  hoursToMilliseconds,
  minutesToMilliseconds,
  differenceInHours,
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
} from "date-fns/fp";
import {
  pipe,
  padCharsStart,
  zipAll,
  difference,
  startsWith,
  endsWith,
  forEach,
} from "lodash/fp";
import type {
  TimestampUnit,
  OrgTimestampPart,
  OrgTimestampPartRecord,
  OrgTimestampPartKey,
  RepeaterType,
} from "../../Types";
import { TIMESTAMPUNITS, HOURSINADAY, DAYABBREVS } from "../Constants";
import {
  RENDERASTEXTESTCASES,
  APPLYREPEATERTESTCASES,
} from "./TestConstants.ts";
import {
  fcGenRandomRepeaterType,
  fcGenValidJSDateObject,
  fcGenRandomItemFromArray,
  fcGenOrgTimestampPartRecord,
  fcGenOrgTimestampPartRecordWithRepeater,
  fcGenOrgTimestampPartObjectWithRepeaterTypeX,
  fcGenRandomTimeStringMV,
} from "../../../test_helpers/TestDataGenerators";
import { parseIntAndAssertIntegerInRangeInclusive } from "../../../test_helpers/Asserters";
import {
  addTimestampUnitToDate,
  subtractTimestampUnitFromDate,
  millisDuration,
  dateDuration,
  timestampPartObjectForDate,
  timestampPartRecordForDate,
  getCurrentTimestamp,
  dateForTimestamp,
  convertDayNumberIntoDayName,
  timestampDuration,
  getJSDateAsOrgTimestampString,
  getCurrentJSDateAsOrgTimestampString,
  renderAsText,
  applyRepeater,
  getYearFromDate,
  getMonthFromDate,
  getDayFromDate,
  getDayNameFromDate,
  getHourPartFromDate,
  getMinutePartFromDate,
  createNextRepeatTimestampPartRecord,
  getCurrentDate,
  removeStartTime,
  removeRepeater,
  removeDelay,
  addStartTime,
  addEndTime,
  addDelay,
  addRepeater,
  activeToggle,
  startTimeChange,
  endTimeChange,
} from "../timestamps";
import { unfold,
  getFromRecord
} from "../../util/transformers";

describe("timestamp unit tests", () => {
  describe("JS Date Object functions", () => {
    describe("date arithmetic", () => {
      const DIFFFUNCTIONS = [
        differenceInHours,
        differenceInDays,
        differenceInWeeks,
        differenceInMonths,
        differenceInYears,
      ];

      const UNITSDIFF = zipAll([TIMESTAMPUNITS, DIFFFUNCTIONS]);

      const INVALIDUNITS = difference(
        unfold((x: number) => String.fromCharCode(x + 65), 26),
        TIMESTAMPUNITS,
      );

      describe("addTimestampUnitToDate", () => {
        test.prop([fc.nat({ max: 10000 }), fc.gen()])(
          "valid unit",
          (testNumUnits, fcGen) => {
            const [testTimestampUnit, diffFunction]: [TimestampUnit, Function] =
              fcGenRandomItemFromArray(fcGen, UNITSDIFF);
            const testDate: Date = fcGenValidJSDateObject(fcGen);
            const actualNewDate: Date = addTimestampUnitToDate(
              testTimestampUnit,
              testNumUnits,
              testDate,
            );
            // issues with precision
            assert.closeTo(
              diffFunction(testDate, actualNewDate),
              testNumUnits,
              1,
            );
          },
        );

        test.prop([fc.nat({ max: 10000 }), fc.gen()])(
          "invalid unit",
          (testNumUnits, fcGen) => {
            const testTimestampUnit = fcGenRandomItemFromArray(
              fcGen,
              INVALIDUNITS,
            );
            const testDate: Date = fcGenValidJSDateObject(fcGen);
            const actualNewDate: Date = addTimestampUnitToDate(
              testTimestampUnit,
              testNumUnits,
              testDate,
            );
            expect(actualNewDate).toBe(testDate);
          },
        );
      });

      describe("subtractTimestampUnitFromDate", () => {
        test.prop([fc.nat({ max: 10000 }), fc.gen()])(
          "valid unit",
          (testNumUnits, fcGen) => {
            const [testTimestampUnit, diffFunction]: [TimestampUnit, Function] =
              fcGenRandomItemFromArray(fcGen, UNITSDIFF);
            const testDate: Date = fcGenValidJSDateObject(fcGen);
            const actualNewDate: Date = subtractTimestampUnitFromDate(
              testTimestampUnit,
              testNumUnits,
              testDate,
            );
            expect(diffFunction(actualNewDate, testDate)).toBe(testNumUnits);
          },
        );

        test.prop([fc.nat({ max: 10000 }), fc.gen()])(
          "invalid unit",
          (testNumUnits, fcGen) => {
            const testTimestampUnit = fcGenRandomItemFromArray(
              fcGen,
              INVALIDUNITS,
            );
            const testDate: Date = fcGenValidJSDateObject(fcGen);
            const actualNewDate: Date = subtractTimestampUnitFromDate(
              testTimestampUnit,
              testNumUnits,
              testDate,
            );

            expect(actualNewDate).toBe(testDate);
          },
        );
      });
    });

    describe("getters", () => {
      test.prop([fc.gen()])("getYearFromDate", (fcGen) => {
        const testDate: Date = fcGenValidJSDateObject(fcGen);
        const actualYear = getYearFromDate(testDate);
        parseIntAndAssertIntegerInRangeInclusive([2000, 3000], actualYear);
      });
      test.prop([fc.gen()])("getMonthFromDate", (fcGen) => {
        const testDate: Date = fcGenValidJSDateObject(fcGen);
        const actualMonth = getMonthFromDate(testDate);
        parseIntAndAssertIntegerInRangeInclusive([1, 12], actualMonth);
      });
      test.prop([fc.gen()])("getDayFromDate", (fcGen) => {
        const testDate: Date = fcGenValidJSDateObject(fcGen);
        const actualDay = getDayFromDate(testDate);
        parseIntAndAssertIntegerInRangeInclusive([1, 31], actualDay);
      });
      test.prop([fc.gen()])("getDayNameFromDate", (fcGen) => {
        const testDate: Date = fcGenValidJSDateObject(fcGen);
        const actualDayName = getDayNameFromDate(testDate);
        assert.include(DAYABBREVS, actualDayName);
      });
      test.prop([fc.gen()])("getHourPartFromDate", (fcGen) => {
        const testDate: Date = fcGenValidJSDateObject(fcGen);
        const actualStartHour = getHourPartFromDate(testDate);
        parseIntAndAssertIntegerInRangeInclusive([0, 23], actualStartHour);
      });
      test.prop([fc.gen()])("getMinutePartFromDate", (fcGen) => {
        const testDate: Date = fcGenValidJSDateObject(fcGen);
        const actualStartMinute = getMinutePartFromDate(testDate);
        parseIntAndAssertIntegerInRangeInclusive([0, 59], actualStartMinute);
      });
    });

    describe("dateDuration tests", () => {
      test.prop([
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 59 }),
        fc.gen(),
      ])("positive duration", (randomHours, randomMinutes, fcGen) => {
        const testStartDate: Date = fcGenValidJSDateObject(fcGen);
        const testEndDate: Date = pipe([
          addHours(randomHours),
          addMinutes(randomMinutes),
        ])(testStartDate);
        const actualDuration = dateDuration(testStartDate, testEndDate);
        const expectedDuration = `${randomHours.toString()}:${padCharsStart("0", 2, randomMinutes.toString())}`;
        expect(actualDuration).toBe(expectedDuration);
      });

      test.prop([
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 59 }),
        fc.gen(),
      ])("negative duration", (randomHours, randomMinutes, fcGen) => {
        const testEndDate: Date = fcGenValidJSDateObject(fcGen);
        const testStartDate: Date = pipe([
          addHours(randomHours),
          addMinutes(randomMinutes),
        ])(testEndDate);
        const actualDuration = dateDuration(testStartDate, testEndDate);
        const expectedDuration = `-${randomHours.toString()}:${padCharsStart("0", 2, randomMinutes.toString())}`;
        expect(actualDuration).toBe(expectedDuration);
      });
    });

    describe("getJSDateAsOrgTimestampString", () => {
      describe("withStartTime", () => {
        test.prop([fc.gen()])("active", (fcGen) => {
          const testDate = fcGenValidJSDateObject(fcGen, true);
          const expectedYear: string = testDate.getFullYear().toString();
          const expectedMonth: string = padCharsStart(
            "0",
            2,
            (testDate.getMonth() + 1).toString(),
          );
          const expectedDay: string = padCharsStart(
            "0",
            2,
            testDate.getDate().toString(),
          );
          const expectedDayName: string = convertDayNumberIntoDayName(
            testDate.getDay(),
          );
          const startHour: string = padCharsStart(
            "0",
            2,
            testDate.getHours().toString(),
          );
          const startMinute: string = padCharsStart(
            "0",
            2,
            testDate.getMinutes().toString(),
          );
          const expectedText: string = `<${expectedYear}-${expectedMonth}-${expectedDay} ${expectedDayName} ${startHour}:${startMinute}>`;
          const actualText = getJSDateAsOrgTimestampString(testDate, {
            isActive: true,
            withStartTime: true,
          });
          expect(actualText).toBe(expectedText);
        });

        test.prop([fc.gen()])("inactive", (fcGen) => {
          const testDate = fcGenValidJSDateObject(fcGen, true);
          const expectedYear: string = testDate.getFullYear().toString();
          const expectedMonth: string = padCharsStart(
            "0",
            2,
            (testDate.getMonth() + 1).toString(),
          );
          const expectedDay: string = padCharsStart(
            "0",
            2,
            testDate.getDate().toString(),
          );
          const expectedDayName: string = convertDayNumberIntoDayName(
            testDate.getDay(),
          );
          const startHour: string = padCharsStart(
            "0",
            2,
            testDate.getHours().toString(),
          );
          const startMinute: string = padCharsStart(
            "0",
            2,
            testDate.getMinutes().toString(),
          );
          const expectedText: string = `[${expectedYear}-${expectedMonth}-${expectedDay} ${expectedDayName} ${startHour}:${startMinute}]`;
          const actualText = getJSDateAsOrgTimestampString(testDate, {
            isActive: false,
            withStartTime: true,
          });
          expect(actualText).toBe(expectedText);
        });

        describe("withoutStartTime", () => {
          test.prop([fc.gen()])("active", (fcGen) => {
            const testDate = fcGenValidJSDateObject(fcGen, false);
            const expectedYear: string = testDate.getFullYear().toString();
            const expectedMonth: string = padCharsStart(
              "0",
              2,
              (testDate.getMonth() + 1).toString(),
            );
            const expectedDay: string = padCharsStart(
              "0",
              2,
              testDate.getDate().toString(),
            );
            const expectedDayName: string = convertDayNumberIntoDayName(
              testDate.getDay(),
            );
            const expectedText: string = `<${expectedYear}-${expectedMonth}-${expectedDay} ${expectedDayName}>`;
            const actualText = getJSDateAsOrgTimestampString(testDate, {
              isActive: true,
              withStartTime: false,
            });
            expect(actualText).toBe(expectedText);
          });

          test.prop([fc.gen()])("inactive", (fcGen) => {
            const testDate = fcGenValidJSDateObject(fcGen, false);
            const expectedYear: string = testDate.getFullYear().toString();
            const expectedMonth: string = padCharsStart(
              "0",
              2,
              (testDate.getMonth() + 1).toString(),
            );
            const expectedDay: string = padCharsStart(
              "0",
              2,
              testDate.getDate().toString(),
            );
            const expectedDayName: string = convertDayNumberIntoDayName(
              testDate.getDay(),
            );
            const expectedText: string = `[${expectedYear}-${expectedMonth}-${expectedDay} ${expectedDayName}]`;
            const actualText = getJSDateAsOrgTimestampString(testDate, {
              isActive: false,
              withStartTime: false,
            });
            expect(actualText).toBe(expectedText);
          });
        });
      });
    });

    describe("getCurrentJSDateAsOrgTimestampString", () => {
      describe("withStartTime", () => {
        test.prop([fc.gen()])("active", (_) => {
          const actualText = getCurrentJSDateAsOrgTimestampString({
            isActive: true,
            withStartTime: true,
          });
          expect(startsWith("<", actualText));
          expect(endsWith(">", actualText));
          // <2026-07-21 Tue 20:15> = min length = 22 characters
          assert.lengthOf(actualText, 22);
        });

        test.prop([fc.gen()])("inactive", (_) => {
          const actualText = getCurrentJSDateAsOrgTimestampString({
            isActive: false,
            withStartTime: true,
          });
          expect(startsWith("[", actualText));
          expect(endsWith("]", actualText));
          // [2026-07-21 Tue 20:15] = min length = 22 characters
          assert.lengthOf(actualText, 22);
        });

        describe("withoutStartTime", () => {
          test.prop([fc.gen()])("active", (_) => {
            const actualText = getCurrentJSDateAsOrgTimestampString({
              isActive: true,
              withStartTime: false,
            });
            expect(startsWith("<", actualText));
            expect(endsWith(">", actualText));
            // <2026-07-21 Tue> = min length = 18 characters
            assert.lengthOf(actualText, 16);
          });

          test.prop([fc.gen()])("inactive", (_) => {
            const actualText = getCurrentJSDateAsOrgTimestampString({
              isActive: false,
              withStartTime: false,
            });
            expect(startsWith("[", actualText));
            expect(endsWith("]", actualText));
            // [2026-07-21 Tue] = min length = 18 characters
            assert.lengthOf(actualText, 16);
          });
        });
      });
    });
  });

  describe("millisDuration tests", () => {
    test.prop([
      fc.integer({ min: 1, max: 10000 }),
      fc.integer({ min: 1, max: 59 }),
    ])("defined", (randomHours, randomMinutes) => {
      const expectedDuration: string = `${randomHours.toString()}:${padCharsStart("0", 2, randomMinutes.toString())}`;
      const testMillis: number =
        hoursToMilliseconds(randomHours) + minutesToMilliseconds(randomMinutes);
      const actualDuration: string = millisDuration(testMillis);
      expect(actualDuration).toBe(expectedDuration);
    });
    test.prop([fc.gen()])("undefined", () => {
      expect(millisDuration(undefined)).toBe("");
    });
  });

  describe("timestamp element", () => {
    test.prop([fc.boolean(), fc.boolean(), fc.gen()])(
      "timestampPartObjectForDate",
      (isActive, withStartTime, fcGen) => {
        const testDate: Date = fcGenValidJSDateObject(fcGen, withStartTime);
        const actualTimestamp = timestampPartObjectForDate(testDate, {
          isActive,
          withStartTime,
        });
        expect(actualTimestamp).toMatchObject({
          isActive,
          withStartTime,
	  year: `${testDate.getFullYear()}`,
          month: padCharsStart("0", 2, (testDate.getMonth() + 1).toString()),
          day: padCharsStart("0", 2, testDate.getDate().toString()),
          dayName: convertDayNumberIntoDayName(testDate.getDay()),
          startHour: padCharsStart("0", 2, testDate.getHours().toString()),
          startMinute: padCharsStart("0", 2, testDate.getMinutes().toString()),
          endHour: undefined,
          endMinute: undefined,
          repeaterType: undefined,
          repeaterValue: undefined,
          repeaterUnit: undefined,
          repeaterDeadlineValue: undefined,
          repeaterDeadlineUnit: undefined,
          delayType: undefined,
          delayValue: undefined,
          delayUnit: undefined,
        });
      },
    );

    test.prop([fc.boolean(), fc.boolean()])(
      "getCurrentTimestamp",
      (isActive, withStartTime) => {
        const actualTimestamp = getCurrentTimestamp({
          isActive,
          withStartTime,
        });

        expect(actualTimestamp).toMatchObject({
          isActive,
          withStartTime,
          startHour: expect.any(String),
          startMinute: expect.any(String),
          endHour: undefined,
          endMinute: undefined,
          repeaterType: undefined,
          repeaterValue: undefined,
          repeaterUnit: undefined,
          repeaterDeadlineValue: undefined,
          repeaterDeadlineUnit: undefined,
          delayType: undefined,
          delayValue: undefined,
          delayUnit: undefined,
        });
      },
    );

    test.prop([fc.boolean(), fc.boolean(), fc.gen()])(
      "dateForTimestamp",
      (isActive, withStartTime, fcGen) => {
        const [testTimestamp, expectedDate] = fcGenOrgTimestampPartRecord(
          { isActive, withStartTime },
          fcGen,
        );
        const actualDate = dateForTimestamp(testTimestamp);
        expect(actualDate).toStrictEqual(expectedDate);
      },
    );
    describe("remove functions test suite one", () => {
      type RemoveFunctionTestCase = [
        (arg: OrgTimestampPartRecord) => OrgTimestampPartRecord,
        Record<string, boolean>,
        Array<OrgTimestampPartKey>,
      ];

      const REMOVEFUNCSTESTCASES: Array<RemoveFunctionTestCase> = [
        [
          removeRepeater,
          { withStartTime: false },
          ["repeaterUnit", "repeaterType", "repeaterValue"],
        ],
        [
          removeRepeater,
          { withStartTime: true },
          ["repeaterUnit", "repeaterType", "repeaterValue"],
        ],
        [
          removeDelay,
          { withStartTime: false },
          ["delayUnit", "delayType", "delayValue"],
        ],
        [
          removeDelay,
          { withStartTime: true },
          ["delayUnit", "delayType", "delayValue"],
        ],
      ];

      const testRunner =
        (fcGen: fc.GeneratorValue) =>
        ([func, timestampArgs, expectedKeys]: RemoveFunctionTestCase): void => {
          const [testTimestamp] = fcGenOrgTimestampPartRecord(
            timestampArgs,
            fcGen,
          );
          const actualTimestamp = func(testTimestamp);
          forEach((key: OrgTimestampPartKey) => {
            expect(get(actualTimestamp, key)).not.toBeDefined();
          })(expectedKeys);
        };

      test.prop([fc.gen()])("testRunnerOne", (fcGen) => {
        forEach(testRunner(fcGen))(REMOVEFUNCSTESTCASES);
      });

      test.prop([fc.gen()])("removeStartTime", (fcGen) => {
	const EXPECTEDKEYS = [
          ["startHour", "startMinute"],
        ];

	const [testTimestamp] = fcGenOrgTimestampPartRecord(
	  { withStartTime: true },
          fcGen,
        );

        const actualTimestamp = removeStartTime(testTimestamp);

        forEach((key: OrgTimestampPartKey) => {
          expect(get(actualTimestamp, key)).not.toBeDefined();
        })(EXPECTEDKEYS);

	expect(get(actualTimestamp, "withStartTime")).toBe(false);

      });

      test.prop([fc.gen()])("removeEndTime", (fcGen) => {
	const EXPECTEDKEYS = [
          ["endHour", "endMinute"],
        ];

	const [testTimestamp] = fcGenOrgTimestampPartRecord(
	  { withStartTime: true, withEndTime: true },
          fcGen,
        );

        const actualTimestamp = removeStartTime(testTimestamp);

        forEach((key: OrgTimestampPartKey) => {
          expect(get(actualTimestamp, key)).not.toBeDefined();
        })(EXPECTEDKEYS);

      });
    });

    describe("add functions test suite", () => {
      type AddFunctionTestCase = [
        (arg: OrgTimestampPartRecord) => OrgTimestampPartRecord,
        Record<string, boolean>,
        (arg: OrgTimestampPartRecord) => void,
      ];

      const addTimeAsserter =
        ([keyOne, keyTwo]: ["startHour" | "endHour", "startMinute" | "endMinute"]) =>
        (actualTimestamp: OrgTimestampPartRecord): void => {
          const [actualHour, actualMinute] = [
            getFromRecord<OrgTimestampPart, "startHour" | "endHour">(keyOne, actualTimestamp),
            getFromRecord<OrgTimestampPart, "startMinute" | "endMinute">(keyTwo, actualTimestamp),
          ];
          expect(actualHour && parseInt(actualHour)).toBe(getCurrentDate().getHours());
          expect(actualMinute && parseInt(actualMinute)).toBe(getCurrentDate().getMinutes());
        };

      const regularAsserter =
        <K extends OrgTimestampPartKey, V extends OrgTimestampPart[K]>(
          keyValuePairs: Array<[K, V]>,
        ) =>
        (actualTimestamp: OrgTimestampPartRecord): void => {
          forEach(([key, expectedValue]: [K, V]): void => {
            expect(get(actualTimestamp, key)).toBe(expectedValue);
          })(keyValuePairs);
        };
      const repeaterAsserter = regularAsserter([
        ["repeaterUnit", "h"],
        ["repeaterType", "+"],
        ["repeaterValue", "1"],
      ]);
      const delayAsserter = regularAsserter([
        ["delayUnit", "h"],
        ["delayType", "-"],
        ["delayValue", "1"],
      ]);

      const ADDFUNCSTESTCASES: Array<AddFunctionTestCase> = [
        [
          addStartTime,
          { withStartTime: true },
          addTimeAsserter(["startHour", "startMinute"]),
        ],
        [
          addEndTime,
          { withStartTime: true, withEndTime: true },
          addTimeAsserter(["endHour", "endMinute"]),
        ],
        [addRepeater, { withStartTime: true }, repeaterAsserter],
        [addDelay, { withStartTime: true }, delayAsserter],
      ];

      const testRunner =
        (fcGen: fc.GeneratorValue) =>
        ([func, timestampArgs, asserter]: AddFunctionTestCase): void => {
          const [testTimestamp] = fcGenOrgTimestampPartRecord(
            timestampArgs,
            fcGen,
          );
          const actualTimestamp = func(testTimestamp);
          asserter(actualTimestamp);
        };

      test.prop([fc.gen()])("runner", (fcGen) => {
        forEach(testRunner(fcGen))(ADDFUNCSTESTCASES);
      });
    });

    describe("change functions test suite", () => {
      test.prop([fc.gen()])("startTimeChange", (fcGen) => {
        const [timestamp] = fcGenOrgTimestampPartRecord(
          { withStartTime: true },
          fcGen,
        );
        const [testTime, [expectedStartHour, expectedStartMinute]] =
          fcGenRandomTimeStringMV(fcGen);
        const actualTimestamp = startTimeChange(testTime, timestamp);
        expect(get(actualTimestamp, "startHour")).toBe(expectedStartHour);
        expect(get(actualTimestamp, "startMinute")).toBe(expectedStartMinute);
      });

      test.prop([fc.gen()])("endTimeChange", (fcGen) => {
        const [timestamp] = fcGenOrgTimestampPartRecord(
          { withStartTime: true },
          fcGen,
        );
        const [testTime, [expectedEndHour, expectedEndMinute]] =
          fcGenRandomTimeStringMV(fcGen);
        const actualTimestamp = endTimeChange(testTime, timestamp);
        expect(get(actualTimestamp, "endHour")).toBe(expectedEndHour);
        expect(get(actualTimestamp, "endMinute")).toBe(expectedEndMinute);
      });

      test.prop([fc.gen(), fc.boolean()])("activeToggle", (fcGen, isActive) => {
        const [timestamp] = fcGenOrgTimestampPartRecord({ isActive }, fcGen);
        const actualTimestamp = activeToggle(timestamp);
        expect(get(actualTimestamp, "isActive")).toBe(!isActive);
      });
    });

    describe("timestampDuration", () => {
      describe("positive duration", () => {
        test.prop([fc.boolean(), fc.integer({ min: 1, max: 10000 }), fc.gen()])(
          "withoutStartTime",
          (isActive, randomDays, fcGen) => {
            const testStartDate: Date = fcGenValidJSDateObject(fcGen, false);
            // no minutes since there is no start date
            const randomHours = HOURSINADAY * randomDays;
            const testEndDate: Date = pipe([addHours(randomHours)])(
              testStartDate,
            );

            const testStartTimestamp = timestampPartRecordForDate(
              { isActive, withStartTime: false },
              testStartDate,
            );
            const testEndTimestamp = timestampPartRecordForDate(
              { isActive, withStartTime: false },
              testEndDate,
            );

            const expectedDuration = `${randomHours.toString()}:00`;

            const actualDuration = timestampDuration(
              testStartTimestamp,
              testEndTimestamp,
            );
            expect(actualDuration).toBe(expectedDuration);
          },
        );

        test.prop([
          fc.boolean(),
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 59 }),
          fc.gen(),
        ])("withStartTime", (isActive, randomHours, randomMinutes, fcGen) => {
          const testStartDate: Date = fcGenValidJSDateObject(fcGen, true);
          const testEndDate: Date = pipe([
            addHours(randomHours),
            addMinutes(randomMinutes),
          ])(testStartDate);
          const testStartTimestamp = timestampPartRecordForDate(
            { isActive, withStartTime: true },
            testStartDate,
          );
          const testEndTimestamp = timestampPartRecordForDate(
            { isActive, withStartTime: true },
            testEndDate,
          );

          const expectedDuration = `${randomHours.toString()}:${padCharsStart("0", 2, randomMinutes.toString())}`;

          const actualDuration = timestampDuration(
            testStartTimestamp,
            testEndTimestamp,
          );
          expect(actualDuration).toBe(expectedDuration);
        });
      });

      describe("negative duration", () => {
        test.prop([fc.boolean(), fc.integer({ min: 1, max: 10000 }), fc.gen()])(
          "withoutStartTime",
          (isActive, randomDays, fcGen) => {
            const testStartDate: Date = fcGenValidJSDateObject(fcGen, false);
            // no minutes since there is no start date
            const randomHours = HOURSINADAY * randomDays;
            const testEndDate: Date = pipe([addHours(randomHours)])(
              testStartDate,
            );

            const testEndTimestamp = timestampPartRecordForDate(
              { isActive, withStartTime: false },
              testEndDate,
            );
            const testStartTimestamp = timestampPartRecordForDate(
              { isActive, withStartTime: false },
              testStartDate,
            );

            const expectedDuration = `${randomHours.toString()}:00`;

            const actualDuration = timestampDuration(
              testStartTimestamp,
              testEndTimestamp,
            );
            expect(actualDuration).toBe(expectedDuration);
          },
        );

        test.prop([
          fc.boolean(),
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 59 }),
          fc.gen(),
        ])("withStartTime", (isActive, randomHours, randomMinutes, fcGen) => {
          const testEndDate: Date = fcGenValidJSDateObject(fcGen, true);
          const testStartDate: Date = pipe([
            addHours(randomHours),
            addMinutes(randomMinutes),
          ])(testEndDate);
          const testEndTimestamp = timestampPartRecordForDate(
            { isActive, withStartTime: true },
            testEndDate,
          );
          const testStartTimestamp = timestampPartRecordForDate(
            { isActive, withStartTime: true },
            testStartDate,
          );

          const expectedDuration = `-${randomHours.toString()}:${padCharsStart("0", 2, randomMinutes.toString())}`;

          const actualDuration = timestampDuration(
            testStartTimestamp,
            testEndTimestamp,
          );
          expect(actualDuration).toBe(expectedDuration);
        });
      });
    });

    test.prop([fc.boolean(), fc.boolean(), fc.gen()])(
      "createNextRepeatTimestampPartRecord",
      (withStartTime, withDeadline, fcGen) => {
        const repeaterType: RepeaterType = fcGenRandomRepeaterType(fcGen);
        const [testPreviousTimestamp, _, repeaterUnit, repeaterValue] =
          fcGenOrgTimestampPartObjectWithRepeaterTypeX(
            { repeaterType, withStartTime, withDeadline },
            fcGen,
          );
        const testDate = fcGenValidJSDateObject(fcGen);
        const actualTimestampPartRecord = createNextRepeatTimestampPartRecord(
          testPreviousTimestamp,
          testDate,
        );
        expect(actualTimestampPartRecord.toJS()).toMatchObject({
          year: expect.any(String),
          month: expect.any(String),
          day: expect.any(String),
          dayName: expect.any(String),
          startHour: expect.any(String),
          startMinute: expect.any(String),
          repeaterUnit,
          repeaterType,
          repeaterValue,
        });
      },
    );

    describe("renderAsText", () => {
      const testRunner =
        (fcGen: fc.GeneratorValue) =>
        (timestampArgs: Record<string, boolean>) => {
          const [testTimestampPartObject, _, expectedText] =
            fcGenOrgTimestampPartRecord(timestampArgs, fcGen);
          const actualText: string = renderAsText(testTimestampPartObject);
          expect(actualText).toBe(expectedText);
        };
      test.prop([fc.gen()])("runner", (fcGen) => {
        forEach(testRunner(fcGen))(RENDERASTEXTESTCASES);
      });
    });

    describe("applyRepeater", () => {
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
          const actualTimestamp: OrgTimestampPartRecord = applyRepeater(
            testTimestampPartRecord,
            testCurrentDate,
          );

          expect(actualTimestamp.toJS()).toStrictEqual(
            expectedNextRepeatTimestampPartObject,
          );
        };
      test.prop([fc.gen()])("runner", (fcGen) => {
        forEach(testRunner(fcGen))(APPLYREPEATERTESTCASES);
      });
    });
  });
});
