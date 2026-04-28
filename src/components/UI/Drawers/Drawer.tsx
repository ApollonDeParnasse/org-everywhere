import React, { useState, useLayoutEffect } from "react";
import { IconContext } from "react-icons";
import { FaTimes } from "react-icons/fa";
import classNames from "classnames";
import "./stylesheet.css";

const Drawer = ({
  children,
  shouldIncludeCloseButton,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  useLayoutEffect(() => {
    setIsVisible(true);
  }, []);

  
  const handleClose = () => setIsVisible(false);

  const outerClassName = classNames("drawer-outer-container", {
    "drawer-outer-container--visible": isVisible,
  });

  return (
    <div
      className={outerClassName}
      onClick={!!onClose ? handleClose : null}
    >
      <div
        className="drawer-inner-container"
        data-testid="drawer"
      >
        <div className="drawer__grabber" />

        {shouldIncludeCloseButton && (
          <button className="drawer__close-button" onClick={handleClose}>
            <IconContext.Provider value={{ className: "fas fa-lg" }}>
              <div>
                <FaTimes /> ..
              </div>
            </IconContext.Provider>
          </button>
        )}

        {children}
      </div>
    </div>
  )
};

export default Drawer;
