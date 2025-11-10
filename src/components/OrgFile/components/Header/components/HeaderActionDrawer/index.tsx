import React, { PureComponent, type MouseEventHandler } from "react";
import { IconContext } from "react-icons"
import { getIcon } from "../../../../../UI/icons.tsx";
import "./stylesheet.css";

// broken in the first place or why this fixes it.
const iconWithFFClickCatcher = ({
  iconName,
  onClick,
  title,
  testId = "",
}: {iconName: string, onClick: MouseEventHandler<HTMLButtonElement>, title: string, testId?: string}) => {
    
  return (
    <button
      title={title}
      onClick={onClick}
      className="header-action-drawer__ff-click-catcher-container"
      data-testid={testId}
    >
      <IconContext.Provider value={{className: "fas fa-lg"}}>
	<div>
	  {getIcon(iconName)}
	</div>
      </IconContext.Provider>
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
  onRefileHeader,
  onAddNote,
  onDuplicateHeader,
}) => {

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
          testId: "header-action-plus",
          title:
            "Create new header below (long-press to duplicate current header)",
        })}
      </div>

      <div className="header-action-drawer__row">
        {iconWithFFClickCatcher({
          iconName: "duplicate",
          onClick: onDuplicateHeader,
          testId: "duplicate-header",
          title: "Duplicate this header",
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
              iconName: "hourglass-start",
              onClick: onClockInOutClick,
              testId: "org-clock-out",
              title: "Clock out (Stop the clock)",
            })
          : iconWithFFClickCatcher({
              iconName: "hourglass-end",
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
