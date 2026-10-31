import { match } from "ts-pattern";
import {
  parse,
  isBefore,
  isEqual as datesEqual,
  differenceInMinutes,
  differenceInHours,
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subHours,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  format,
  getHours,
  setHours,
  getMinutes,
  setMinutes,
} from "date-fns/fp";
import {
  sortBy,
  identity,
  padCharsStart,
  property,
  map,
  merge,
  reduce,
  zip,
  split,
  isString,
  constant,
} from "lodash/fp";
import { pipe } from "fp-ts/function";
import { flap } from "fp-ts/Array";
import { type ReadonlyNonEmptyArray } from "fp-ts/ReadonlyNonEmptyArray";
import {
  curriedSetRecord,
  curriedGetFromRecord,
  setAllForRecord,
  curriedUpdateAllForRecord,
  curriedSetAllForRecord,
  curriedUpdateRecord,
  setRecord,
} from "../util/transformers";
import type {
  TimestampUnit,
  OrgTimestampPart,
  OrgTimestampPartKey,
  OrgTimestampPartRecord,
  RepeaterType,
  RepeaterUnit,
  StartOrEnd,
  TimestampArgs,
} from "../Types";
import { makeOrgTimestampPartRecord } from "../Types";
import {
  REPEATERTYPESSET,
  TIMESTAMPUNITSSET,
  ORGTIMESTAMPDATEKEYNAMES,
  DELAYTYPESSET,
  DAYABBREVS,
} from "./Constants";

export const padTimePart = padCharsStart("0", 2);
export const convertDayNumberIntoDayName = (
  number: number,
  abbrevs = DAYABBREVS,
): string => property(number, abbrevs);

// JS Date Functions

export const getYearFromDate = (date: Date): string =>
  date.getFullYear().toString();
export const getMonthFromDate = (date: Date): string =>
  padTimePart((date.getMonth() + 1).toString());
export const getDayFromDate = (date: Date): string =>
  padTimePart(date.getDate().toString());
export const getDayNameFromDate = (date: Date): string =>
  convertDayNumberIntoDayName(date.getDay());
export const getHourPartFromDate = (date: Date): string =>
  padTimePart(date.getHours().toString());
export const getMinutePartFromDate = (date: Date): string =>
  padTimePart(date.getMinutes().toString());

export const getTimestampPartsFromDate = (
  date: Date,
): ReadonlyNonEmptyArray<string> => {
  return flap(date)([
    getYearFromDate,
    getMonthFromDate,
    getDayFromDate,
    getDayNameFromDate,
    getHourPartFromDate,
    getMinutePartFromDate,
  ]);
};

export const getCurrentDate = (): Date => new Date();
const getXFromCurrentDate = (func: (date: Date) => string) => (): string =>
  func(getCurrentDate());
export const getYearFromCurrentDate = getXFromCurrentDate(getYearFromDate);
export const getMonthFromCurrentDate = getXFromCurrentDate(getMonthFromDate);
export const getDayFromCurrentDate = getXFromCurrentDate(getDayFromDate);
export const getDayNameFromCurrentDate =
  getXFromCurrentDate(getDayNameFromDate);
export const getHourPartFromCurrentDate =
  getXFromCurrentDate(getHourPartFromDate);
export const getMinutePartFromCurrentDate = getXFromCurrentDate(
  getMinutePartFromDate,
);

// Date Arithmetic

export const addTimestampUnitToDate = (
  timestampUnit: TimestampUnit,
  numUnits: number,
  date: Date,
): Date => {
  switch (timestampUnit) {
    case "h":
      return addHours(numUnits, date);
    case "d":
      return addDays(numUnits, date);
    case "w":
      return addWeeks(numUnits, date);
    case "m":
      return addMonths(numUnits, date);
    case "y":
      return addYears(numUnits, date);
    default:
      return date;
  }
};

export const subtractTimestampUnitFromDate = (
  timestampUnit: TimestampUnit,
  numUnits: number,
  date: Date,
): Date => {
  switch (timestampUnit) {
    case "h":
      return subHours(numUnits, date);
    case "d":
      return subDays(numUnits, date);
    case "w":
      return subWeeks(numUnits, date);
    case "m":
      return subMonths(numUnits, date);
    case "y":
      return subYears(numUnits, date);
    default:
      return date;
  }
};

