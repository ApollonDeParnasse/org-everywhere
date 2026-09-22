import React from "react";
import { describe, expect, afterEach, test, vi, type Mock } from "vitest";
import { type RenderResult, cleanup } from "vitest-browser-react";
import type { UserEvent } from "vitest/browser";
import thunk from "redux-thunk";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import { isBoolean, stubTrue } from "lodash/fp";
import { getIn, get } from "immutable";
import {
  TESTBASESTATE,
  TESTFILEPATH,
} from "../../../../../../test_helpers/Constants";
import { setup } from "../../../../../../test_helpers/BrowserTestingHelpers";
import {
  randomHourPart,
  randomYear,
} from "../../../../../../test_helpers/TestDataGenerators";
import rootReducer from "../../../../../reducers/";
import { parseFile, setPath } from "../../../../../actions/org";
import {
  timestampPartRecordForDate,
  renderAsText,
  getHourPartFromDate,
  getMinutePartFromDate,
  getRepeaterUnit,
  getRepeaterType,
  getRepeaterValue,
  getDelayUnit,
  getDelayType,
  getDelayValue,
} from "../../../../../lib/timestamps";
import {
  getAllFromRecord,
  getFromRecord,
  over,
} from "../../../../../util/transformers";
import TimestampEditor from "../TimestampEditor";
import type {
  OrgTimestampPartRecord,
  TimestampArgs,
  RepeaterUnit,
  RepeaterType,
  DelayUnit,
  DelayType,
} from "../../../../../Types";

const ACTIVESWITCH = "active-switch";
const ADDSTARTTIME = "add-start-time";
const REMOVESTARTTIME = "remove-start-time";
const CHANGESTARTTIME = "change-start-time";
const ADDENDTIME = "add-end-time";
const REMOVEENDTIME = "remove-end-time";
const CHANGEENDTIME = "change-end-time";
const CHANGEDATE = "change-date";
const ADDREPEATER = "add-repeater";
const REMOVEREPEATER = "remove-repeater";
const CHANGEREPEATERUNIT = "change-repeater-unit";
const CHANGEREPEATERVALUE = "change-repeater-value";
const CHANGEREPEATERTYPE = "change-repeater-type";
const ADDDELAY = "add-delay";
const REMOVEDELAY = "remove-delay";
const CHANGEDELAYUNIT = "change-delay-unit";
const CHANGEDELAYVALUE = "change-delay-value";
const CHANGEDELAYTYPE = "change-delay-type";

const createFileWithHeadlineAndTimestampInDescription = (
  timestampArgs: TimestampArgs,
): [string, OrgTimestampPartRecord, string, string] => {
  const testTimestampPartRecord = timestampPartRecordForDate(
    timestampArgs,
    new Date(),
  );
  const testTimestampPartRecordAsText = renderAsText(testTimestampPartRecord);
  const headline: string = `* TODO Plain\n${testTimestampPartRecordAsText}\n`;
  return [
    headline,
    testTimestampPartRecord,
    testTimestampPartRecordAsText,
    "description",
  ];
};

// don't need onCloseFunc
const testRenderer = async (
  onChangeFunc: (actualTimestampPart: OrgTimestampPartRecord) => boolean,
  onCloseFunc: (actualTimestampPart: OrgTimestampPartRecord) => boolean,
  timestampArgs: TimestampArgs,
): Promise<
  [
    { user: UserEvent; screen: RenderResult },
    OrgTimestampPartRecord,
    string,
    Mock<(arg: OrgTimestampPartRecord) => boolean>,
    Mock<(arg: OrgTimestampPartRecord) => boolean>,
  ]
