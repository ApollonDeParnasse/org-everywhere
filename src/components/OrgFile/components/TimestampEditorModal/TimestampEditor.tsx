import { format, parseISO } from "date-fns";
import { Map } from "immutable";
import { match, P } from "ts-pattern";
import { isEmpty, isNumber, every, isString } from "lodash/fp";
import React, { type ChangeEvent, type MouseEvent, Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as baseActions from "../../../../actions/base";
import * as orgActions from "../../../../actions/org";
import { getSelectedHeader } from "../../../../lib/org_utils";
import { renderAsText } from "../../../../lib/timestamps";
import type {
  OrgFileRecord,
  OrgTimestampPartRecord,
  PlanningType,
  PopupRecord,
  RepeaterType,
  DelayType,
  DelayUnit,
  StartOrEnd,
  RepeaterUnit,
  PopupType,
} from "../../../../Types";
import { getIcon } from "../../../UI/icons";
import Switch from "../../../UI/Switch/";
import TabButtons from "../../../UI/TabButtons/";
import "./stylesheet.css";
import {
  REPEATERUNITS,
  WITHOUTSTARTIMEREPEATERUNITS,
  REPEATERTYPES,
  DELAYUNITS,
  DELAYTYPES,
  WITHOUTSTARTIMEDELAYUNITS,
} from "../../../../lib/Constants";
import {
  activeToggle,
  addTime,
  removeTime,
  timeChange,
  addRepeater,
  removeRepeater,
  repeaterTypeChange,
  repeaterValueChange,
  repeaterUnitChange,
  addDelay,
  removeDelay,
  delayTypeChange,
  delayValueChange,
  delayUnitChange,
  padTimePart,
  getDelayType,
  getDelayUnit,
  getDelayValue,
  getRepeaterUnit,
  getRepeaterType,
  getRepeaterValue,
  getWithStartTime,
  getIsActive,
  getYear,
  getMonth,
  getDay,
  getStartHour,
  getStartMinute,
  getEndHour,
  getEndMinute,
} from "../../../../lib/timestamps";

interface TimestampEditorProps {
  headerId: number;
  timestamp: OrgTimestampPartRecord;
  timestampId: number;
  planningItemIndex: number;
  onClose: Function;
  onChange: Function;
}

const CHANGESTARTTIMEKEYS: Array<string> = [
  "add-start-time",
  "change-start-time",
  "remove-start-time",
];
const CHANGEENDTIMEKEYS: Array<string> = [
  "add-end-time",
  "change-end-time",
  "remove-end-time",
];

const getTestIds = (
  startOrEnd: StartOrEnd,
  changeStartTimekeys = CHANGESTARTTIMEKEYS,
  changeEndTimeKeys = CHANGEENDTIMEKEYS,
): Array<string> => {
  return startOrEnd === "start" ? changeStartTimekeys : changeEndTimeKeys;
};

const getEnabledButtons =
  (
    withStartTimeUnits: Array<RepeaterUnit> | Array<RepeaterUnit>,
    withoutStartTimeUnits: Array<RepeaterUnit> | Array<RepeaterUnit>,
  ) =>
  (
    timestamp: OrgTimestampPartRecord,
  ): [Array<RepeaterUnit | DelayUnit>, Array<string>] => {
    if (getWithStartTime(timestamp)) {
      return [
        withStartTimeUnits,
        ["hours", "days", "weeks", "months", "years"],
      ];
    }
    return [withoutStartTimeUnits, ["days", "weeks", "months", "years"]];
  };

const getEnabledButtonsForRepeaters = getEnabledButtons(
  REPEATERUNITS,
  WITHOUTSTARTIMEREPEATERUNITS,
);
const getEnabledButtonsForDelayUnits = getEnabledButtons(
  DELAYUNITS,
  WITHOUTSTARTIMEDELAYUNITS,
);

const getPlanningType = (activePopupType: PopupType): PlanningType => {
  return match(activePopupType)
    .with("deadline-editor", (): PlanningType => "DEADLINE")
    .with("scheduled-editor", (): PlanningType => "SCHEDULED")
    .with(P._, (): PlanningType => "SCHEDULED")
    .run();
};

const TimestampEditor = (props: TimestampEditorProps) => {
  const {
    onChange,
    timestamp,
    headerId,
    activePopupType,
    onClose,
    selectedHeaderId,
    header,
    timestampId,
    planningItemIndex,
  } = props;

  const handleActiveToggle = (_: MouseEvent): void => {
    onChange(activeToggle(timestamp));
  };

  // not worth changing until we use hooks
  const handleDateChange = (
    event: ChangeEvent<HTMLInputElement, HTMLInputElement>,
    planningItemIndex: number,
    timestampId: number,
  ): void => {
    if (isEmpty(event.target.value)) {
      // It's a planning item and the parser knows which one.
      if (isNumber(planningItemIndex)) {
        props.org.removePlanningItem(headerId, planningItemIndex);
      } else if (isNumber(timestampId)) {
        props.org.removeTimestamp(headerId, timestampId);
      }
      if (
        activePopupType !== "scheduled-editor" &&
        activePopupType !== "deadline-editor"
      ) {
        // for scheduled timestamp and deadline the modal can be open when no timestamp exists
        onClose();
      }
    } else {
      const [newYear, newMonth, newDay, newDayName] = format(
        parseISO(event.target.value),
        "yyyy MM dd eee",
      ).split(" ");
      onChange(
        timestamp
          .set("year", newYear)
          .set("month", newMonth)
          .set("day", newDay)
          .set("dayName", newDayName),
      );
    }
  };
  const handleAddTime = (startOrEnd: StartOrEnd) => {
    return (_: MouseEvent): void => {
      onChange(addTime(startOrEnd, timestamp));
    };
  };
  const handleRemoveTime = (startOrEnd: StartOrEnd) => {
    return (_: MouseEvent): void => {
      onChange(removeTime(startOrEnd, timestamp));
    };
  };
  const handleTimeChange = (startOrEnd: StartOrEnd) => {
    return (event: ChangeEvent<HTMLInputElement>): void => {
      onChange(timeChange(startOrEnd, timestamp, event.target.value));
    };
  };
  const handleAddRepeater = (_: MouseEvent): void => {
    onChange(addRepeater(timestamp));
  };
  const handleRemoveRepeater = (_: MouseEvent): void => {
    onChange(removeRepeater(timestamp));
  };
  const handleRepeaterTypeChange = (newRepeaterType: RepeaterType): void => {
    onChange(repeaterTypeChange(newRepeaterType)(timestamp));
  };
  const handleRepeaterValueChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    onChange(repeaterValueChange(event.target.value)(timestamp));
  };
  const handleRepeaterUnitChange = (newRepeaterUnit: RepeaterUnit): void => {
    onChange(repeaterUnitChange(newRepeaterUnit)(timestamp));
  };
  const handleAddDelay = (_: MouseEvent): void => {
    onChange(addDelay(timestamp));
  };
  const handleRemoveDelay = (_: MouseEvent): void => {
    onChange(removeDelay(timestamp));
  };
  const handleDelayTypeChange = (newDelayType: DelayType): void => {
    onChange(delayTypeChange(newDelayType)(timestamp));
  };
  const handleDelayValueChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    onChange(delayValueChange(event.target.value)(timestamp));
  };
  const handleDelayUnitChange = (newDelayUnit: DelayUnit): void => {
    onChange(delayUnitChange(newDelayUnit)(timestamp));
  };

  const renderTimeField = (
    label: string,
    timeKey: StartOrEnd,
    withTime: boolean,
    hour: string | undefined,
    minute: string | undefined,
    showRemoveButton: boolean,
  ) => {
    const [addTimeID, changeTimeID, removeTimeID] = getTestIds(timeKey);
    return (
      <div className="timestamp-editor__field-container timestamp-editor__field-container--inline">
        <div className="timestamp-editor__field-title">{label}</div>
        <div className="timestamp-editor__field">
          {withTime ? (
            <Fragment>
              <input
                type="time"
                className="timestamp-editor__time-input"
                data-testid={changeTimeID}
                value={`${padTimePart(hour ?? "0")}:${padTimePart(minute ?? "0")}`}
                onChange={handleTimeChange(timeKey)}
              />
              {showRemoveButton && (
                <div
                  className="timestamp-editor__icon timestamp-editor__icon--remove"
                  data-testid={removeTimeID}
                  onClick={handleRemoveTime(timeKey)}
                >
                  {getIcon("times")}
                </div>
              )}
            </Fragment>
          ) : (
            <div
              className="timestamp-editor__icon timestamp-editor__icon--add"
              data-testid={addTimeID}
              onClick={handleAddTime(timeKey)}
            >
              {getIcon("plus")}
            </div>
          )}
        </div>
      </div>
    );
  };
  const renderRepeater = () => {
    const [repeaterType, repeaterValue, repeaterUnit] = [
      getRepeaterType(timestamp),
      getRepeaterValue(timestamp),
      getRepeaterUnit(timestamp),
    ];
    const [buttons, titles] = getEnabledButtonsForRepeaters(timestamp);

    return (
      <div className="timestamp-editor__field-container">
        <div className="timestamp-editor__field-title">Repeater</div>
        <div className="timestamp-editor__field timestamp-editor__field--delay-repeater">
          {!!repeaterType ? (
            <Fragment>
              <div
                className="timestamp-editor__delay-repeater-type"
                data-testid="change-repeater-type"
              >
                <TabButtons
                  buttons={REPEATERTYPES}
                  titles={[
                    "Shift exactly the amount of time in the repeater (i.e. one month for +1m).",
                    "Shift the date by as many intervals of the amount of time in the repeater (i.e. one or many months for for ++1m) as it takes to get this date into the future.",
                    "Shift the date exactly the amount of time of the repeater relative to the time of the state change.",
                  ]}
                  selectedButton={repeaterType || "+"}
                  onSelect={handleRepeaterTypeChange}
                />
              </div>
              <input
                type="number"
                min="1"
                className="textfield delay-repeater-value-input"
                data-testid="change-repeater-value"
                value={repeaterValue || 1}
                onChange={handleRepeaterValueChange}
              />
              <div data-testid="change-repeater-unit">
                <TabButtons
                  buttons={buttons}
                  titles={titles}
                  selectedButton={repeaterUnit || "d"}
                  onSelect={handleRepeaterUnitChange}
                />
              </div>
              <div
                className="timestamp-editor__icon timestamp-editor__icon--remove"
                data-testid="remove-repeater"
                onClick={handleRemoveRepeater}
              >
                {getIcon("times")}
              </div>
            </Fragment>
          ) : (
            <div
              className="timestamp-editor__icon timestamp-editor__icon--add"
              data-testid="add-repeater"
              onClick={handleAddRepeater}
            >
              {getIcon("plus")}
            </div>
          )}
        </div>
      </div>
    );
  };
  const renderDelay = () => {
    const [delayType, delayValue, delayUnit] = [
      getDelayType(timestamp),
      getDelayValue(timestamp),
      getDelayUnit(timestamp),
    ];

    const [buttons, titles] = getEnabledButtonsForDelayUnits(timestamp);

    return (
      <div className="timestamp-editor__field-container">
        <div className="timestamp-editor__field-title">Delay</div>
        <div className="timestamp-editor__field">
          {!!delayType ? (
            <Fragment>
              <div
                className="timestamp-editor__delay-repeater-type"
                data-testid="change-delay-type"
              >
                <TabButtons
                  buttons={DELAYTYPES}
                  titles={[
                    "Set a different lead time before the entry is put into the agenda.",
                    "In case the task contains a repeater, the delay is considered to affect all occurrences; if you want the delay to only affect the first scheduled occurrence of the task, use '--' instead.",
                  ]}
                  selectedButton={delayType || "-"}
                  onSelect={handleDelayTypeChange}
                />
              </div>
              <input
                type="number"
                min="1"
                className="textfield delay-repeater-value-input"
                data-testid="change-delay-value"
                value={delayValue || 1}
                onChange={handleDelayValueChange}
              />
              <div data-testid="change-delay-unit">
                <TabButtons
                  buttons={buttons}
                  titles={titles}
                  selectedButton={delayUnit || "d"}
                  onSelect={handleDelayUnitChange}
                />
              </div>
              <div
                className="timestamp-editor__icon timestamp-editor__icon--remove"
                data-testid="remove-delay"
                onClick={handleRemoveDelay}
              >
                {getIcon("times")}
              </div>
            </Fragment>
          ) : (
            <div
              className="timestamp-editor__icon timestamp-editor__icon--add"
              data-testid="add-delay"
              onClick={handleAddDelay}
            >
              {getIcon("plus")}
            </div>
          )}
        </div>
      </div>
    );
  };
  const createPlanningItem = (): void => {
    const planningType = getPlanningType(activePopupType);
    props.org.addNewPlanningItem(selectedHeaderId, planningType);
    props.base.activatePopup(activePopupType, {
      headerId: selectedHeaderId,
      planningItemIndex: header.get("planningItems").size,
    });
  };
  if (!timestamp) {
    // for scheduled timestamp and deadline the modal can be opened when no timestamp exists
    return (
      <>
        <div className="timestamp-editor__field-title">Add Timestamp</div>
        <div className="timestamp-editor__field" onClick={createPlanningItem}>
          <div className="fas fa-plus timestamp-editor__icon timestamp-editor__icon--add"></div>
          {getIcon("plus")}
        </div>
      </>
    );
  }

  // it would be better to fetch each value individually

  const [
    isActive,
    year,
    month,
    day,
    withStartTime,
    startHour,
    startMinute,
    endHour,
    endMinute,
  ] = [
    getIsActive(timestamp),
    getYear(timestamp),
    getMonth(timestamp),
    getDay(timestamp),
    getWithStartTime(timestamp),
    getStartHour(timestamp),
    getStartMinute(timestamp),
    getEndHour(timestamp),
    getEndMinute(timestamp),
  ];

  const withEndTime = every(isString)([endHour, endMinute]);

  return (
    <div>
      <div className="timestamp-editor__render">{renderAsText(timestamp)}</div>

      <div className="timestamp-editor__date-time-fields-container">
        <div className="timestamp-editor__field-container timestamp-editor__field-container--inline">
          <div className="timestamp-editor__field-title">Active</div>
          <div className="timestamp-editor__field">
            <Switch
              isEnabled={isActive ?? false}
              onToggle={handleActiveToggle}
              testId={"active-switch"}
            />
          </div>
        </div>

        <div className="timestamp-editor__field-container timestamp-editor__field-container--inline">
          <div className="timestamp-editor__field-title">Date</div>
          <div className="timestamp-editor__field">
            <input
              data-testid="change-date"
              type="date"
              className="timestamp-editor__date-input"
              onChange={(
                event: ChangeEvent<HTMLInputElement, HTMLInputElement>,
              ): void =>
                handleDateChange(event, planningItemIndex, timestampId)
              }
              // Needed for iOS due to React bug
              // https://github.com/facebook/react/issues/8938#issuecomment-519074141
              onFocus={(event: FocusEvent): string =>
                (event.nativeEvent.target.defaultValue = "")
              }
              value={`${year}-${month}-${day}`}
            />
          </div>
        </div>

        {renderTimeField(
          "Start time",
          "start",
          withStartTime ?? false,
          startHour,
          startMinute,
          !endHour,
        )}
        {withStartTime &&
          renderTimeField(
            "End time",
            "end",
            withEndTime,
            endHour,
            endMinute,
            withEndTime,
          )}
      </div>

      {renderRepeater()}
      {renderDelay()}
    </div>
  );
};

const mapStateToProps = (state) => {
  const path: string = state.org.present.get("path");
  const file: OrgFileRecord = state.org.present.getIn(["files", path], Map());
  const activePopup: PopupRecord = state.base.get("activePopup");
  return {
    selectedHeaderId: file.get("selectedHeaderId"),
    header: getSelectedHeader(state),
    activePopupType: !!activePopup ? activePopup.get("type") : undefined,
    activePopupData: !!activePopup ? activePopup.get("data") : undefined,
  };
};
const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
  base: bindActionCreators(baseActions, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(TimestampEditor);
