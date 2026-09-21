import { List, Set, Map } from "immutable";
import { Record as ImmutableRecord, type MapOf } from "immutable";
import type { ActionTypes } from "redux-undo";

export type StartOrEnd = "start" | "end";

export type OrgMarkupType =
  | "inline-code"
  | "bold"
  | "italic"
  | "strikethrough"
  | "underline"
  | "verbatim";

export type AgendaTimeframe = "Week" | "Day" | "Month";
export type TimestampUnit = "h" | "d" | "m" | "w" | "y";
export type DelayUnit = TimestampUnit;
export type RepeaterUnit = TimestampUnit;
export type RepeaterType = "+" | "++" | ".+";
export type DelayType = "-" | "--";

export type LogEntryType = "start" | "end";
export type PlanningType = "DEADLINE" | "SCHEDULED";

export type Context = "agenda" | "search" | "task-list" | "refile";
export type FinderTab = "Search" | "Clock List" | "Task List";
export type BulletStyle = "Fancy" | "Classic";

export type OrgCheckboxState = "unchecked" | "checked" | "partial";

export type ClientType = "WebDAV" | "Dropbox" | "GitLab";

export type ForceAction = "manual" | "push" | "pull" | undefined;

export type EditModeType =
  | "list-title"
  | "list-contents"
  | "table"
  | "description";

export type PopupType =
  | "deadline-editor"
  | "scheduled-editor"
  | "timestamp-editor"
  | "sync-confirmation"
  | "capture"
  | "tags-editor"
  | "property-list-editor"
  | "agenda"
  | "search"
  | "refile"
  | "title-editor"
  | "description-editor"
  | "table-editor";

export type ModalPage =
  | "sample"
  | "keyboard_shortcuts_editor"
  | "capture_templates_editor"
  | "file_settings_editor"
  | "settings";

export type OrgTimestampPart = {
  isActive: boolean;
  withStartTime: boolean;
  year: string;
  month: string;
  day: string;
  dayName: string | undefined;
  startHour: string;
  startMinute: string;
  endHour: string | undefined;
  endMinute: string | undefined;
  repeaterType: RepeaterType | undefined;
  repeaterValue: string | undefined;
  repeaterUnit: RepeaterUnit | undefined;
  delayType: DelayType | undefined;
  delayValue: string | undefined;
  delayUnit: DelayUnit | undefined;
  repeaterDeadlineValue: string | undefined;
  repeaterDeadlineUnit: RepeaterUnit | undefined;
};

export type OrgTimestampPartKey = keyof OrgTimestampPart;

// when we parse and handle time, does january become 01 or 00?
const defaultOrgTimestampPartValues: OrgTimestampPart = {
  isActive: false,
  withStartTime: false,
  year: "1970",
  month: "01",
  day: "01",
  dayName: undefined,
  startHour: "00",
  startMinute: "00",
  endHour: undefined,
  endMinute: undefined,
  repeaterType: undefined,
  repeaterValue: undefined,
  repeaterUnit: undefined,
  delayType: undefined,
  delayValue: undefined,
  delayUnit: undefined,
  repeaterDeadlineValue: undefined,
  repeaterDeadlineUnit: undefined,
};

export const makeOrgTimestampPartRecord: ImmutableRecord.Factory<OrgTimestampPart> =
  ImmutableRecord(defaultOrgTimestampPartValues);
export type OrgTimestampPartRecord = ImmutableRecord<OrgTimestampPart>;

export type OrgLinkToken = {
  type: "link";
  rawText: string;
  uri: string;
  title?: string;
  index: number;
};
const defaultOrgLinkToken: OrgLinkToken = {
  type: "link",
  rawText: "",
  uri: "",
  title: undefined,
  index: 0,
};

export const makeOrgLinkTokenRecord: ImmutableRecord.Factory<OrgLinkToken> =
  ImmutableRecord(defaultOrgLinkToken);
export type OrgLinkTokenRecord = ImmutableRecord<OrgLinkToken>;

export type OrgSimpleToken =
  | OrgLinkToken
  | {
      type: "percentage-cookie";
      rawText: string;
      percentage: string | undefined;
      index: number;
    }
  | {
      type: "fraction-cookie";
      rawText: string;
      fraction: [string | undefined, string | undefined];
      index: number;
    }
  | {
      type: "inline-markup";
      rawText: string;
      index: number;
      content: string;
      markupType: OrgMarkupType | undefined;
    }
  | {
      type: "timestamp";
      rawText: string;
      index: number;
      firstTimestamp: OrgTimestampPart | undefined;
      secondTimestamp: OrgTimestampPart | undefined;
    }
  | {
      type: "url";
      rawText: string;
      index: number;
    }
  | {
      type: "e-mail";
      rawText: string;
      index: number;
    }
  | {
      type: "phone-number";
      rawText: string;
      index: number;
    }
  | {
      type: "www-url";
      rawText: string;
      index: number;
    };

export type OrgRawListContentToken = {
  type: "raw-list-content";
  line: string;
};
export type OrgRawListHeaderToken = {
  type: "raw-list-header";
  line: string;
};

export type OrgRawTableToken = {
  type: "raw-table";
  line: string;
};

export type OrgRecursiveToken =
  | OrgRawTableToken
  | OrgRawListHeaderToken
  | OrgRawListContentToken;

export type OrgToken = OrgRecursiveToken | OrgSimpleToken;

export type OrgTodoKeywordSet = {
  keywords: List<string>;
  completedKeywords: List<string>;
  configLine?: string;
  default: boolean;
};
const defaultOrgTodoKeywordSet: OrgTodoKeywordSet = {
  keywords: List(),
  completedKeywords: List(),
  configLine: undefined,
  default: false,
};

export const makeOrgTodoKeywordSetRecord: ImmutableRecord.Factory<OrgTodoKeywordSet> =
  ImmutableRecord(defaultOrgTodoKeywordSet);