> => {
  const testStore = createStore(
    rootReducer,
    TESTBASESTATE,
    applyMiddleware(thunk),
  );

  const [testFileContents, testTimestamp, testTimestampAsText, key] =
    createFileWithHeadlineAndTimestampInDescription(timestampArgs);
  testStore.dispatch(parseFile(TESTFILEPATH, testFileContents));
  testStore.dispatch(setPath(TESTFILEPATH));

  const testState = testStore.getState();

  const testHeader = getIn(testState, [
    "org",
    "present",
    "files",
    "org-everywhere_internal_fixtureTestFile.org",
    "headers",
    0,
  ]);

  const timestampLocation = get(testHeader, key);
  const timestamp = get(timestampLocation, "0");
  const onClose = vi.fn(onCloseFunc);
  const onChange = vi.fn(onChangeFunc);

  const testProps = {
    headerId: get(testHeader, "id"),
    timestamp: get(timestamp, "firstTimestamp"),
    timestampId: get(timestamp, "id"),
    planningItemIndex: 0,
    onClose,
    onChange,
  };
  const setupObj = await setup(
    <MemoryRouter
      keyLength={0}
      initialEntries={["/file/dir1/dir2/fixtureTestFile.org"]}
    >
      <Provider store={testStore}>
        <TimestampEditor {...testProps} />
      </Provider>
    </MemoryRouter>,
  );

  return [setupObj, testTimestamp, testTimestampAsText, onChange, onClose];
};

