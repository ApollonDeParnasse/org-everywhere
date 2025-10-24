import React, { PureComponent } from "react";
import { getIcon } from "../../../../../UI/icons.tsx";
import "./stylesheet.css";

// broken in the first place or why this fixes it.
const iconWithFFClickCatcher = ({
  iconName,
  onClick,
  onLongPress,
  title,
  testId = "",
}) => {
  let isLongPressing = false;
  let longPressTimer = null;

  const handleMouseDown = onLongPress
    ? (e) => {
        isLongPressing = false;
        // Store reference to the target element to avoid React event pooling issues
        const targetElement = e.currentTarget;
        // Add visual feedback class immediately for better UX
        targetElement.classList.add(
          "header-action-drawer__long-press-feedback",
        );
        longPressTimer = setTimeout(() => {
          isLongPressing = true;
          onLongPress(e);
          // Add success feedback class
          targetElement.classList.add(
            "header-action-drawer__long-press-success",
          );
        }, 600);
      }
    : undefined;

  const handleMouseUp = onLongPress
    ? (e) => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        // Remove visual feedback classes
        e.currentTarget.classList.remove(
          "header-action-drawer__long-press-feedback",
        );
        e.currentTarget.classList.remove(
          "header-action-drawer__long-press-success",
        );
      }
    : undefined;

  const handleMouseLeave = onLongPress
    ? (e) => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        // Remove visual feedback classes
        e.currentTarget.classList.remove(
          "header-action-drawer__long-press-feedback",
        );
        e.currentTarget.classList.remove(
          "header-action-drawer__long-press-success",
        );
      }
    : undefined;

  const handleClick = onClick
    ? (e) => {
        // Only trigger regular click if it wasn't a long press
        if (!isLongPressing) {
          onClick(e);
        }
        isLongPressing = false;
      }
    : undefined;

  return (
    <button
      title={title}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseLeave}
      className="header-action-drawer__ff-click-catcher-container"
    >
      {getIcon(iconName)}
    </button>
  );
};

const HeaderActionDrawer = ({
  onTitleClick,
  onDescriptionClick,
  onTagsClick,
  onPropertiesClick,
  isNarrowed,
  onNarrow,
  onWiden,
  onAddNewHeader,
  onDeadlineClick,
  onClockInOutClick,
  onScheduledClick,
  hasActiveClock,
  onShareHeader,
  onRefileHeader,
  onAddNote,
  onDuplicateHeader,
}) => {
  // A nasty hack required to get click handling to work properly in Firefox. No idea why it
  // Create a fallback function for onDuplicateHeader if not provided
  const handleDuplicateHeader =
    onDuplicateHeader ||
    ((e) => {
      // As a fallback, just call the regular add new header function
      if (onAddNewHeader) {
        onAddNewHeader(e);
      }
    });

  return (
    <div className="header-action-drawer-container">
      <div className="header-action-drawer__row">
        {iconWithFFClickCatcher({
          iconName: "pencil",
          onClick: onTitleClick,
          title: "Edit header title",
        })}

        {iconWithFFClickCatcher({
          iconName: "edit",
          onClick: onDescriptionClick,
          title: "Edit header description",
          testId: "edit-header-title",
        })}

        {iconWithFFClickCatcher({
          iconName: "tags",
          onClick: onTagsClick,
          title: "Modify tags",
        })}

        {iconWithFFClickCatcher({
          iconName: "list",
          onClick: onPropertiesClick,
          title: "Modify properties",
        })}

        {isNarrowed
          ? iconWithFFClickCatcher({
              iconName: "expand",
              onClick: onWiden,
              title: "Widen (Cancelling the narrowing.)",
            })
          : iconWithFFClickCatcher({
              iconName: "compress",
              onClick: onNarrow,
              testId: "header-action-narrow",
              title:
                "Narrow to subtree (focusing in on some portion of the buffer, making the rest temporarily inaccessible.)",
            })}

        {iconWithFFClickCatcher({
          iconName: "plus",
          onClick: onAddNewHeader,
          onLongPress: handleDuplicateHeader,
          testId: "header-action-plus",
          title:
            "Create new header below (long-press to duplicate current header)",
        })}
      </div>

      <div className="header-action-drawer__row">
        {iconWithFFClickCatcher({
          iconName: "share",
          onClick: onShareHeader,
          testId: "share",
          title: "Share this header via email",
        })}
        {iconWithFFClickCatcher({
          iconName: "calendar-check",
          onClick: onDeadlineClick,
          title: "Set deadline datetime",
        })}
        {iconWithFFClickCatcher({
          iconName: "calendar-check",
          onClick: onScheduledClick,
          title: "Set scheduled datetime",
        })}
        {hasActiveClock
          ? iconWithFFClickCatcher({
              iconName: "hourglass-end",
              onClick: onClockInOutClick,
              testId: "org-clock-out",
              title: "Clock out (Stop the clock)",
            })
          : iconWithFFClickCatcher({
              iconName: "hourglass-start",
              onClick: onClockInOutClick,
              testId: "org-clock-in",
              title: "Clock in (Start the clock)",
            })}

        {iconWithFFClickCatcher({
          iconName: "file-export",
          onClick: onRefileHeader,
          testId: "org-refile",
          title: "Refile this header to another header",
        })}
        {iconWithFFClickCatcher({
          iconName: "sticky-note",
          onClick: onAddNote,
          title: "Add a note",
        })}
      </div>
    </div>
  );
};

export default HeaderActionDrawer;