export const getTimestampPartsFromDateWithKeyNames = pipe([
  getTimestampPartsFromDate,
  zip(ORGTIMESTAMPDATEKEYNAMES),
]);

// Validators
export const isValidRepeaterUnit = (
  value: unknown,
  repeaterUnitsSet = TIMESTAMPUNITSSET,
): value is RepeaterUnit => isString(value) && repeaterUnitsSet.has(value);
export const isValidRepeaterType = (
  value: unknown,
  repeaterTypesSet = REPEATERTYPESSET,
): value is RepeaterType => isString(value) && repeaterTypesSet.has(value);

export const isValidDelayType = (
  value: unknown,
  delayTypesSet = DELAYTYPESSET,
): value is RepeaterType => isString(value) && delayTypesSet.has(value);

export const isValidDelayUnit = (
  value: unknown,
  delayUnitsSet = TIMESTAMPUNITSSET,
): value is DelayUnit => isString(value) && delayUnitsSet.has(value);

// Timestamp string constructors

const renderAsTextReducer = (
  currStr: string,
  [bool, stringToAppend]: [boolean, string],
): string => {
  if (bool) {
    return currStr + stringToAppend;
  }
  return currStr;
};

export const renderAsText = (timestamp: OrgTimestampPartRecord): string => {
  const {
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
  } = timestamp.toJS();

  const [startBracket, endBracket]: string = isActive ? "<>" : "[]";
  const boolStringTuples: Array<[boolean, string]> = [
    [true, startBracket],
    [true, `${year}-${month}-${day} ${dayName}`],
    [withStartTime, ` ${startHour}:${startMinute}`],
    [withStartTime && !!endHour, `-${endHour}:${endMinute}`],
    [!!repeaterType, ` ${repeaterType}${repeaterValue}${repeaterUnit}`],
    [
      !!repeaterType && !!repeaterDeadlineValue,
      `/${repeaterDeadlineValue}${repeaterDeadlineUnit}`,
    ],
    [!!delayType, ` ${delayType}${delayValue}${delayUnit}`],
    [true, endBracket],
  ];

  return reduce(renderAsTextReducer, "", boolStringTuples);
};

// Timestamp object constructors

export const getCurrentTimestamp = ({
  isActive = true,
  withStartTime = false,
} = {}): OrgTimestampPart =>
  timestampPartObjectForDate(new Date(), { isActive, withStartTime });

const withEndTimeCreator = (): Partial<OrgTimestampPart> => {
  return {
    endHour: getHourPartFromCurrentDate(),
    endMinute: getMinutePartFromCurrentDate(),
  };
};

const withRepeaterCreator =
  (withStartTime: boolean) => (): Partial<OrgTimestampPart> => {
    return {
      repeaterUnit: withStartTime ? "h" : "d",
      repeaterValue: "1",
      repeaterType: "+",
    };
  };

const withDeadlineCreator =
  (withStartTime: boolean) => (): Partial<OrgTimestampPart> => {
    return {
      repeaterDeadlineUnit: withStartTime ? "h" : "d",
      repeaterDeadlineValue: "2",
    };
  };

const withDelayCreator =
  (withStartTime: boolean) => (): Partial<OrgTimestampPart> => {
    return {
      delayUnit: withStartTime ? "h" : "d",
      delayValue: "1",
      delayType: "-",
    };
  };

export const timestampPartObjectForDate = (
  time: Date,
  {
    isActive = false,
    withStartTime = false,
    withEndTime = false,
    withRepeater = false,
    withDeadline = false,
    withDelay = false,
  }: TimestampArgs = {},
): OrgTimestampPart => {
  const baseTimestamp: OrgTimestampPart = {
    isActive,
    withStartTime,
    year: time.getFullYear().toString(),
    month: format("MM", time),
    day: format("dd", time),
    dayName: format("eee", time),
    startHour: format("HH", time),
    startMinute: format("mm", time),
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
  };

  const boolFuncTuples: Array<[boolean, () => Partial<OrgTimestampPart>]> = [
    [withEndTime, withEndTimeCreator],
    [withRepeater, withRepeaterCreator(withStartTime)],
    [withDeadline, withDeadlineCreator(withStartTime)],
    [withDelay, withDelayCreator(withStartTime)],
  ];

  return reduce(
    (
      orgTimestampPart: OrgTimestampPart,
      [addValue, newValues]: [boolean, () => Partial<OrgTimestampPart>],
    ): OrgTimestampPart => {
      return addValue ? merge(orgTimestampPart, newValues()) : orgTimestampPart;
    },
    baseTimestamp,
    boolFuncTuples,
  );
};