export type OrgTodoKeywordSetRecord = ImmutableRecord<OrgTodoKeywordSet>;

export type OrgFileConfig = {
  todoKeywordSets: List<OrgTodoKeywordSetRecord>;
  fileConfigLines: List<string>;
};
const defaultOrgFileConfig: OrgFileConfig = {
  todoKeywordSets: List(),
  fileConfigLines: List(),
};

export const makeOrgFileConfigRecord: ImmutableRecord.Factory<OrgFileConfig> =
  ImmutableRecord(defaultOrgFileConfig);
export type OrgFileConfigRecord = ImmutableRecord<OrgFileConfig>;

export type OrgText = {
  type: "text";
  contents: string;
};
const defaultOrgText: OrgText = {
  type: "text",
  contents: "",
};

export const makeOrgTextRecord: ImmutableRecord.Factory<OrgText> =
  ImmutableRecord(defaultOrgText);
export type OrgTextRecord = ImmutableRecord<OrgText>;

export type OrgLinkContents = {
  uri: string;
  title?: string;
};
const defaultOrgLinkContents: OrgLinkContents = {
  uri: "",
  title: undefined,
};

export const makeOrgLinkContentsRecord: ImmutableRecord.Factory<OrgLinkContents> =
  ImmutableRecord(defaultOrgLinkContents);
export type OrgLinkContentsRecord = ImmutableRecord<OrgLinkContents>;

export type OrgLink = {
  id: number;
  type: "link";
  contents: OrgLinkContentsRecord;
};
const defaultOrgLink: OrgLink = {
  id: 0,
  type: "link",
  contents: makeOrgLinkContentsRecord(),
};

export const makeOrgLinkRecord: ImmutableRecord.Factory<OrgLink> =
  ImmutableRecord(defaultOrgLink);
export type OrgLinkRecord = ImmutableRecord<OrgLink>;

// name is temporary
export type OrgLink2 = {
  id: number;
  type: "url" | "phone-number" | "e-mail" | "www-url";
  content: string;
};
const defaultOrgLink2: OrgLink2 = {
  id: 0,
  type: "url",
  content: "",
};

export const makeOrgLink2Record: ImmutableRecord.Factory<OrgLink2> =
  ImmutableRecord(defaultOrgLink2);
export type OrgLink2Record = ImmutableRecord<OrgLink2>;

export type OrgPercentageCookie = {
  id: number;
  type: "percentage-cookie";
  percentage: string | undefined;
};
const defaultOrgPercentageCookie: OrgPercentageCookie = {
  id: 0,
  type: "percentage-cookie",
  percentage: undefined,
};

export const makeOrgPercentageCookieRecord: ImmutableRecord.Factory<OrgPercentageCookie> =
  ImmutableRecord(defaultOrgPercentageCookie);
export type OrgPercentageCookieRecord = ImmutableRecord<OrgPercentageCookie>;

export type OrgFractionCookie = {
  id: number;
  type: "fraction-cookie";
  fraction: List<string | undefined>;
};
const defaultOrgFractionCookie: OrgFractionCookie = {
  id: 0,
  type: "fraction-cookie",
  fraction: List(),
};

export const makeOrgFractionCookieRecord: ImmutableRecord.Factory<OrgFractionCookie> =
  ImmutableRecord(defaultOrgFractionCookie);
export type OrgFractionCookieRecord = ImmutableRecord<OrgFractionCookie>;

export type OrgCookie = OrgPercentageCookieRecord | OrgFractionCookieRecord;

export type OrgInlineMarkup = {
  id: number;
  type: "inline-markup";
  content: string;
  markupType: OrgMarkupType | undefined;
};
const defaultOrgInlineMarkup: OrgInlineMarkup = {
  id: 0,
  type: "inline-markup",
  content: "",
  markupType: undefined,
};

export const makeOrgInlineMarkupRecord: ImmutableRecord.Factory<OrgInlineMarkup> =
  ImmutableRecord(defaultOrgInlineMarkup);
export type OrgInlineMarkupRecord = ImmutableRecord<OrgInlineMarkup>;

export type OrgClockString = {
  id: number;
  type: "timestamp";
  firstTimestamp: OrgTimestampPart | undefined;
  secondTimestamp: OrgTimestampPart | undefined;
};
const defaultOrgClockString: OrgClockString = {
  id: 0,
  type: "timestamp",
  firstTimestamp: undefined,
  secondTimestamp: undefined,
};

export const makeOrgClockStringRecord: ImmutableRecord.Factory<OrgClockString> =
  ImmutableRecord(defaultOrgClockString);
export type OrgClockStringRecord = ImmutableRecord<OrgClockString>;

export type OrgTimestampType =
  | "TIMESTAMP_TITLE"
  | "TIMESTAMP_DESCRIPTION"
  | "TIMESTAMP_LOG_NOTES";

export type OrgTimestamp = {
  id: number;
  type: OrgTimestampType;
  timestamp: OrgTimestampPartRecord;
};
const defaultOrgTimestamp: OrgTimestamp = {
  id: 0,
  type: "TIMESTAMP_TITLE",
  timestamp: makeOrgTimestampPartRecord(),
};

export const makeOrgTimestampRecord: ImmutableRecord.Factory<OrgTimestamp> =
  ImmutableRecord(defaultOrgTimestamp);
export type OrgTimestampRecord = ImmutableRecord<OrgTimestamp>;

export type OrgPlanningItemType = "SCHEDULED" | "DEADLINE";

export type OrgPlanningItem = {
  type: OrgPlanningItemType;
  timestamp: OrgTimestampPartRecord;
};
const defaultOrgPlanningItem: OrgPlanningItem = {
  type: "SCHEDULED",
  timestamp: makeOrgTimestampPartRecord(),
};

export const makeOrgPlanningItemRecord: ImmutableRecord.Factory<OrgPlanningItem> =
  ImmutableRecord(defaultOrgPlanningItem);
export type OrgPlanningItemRecord = ImmutableRecord<OrgPlanningItem>;

