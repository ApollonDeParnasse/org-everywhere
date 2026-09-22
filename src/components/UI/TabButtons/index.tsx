import React from "react";
import type { CSSProperties, JSX } from "react";
import { map } from "lodash/fp";
import "./stylesheet.css";
import classNames from "classnames";

export interface TabButtonProps<A extends string, B extends string> {
  buttons: Array<A>;
  titles: Array<string>;
  values?: Array<B>;
  selectedButton: A;
  useEqualWidthTabs?: boolean;
  onSelect: (buttonName: A | B) => void;
}

export interface ButtonProps<A extends string, B extends string> {
  buttonName: A;
  index: number;
  title: string;
  value: A | B;
  className: string;
  handleButtonClick: (buttonName: A | B) => () => void;
}

function ButtonCreator<A extends string, B extends string>({
  buttonName,
  index,
  title,
  value,
  className,
  handleButtonClick,
}: ButtonProps<A, B>): JSX.Element {
  return (
    <div
      key={buttonName + index}
      title={title}
      className={className}
      onClick={handleButtonClick(value)}
    >
      {buttonName}
    </div>
  );
}

export default function TabButton<A extends string, B extends string>({
  buttons,
  titles,
  values,
  selectedButton,
  useEqualWidthTabs,
  onSelect,
}: TabButtonProps<A, B>) {
  const handleButtonClick = (buttonName: A | B) => () => onSelect(buttonName);

  const containerClassName = classNames("tab-buttons", {
    "tab-buttons--equal-width-tabs": useEqualWidthTabs,
  });

  const style: CSSProperties = {
    gridTemplateColumns: useEqualWidthTabs
      ? `repeat(${buttons.length}, 1fr)`
      : undefined,
  };

  const buttonMapper = (buttonName: A, index: number): JSX.Element => {
    const value = values ? values[index] : buttonName;
    const className = classNames("tab-buttons__btn", {
      "tab-buttons__btn--selected": value === selectedButton,
    });
    // Optionally add a title
    let title = "";
    if (titles) {
      title = titles[index];
    }
    return (
      <ButtonCreator
        key={index}
        buttonName={buttonName}
        index={index}
        title={title}
        value={value}
        className={className}
        handleButtonClick={handleButtonClick}
      />
    );
  };

  return (
    <div className={containerClassName} style={style}>
      {buttons.map(buttonMapper)}
    </div>
  );
}
