import React from "react";
import { Motion, spring } from "react-motion";
import { getIcon } from "../icons.tsx";
import {
  interpolateColorsAndReturnCSS,
  createColorObject,
} from "../../../lib/color";

import "./stylesheet.css";

export default ({ state, onClick }) => {
  const uncheckedColor = createColorObject(255, 255, 255, 1);
  const checkedColor = createColorObject(238, 232, 213, 1);

  const checkboxStyle = {
    colorFactor: spring(
      {
        checked: 1,
        partial: 1,
        unchecked: 0,
      }[state],
      { stiffness: 300 },
    ),
  };

  return (
    <Motion style={checkboxStyle}>
      {(style) => {
        const backgroundColor = interpolateColorsAndReturnCSS(
          uncheckedColor,
          checkedColor,
          style.colorFactor,
        );

        return (
          <div
            className="checkbox"
            onClick={onClick}
            style={{ backgroundColor }}
          >
            <div className="checkbox__inner-container">
              {state === "checked" && getIcon("check")}
              {state === "partial" && getIcon("minus")}
              {state === "unchecked" && getIcon("square")}
            </div>
          </div>
        );
      }}
    </Motion>
  );
};