export type OrgPropertyListItem = {
  type: "property-list-item";
  property: string;
  value: List<OrgTextRecord | OrgTimestampRecord | undefined>;
  id: number;
};
const defaultOrgPropertyListItem: OrgPropertyListItem = {
  type: "property-list-item",
  property: "",
  value: List(),
  id: 0,
};

export const makeOrgPropertyListItemRecord: ImmutableRecord.Factory<OrgPropertyListItem> =
  ImmutableRecord(defaultOrgPropertyListItem);
export type OrgPropertyListItemRecord = ImmutableRecord<OrgPropertyListItem>;

export type OrgListItem = {
  type: "list-item";
  id: number;
  titleLine: List<OrgTitleElement>;
  contents: any;
  forceNumber: string | undefined;
  isCheckbox: boolean;
  checkboxState: OrgCheckboxState | undefined;
};
const defaultOrgListItem: OrgListItem = {
  type: "list-item",
  id: 0,
  titleLine: List(),
  contents: undefined,
  forceNumber: undefined,
  isCheckbox: false,
  checkboxState: undefined,
};

export const makeOrgListItemRecord: ImmutableRecord.Factory<OrgListItem> =
  ImmutableRecord(defaultOrgListItem);
export type OrgListItemRecord = ImmutableRecord<OrgListItem>;

export type OrgList = {
  type: "list";
  id: number;
  items: List<OrgListItemRecord>;
  bulletCharacter: string;
  numberTerminatorCharacter: string | undefined;
  isOrdered: boolean;
};
const defaultOrgList: OrgList = {
  type: "list",
  id: 0,
  items: List(),
  bulletCharacter: "",
  numberTerminatorCharacter: undefined,
  isOrdered: false,
};

export const makeOrgListRecord: ImmutableRecord.Factory<OrgList> =
  ImmutableRecord(defaultOrgList);
export type OrgListRecord = ImmutableRecord<OrgList>;

export type OrgTableCell = {
  id: number;
  type: "table-cell";
  contents: List<string | OrgInlineMarkupRecord>;
  rawContents: string;
};
const defaultOrgTableCell: OrgTableCell = {
  id: 0,
  type: "table-cell",
  contents: List(),
  rawContents: "",
};

export const makeOrgTableCellRecord: ImmutableRecord.Factory<OrgTableCell> =
  ImmutableRecord(defaultOrgTableCell);
export type OrgTableCellRecord = ImmutableRecord<OrgTableCell>;

export type OrgTableRow = {
  id: number;
  type: "table-row";
  contents: List<OrgTableCellRecord>;
};
const defaultOrgTableRow: OrgTableRow = {
  id: 0,
  type: "table-row",
  contents: List(),
};

export const makeOrgTableRowRecord: ImmutableRecord.Factory<OrgTableRow> =
  ImmutableRecord(defaultOrgTableRow);
export type OrgTableRowRecord = ImmutableRecord<OrgTableRow>;

export type OrgTable = {
  id: number;
  type: "table";
  contents: List<OrgTableRowRecord>;
  columnProperties: List<any>;
};
const defaultOrgTable: OrgTable = {
  id: 0,
  type: "table",
  contents: List(),
  columnProperties: List(),
};

export const makeOrgTableRecord: ImmutableRecord.Factory<OrgTable> =
  ImmutableRecord(defaultOrgTable);
export type OrgTableRecord = ImmutableRecord<OrgTable>;

export type OrgTitleElement =
  | OrgTextRecord
  | OrgPlanningItemRecord
  | OrgTimestampRecord
  | OrgInlineMarkupRecord
  | OrgCookie;

export type OrgTitleLine = {
  type: "title-line";
  title: List<OrgTitleElement>;
  rawTitle: string;
  todoKeyword: string;
  tags: List<string>;
};
const defaultOrgTitleLine: OrgTitleLine = {
  type: "title-line",
  title: List(),
  rawTitle: "",
  todoKeyword: "",
  tags: List(),
};

export const makeOrgTitleLineRecord: ImmutableRecord.Factory<OrgTitleLine> =
  ImmutableRecord(defaultOrgTitleLine);
export type OrgTitleLineRecord = ImmutableRecord<OrgTitleLine>;

export type OrgHeadline = {
  type: "headline";
  titleLine: OrgTitleLineRecord;
  rawDescription: string;
  description: List<any>;
  opened: boolean;
  id: number;
  nestingLevel: number;
  planningItems: List<any>;
  propertyListItems: List<OrgPropertyListItemRecord>;
  logNotes: List<any>;
  logBookEntries: List<any>;
};
const defaultOrgHeadline: OrgHeadline = {
  type: "headline",
  titleLine: makeOrgTitleLineRecord(),
  rawDescription: "",
  description: List(),
  opened: false,
  id: 0,
  nestingLevel: 0,
  planningItems: List(),
  propertyListItems: List(),
  logNotes: List(),
  logBookEntries: List(),
};

export const makeOrgHeadlineRecord: ImmutableRecord.Factory<OrgHeadline> =
  ImmutableRecord(defaultOrgHeadline);
export type OrgHeadlineRecord = ImmutableRecord<OrgHeadline>;

export type OrgElement =
  | OrgLinkRecord
  | OrgLink2Record
  | OrgPercentageCookieRecord
  | OrgFractionCookieRecord
  | OrgCookie
  | OrgInlineMarkupRecord
  | OrgTimestampRecord
  | OrgPlanningItemRecord
  | OrgClockStringRecord
  | OrgPropertyListItemRecord
  | OrgListItemRecord
  | OrgListItemRecord
  | OrgTableCellRecord
  | OrgTableRowRecord
  | OrgTableRowRecord
  | OrgTitleLineRecord
  | OrgHeadlineRecord
  | OrgTextRecord;