export const timestampPartRecordForDate = (
  timestampArgs: TimestampArgs = {},
  time: Date,
): OrgTimestampPartRecord => {
  return makeOrgTimestampPartRecord(
    timestampPartObjectForDate(time, timestampArgs),
  );
};

export const getJSDateAsOrgTimestampString = (
  time: Date,
  { isActive = true, withStartTime = false } = {},
): string => {
  const bracketPair: string = isActive ? "<>" : "[]";
  let formatString: string = "yyyy-MM-dd eee";
  if (withStartTime) formatString += " HH:mm";
  return `${bracketPair[0]}${format(formatString, time)}${bracketPair[1]}`;
};

// To get around the heavy-weight renderAsText(fromJS(getCurrentJSDateAsOrgTimestampString()))
export const getCurrentJSDateAsOrgTimestampString = ({
  isActive = true,
  withStartTime = true,
} = {}): string =>
  getJSDateAsOrgTimestampString(new Date(), { isActive, withStartTime });

export const dateForTimestamp = (timestamp: OrgTimestampPartRecord): Date => {
  // should not use toJS() here
  const { year, month, day, startHour, startMinute } = timestamp.toJS();
  let timestampString: string = `${year}-${month}-${day} ${startHour}:${startMinute}`;
  return parse(new Date(), "yyyy-MM-dd HH:mm", timestampString);
};

// Lenses
// timestamp getters

export const getIsActive = curriedGetFromRecord<OrgTimestampPart, "isActive">(
  "isActive",
);
export const getWithStartTime = curriedGetFromRecord<
  OrgTimestampPart,
  "withStartTime"
>("withStartTime");
export const getYear = curriedGetFromRecord<OrgTimestampPart, "year">("year");
export const getMonth = curriedGetFromRecord<OrgTimestampPart, "month">(
  "month",
);
export const getDay = curriedGetFromRecord<OrgTimestampPart, "day">("day");
export const getDayName = curriedGetFromRecord<OrgTimestampPart, "dayName">(
  "dayName",
);
export const getStartHour = curriedGetFromRecord<OrgTimestampPart, "startHour">(
  "startHour",
);
export const getStartMinute = curriedGetFromRecord<
  OrgTimestampPart,
  "startMinute"
>("startMinute");
export const getEndHour = curriedGetFromRecord<OrgTimestampPart, "endHour">(
  "endHour",
);
export const getEndMinute = curriedGetFromRecord<OrgTimestampPart, "endMinute">(
  "endMinute",
);
export const getRepeaterType = curriedGetFromRecord<
  OrgTimestampPart,
  "repeaterType"
>("repeaterType");
export const getRepeaterValue = curriedGetFromRecord<
  OrgTimestampPart,
  "repeaterValue"
>("repeaterValue");
export const getRepeaterUnit = curriedGetFromRecord<
  OrgTimestampPart,
  "repeaterUnit"
>("repeaterUnit");
export const getDelayType = curriedGetFromRecord<OrgTimestampPart, "delayType">(
  "delayType",
);
export const getDelayValue = curriedGetFromRecord<
  OrgTimestampPart,
  "delayValue"
>("delayValue");
export const getDelayUnit = curriedGetFromRecord<OrgTimestampPart, "delayUnit">(
  "delayUnit",
);
export const getRepeaterDeadlineValue = curriedGetFromRecord<
  OrgTimestampPart,
  "repeaterDeadlineValue"
>("repeaterDeadlineValue");
export const getRepeaterDeadlineUnit = curriedGetFromRecord<
  OrgTimestampPart,
  "repeaterDeadlineUnit"
>("repeaterDeadlineUnit");

// timestamp setters

// add data
export const addStartTime = curriedUpdateAllForRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  OrgTimestampPartKey
>([
  ["withStartTime", constant(true)],
  ["startHour", (_): string => getHourPartFromCurrentDate()],
  ["startMinute", (_): string => getMinutePartFromCurrentDate()],
]);

