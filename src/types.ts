import { List } from "immutable";
import type { MapOf } from "immutable";

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export type ClientType = "WebDAV" | "Dropbox" | "GitLab";

export type DirectoryListingEntry = {
  id: string;
  name: string;
  isDirectory: boolean;
  path: string | undefined;
};

export type AdditionalSyncBackendState = {
  cursor: string;
};

export interface DirectoryListing {
  listing: List<MapOf<DirectoryListingEntry>>;
  hasMore: boolean;
  isLoadingMore?: boolean;
  additionalSyncBackendState: MapOf<AdditionalSyncBackendState>;
}


export interface Client {
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
}

export type SyncBackend = {
  isAuthenticated: boolean;
  client: Client | null;
  currentFileBrowserDirectoryListing: DirectoryListing;
  currentPath: string;
};

export type SyncBackendAction =
  | { type: "SIGN_OUT" }
  | {
      type: "SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING";
      directoryListing: DirectoryListing;
      hasMore: boolean;
      additionalSyncBackendState: AdditionalSyncBackendState;
      path: string;
    }
  | { type: "SET_IS_LOADING_MORE_DIRECTORY_LISTING"; isLoadingMore: boolean };

export type BaseAction =
  | { type: "SET_LOADING_MESSAGE"; loadingMessage: string }
  | { type: "HIDE_LOADING_MESSAGE" }
  | { type: "SET_IS_LOADING"; isLoading: boolean; path: string }
  | { type: "SET_IS_ONLINE"; online: boolean }
  | { type: "SET_LAST_VIEWED_FILE"; lastViewedPath: string }
  | { type: "SET_FONT_SIZE"; newFontSize: number }
  | { type: "SET_BULLET_STYLE"; newBulletStyle: string }
  | {
      type: "SET_SHOULD_TAP_TODO_TO_ADVANCE";
      newShouldTapTodoToAdvance: boolean;
    }
  | {
      type: "SET_AGENDA_DEFAULT_DEADLINE_DELAY_UNIT";
      newAgendaDefaultDeadlineDelayUnit: string;
    }
  | {
      type: "SET_AGENDA_DEFAULT_DEADLINE_DELAY_VALUE";
      newAgendaDefaultDeadlineDelayValue: number;
    }
  | {
      type: "SET_EDITOR_DESCRIPTION_HEIGHT_VALUE";
      newEditorDescriptionHeightValue: number;
    }
  | { type: "SET_AGENDA_START_ON_WEEKDAY"; newAgendaStartOnWeekday: boolean }
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
    };

export type Action = SyncBackendAction | BaseAction;