export type OrgFile = {
  headers: List<OrgHeadlineRecord>;
  activeClocks: number;
  todoKeywordSets: List<OrgTodoKeywordSetRecord>;
  isDirty: boolean;
  lastSyncAt: Date;
  fileConfigLines: List<string>;
  linesBeforeHeadings: List<string>;
  narrowedHeaderId: number | undefined;
  selectedHeaderId: number;
  selectedHeaderIndex: number;
  editMode: EditModeType | undefined;
  selectedTableId: number;
  selectedDescriptionItemIndex: number;
  selectedTableCellId: number | undefined;
  selectedListItemId: number | undefined;
};
const defaultOrgFile: OrgFile = {
  headers: List(),
  activeClocks: 0,
  todoKeywordSets: List(),
  isDirty: false,
  lastSyncAt: new Date(),
  fileConfigLines: List(),
  linesBeforeHeadings: List(),
  narrowedHeaderId: undefined,
  selectedHeaderId: 0,
  selectedHeaderIndex: 0,
  editMode: undefined,
  selectedTableId: 0,
  selectedDescriptionItemIndex: 0,
  selectedTableCellId: undefined,
  selectedListItemId: undefined,
};

export const makeOrgFileRecord: ImmutableRecord.Factory<OrgFile> =
  ImmutableRecord(defaultOrgFile);
export type OrgFileRecord = ImmutableRecord<OrgFile>;

export type DirectoryListingEntry = {
  id: string;
  name: string;
  isDirectory: boolean;
  path: string | undefined;
};
const defaultDirectoryListingEntry: DirectoryListingEntry = {
  id: "",
  name: "",
  isDirectory: false,
  path: undefined,
};

export const makeDirectoryListingEntryRecord: ImmutableRecord.Factory<DirectoryListingEntry> =
  ImmutableRecord(defaultDirectoryListingEntry);
export type DirectoryListingEntryRecord =
  ImmutableRecord<DirectoryListingEntry>;

export type AdditionalSyncBackendState = {
  cursor: string;
};
const defaultAdditionalSyncBackendState: AdditionalSyncBackendState = {
  cursor: "",
};

export const makeAdditionalSyncBackendStateRecord: ImmutableRecord.Factory<AdditionalSyncBackendState> =
  ImmutableRecord(defaultAdditionalSyncBackendState);
export type AdditionalSyncBackendStateRecord =
  ImmutableRecord<AdditionalSyncBackendState>;

export type DirectoryListing = {
  listing: List<DirectoryListingEntryRecord>;
  hasMore: boolean;
  isLoadingMore?: boolean;
  additionalSyncBackendState: AdditionalSyncBackendStateRecord;
};
const defaultDirectoryListing: DirectoryListing = {
  listing: List(),
  hasMore: false,
  isLoadingMore: undefined,
  additionalSyncBackendState: makeAdditionalSyncBackendStateRecord(),
};

export const makeDirectoryListingRecord: ImmutableRecord.Factory<DirectoryListing> =
  ImmutableRecord(defaultDirectoryListing);
export type DirectoryListingRecord = ImmutableRecord<DirectoryListing>;

export type Client = {
  type: ClientType;
  isSignedIn: () => Promise<boolean>;
  getDirectoryListing: (path: string) => Promise<DirectoryListing>;
  getMoreDirectoryListing: (
    additionalSyncBackendState: MapOf<AdditionalSyncBackendState>,
  ) => Promise<DirectoryListing>;
  updateFile: (path: string, contents: string) => Promise<any>;
  createFile: (path: string, contents: string) => Promise<any>;
  getFileContentsAndMetadata: (
    path: string,
  ) => Promise<{ contents: string; lastModifiedAt: string }>;
  getFileContents: (path: string) => Promise<string>;
  deleteFile: (path: string) => Promise<any>;
};
// const defaultClient: Client = {
//     type: "WebDAV",
//     isSignedIn: ,
//     getDirectoryListing:,
//     getMoreDirectoryListing:,
//     updateFile:,
//     createFile:,
//     getFileContentsAndMetadata:,
//     getFileContents:,
//     deleteFile:
// }

// export const makeClientRecord: ImmutableRecord.Factory<Client> = ImmutableRecord(defaultClient);
// export type ClientRecord = ImmutableRecord<Client>

export type SyncOptions = {
  forceAction: ForceAction;
  successMessage: string;
  shouldSuppressMessages: boolean;
  path: string;
};
const defaultSyncOptions: SyncOptions = {
  forceAction: undefined,
  successMessage: "",
  shouldSuppressMessages: false,
  path: "",
};

export const makeSyncOptionsRecord: ImmutableRecord.Factory<SyncOptions> =
  ImmutableRecord(defaultSyncOptions);
export type SyncOptionsRecord = ImmutableRecord<SyncOptions>;

export type Search = {
  searchFilter: string;
  searchFilterExpr: List<string>;
};
const defaultSearch: Search = {
  searchFilter: "",
  searchFilterExpr: List(),
};

export const makeSearchRecord: ImmutableRecord.Factory<Search> =
  ImmutableRecord(defaultSearch);
export type SearchRecord = ImmutableRecord<Search>;

export type Bookmark = {
  search: List<SearchRecord>;
  "task-list": List<string>;
  refile: List<string>;
};
const defaultBookmark: Bookmark = {
  search: List(),
  "task-list": List(),
  refile: List(),
};

export const makeBookmarkRecord: ImmutableRecord.Factory<Bookmark> =
  ImmutableRecord(defaultBookmark);
export type BookmarkRecord = ImmutableRecord<Bookmark>;

export type FileSetting = {
  id: number;
  path: string;
  loadOnStartup: boolean;
  includeInAgenda: boolean;
  includeInSearch: boolean;
  includeInRefile: boolean;
  includeInTasklist: boolean;
};
const defaultFileSetting: FileSetting = {
  id: 0,
  path: "",
  loadOnStartup: false,
  includeInAgenda: false,
  includeInSearch: false,
  includeInRefile: false,
  includeInTasklist: false,
};