export const addEndTime = curriedUpdateAllForRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  OrgTimestampPartKey
>([
  ["endHour", (_): string => getHourPartFromCurrentDate()],
  ["endMinute", (_): string => getMinutePartFromCurrentDate()],
]);
export const addTime = (
  startOrEnd: StartOrEnd,
  timestamp: OrgTimestampPartRecord,
): OrgTimestampPartRecord => {
  return startOrEnd === "start"
    ? addStartTime(timestamp)
    : addEndTime(timestamp);
};

export const addDelay = curriedSetAllForRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  OrgTimestampPartKey
>([
  ["delayType", "-"],
  ["delayUnit", "d"],
  ["delayValue", "1"],
]);
export const addRepeater = curriedSetAllForRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  OrgTimestampPartKey
>([
  ["repeaterType", "+"],
  ["repeaterUnit", "d"],
  ["repeaterValue", "1"],
]);

// update data
const updateTime =
  <K extends OrgTimestampPartKey>([argOne, argTwo]: [K, K]) =>
  (
    timeString: string,
    timestamp: OrgTimestampPartRecord,
  ): OrgTimestampPartRecord => {
    const [hourPart, minutePart] = split(":", timeString);
    return setAllForRecord<
      OrgTimestampPart,
      OrgTimestampPartRecord,
      OrgTimestampPartKey
    >(
      [
        [argOne, hourPart],
        [argTwo, minutePart],
      ],
      timestamp,
    );
  };

export const startTimeChange = updateTime(["startHour", "startMinute"]);
export const endTimeChange = updateTime(["endHour", "endMinute"]);

export const timeChange = (
  startOrEnd: StartOrEnd,
  timestamp: OrgTimestampPartRecord,
  timeString: string,
): OrgTimestampPartRecord => {
  return startOrEnd === "start"
    ? startTimeChange(timeString, timestamp)
    : endTimeChange(timeString, timestamp);
};

export const repeaterTypeChange = curriedSetRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  "repeaterType"
>("repeaterType");
export const repeaterValueChange = curriedSetRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  "repeaterValue"
>("repeaterValue");
export const repeaterUnitChange = curriedSetRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  "repeaterUnit"
>("repeaterUnit");
export const delayTypeChange = curriedSetRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  "delayType"
>("delayType");
export const delayValueChange = curriedSetRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  "delayValue"
>("delayValue");
export const delayUnitChange = curriedSetRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  "delayUnit"
>("delayUnit");

export const activeToggle = curriedUpdateRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  "isActive"
>((isActive: boolean) => !isActive)("isActive");

// remove data
export const removeStartTime = curriedSetAllForRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  OrgTimestampPartKey
>([
  ["startHour", undefined],
  ["startMinute", undefined],
  ["withStartTime", false],
]);
export const removeEndTime = curriedSetAllForRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  OrgTimestampPartKey
>([
  ["endHour", undefined],
  ["endMinute", undefined],
]);
export const removeTime = (
  startOrEnd: StartOrEnd,
  timestamp: OrgTimestampPartRecord,
): OrgTimestampPartRecord => {
  return startOrEnd === "start"
    ? removeStartTime(timestamp)
    : removeEndTime(timestamp);
};

export const removeDelay = curriedSetAllForRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  OrgTimestampPartKey
>([
  ["delayType", undefined],
  ["delayUnit", undefined],
  ["delayValue", undefined],
]);
export const removeRepeater = curriedSetAllForRecord<
  OrgTimestampPart,
  OrgTimestampPartRecord,
  OrgTimestampPartKey
>([
  ["repeaterType", undefined],
  ["repeaterUnit", undefined],
  ["repeaterValue", undefined],
]);

// Repeaters

export const createNextRepeatTimestampPartObject = (
  timestampWithRepeater: OrgTimestampPart,
  nextRepeatDate: Date,
): OrgTimestampPart => {
  const [year, month, day, dayName, startHour, startMinute] =
    getTimestampPartsFromDate(nextRepeatDate);
  return merge(timestampWithRepeater, {
    year,
    month,
    day,
    dayName,
    startHour,
    startMinute,
  });
};

export const createNextRepeatTimestampPartRecord = (
  previousTimestamp: OrgTimestampPart,
  nextRepeatDate: Date,
): OrgTimestampPartRecord => {
  return makeOrgTimestampPartRecord(
    createNextRepeatTimestampPartObject(previousTimestamp, nextRepeatDate),
  );
};

