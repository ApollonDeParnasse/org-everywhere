import React, {type RefObject } from "react";
import TableCell from "./TableCell/index";
import "./stylesheet.css";

interface TableProps {
  filePath: string;
  table: any;
  headerIndex: number;
  descriptionItemIndex: number;
  tableContainerRef: RefObject<null|HTMLTableElement>;
}

const Table = ({
  props: { filePath, table, headerIndex, descriptionItemIndex, tableContainerRef },
}: {props: TableProps}) => {
  const containerHeight: number | null = tableContainerRef?.current ? parseInt(getComputedStyle(tableContainerRef?.current).height) : null
  return (
    <table className="table-part">
      <tbody>
        {table.get("contents").map((row, rowIndex: number) => {
          return (
            <tr className={"table-part__row"} key={row.get("id")} style={{height: containerHeight ? containerHeight * 0.025 : "auto"}}>
              {row.get("contents").map((cell, columnIndex: number) => {
                const cellId = cell.get("id");
                const cellProps = {
                  filePath,
                  headerIndex,
                  descriptionItemIndex,
                  cellId,
                  row: rowIndex,
                  column: columnIndex,
                };
                return <TableCell key={cellId} props={cellProps} />;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Table;