export const makeFileSettingRecord: ImmutableRecord.Factory<FileSetting> =
  ImmutableRecord(defaultFileSetting);
export type FileSettingRecord = ImmutableRecord<FileSetting>;

export type PendingCapture = {
  capturePath: string;
  captureTemplateName: string;
  captureContent: string;
  customCaptureVariables: Map<string, string>;
};
const defaultPendingCapture: PendingCapture = {
  capturePath: "",
  captureTemplateName: "",
  captureContent: "",
  customCaptureVariables: Map(),
};

export const makePendingCaptureRecord: ImmutableRecord.Factory<PendingCapture> =
  ImmutableRecord(defaultPendingCapture);
export type PendingCaptureRecord = ImmutableRecord<PendingCapture>;

export type SyncBackendAction =
  | { type: "SIGN_OUT" }
  | {
      type: "SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING";
      directoryListing: DirectoryListingRecord;
      hasMore: boolean;
      additionalSyncBackendState: AdditionalSyncBackendStateRecord;
      path: string;
    }
  | { type: "SET_IS_LOADING_MORE_DIRECTORY_LISTING"; isLoadingMore: boolean };

export type OrgAction =
  | {
      type: "PARSE_FILE";
      path: string;
      contents: string;
    }
  | {
      type: "SET_LAST_SYNC_AT";
      path: string;
      lastSyncAt: Date;
    }
  | {
      type: "CLEAR_SEARCH";
    }
  | {
      type: "OPEN_HEADER";
      headerId: number;
    }
  | {
      type: "TOGGLE_HEADER_OPENED";
      headerId: number;
      closeSubheadersRecursively: boolean;
    }
  | {
      type: "SELECT_HEADER";
      headerId: number;
    }
  | {
      type: "SELECT_HEADER_INDEX";
      headerIndex: number;
    }
  | {
      type: "SET_PATH";
      path: string;
    }
  | {
      type: ActionTypes;
    }
  | {
      type: "OPEN_PARENTS_OF_HEADER";
      headerId: number;
    }
  | {
      type: "ADVANCE_TODO_STATE";
      headerId: number;
      logIntoDrawer: boolean;
      dirtying: boolean;
      timestamp: Date;
    }
  | {
      type: "SET_TODO_STATE";
      newTodoState: string;
      headerId: number;
      logIntoDrawer: boolean;
      dirtying: boolean;
      timestamp: Date;
    }
  | {
      type: "ENTER_EDIT_MODE";
      editModeType: EditModeType;
    }
  | {
      type: "EXIT_EDIT_MODE";
    }
  | {
      type: "UPDATE_HEADER_TppITLE";
      headerId: number;
      newRawTitle: string;
      dirtying: boolean;
    }
  | {
      type: "UPDATE_HEADER_DESCRIPTION";
      headerId: number;
      newRawDescription: string;
      dirtying: boolean;
    }
  | {
      type: "ADD_HEADER";
      headerId: number;
      dirtying: boolean;
    }
  | {
      type: "DUPLICATE_HEADER";
      headerId: number;
      dirtying: boolean;
    }
  | {
      type: "CREATE_FIRST_HEADER";
      dirtying: boolean;
    }
  | {
      type: "SELECT_NEXT_SIBLING_HEADER";
      headerId: number;
    }
  | {
      type: "SELECT_NEXT_VISIBLE_HEADER";
      headerId: number;
    }
  | {
      type: "SELECT_PREVIOUS_VISIBLE_HEADER";
      headerId: number;
    }
  | {
      type: "REMOVE_HEADER";
      headerId: number;
      dirtying: boolean;
    }
  | {
      type: "MOVE_HEADER_UP";
      headerId: number;
      dirtying: boolean;
    }
  | {
      type: "MOVE_HEADER_DOWN";
      headerId: number;
      dirtying: boolean;
    }
  | {
      type: "MOVE_HEADER_LEFT";
      headerId: number;
      dirtying: boolean;
    }
  | {
      type: "MOVE_HEADER_RIGHT";
      headerId: number;
      dirtying: boolean;
    }
  | {
      type: "MOVE_SUBTREE_LEFT";
      headerId: number;
      dirtying: boolean;
    }
  | {
      type: "MOVE_SUBTREE_RIGHT";
      headerId: number;
      dirtying: boolean;
    }
  | {
      type: "REFILE_SUBTREE";
      sourcePath: string;
      sourceHeaderId: number;
      targetPath: string;
      targetHeaderId: number;
      dirtying: boolean;
    }
  | {
      type: "HEADER_ADD_NOTE";
      inputText: string;
      currentDate: Date;
      dirtying: boolean;
    }
  | {
      type: "NARROW_HEADER";
      headerId: number;
    }
  | {
      type: "WIDEN_HEADER";
    }
  | {
      type: "SET_OPENNESS_STATE";
      path: string;
      opennessState: boolean;
    }
  | {
      type: "APPLY_OPENNESS_STATE";
      path: string;
    }
  | {
      type: "SET_DIRTY";
      isDirty: boolean;
      path: string;
    }
  | {
      type: "SET_SELECTED_DESCRIPTION_ITEM_INDEX";
      itemIndex: number;
    }
  | {
      type: "SET_SELECTED_TABLE_ID";
      tableId: number;
    }
  | {
      type: "SET_SELECTED_TABLE_CELL_ID";
      cellId: number;
    }
  | {
      type: "ADD_NEW_TABLE_ROW";
      dirtying: boolean;
    }
  | {
      type: "REMOVE_TABLE_ROW";
      dirtying: boolean;
    }
  | {
      type: "ADD_NEW_TABLE_COLUMN";
      dirtying: boolean;
    }
  | {
      type: "REMOVE_TABLE_COLUMN";
      dirtying: boolean;
    }
  | {
      type: "MOVE_TABLE_ROW_DOWN";
      dirtying: boolean;
    }
  | {
      type: "MOVE_TABLE_ROW_UP";
      dirtying: boolean;
    }
  | {
      type: "MOVE_TABLE_COLUMN_LEFT";
      dirtying: boolean;
    }
  | {
      type: "MOVE_TABLE_COLUMN_RIGHT";
      dirtying: boolean;
    }
  | {
      type: "UPDATE_TABLE_CELL_VALUE";
      cellId: number;
      newValue: string;
      dirtying: boolean;
    }
  | {
      type: "INSERT_CAPTURE";
      template: string;
      content: string;
      shouldPrepend: boolean;
      dirtying: boolean;
    }
  | {
      type: "CLEAR_PENDING_CAPTURE";
    }
  | {
      type: "ADVANCE_CHECKBOX_STATE";
      listItemId: number;
      dirtying: boolean;
    }
  | {
      type: "SET_SELECTED_LIST_ITEM_ID";
      listItemId: number;
    }
  | {
      type: "UPDATE_LIST_TITLE_VALUE";
      listItemId: number;
      newValue: string;
      dirtying: boolean;
    }
  | {
      type: "UPDATE_LIST_CONTENTS_VALUE";
      listItemId: number;
      newValue: string;
      dirtying: boolean;
    }
  | {
      type: "ADD_NEW_LIST_ITEM";
      dirtying: boolean;
    }
  | {
      type: "SELECT_NEXT_SIBLING_LIST_ITEM";
    }
  | {
      type: "REMOVE_LIST_ITEM";
      dirtying: boolean;
    }
  | {
      type: "MOVE_LIST_ITEM_UP";
      dirtying: boolean;
    }
  | {
      type: "MOVE_LIST_ITEM_DOWN";
      dirtying: boolean;
    }
  | {
      type: "MOVE_LIST_ITEM_LEFT";
      dirtying: boolean;
    }
  | {
      type: "MOVE_LIST_ITEM_RIGHT";
      dirtying: boolean;
    }
  | {
      type: "MOVE_LIST_SUBTREE_LEFT";
      dirtying: boolean;
    }
  | {
      type: "MOVE_LIST_SUBTREE_RIGHT";
      dirtying: boolean;
    }
  | {
      type: "SET_HEADER_TAGS";
      headerId: number;
      tags: Array<string>;
      dirtying: boolean;
    }
  | {
      type: "REORDER_TAGS";
      fromIndex: number;
      toIndex: number;
      dirtying: boolean;
    }
  | {
      type: "REORDER_PROPERTY_LIST";
      fromIndex: number;
      toIndex: number;
      headerId: number;
      dirtying: boolean;
    }
  | {
      type: "UPDATE_TIMESTAMP_WITH_ID";
      timestampId: number;
      newTimestamp: OrgTimestampPartRecord;
      dirtying: boolean;
    }
  | {
      type: "UPDATE_PLANNING_ITEM_TIMESTAMP";
      headerId: number;
      planningItemIndex: number;
      newTimestamp: OrgTimestampPartRecord;
      dirtying: boolean;
    }
  | {
      type: "ADD_NEW_PLANNING_ITEM";
      headerId: number;
      planningType: PlanningType;
      dirtying: boolean;
      timestamp: Date;
    }
  | {
      type: "REMOVE_PLANNING_ITEM";
      headerId: number;
      planningItemIndex: number;
      dirtying: boolean;
    }
  | {
      type: "REMOVE_TIMESTAMP";
      headerId: number;
      timestampId: number;
      dirtying: boolean;
    }
  | {
      type: "UPDATE_PROPERTY_LIST_ITEMS";
      headerId: number;
      newPropertyListItems: Array<string>;
      dirtying: boolean;
    }
  | {
      type: "SET_ORG_FILE_ERROR_MESSAGE";
      message: string;
    }
  | {
      type: "SET_LOG_ENTRY_STOP";
      headerId: number;
      entryId: number;
      time: Date;
      dirtying: boolean;
    }
  | {
      type: "CREATE_LOG_ENTRY_START";
      headerId: number;
      time: Date;
      dirtying: boolean;
    }
  | {
      type: "UPDATE_LOG_ENTRY_TIME";
      headerId: number;
      entryIndex: number;
      entryType: LogEntryType;
      newTime: Date;
      dirtying: boolean;
    }
  | {
      type: "SET_SEARCH_FILTER_INFORMATION";
      searchFilter: string;
      cursorPosition: number;
      context: Context;
    }
  | {
      type: "TOGGLE_CLOCK_DISPLAY";
      showClockDisplay: boolean;
    }
  | {
      type: "UPDATE_FILE_SETTING_FIELD_PATH_VALUE";
      settingId: number;
      fieldPath: string;
      newValue: string;
    }
  | {
      type: "REORDER_FILE_SETTING";
      fromIndex: number;
      toIndex: number;
    }
  | {
      type: "DELETE_FILE_SETTING";
      settingId: number;
    }
  | {
      type: "ADD_NEW_EMPTY_FILE_SETTING";
    }
  | {
      type: "RESTORE_FILE_SETTINGS";
      newSettings: Record<string, string>;
    }
  | {
      type: "SAVE_BOOKMARK";
      context: Context;
      bookmark: string;
    }
  | {
      type: "DELETE_BOOKMARK";
      context: Context;
      bookmark: string;
    }
  | {
      type: "ADD_NEW_FILE";
      path: string;
      content: string;
    }
  | {
      type: "UPDATE_HEADER_TITLE";
      newRawTitle: string;
      headerId: number;
    }
  | {
      type: "TIMESTAMP_TITLE";
    }
  | {
      type: "TIMESTAMP_DESCRIPTION";
    };