export const getNextRepeatDate = (
  {
    repeaterType,
    repeaterValue,
    repeaterUnit,
  }: {
    repeaterType: RepeaterType;
    repeaterValue: number;
    repeaterUnit: RepeaterUnit;
  },
  timestampAsDate: Date,
  currentDate: Date,
): Date => {
  return match(repeaterType)
    .with(
      "+",
      (): Date =>
        addTimestampUnitToDate(repeaterUnit, repeaterValue, timestampAsDate),
    )
    .with("++", (): Date => {
      const newDate: Date = addTimestampUnitToDate(
        repeaterUnit,
        repeaterValue,
        timestampAsDate,
      );
      if (isBefore(currentDate, newDate) || datesEqual(currentDate, newDate)) {
        return getNextRepeatDate(
          { repeaterType, repeaterValue, repeaterUnit },
          newDate,
          currentDate,
        );
      }
      return newDate;
    })
    .with(".+", (): Date => {
      const newDate = addTimestampUnitToDate(
        repeaterUnit,
        repeaterValue,
        currentDate,
      );
      if (repeaterUnit == "h") {
        return newDate;
      }

      const [newHours, newMinutes] = flap(currentDate)([getHours, getMinutes]);
      return pipe(newDate, setHours(newHours), setMinutes(newMinutes));
    })
    .exhaustive();
};

const applyRepeaterReducer = (
  currTimestamp: OrgTimestampPartRecord,
  [key, value]: [OrgTimestampPartKey, OrgTimestampPart[OrgTimestampPartKey]],
): OrgTimestampPartRecord => {
  return setRecord<
    OrgTimestampPart,
    OrgTimestampPartRecord,
    OrgTimestampPartKey
  >(key, value, currTimestamp);
};

export const applyRepeater = (
  timestamp: OrgTimestampPartRecord,
  currentDate: Date,
): OrgTimestampPartRecord => {
  const [repeaterType, repeaterValueAsString, repeaterUnit] = flap(timestamp)([
    getRepeaterType,
    getRepeaterValue,
    getRepeaterUnit,
  ]);

  if (!repeaterType || !repeaterValueAsString || !repeaterUnit) {
    return timestamp;
  }

  const repeaterValue = parseInt(repeaterValueAsString);

  if (!isValidRepeaterType(repeaterType)) {
    console.error(`Unrecognized timestamp repeater type: ${repeaterType}`);
    return timestamp;
  }

  if (!isValidRepeaterUnit(repeaterUnit)) {
    console.error(`Unrecognized timestamp repeater unit: ${repeaterUnit}`);
    return timestamp;
  }

  const timestampAsDate = dateForTimestamp(timestamp);
  const nextRepeatDate = getNextRepeatDate(
    { repeaterType, repeaterValue, repeaterUnit },
    timestampAsDate,
    currentDate,
  );

  const timestampPartsFromDate =
    getTimestampPartsFromDateWithKeyNames(nextRepeatDate);
  return reduce(applyRepeaterReducer, timestamp, timestampPartsFromDate);
};

// Durations

export const dateDuration = (
  intervalStart: Date,
  intervalEnd: Date,
): string => {
  const [start, end] = sortBy(identity, [intervalStart, intervalEnd]);
  const hoursDiff: number = differenceInHours(start, end);
  const minDiff: number = differenceInMinutes(addHours(hoursDiff, start), end);
  const durationString = `${hoursDiff.toString()}:${padTimePart(minDiff.toString())}`;
  return intervalStart > intervalEnd ? `-${durationString}` : durationString;
};

export const dateDurationForClockString = pipe([
  dateDuration,
  padCharsStart(" ", 5),
]);

export const createTimestampDuration =
  (func: (intervalStart: Date, intervalEnd: Date) => string) =>
  (
    startTimestamp: OrgTimestampPartRecord,
    endTimestamp: OrgTimestampPartRecord,
  ): string => {
    let [start, end] = map(dateForTimestamp)([startTimestamp, endTimestamp]);
    return func(start, end);
  };

export const timestampDuration = createTimestampDuration(dateDuration);
export const timestampDurationForClockString = createTimestampDuration(
  dateDurationForClockString,
);

export const millisDuration = (millis: number | undefined): string => {
  if (millis === undefined) {
    return "";
  }
  return dateDuration(new Date(0), new Date(millis));
};
