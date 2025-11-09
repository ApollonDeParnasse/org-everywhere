import React, { useState } from "react";
import { UnmountClosed as Collapse } from "react-collapse";

import { Draggable } from "react-beautiful-dnd";
import { IconContext } from "react-icons";
import { mapIndexed } from "futil-js";
import {
  FaSync,
  FaBookmark,
  FaCalendar,
  FaSearch,
  FaTasks,
  FaFileExport,
  FaBars,
  FaCaretRight,
} from "react-icons/fa";

import "./stylesheet.css";

import Switch from "../../../UI/Switch";

import classNames from "classnames";

const SETTINGSICONSMAPPING = [
  ["defaultOnStartup", ["default-on-startup-icon", <FaBookmark />]],
  ["loadOnStartup", ["load-on-startup-icon", <FaSync />]],
  ["includeInAgenda", ["", <FaCalendar />]],
  ["includeInSearch", ["", <FaSearch />]],
  ["includeInTasklist", ["", <FaTasks />]],
  ["includeInRefile", ["", <FaFileExport />]],
];

const SettingsIcon = ({ settings }) => {
  return mapIndexed(([setting, [className, icon]], key: number) => {
    const iconClassName = classNames("fas fa-lg file-setting-icon", className);
    return (
      (settings.get(setting) && (
        <div key={key}>
          <IconContext.Provider value={{ className: iconClassName }}>
            <div>{icon}</div>
          </IconContext.Provider>
        </div>
      )) ||
      ""
    );
  })(SETTINGSICONSMAPPING);
};