export type UpdateOrgCaptureAction = {
  type: "UPDATE_TEMPLATE_FIELD_PATH_VALUE";
  templateId: number;
  fieldPath: string;
  newValue: string;
};

export type OrgCaptureUpdateAction =
  | {
      type: "ADD_NEW_TEMPLATE_ORG_FILE_AVAILABILITY";
      templateId: number;
    }
  | {
      type: "REMOVE_TEMPLATE_ORG_FILE_AVAILABILITY";
      templateId: number;
      orgFileAvailabilityIndex: number;
    }
  | {
      type: "ADD_NEW_TEMPLATE_HEADER_PATH";
      templateId: number;
    }
  | {
      type: "REMOVE_TEMPLATE_HEADER_PATH";
      templateId: number;
      headerPathIndex: number;
    }
  | {
      type: "DELETE_TEMPLATE";
      templateId: number;
    }
  | UpdateOrgCaptureAction;

export type ReorderOrgCaptureTemplateAction = {
  type: "REORDER_CAPTURE_TEMPLATE";
  fromIndex: number;
  toIndex: number;
};

export type RestoreOrgCaptureAction = {
  type: "RESTORE_CAPTURE_SETTINGS";
  newSettings: Record<string, string>;
};

export type OrgCaptureAction =
  | {
      type: "ADD_NEW_EMPTY_CAPTURE_TEMPLATE";
    }
  | RestoreOrgCaptureAction
  | ReorderOrgCaptureTemplateAction
  | OrgCaptureUpdateAction;