afterEach(cleanup);
describe("TimestampEditor suite", async () => {
  describe("test toggle active", async () => {
    // change, just return the value
    const assertExpectedTimestampAfterActiveToggle =
      (expected: boolean) =>
      (timestampPart: OrgTimestampPartRecord): boolean => {
        const actualValue: boolean | undefined = getFromRecord(
          "isActive",
          timestampPart,
        );
        return isBoolean(actualValue) ? actualValue === expected : false;
      };
    test("active -> inactive, withStartTime", async () => {
      const [{ user, screen }, _, testTimestampAsText, onChange] =
        await testRenderer(
          assertExpectedTimestampAfterActiveToggle(false),
          stubTrue,
          { isActive: true, withStartTime: true },
        );
      expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
      await user.click(screen.getByTestId(ACTIVESWITCH));
      expect(onChange).toHaveReturnedWith(true);
    });

    test("inactive -> active, withStartTime", async () => {
      const [{ user, screen }, _, testTimestampAsText, onChange] =
        await testRenderer(
          assertExpectedTimestampAfterActiveToggle(true),
          stubTrue,
          { isActive: false, withStartTime: true },
        );
      expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
      await user.click(screen.getByTestId(ACTIVESWITCH));
      expect(onChange).toHaveReturnedWith(true);
    });

    test("active -> inactive, withoutStartTime", async () => {
      const [{ user, screen }, _, testTimestampAsText, onChange] =
        await testRenderer(
          assertExpectedTimestampAfterActiveToggle(false),
          stubTrue,
          { isActive: true, withStartTime: false },
        );
      expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
      await user.click(screen.getByTestId(ACTIVESWITCH));
      expect(onChange).toHaveReturnedWith(true);
    });

    test("inactive -> active, withoutStartTime", async () => {
      const [{ user, screen }, _, testTimestampAsText, onChange] =
        await testRenderer(
          assertExpectedTimestampAfterActiveToggle(true),
          stubTrue,
          { isActive: false, withStartTime: false },
        );
      expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
      await user.click(screen.getByTestId(ACTIVESWITCH));
      expect(onChange).toHaveReturnedWith(true);
    });
  });

  describe("start time changes", async () => {
    const assertExpectedTimestampAfterStartTimeAdded = (
      timestamp: OrgTimestampPartRecord,
    ): boolean => {
      const [newHour, newMinute] = over([
        getHourPartFromDate,
        getMinutePartFromDate,
      ])(new Date());
      const [withStartTime, startHour, startMinute] = getAllFromRecord(
        ["withStartTime", "startHour", "startMinute"],
        timestamp,
      );
      return (
        withStartTime === true &&
        startHour === newHour &&
        startMinute === newMinute
      );
    };

    const assertExpectedTimestampAfterStartTimeRemoved = (
      timestamp: OrgTimestampPartRecord,
    ): boolean => {
      const [withStartTime, startHour, startMinute] = getAllFromRecord(
        ["withStartTime", "startHour", "startMinute"],
        timestamp,
      );
      return (
        withStartTime === false &&
        startHour === undefined &&
        startMinute === undefined
      );
    };

    describe("add start time", async () => {
      test("active", async () => {
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(
            assertExpectedTimestampAfterStartTimeAdded,
            stubTrue,
            { isActive: true, withStartTime: false },
          );
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(ADDSTARTTIME));
        expect(onChange).toHaveReturnedWith(true);
      });

      test("inactive", async () => {
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(
            assertExpectedTimestampAfterStartTimeAdded,
            stubTrue,
            { isActive: false, withStartTime: false },
          );
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(ADDSTARTTIME));
        expect(onChange).toHaveReturnedWith(true);
      });
    });

    describe("remove start time", async () => {
      test("active", async () => {
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(
            assertExpectedTimestampAfterStartTimeRemoved,
            stubTrue,
            { isActive: true, withStartTime: true },
          );
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(REMOVESTARTTIME));
        expect(onChange).toHaveReturnedWith(true);
      });

      test("inactive", async () => {
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(
            assertExpectedTimestampAfterStartTimeRemoved,
            stubTrue,
            { isActive: false, withStartTime: true },
          );
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(REMOVESTARTTIME));
        expect(onChange).toHaveReturnedWith(true);
      });
    });

    describe("change start time", async () => {
      // we can't check that new values are set here
      // we can only check that on change is called
      test("active", async () => {
        const testNewHour = randomHourPart();
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(stubTrue, stubTrue, {
            isActive: true,
            withStartTime: true,
          });
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(CHANGESTARTTIME));
        await user.type(screen.getByTestId(CHANGESTARTTIME), testNewHour);
        expect(onChange).toHaveBeenCalled();
      });

      test("inactive", async () => {
        const testNewHour = randomHourPart();
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(stubTrue, stubTrue, {
            isActive: false,
            withStartTime: true,
          });
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(CHANGESTARTTIME));
        await user.type(screen.getByTestId(CHANGESTARTTIME), testNewHour);
        expect(onChange).toHaveBeenCalled();
      });
    });
  });

  describe("end time changes", async () => {
    const assertExpectedTimestampAfterEndTimeAdded = (
      timestamp: OrgTimestampPartRecord,
    ): boolean => {
      const [newHour, newMinute] = over([
        getHourPartFromDate,
        getMinutePartFromDate,
      ])(new Date());
      const [endHour, endMinute] = getAllFromRecord(
        ["endHour", "endMinute"],
        timestamp,
      );
      return endHour === newHour && endMinute === newMinute;
    };

    const assertExpectedTimestampAfterEndTimeRemoved = (
      timestamp: OrgTimestampPartRecord,
    ): boolean => {
      const [endHour, endMinute] = getAllFromRecord(
        ["endHour", "endMinute"],
        timestamp,
      );
      return endHour === undefined && endMinute === undefined;
    };

    describe("add end time", async () => {
      test("active", async () => {
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(
            assertExpectedTimestampAfterEndTimeAdded,
            stubTrue,
            { isActive: true, withStartTime: true, withEndTime: false },
          );
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(ADDENDTIME));
        expect(onChange).toHaveReturnedWith(true);
      });

      test("inactive", async () => {
        const [{ user, screen }, testTimestamp, testTimestampAsText, onChange] =
          await testRenderer(
            assertExpectedTimestampAfterEndTimeAdded,
            stubTrue,
            { isActive: false, withStartTime: true, withEndTime: false },
          );
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(ADDENDTIME));
        expect(onChange).toHaveReturnedWith(true);
      });
    });

    describe("remove end time", async () => {
      test("active", async () => {
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(
            assertExpectedTimestampAfterEndTimeRemoved,
            stubTrue,
            { isActive: true, withStartTime: true, withEndTime: true },
          );
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(REMOVEENDTIME));
        expect(onChange).toHaveReturnedWith(true);
      });

      test("inactive", async () => {
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(
            assertExpectedTimestampAfterEndTimeRemoved,
            stubTrue,
            { isActive: false, withStartTime: true, withEndTime: true },
          );
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(REMOVEENDTIME));
        expect(onChange).toHaveReturnedWith(true);
      });
    });

    describe("change end time", async () => {
      // we can't check that new values are set here
      // we can only check that on change is called
      test("active", async () => {
        const testNewHour = randomHourPart();
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(stubTrue, stubTrue, {
            isActive: true,
            withStartTime: true,
            withEndTime: true,
          });
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(CHANGEENDTIME));
        await user.type(screen.getByTestId(CHANGEENDTIME), testNewHour);
        expect(onChange).toHaveBeenCalled();
      });

      test("inactive", async () => {
        const testNewHour = randomHourPart();
        const [{ user, screen }, _, testTimestampAsText, onChange] =
          await testRenderer(stubTrue, stubTrue, {
            isActive: false,
            withStartTime: true,
            withEndTime: true,
          });
        expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
        await user.click(screen.getByTestId(CHANGEENDTIME));
        await user.type(screen.getByTestId(CHANGEENDTIME), testNewHour);
        expect(onChange).toHaveBeenCalled();
      });
    });
  });

  describe("change date", async () => {
    // we can't check that new values are set here
    // we can only check that on change is called
    test("active", async () => {
      const testNewYear = randomYear();
      const [{ user, screen }, _, testTimestampAsText, onChange] =
        await testRenderer(stubTrue, stubTrue, { isActive: true });
      expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
      await user.click(screen.getByTestId(CHANGEDATE));
      await user.type(screen.getByTestId(CHANGEDATE), testNewYear);
      expect(onChange).toHaveBeenCalled();
    });

    test("inactive", async () => {
      const testNewYear = randomYear();
      const [{ user, screen }, _, testTimestampAsText, onChange] =
        await testRenderer(stubTrue, stubTrue, { isActive: false });
      expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
      await user.click(screen.getByTestId(CHANGEDATE));
      await user.type(screen.getByTestId(CHANGEDATE), testNewYear);
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe("repeater changes", async () => {
    const assertExpectedTimestampAfterRepeaterAdded = (
      timestamp: OrgTimestampPartRecord,
    ): boolean => {
      const [repeaterUnit, repeaterValue, repeaterType] = getAllFromRecord(
        ["repeaterUnit", "repeaterValue", "repeaterType"],
        timestamp,
      );
      return (
        repeaterUnit === "d" && repeaterValue === "1" && repeaterType === "+"
      );
    };

    const assertExpectedTimestampAfterRepeaterRemoved = (
      timestamp: OrgTimestampPartRecord,
    ): boolean => {
      const [repeaterUnit, repeaterValue, repeaterType] = getAllFromRecord(
        ["repeaterUnit", "repeaterValue", "repeaterType"],
        timestamp,
      );
      return (
        repeaterUnit === undefined &&
        repeaterValue === undefined &&
        repeaterType === undefined
      );
    };

    const assertExpectedTimestampAfterRepeaterUnitChanged =
      (newUnit: RepeaterUnit) =>
      (timestamp: OrgTimestampPartRecord): boolean => {
        return getRepeaterUnit(timestamp) === newUnit;
      };

    const assertExpectedTimestampAfterRepeaterTypeChanged =
      (newType: RepeaterType) =>
      (timestamp: OrgTimestampPartRecord): boolean => {
        return getRepeaterType(timestamp) === newType;
      };

    const assertExpectedTimestampAfterRepeaterValueChanged =
      (newValue: string) =>
      (timestamp: OrgTimestampPartRecord): boolean => {
        return getRepeaterValue(timestamp) === newValue;
      };

    describe("add repeater", async () => {
      describe("withoutStartTime", async () => {
        test("active", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterRepeaterAdded,
              stubTrue,
              { isActive: true, withRepeater: false },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(ADDREPEATER));
          expect(onChange).toHaveReturnedWith(true);
        });

        test("inactive", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterRepeaterAdded,
              stubTrue,
              { isActive: false, withRepeater: false },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(ADDREPEATER));
          expect(onChange).toHaveReturnedWith(true);
        });
      });

      describe("withStartTime", async () => {
        test("active", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterRepeaterAdded,
              stubTrue,
              { isActive: true, withRepeater: false, withStartTime: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(ADDREPEATER));
          expect(onChange).toHaveReturnedWith(true);
        });

        test("inactive", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterRepeaterAdded,
              stubTrue,
              { isActive: false, withRepeater: false, withStartTime: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(ADDREPEATER));
          expect(onChange).toHaveReturnedWith(true);
        });
      });
    });

    describe("remove repeater", async () => {
      describe("withoutStartTime", async () => {
        test("active", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterRepeaterRemoved,
              stubTrue,
              { isActive: true, withRepeater: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(REMOVEREPEATER));
          expect(onChange).toHaveReturnedWith(true);
        });

        test("inactive", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterRepeaterRemoved,
              stubTrue,
              { isActive: false, withRepeater: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(REMOVEREPEATER));
          expect(onChange).toHaveReturnedWith(true);
        });
      });

      describe("withoutStartTime", async () => {
        test("active", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterRepeaterRemoved,
              stubTrue,
              { isActive: true, withRepeater: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(REMOVEREPEATER));
          expect(onChange).toHaveReturnedWith(true);
        });

        test("inactive", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterRepeaterRemoved,
              stubTrue,
              { isActive: false, withRepeater: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(REMOVEREPEATER));
          expect(onChange).toHaveReturnedWith(true);
        });
      });
    });

    describe("change repeater", async () => {
      // we can't check that new values are set here
      // we can only check that on change is called
      describe("change repeater unit", async () => {
        describe("withoutStartTime", async () => {
          describe("active", async () => {
            test("valid unit change", async () => {
              const [{ user, screen }, _, testTimestampAsText, onChange] =
                await testRenderer(
                  assertExpectedTimestampAfterRepeaterUnitChanged("w"),
                  stubTrue,
                  { isActive: true, withRepeater: true },
                );
              expect(
                screen.getByText(testTimestampAsText).query(),
              ).toBeTruthy();
              const repeaterUnitChangeButtons =
                screen.getByTestId(CHANGEREPEATERUNIT);
              await user.click(repeaterUnitChangeButtons.getByText("w"));
              expect(onChange).toHaveReturnedWith(true);
            });
            test("should not be able to select h", async () => {
              const [{ screen }, , testTimestampAsText] = await testRenderer(
                assertExpectedTimestampAfterRepeaterUnitChanged("d"),
                stubTrue,
                { isActive: true, withRepeater: true },
              );
              expect(
                screen.getByText(testTimestampAsText).query(),
              ).toBeTruthy();
              const repeaterUnitChangeButtons =
                screen.getByTestId(CHANGEREPEATERUNIT);
              expect(
                repeaterUnitChangeButtons.getByText("h").query(),
              ).toBeFalsy();
            });
          });

          describe("inactive", async () => {
            test("valid unit change", async () => {
              const [{ user, screen }, _, testTimestampAsText, onChange] =
                await testRenderer(
                  assertExpectedTimestampAfterRepeaterUnitChanged("m"),
                  stubTrue,
                  { isActive: false, withRepeater: true },
                );
              expect(
                screen.getByText(testTimestampAsText).query(),
              ).toBeTruthy();
              const repeaterUnitChangeButtons =
                screen.getByTestId(CHANGEREPEATERUNIT);
              await user.click(repeaterUnitChangeButtons.getByText("m"));
              expect(onChange).toHaveReturnedWith(true);
            });
            test("should not be able to select h", async () => {
              const [{ screen }, _, testTimestampAsText] = await testRenderer(
                assertExpectedTimestampAfterRepeaterUnitChanged("d"),
                stubTrue,
                { isActive: false, withRepeater: true },
              );
              expect(
                screen.getByText(testTimestampAsText).query(),
              ).toBeTruthy();
              const repeaterUnitChangeButtons =
                screen.getByTestId(CHANGEREPEATERUNIT);
              expect(
                repeaterUnitChangeButtons.getByText("h").query(),
              ).toBeFalsy();
            });
          });
        });

        describe("withStartTime", async () => {
          test("active", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterRepeaterUnitChanged("h"),
                stubTrue,
                { isActive: true, withRepeater: true, withStartTime: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const repeaterUnitChangeButtons =
              screen.getByTestId(CHANGEREPEATERUNIT);
            await user.click(repeaterUnitChangeButtons.getByText("h"));
            expect(onChange).toHaveReturnedWith(true);
          });

          test("inactive", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterRepeaterUnitChanged("y"),
                stubTrue,
                { isActive: false, withRepeater: true, withStartTime: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const repeaterUnitChangeButtons =
              screen.getByTestId(CHANGEREPEATERUNIT);
            await user.click(repeaterUnitChangeButtons.getByText("y"));
            expect(onChange).toHaveReturnedWith(true);
          });
        });
      });
      describe("change repeater type", async () => {
        describe("withoutStartTime", async () => {
          test("active", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterRepeaterTypeChanged("++"),
                stubTrue,
                { isActive: true, withRepeater: true },
              );

            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const repeaterTypeChangeButtons =
              screen.getByTestId(CHANGEREPEATERTYPE);
            await user.click(repeaterTypeChangeButtons.getByText("++"));
            expect(onChange).toHaveReturnedWith(true);
          });

          test("inactive", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterRepeaterTypeChanged(".+"),
                stubTrue,
                { isActive: false, withRepeater: true },
              );

            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const repeaterTypeChangeButtons =
              screen.getByTestId(CHANGEREPEATERTYPE);
            await user.click(repeaterTypeChangeButtons.getByText(".+"));
            expect(onChange).toHaveReturnedWith(true);
          });
        });

        describe("withStartTime", async () => {
          test("active", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterRepeaterTypeChanged(".+"),
                stubTrue,
                { isActive: true, withRepeater: true, withStartTime: true },
              );

            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const repeaterTypeChangeButtons =
              screen.getByTestId(CHANGEREPEATERTYPE);
            await user.click(repeaterTypeChangeButtons.getByText(".+"));
            expect(onChange).toHaveReturnedWith(true);
          });

          test("inactive", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterRepeaterTypeChanged("++"),
                stubTrue,
                { isActive: false, withRepeater: true, withStartTime: true },
              );

            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const repeaterTypeChangeButtons =
              screen.getByTestId(CHANGEREPEATERTYPE);
            await user.click(repeaterTypeChangeButtons.getByText("++"));
            expect(onChange).toHaveReturnedWith(true);
          });
        });
      });
      describe("change repeater value", async () => {
        describe("withoutStartTime", async () => {
          test("active", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterRepeaterValueChanged("12"),
                stubTrue,
                { isActive: true, withRepeater: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            await user.type(screen.getByTestId(CHANGEREPEATERVALUE), "2");
            expect(onChange).toHaveReturnedWith(true);
          });

          test("inactive", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterRepeaterValueChanged("15"),
                stubTrue,
                { isActive: false, withRepeater: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            await user.type(screen.getByTestId(CHANGEREPEATERVALUE), "5");
            expect(onChange).toHaveReturnedWith(true);
          });
        });

        describe("withStartTime", async () => {
          test("active", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterRepeaterValueChanged("10"),
                stubTrue,
                { isActive: true, withRepeater: true, withStartTime: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            await user.type(screen.getByTestId(CHANGEREPEATERVALUE), "0");
            expect(onChange).toHaveReturnedWith(true);
          });

          test("inactive", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterRepeaterValueChanged("17"),
                stubTrue,
                { isActive: false, withRepeater: true, withStartTime: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            await user.type(screen.getByTestId(CHANGEREPEATERVALUE), "7");
            expect(onChange).toHaveReturnedWith(true);
          });
        });
      });
    });
  });
  describe("delay changes", async () => {
    const assertExpectedTimestampAfterDelayAdded = (
      timestamp: OrgTimestampPartRecord,
    ): boolean => {
      const [delayUnit, delayValue, delayType] = getAllFromRecord(
        ["delayUnit", "delayValue", "delayType"],
        timestamp,
      );
      return delayUnit === "d" && delayValue === "1" && delayType === "-";
    };

    const assertExpectedTimestampAfterDelayRemoved = (
      timestamp: OrgTimestampPartRecord,
    ): boolean => {
      const [delayUnit, delayValue, delayType] = getAllFromRecord(
        ["delayUnit", "delayValue", "delayType"],
        timestamp,
      );
      return (
        delayUnit === undefined &&
        delayValue === undefined &&
        delayType === undefined
      );
    };

    const assertExpectedTimestampAfterDelayUnitChanged =
      (newUnit: DelayUnit) =>
      (timestamp: OrgTimestampPartRecord): boolean => {
        return getDelayUnit(timestamp) === newUnit;
      };

    const assertExpectedTimestampAfterDelayTypeChanged =
      (newType: DelayType) =>
      (timestamp: OrgTimestampPartRecord): boolean => {
        return getDelayType(timestamp) === newType;
      };

    const assertExpectedTimestampAfterDelayValueChanged =
      (newValue: string) =>
      (timestamp: OrgTimestampPartRecord): boolean => {
        return getDelayValue(timestamp) === newValue;
      };

    describe("add delay", async () => {
      describe("withoutStartTime", async () => {
        test("active", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterDelayAdded,
              stubTrue,
              { isActive: true, withDelay: false },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(ADDDELAY));
          expect(onChange).toHaveReturnedWith(true);
        });

        test("inactive", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterDelayAdded,
              stubTrue,
              { isActive: false, withDelay: false },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(ADDDELAY));
          expect(onChange).toHaveReturnedWith(true);
        });
      });

      describe("withStartTime", async () => {
        test("active", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterDelayAdded,
              stubTrue,
              { isActive: true, withDelay: false, withStartTime: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(ADDDELAY));
          expect(onChange).toHaveReturnedWith(true);
        });

        test("inactive", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterDelayAdded,
              stubTrue,
              { isActive: false, withDelay: false, withStartTime: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(ADDDELAY));
          expect(onChange).toHaveReturnedWith(true);
        });
      });
    });

    describe("remove delay", async () => {
      describe("withoutStartTime", async () => {
        test("active", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterDelayRemoved,
              stubTrue,
              { isActive: true, withDelay: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(REMOVEDELAY));
          expect(onChange).toHaveReturnedWith(true);
        });

        test("inactive", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterDelayRemoved,
              stubTrue,
              { isActive: false, withDelay: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(REMOVEDELAY));
          expect(onChange).toHaveReturnedWith(true);
        });
      });

      describe("withoutStartTime", async () => {
        test("active", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterDelayRemoved,
              stubTrue,
              { isActive: true, withDelay: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(REMOVEDELAY));
          expect(onChange).toHaveReturnedWith(true);
        });

        test("inactive", async () => {
          const [{ user, screen }, _, testTimestampAsText, onChange] =
            await testRenderer(
              assertExpectedTimestampAfterDelayRemoved,
              stubTrue,
              { isActive: false, withDelay: true },
            );
          expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
          await user.click(screen.getByTestId(REMOVEDELAY));
          expect(onChange).toHaveReturnedWith(true);
        });
      });
    });

    describe("change delay", async () => {
      // we can't check that new values are set here
      // we can only check that on change is called
      describe("change delay unit", async () => {
        describe("withoutStartTime", async () => {
          describe("active", async () => {
            test("valid unit change", async () => {
              const [{ user, screen }, _, testTimestampAsText, onChange] =
                await testRenderer(
                  assertExpectedTimestampAfterDelayUnitChanged("w"),
                  stubTrue,
                  { isActive: true, withDelay: true },
                );
              expect(
                screen.getByText(testTimestampAsText).query(),
              ).toBeTruthy();
              const delayUnitChangeButtons =
                screen.getByTestId(CHANGEDELAYUNIT);
              await user.click(delayUnitChangeButtons.getByText("w"));
              expect(onChange).toHaveReturnedWith(true);
            });
            test("should not be able to select h", async () => {
              const [{ screen }, _, testTimestampAsText] = await testRenderer(
                assertExpectedTimestampAfterDelayUnitChanged("d"),
                stubTrue,
                { isActive: true, withDelay: true },
              );
              expect(
                screen.getByText(testTimestampAsText).query(),
              ).toBeTruthy();
              const delayUnitChangeButtons =
                screen.getByTestId(CHANGEDELAYUNIT);

              expect(delayUnitChangeButtons.getByText("h").query()).toBeFalsy();
            });
          });

          describe("inactive", async () => {
            test("valid unit change", async () => {
              const [{ user, screen }, _, testTimestampAsText, onChange] =
                await testRenderer(
                  assertExpectedTimestampAfterDelayUnitChanged("m"),
                  stubTrue,
                  { isActive: false, withDelay: true },
                );
              expect(
                screen.getByText(testTimestampAsText).query(),
              ).toBeTruthy();
              const delayUnitChangeButtons =
                screen.getByTestId(CHANGEDELAYUNIT);
              await user.click(delayUnitChangeButtons.getByText("m"));
              expect(onChange).toHaveReturnedWith(true);
            });
            test("should not be able to select h", async () => {
              const [{ screen }, _, testTimestampAsText] = await testRenderer(
                assertExpectedTimestampAfterDelayUnitChanged("d"),
                stubTrue,
                { isActive: false, withDelay: true },
              );
              expect(
                screen.getByText(testTimestampAsText).query(),
              ).toBeTruthy();
              const delayUnitChangeButtons =
                screen.getByTestId(CHANGEDELAYUNIT);

              expect(delayUnitChangeButtons.getByText("h").query()).toBeFalsy();
            });
          });
        });

        describe("withStartTime", async () => {
          test("active", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterDelayUnitChanged("h"),
                stubTrue,
                { isActive: true, withDelay: true, withStartTime: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const delayUnitChangeButtons = screen.getByTestId(CHANGEDELAYUNIT);
            await user.click(delayUnitChangeButtons.getByText("h"));
            expect(onChange).toHaveReturnedWith(true);
          });

          test("inactive", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterDelayUnitChanged("y"),
                stubTrue,
                { isActive: false, withDelay: true, withStartTime: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const delayUnitChangeButtons = screen.getByTestId(CHANGEDELAYUNIT);
            await user.click(delayUnitChangeButtons.getByText("y"));
            expect(onChange).toHaveReturnedWith(true);
          });
        });
      });
      describe("change delay type", async () => {
        describe("withoutStartTime", async () => {
          test("active", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterDelayTypeChanged("--"),
                stubTrue,
                { isActive: true, withDelay: true },
              );

            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const delayTypeChangeButtons = screen.getByTestId(CHANGEDELAYTYPE);
            await user.click(delayTypeChangeButtons.getByText("--"));
            expect(onChange).toHaveReturnedWith(true);
          });

          test("inactive", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterDelayTypeChanged("--"),
                stubTrue,
                { isActive: false, withDelay: true },
              );

            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const delayTypeChangeButtons = screen.getByTestId(CHANGEDELAYTYPE);
            await user.click(delayTypeChangeButtons.getByText("--"));
            expect(onChange).toHaveReturnedWith(true);
          });
        });

        describe("withStartTime", async () => {
          test("active", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterDelayTypeChanged("--"),
                stubTrue,
                { isActive: true, withDelay: true, withStartTime: true },
              );

            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const delayTypeChangeButtons = screen.getByTestId(CHANGEDELAYTYPE);
            await user.click(delayTypeChangeButtons.getByText("--"));
            expect(onChange).toHaveReturnedWith(true);
          });

          test("inactive", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterDelayTypeChanged("--"),
                stubTrue,
                { isActive: false, withDelay: true, withStartTime: true },
              );

            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            const delayTypeChangeButtons = screen.getByTestId(CHANGEDELAYTYPE);
            await user.click(delayTypeChangeButtons.getByText("--"));
            expect(onChange).toHaveReturnedWith(true);
          });
        });
      });
      describe("change delay value", async () => {
        describe("withoutStartTime", async () => {
          test("active", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterDelayValueChanged("12"),
                stubTrue,
                { isActive: true, withDelay: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            await user.type(screen.getByTestId(CHANGEDELAYVALUE), "2");
            expect(onChange).toHaveReturnedWith(true);
          });

          test("inactive", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterDelayValueChanged("15"),
                stubTrue,
                { isActive: false, withDelay: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            await user.type(screen.getByTestId(CHANGEDELAYVALUE), "5");
            expect(onChange).toHaveReturnedWith(true);
          });
        });

        describe("withStartTime", async () => {
          test("active", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterDelayValueChanged("10"),
                stubTrue,
                { isActive: true, withDelay: true, withStartTime: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            await user.type(screen.getByTestId(CHANGEDELAYVALUE), "0");
            expect(onChange).toHaveReturnedWith(true);
          });

          test("inactive", async () => {
            const [{ user, screen }, _, testTimestampAsText, onChange] =
              await testRenderer(
                assertExpectedTimestampAfterDelayValueChanged("17"),
                stubTrue,
                { isActive: false, withDelay: true, withStartTime: true },
              );
            expect(screen.getByText(testTimestampAsText).query()).toBeTruthy();
            await user.type(screen.getByTestId(CHANGEDELAYVALUE), "7");
            expect(onChange).toHaveReturnedWith(true);
          });
        });
      });
    });
  });
});
