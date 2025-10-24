import React, { PureComponent, Fragment } from "react";
import { IconContext } from "react-icons";
import { FaBars, FaTimes, FaPlus } from "react-icons/fa";
import classNames from "classnames";
import { fromJS } from "immutable";
import { bindAll } from "lodash";
import { Droppable, Draggable } from "react-beautiful-dnd";

import "./stylesheet.css";

import { attributedStringToRawText } from "../../../../lib/export_org";
import generateId from "../../../../lib/id_generator";
import { parseMarkupAndCookies } from "../../../../lib/parse_org";
import {
  computeAllPropertyNames,
  computeAllPropertyValuesFor,
} from "../../../../lib/org_utils";

export default class PropertyListEditorModal extends PureComponent {
  constructor(props) {
    super(props);

    bindAll(this, ["handleAddNewItem"]);
  }

  componentDidUpdate(prevProps) {
    const prevItems = prevProps.propertyListItems;
    const currentItems = this.props.propertyListItems;
    if (
      prevItems.size === currentItems.size - 1 &&
      currentItems.last().get("property") === ""
    ) {
      if (this.lastTextfield) {
        this.lastTextfield.focus();
      }
    }
  }

  handlePropertyChange(propertyListItemId) {
    return (event) => {
      const propertyListItemIndex = this.props.propertyListItems.findIndex(
        (propertyListItem) => propertyListItem.get("id") === propertyListItemId,
      );
      this.props.onChange(
        this.props.propertyListItems.setIn(
          [propertyListItemIndex, "property"],
          event.target.value,
        ),
      );
    };
  }

  handleValueChange(propertyListItemId) {
    return (event) => {
      const { propertyListItems, onChange } = this.props;

      const propertyListItemIndex = propertyListItems.findIndex(
        (propertyListItem) => propertyListItem.get("id") === propertyListItemId,
      );
      onChange(
        propertyListItems.setIn(
          [propertyListItemIndex, "value"],
          fromJS(parseMarkupAndCookies(event.target.value)),
        ),
      );
    };
  }

  handleRemoveItem(propertyListItemId) {
    return () =>
      this.props.onChange(
        this.props.propertyListItems.filter(
          (propertyListItem) =>
            propertyListItem.get("id") !== propertyListItemId,
        ),
      );
  }

  handleAddNewItem() {
    this.props.onChange(
      this.props.propertyListItems.push(
        fromJS({
          property: "",
          value: "",
          id: generateId(),
        }),
      ),
    );
  }

  render() {
    const { propertyListItems, allOrgProperties } = this.props;
    const allPropertyNames = computeAllPropertyNames(allOrgProperties);

    const propertyListItemsWithAllPropVals = propertyListItems.map((p) => {
      const propertyName = p.get("property");
      const allPropertyValues = computeAllPropertyValuesFor(
        allOrgProperties,
        propertyName,
      );
      return [p, allPropertyValues];
    });

    return (
      <>
        <h2 className="drawer-modal__title">Edit property list</h2>

        <datalist id="drawer-modal__datalist-property-names">
          {allPropertyNames.map((propertyName, idx) => (
            <option key={idx} value={propertyName} />
          ))}
        </datalist>

        {propertyListItems.size === 0 ? (
          <div className="no-items-message">
            There are no items in this property list.
            <br />
            <br />
            Click the <FaPlus /> button to add a new one.
          </div>
        ) : (
          <Droppable
            droppableId="property-list-editor-droppable"
            type="PROPERTY-LIST"
          >
            {(provided) => (
              <div
                className="property-list-editor__items-container"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <Fragment>
                  {propertyListItemsWithAllPropVals.map(
                    ([propertyListItem, allPropertyValues], index) => (
                      <Draggable
                        draggableId={`property-list-item--${index}`}
                        index={index}
                        key={propertyListItem.get("id")}
                      >
                        {(provided, snapshot) => (
                          <div
                            className={classNames(
                              "property-list-editor__item-container",
                              {
                                "property-list-editor__item-container--dragging":
                                  snapshot.isDragging,
                              },
                            )}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <div className="item__textfields-container">
                              <input
                                type="text"
                                className="textfield item-container__textfield"
                                value={propertyListItem.get("property")}
                                onChange={this.handlePropertyChange(
                                  propertyListItem.get("id"),
                                )}
                                ref={(textfield) =>
                                  (this.lastTextfield = textfield)
                                }
                                list="drawer-modal__datalist-property-names"
                              />
                              <input
                                type="text"
                                className="textfield item-container__textfield"
                                value={attributedStringToRawText(
                                  propertyListItem.get("value"),
                                )}
                                onChange={this.handleValueChange(
                                  propertyListItem.get("id"),
                                )}
                                list={`drawer-modal__datalist-property-${index}-values`}
                              />
                              <datalist
                                id={`drawer-modal__datalist-property-${index}-values`}
                              >
                                {allPropertyValues.map((propertyValue, idx) => (
                                  <option key={idx} value={propertyValue} />
                                ))}
                              </datalist>
                            </div>
                            <div className="item-container__actions-container">
                              <FaTimes />
                              <IconContext.Provider
                                value={{
                                  className:
                                    "tag-container__drag-handle drag-handle",
                                }}
                              >
                                <div
                                  onClick={this.handleRemoveItem(
                                    propertyListItem.get("id"),
                                  )}
                                >
                                  <FaBars />
                                </div>
                              </IconContext.Provider>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ),
                  )}

                  {provided.placeholder}
                </Fragment>
              </div>
            )}
          </Droppable>
        )}

        <div className="property-list-editor__add-new-container">
          <button className="btn btn--circle" onClick={this.handleAddNewItem}>
            <FaPlus />
          </button>
        </div>
      </>
    );
  }
}