export type BaseAction =
  | {
      type: "SET_LOADING_MESSAGE";
      loadingMessage: string | undefined;
    }
  | {
      type: "HIDE_LOADING_MESSAGE";
    }
  | {
      type: "SET_IS_LOADING";
      isLoading: Set<string>;
      path: string;
    }
  | {
      type: "SET_IS_ONLINE";
      online: boolean;
    }
  | {
      type: "SET_LAST_VIEWED_FILE";
      lastViewedPath: string;
    }
  | {
      type: "SET_FONT_SIZE";
      newFontSize: number;
    }
  | {
      type: "SET_BULLET_STYLE";
      newBulletStyle: BulletStyle;
    }
  | {
      type: "SET_SHOULD_TAP_TODO_TO_ADVANCE";
      newShouldTapTodoToAdvance: boolean;
    }
  | {
      type: "SET_AGENDA_DEFAULT_DEADLINE_DELAY_UNIT";
      newAgendaDefaultDeadlineDelayUnit: DelayUnit;
    }
  | {
      type: "SET_AGENDA_DEFAULT_DEADLINE_DELAY_VALUE";
      newAgendaDefaultDeadlineDelayValue: number;
    }
  | {
      type: "SET_EDITOR_DESCRIPTION_HEIGHT_VALUE";
      newEditorDescriptionHeightValue: number;
    }
  | {
      type: "SET_AGENDA_START_ON_WEEKDAY";
      newAgendaStartOnWeekday: boolean;
    }
  | {
      type: "SET_SHOULD_LIVE_SYNC";
      shouldLiveSync: boolean;
    }
  | {
      type: "SET_SHOW_DEADLINE_DISPLAY";
      showDeadlineDisplay: boolean;
    }
  | {
      type: "SET_SHOULD_SYNC_ON_BECOMING_VISIBLE";
      shouldSyncOnBecomingVisibile: boolean;
    }
  | {
      type: "SET_SHOULD_SHOW_TITLE_IN_ORG_FILE";
      shouldShowTitleInOrgFile: boolean;
    }
  | {
      type: "SET_SHOULD_LOG_INTO_DRAWER";
      shouldLogIntoDrawer: boolean;
    }
  | {
      type: "SET_CLOSE_SUBHEADERS_RECURSIVELY";
      closeSubheadersRecursively: boolean;
    }
  | {
      type: "SET_SHOULD_NOT_INDENT_ON_EXPORT";
      shouldNotIndentOnExport: boolean;
    }
  | {
      type: "SET_SHOULD_STORE_SETTINGS_IN_SYNC_BACKEND";
      newShouldStoreSettingsInSyncBackend: boolean;
    }
  | {
      type: "SET_COLOR_SCHEME";
      colorScheme: string;
    }
  | {
      type: "SET_THEME";
      theme: string;
    }
  | {
      type: "SET_CUSTOM_KEYBINDING";
      keybindingName: string;
      keybinding: string;
    }
  | {
      type: "RESTORE_BASE_SETTINGS";
      newSettings: Record<string, string>;
    }
  | {
      type: "PUSH_MODAL_PAGE";
      modalPage: ModalPage;
    }
  | {
      type: "POP_MODAL_PAGE";
    }
  | {
      type: "CLEAR_MODAL_STACK";
    }
  | {
      type: "ACTIVATE_POPUP";
      popupType: PopupType;
      data: Record<string, string>;
    }
  | {
      type: "CLOSE_POPUP";
    }
  | {
      type: "SET_AGENDA_TIMEFRAME";
      agendaTimeframe: AgendaTimeframe;
    }
  | {
      type: "SET_FINDER_TAB";
      finderTab: FinderTab;
    }
  | {
      type: "PREFER_EDIT_RAW_VALUES";
      preferEditRawValues: boolean;
    }
  | {
      type: "SET_HAS_UNSEEN_CHANGELOG";
      newHasUnseenChangelog: boolean;
    }
  | {
      type: "SET_LAST_SEEN_CHANGELOG_HEADER";
      newLastSeenChangelogHash: string;
    };

export type ReduxAction =
  | SyncBackendAction
  | BaseAction
  | OrgCaptureAction
  | OrgAction;

export type OrgCaptureTemplate = {
  id: number;
  description: string;
  letter: string;
  iconName: string;
  isAvailableInAllOrgFiles: boolean;
  file: string;
  orgFilesWhereAvailable: List<string>;
  headerPaths: List<string>;
  shouldPrepend: boolean;
  template: string;
};
const defaultOrgCaptureTemplate: OrgCaptureTemplate = {
  id: 0,
  description: "",
  letter: "",
  iconName: "",
  isAvailableInAllOrgFiles: false,
  file: "",
  orgFilesWhereAvailable: List(),
  headerPaths: List(),
  shouldPrepend: false,
  template: "",
};

