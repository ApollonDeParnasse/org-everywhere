import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { curry } from "lodash/fp";
import "./stylesheet.css";
import { getIcon } from "../../../../../UI/icons.tsx";
import {
  addNewTableRow,
  removeTableRow,
  addNewTableColumn,
  removeTableColumn,
  enterEditMode,
  moveTableRowUp,
  moveTableRowDown,
  moveTableColumnLeft,
  moveTableColumnRight,
} from "../../../../../../actions/org";

const getSelectedCellId = curry((filePath: string, state) => {
  return state.org.present.getIn(["files", filePath, "selectedTableCellId"]);
});

const TableActionButtons = ({ filePath }: { filePath: string }) => {
  const dispatch = useDispatch();
  const selectedTableCellId = useSelector(getSelectedCellId(filePath));

  const handleEnterTableEditMode = () => {
    dispatch(enterEditMode("table"));
  };

  const handleAddNewTableRow = () => {
    dispatch(addNewTableRow());
  };

  const handleRemoveTableRow = () => {
    dispatch(removeTableRow());
  };

  const handleAddNewTableColumn = () => {
    dispatch(addNewTableColumn());
  };

  const handleRemoveTableColumn = () => {
    dispatch(removeTableColumn());
  };

  const handleUpClick = () => {
    dispatch(moveTableRowUp());
  };

  const handleDownClick = () => {
    dispatch(moveTableRowDown());
  };

  const handleLeftClick = () => {
    dispatch(moveTableColumnLeft());
  };

  const handleRightClick = () => {
    dispatch(moveTableColumnRight());
  };

  return (
    <div className="table-action-drawer">
      {
        <>
          <div className="table-action-drawer-container">
            <button
              className=" table-action-drawer__edit-icon-container"
              data-testid="edit-cell-button"
              onClick={() =>
                selectedTableCellId ? handleEnterTableEditMode() : undefined
              }
            >
              {getIcon("pencil")}
            </button>

            <button
              className="table-action-drawer__sub-icon-container"
              data-testid="add-column-button"
              onClick={() =>
                selectedTableCellId ? handleAddNewTableColumn() : undefined
              }
            >
              {getIcon("columns")}
              {getIcon("small-plus")}
            </button>

            <button
              className="table-action-drawer__sub-icon-container"
              data-testid="delete-column-button"
              onClick={() =>
                selectedTableCellId ? handleRemoveTableColumn() : undefined
              }
            >
              {getIcon("columns")}
              {getIcon("small-times")}
            </button>

            <button
              className="table-action-drawer__sub-icon-container"
              data-testid="add-row-button"
              onClick={() =>
                selectedTableCellId ? handleAddNewTableRow() : undefined
              }
            >
              {getIcon("rows")}
              {getIcon("small-plus")}
            </button>

            <button
              className="table-action-drawer__sub-icon-container"
	      data-testid="delete-row-button"
              onClick={() =>
                selectedTableCellId ? handleRemoveTableRow() : undefined
              }
            >
              {getIcon("rows")}
              {getIcon("small-times")}
            </button>
          </div>

          <div className="table-action-movement-container">
            <button
              className="table-action-movement__up"
              data-testid="up-button"
              onClick={() =>
                selectedTableCellId ? handleUpClick() : undefined
              }
            >
              {getIcon("arrow-up")}
            </button>
            <button
              className="table-action-movement__left"
              data-testid="left-button"
              onClick={() =>
                selectedTableCellId ? handleLeftClick() : undefined
              }
            >
              {getIcon("arrow-left")}
            </button>

            <button
              className="table-action-movement__right"
              data-testid="right-button"
              onClick={() =>
                selectedTableCellId ? handleRightClick() : undefined
              }
            >
              {getIcon("arrow-right")}
            </button>
            <button
              className="table-action-movement__down"
              data-testid="down-button"
              onClick={() =>
                selectedTableCellId ? handleDownClick() : undefined
              }
            >
              {getIcon("arrow-down")}
            </button>
          </div>
        </>
      }
    </div>
  );
};

export default TableActionButtons;
