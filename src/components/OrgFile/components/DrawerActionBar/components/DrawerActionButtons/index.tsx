import React, { PureComponent } from "react";
import classNames from "classnames";
import "./stylesheet.css";
import { getIcon } from "../../../../../UI/icons.tsx";

export default class DrawerActionButtons extends PureComponent {
  // A nasty hack required to get click handling to work properly in Firefox. No idea why its
  // broken in the first place or why this fixes it.
  iconWithFFClickCatcher({
    iconName,
    className,
    onClick,
    title,
    disabled,
    testId = "",
  }) {
    const buttonClass = classNames(
      "header-action-drawer__ff-click-catcher-container",
      className,
    );
    return (
      <button
        title={title}
        onClick={!disabled ? onClick : undefined}
        data-testid={testId}
        className={buttonClass}
      >
        {getIcon(iconName)}
      </button>
    );
  }

  render() {
    const {
      onSwitch,
      onTitleClick,
      onDescriptionClick,
      onTagsClick,
      onPropertiesClick,
      onDeadlineClick,
      onScheduledClick,
      onAddNote,
      onRemoveHeader,
      activePopupType,
      editRawValues,
      setEditRawValues,
      restorePreferEditRawValues,
    } = this.props;

    return (
      <div className="header-action-drawer-container">
        <div className="header-action-drawer__row">
          {this.iconWithFFClickCatcher({
            iconName: "pencil",
            className:
              "title-editor" === activePopupType
                ? " drawer-action-button--selected"
                : "",
            onClick: () => {
              if ("title-editor" === activePopupType) {
                onSwitch();
                setEditRawValues(!editRawValues);
              } else {
                restorePreferEditRawValues();
              }
              onTitleClick();
            },
            title: "Edit title",
          })}

          {this.iconWithFFClickCatcher({
            iconName: "edit",
            className:
              "description-editor" === activePopupType
                ? " drawer-action-button--selected"
                : "",
            onClick: () => {
              if ("description-editor" === activePopupType) {
                onSwitch();
                setEditRawValues(!editRawValues);
              } else {
                restorePreferEditRawValues();
              }
              onDescriptionClick();
            },
            title: "Edit description",
            testId: "edit-header-title",
          })}

          {this.iconWithFFClickCatcher({
            iconName: "tags",
            className:
              "tags-editor" === activePopupType
                ? " drawer-action-button--selected"
                : "",
            onClick: onTagsClick,
            title: "Modify tags",
            disabled: "tags-editor" === activePopupType,
          })}

          {this.iconWithFFClickCatcher({
            iconName: "list",
            className:
              "property-list-editor" === activePopupType
                ? " drawer-action-button--selected"
                : "",
            onClick: onPropertiesClick,
            title: "Modify properties",
            disabled: "property-list-editor" === activePopupType,
          })}

          {this.iconWithFFClickCatcher({
            iconName: "calendar-check",
            className:
              "deadline-editor" === activePopupType
                ? " drawer-action-button--selected"
                : "",
            onClick: onDeadlineClick,
            title: "Set deadline datetime",
            disabled: "deadline-editor" === activePopupType,
          })}
          {this.iconWithFFClickCatcher({
            iconName: "calendar-times",
            className:
              "scheduled-editor" === activePopupType
                ? " drawer-action-button--selected"
                : "",
            onClick: onScheduledClick,
            title: "Set scheduled datetime",
            disabled: "scheduled-editor" === activePopupType,
          })}

          {this.iconWithFFClickCatcher({
            iconName: "sticky-note",
            className:
              "note-editor" === activePopupType
                ? " drawer-action-button--selected"
                : "",
            onClick: onAddNote,
            title: "Add a note",
            disabled: "note-editor" === activePopupType,
          })}

          {this.iconWithFFClickCatcher({
            iconName: "trash",
            className:
              "note-editor" === activePopupType
                ? " drawer-action-button--selected"
                : "",
            onClick: onRemoveHeader,
            title: "Delete this header",
            disabled: "note-editor" === activePopupType,
          })}
        </div>
      </div>
    );
  }
}