export const makeOrgCaptureTemplateRecord: ImmutableRecord.Factory<OrgCaptureTemplate> =
  ImmutableRecord(defaultOrgCaptureTemplate);
export type OrgCaptureTemplateRecord = ImmutableRecord<OrgCaptureTemplate>;

export type SyncBackendState = {
  isAuthenticated: boolean;
  client: Client | undefined;
  currentFileBrowserDirectoryListing: DirectoryListingRecord;
  currentPath: string;
};
const defaultSyncBackendState: SyncBackendState = {
  isAuthenticated: false,
  client: undefined,
  currentFileBrowserDirectoryListing: makeDirectoryListingRecord(),
  currentPath: "",
};

export const makeSyncBackendStateRecord: ImmutableRecord.Factory<SyncBackendState> =
  ImmutableRecord(defaultSyncBackendState);
export type SyncBackendStateRecord = ImmutableRecord<SyncBackendState>;

export type OrgCaptureState = {
  captureTemplates: List<OrgCaptureTemplateRecord>;
};
const defaultOrgCaptureState: OrgCaptureState = {
  captureTemplates: List(),
};

export const makeOrgCaptureStateRecord: ImmutableRecord.Factory<OrgCaptureState> =
  ImmutableRecord(defaultOrgCaptureState);
export type OrgCaptureStateRecord = ImmutableRecord<OrgCaptureState>;

export type Popup = { type: PopupType; data: Map<string, string> };
const defaultPopup: Popup = {
  type: "deadline-editor",
  data: Map(),
};

export const makePopupRecord: ImmutableRecord.Factory<Popup> =
  ImmutableRecord(defaultPopup);
export type PopupRecord = ImmutableRecord<Popup>;

export type BaseState = {
  loadingMessage: string | undefined;
  fontSize: number;
  bulletStyle: BulletStyle;
  shouldTapTodoToAdvance: boolean;
  agendaDefaultDeadlineDelayUnit: DelayUnit;
  agendaDefaultDeadlineDelayValue: number;
  editorDescriptionHeightValue: number;
  agendaStartOnWeekday: boolean;
  shouldStoreSettingsInSyncBackend: boolean;
  shouldLiveSync: boolean;
  showDeadlineDisplay: boolean;
  shouldSyncOnBecomingVisibile: boolean;
  shouldShowTitleInOrgFile: boolean;
  shouldLogIntoDrawer: boolean;
  closeSubheadersRecursively: boolean;
  shouldNotIndentOnExport: boolean;
  hasUnseenChangelog: boolean;
  lastSeenChangelogHash: string;
  lastViewedPath: string;
  customKeybindings: Map<string, string>;
  modalPageStack: List<ModalPage>;
  activePopup: PopupRecord | undefined;
  isLoading: Set<string>;
  online: boolean;
  agendaTimeframe: AgendaTimeframe;
  finderTab: FinderTab;
  preferEditRawValues: boolean;
  colorScheme: string;
  theme: string;
};
const defaultBaseState: BaseState = {
  loadingMessage: undefined,
  fontSize: 0,
  bulletStyle: "Fancy",
  shouldTapTodoToAdvance: false,
  agendaDefaultDeadlineDelayUnit: "h",
  agendaDefaultDeadlineDelayValue: 0,
  editorDescriptionHeightValue: 0,
  agendaStartOnWeekday: false,
  shouldStoreSettingsInSyncBackend: false,
  shouldLiveSync: false,
  showDeadlineDisplay: false,
  shouldSyncOnBecomingVisibile: false,
  shouldShowTitleInOrgFile: false,
  shouldLogIntoDrawer: false,
  closeSubheadersRecursively: false,
  shouldNotIndentOnExport: false,
  hasUnseenChangelog: false,
  lastSeenChangelogHash: "",
  lastViewedPath: "",
  customKeybindings: Map(),
  modalPageStack: List(),
  activePopup: undefined,
  isLoading: Set(),
  online: false,
  agendaTimeframe: "Week",
  finderTab: "Search",
  preferEditRawValues: false,
  colorScheme: "",
  theme: "",
};

export const makeBaseStateRecord: ImmutableRecord.Factory<BaseState> =
  ImmutableRecord(defaultBaseState);
export type BaseStateRecord = ImmutableRecord<BaseState>;

export type OrgState = {
  path: string;
  files: List<OrgFileRecord>;
  search: SearchRecord;
  opennessState: boolean;
  pendingCapture: PendingCaptureRecord;
  fileSettings: List<FileSettingRecord>;
  bookmarks: List<string>;
  orgFileErrorMessage: string;
  showClockDisplay: boolean;
  fileConfigLines: List<string>;
};
const defaultOrgState: OrgState = {
  path: "",
  files: List(),
  search: makeSearchRecord(),
  opennessState: false,
  pendingCapture: makePendingCaptureRecord(),
  fileSettings: List(),
  bookmarks: List(),
  orgFileErrorMessage: "",
  showClockDisplay: false,
  fileConfigLines: List(),
};

export const makeOrgStateRecord: ImmutableRecord.Factory<OrgState> =
  ImmutableRecord(defaultOrgState);
export type OrgStateRecord = ImmutableRecord<OrgState>;

export type State = {
  base: BaseStateRecord;
  syncBackend: SyncBackendStateRecord;
  org: {
    past: List<OrgStateRecord>;
    present: OrgStateRecord;
    future: List<OrgStateRecord>;
  };
  capture: OrgCaptureStateRecord;
};
const defaultState: State = {
  base: makeBaseStateRecord(),
  syncBackend: makeSyncBackendStateRecord(),
  org: {
    past: List(),
    present: makeOrgStateRecord(),
    future: List(),
  },
  capture: makeOrgCaptureStateRecord(),
};

export const makeStateRecord: ImmutableRecord.Factory<State> =
  ImmutableRecord(defaultState);
export type StateRecord = ImmutableRecord<State>;