const FileSettings = ({
  settings,
  index,
  onFieldPathUpdate,
  onDeleteSettings,
  loadedFilepaths,
  path,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const handleHeaderBarClick = () => setIsCollapsed(!isCollapsed);

  const updateField = (fieldName) => (event) =>
    onFieldPathUpdate(settings.get("id"), [fieldName], event.target.value);

  const toggleDefaultOnStartup = () =>
    onFieldPathUpdate(
      settings.get("id"),
      ["defaultOnStartup"],
      !settings.get("defaultOnStartup"),
    );

  const toggleLoadOnStartup = () =>
    onFieldPathUpdate(
      settings.get("id"),
      ["loadOnStartup"],
      !settings.get("loadOnStartup"),
    );

  const toggleIncludeInAgenda = () =>
    onFieldPathUpdate(
      settings.get("id"),
      ["includeInAgenda"],
      !settings.get("includeInAgenda"),
    );

  const toggleIncludeInSearch = () =>
    onFieldPathUpdate(
      settings.get("id"),
      ["includeInSearch"],
      !settings.get("includeInSearch"),
    );

  const toggleIncludeInTasklist = () =>
    onFieldPathUpdate(
      settings.get("id"),
      ["includeInTasklist"],
      !settings.get("includeInTasklist"),
    );

  const toggleIncludeInRefile = () =>
    onFieldPathUpdate(
      settings.get("id"),
      ["includeInRefile"],
      !settings.get("includeInRefile"),
    );

  const handleDeleteClick = () => {
    if (
      window.confirm(
        `Are you sure you want to delete the settingss for "${settings.get("path")}"?`,
      )
    ) {
      onDeleteSettings(settings.get("id"));
    }
  };

  const renderPathField = (settings) => {
    if (settings.get("path") === "") {
      updateField("path")({ target: { value: path || loadedFilepaths[0] } });
    }
    return (
      <div className="file-settings__field-container">
        <div className="file-settings__field">
          <div>Path: </div>
          <select onChange={updateField("path")} style={{ width: "90%" }}>
            {[settings.get("path"), ...loadedFilepaths].map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const renderOptionFields = (settings) => (
    <>
      <div className="file-settings__field-container">
        <div className="file-settings__field">
          <div>Is default file to load on startup?</div>
          <Switch
            isEnabled={settings.get("defaultOnStartup")}
            onToggle={toggleDefaultOnStartup}
          />
        </div>

        <div className="file-settings__help-text">
          By default, when you start org-everywhere, it will display your root
          file directory. If you prefer to display a specific Org file instead,
          enable this option. <br /> Note: There can only be one default file,
          of course. If you enable this option for multiple files,
          org-everywhere will pick the first one.
        </div>
      </div>
      <div className="file-settings__field-container">
        <div className="file-settings__field">
          <div>Sync on startup?</div>
          <Switch
            isEnabled={settings.get("loadOnStartup")}
            onToggle={toggleLoadOnStartup}
          />
        </div>

        <div className="file-settings__help-text">
          By default, files are loaded from localStorage when available and are
          only synced when visited or when a sync is manually triggered. Enable
          this settings to always sync this file when opening org-everywhere.
        </div>
      </div>

      <div className="file-settings__field-container">
        <div className="file-settings__field">
          <div>Include in Agenda?</div>
          <Switch
            isEnabled={settings.get("includeInAgenda")}
            onToggle={toggleIncludeInAgenda}
          />
        </div>

        <div className="file-settings__help-text">
          By default, only the currently opened file is included in the agenda.
          Enable this settings to always include this file. The currently viewed
          file is always included.
        </div>
      </div>

      <div className="file-settings__field-container">
        <div className="file-settings__field">
          <div>Include in Search?</div>
          <Switch
            isEnabled={settings.get("includeInSearch")}
            onToggle={toggleIncludeInSearch}
          />
        </div>

        <div className="file-settings__help-text">
          By default, only the current viewed file is included in search. Enable
          this settings to always include this file. The currently loaded file
          is always included.
        </div>
      </div>

      <div className="file-settings__field-container">
        <div className="file-settings__field">
          <div>Include in Tasklist?</div>
          <Switch
            isEnabled={settings.get("includeInTasklist")}
            onToggle={toggleIncludeInTasklist}
          />
        </div>

        <div className="file-settings__help-text">
          By default, only the current viewed file is included in the tasklist.
          Enable this settings to always include this file. The currently loaded
          file is always included.
        </div>
      </div>

      <div className="file-settings__field-container">
        <div className="file-settings__field">
          <div>Include in Refile?</div>
          <Switch
            isEnabled={settings.get("includeInRefile")}
            onToggle={toggleIncludeInRefile}
          />
        </div>

        <div className="file-settings__help-text">
          By default, only the currently viewed file is available as a refile
          targets. Enable this settings to always include this file. The
          currently loaded file is always included.
        </div>
      </div>
    </>
  );

  const renderDeleteButton = () => (
    <div className="file-settings__field-container file-settings__delete-button-container">
      <button
        className="btn settingss-btn file-settings__delete-button"
        onClick={handleDeleteClick}
      >
        Delete settings
      </button>
    </div>
  );

  const caretClassName = classNames(
    "fas fa-2x file-setting-container__header__caret",
    {
      "file-setting-container__header__caret--rotated": !isCollapsed,
    },
  );

  return (
    <Draggable
      draggableId={`file-settings--${settings.get("path")}`}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          className={classNames("file-settings-container", {
            "file-settings-container--dragging": snapshot.isDragging,
          })}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div
            className="file-settings-container__header"
            onClick={handleHeaderBarClick}
          >
            <IconContext.Provider value={{ className: caretClassName }}>
              <div>
                <FaCaretRight />
              </div>
            </IconContext.Provider>

            <div className="file-settings-icons">
              <SettingsIcon settings={settings} />
            </div>

            <span className="file_settings-container__header__title">
              {settings.get("path")}
            </span>

            <IconContext.Provider
              value={{
                className:
                  "fas fa-lg file-setting-container__header__drag-handle",
              }}
            >
              <div {...provided.dragHandleProps}>
                <FaBars />
              </div>
            </IconContext.Provider>
          </div>

          <Collapse isOpened={!isCollapsed} springConfig={{ stiffness: 300 }}>
            <div className="file-settings-container__content">
              {renderPathField(settings)}
              {renderOptionFields(settings)}
              {renderDeleteButton()}
            </div>
          </Collapse>
        </div>
      )}
    </Draggable>
  );
};

export default FileSettings;
