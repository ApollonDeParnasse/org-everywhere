import { List } from 'immutable'
import type { MapOf } from 'immutable'


export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export type ClientType =  "WebDAV" | "Dropbox" | "Gitlab";

export type DirectoryListingEntry = {
  id: string;
  name: string;
  isDirectory: boolean;
  path: string | undefined;
}


export type AdditionalSyncBackendState = {
  cursor: string 
}

export interface DirectoryListing {
  listing: List<MapOf<DirectoryListingEntry>>;
  hasMore: boolean;
  additionalSyncBackendState: MapOf<AdditionalSyncBackendState>;
}

export interface Client {
  type: ClientType;
  isSignedIn: () => Promise<boolean>;
  getDirectoryListing: (path: string) => Promise<DirectoryListing>;
  getMoreDirectoryListing: (additionalSyncBackendState: MapOf<AdditionalSyncBackendState>) => Promise<DirectoryListing>;
  updateFile: (path: string, contents: string) => Promise<any>;
  createFile: (path: string, contents: string) => Promise<any>;
  getFileContentsAndMetadata: (path: string) => Promise<{contents: string, lastModifiedAt: string}>;
  getFileContents: (path: string) => Promise<string>;
  deleteFile: (path: string) => Promise<any>
}


export interface syncBackend {
  isAuthenticated: boolean,
  client: Client
}

