/* global process */
import { Dropbox, DropboxAuth } from "dropbox";
import { Map, List } from "immutable";
import { isEmpty, isString, property } from "lodash/fp";
import type { MapOf } from "immutable";
import type { DropboxResponse, files, DropboxResponseError } from "dropbox";
import type {
  Client,
  DirectoryListing,
  DirectoryListingEntry,
  AdditionalSyncBackendState,
} from "../types";
import { orgFileExtensions } from "../lib/org_utils";
import { persistField, getPersistedField } from "../util/settings_persister";
import parseQueryString from "../util/parse_query_string";

export interface DropboxFileMetadata extends files.FileMetadata {
  fileBlob?: Blob;
}
export type DropboxMetadata =
  | files.FileMetadataReference
  | files.FolderMetadataReference
  | files.DeletedMetadataReference;
export type DropboxFileReference =
  | files.FileMetadataReference
  | files.FolderMetadataReference;

/**
 * Gets a directory listing ready to be rendered by org-everywhere.
 *  - Filters files from `listing` down to org files.
 *  - Sorts folders atop of files.
 *  - Sorts both folders and files alphabetically.
 * @param {Array} listing
 */

/**
 * Gets a directory listing ready to be rendered by org-everywhere.
 *  - Filters files from `listing` down to org files.
 *  - Sorts folders atop of files.
 *  - Sorts both folders and files alphabetically.
 */
export const filterAndSortDirectoryListing = (
  listing: Array<DropboxMetadata>,
): Array<DropboxFileReference> => {
  const filteredListing: Array<DropboxFileReference> = listing.filter<
    files.FileMetadataReference | files.FolderMetadataReference
  >((file: DropboxMetadata): file is DropboxFileReference => {
    // Show all folders
    if (file[".tag"] === "folder") {
      return true;
    }
    // Filter out all non-org files
    if (file[".tag"] === "file" && file.name.match(orgFileExtensions)) {
      return true;
    }
    return false;
  });
  return filteredListing.sort((a, b) => {
    // Folders before files
    if (a[".tag"] === "folder" && b[".tag"] === "file") {
      return -1;
    } else {
      // Sorth both folders and files alphabetically
      return a.name > b.name ? 1 : -1;
    }
  });
};

function getCodeFromUrl(): string {
  return parseQueryString(window.location.search).code;
}

export default (): Client => {
  let dbxPromise: Promise<Dropbox>;

  const isSignedIn: () => Promise<boolean> = () =>
    new Promise((resolve) => resolve(true));

  const transformDirectoryListing = (
    listing: Array<DropboxMetadata>,
  ): List<MapOf<DirectoryListingEntry>> => {
    const sortedListing: Array<DropboxFileReference> =
      filterAndSortDirectoryListing(listing);
    return List(
      sortedListing.map(
        (entry: DropboxFileReference): MapOf<DirectoryListingEntry> =>
          Map({
            id: entry.id,
            name: entry.name,
            isDirectory: entry[".tag"] === "folder",
            path: entry.path_display,
          }),
      ),
    );
  };

  const getDirectoryListing = (path: string): Promise<DirectoryListing> =>
    new Promise((resolve, reject) => {
      dbxPromise
        .then((dbx: Dropbox) => {
          dbx
            .filesListFolder({ path })
            .then((response: DropboxResponse<files.ListFolderResult>) => {
              resolve({
                listing: transformDirectoryListing(response.result.entries),
                hasMore: response.result.has_more,
                additionalSyncBackendState: Map({
                  cursor: response.result.cursor,
                }),
              });
            });
        })
        .catch(reject);
    });

  const getMoreDirectoryListing = (
    additionalSyncBackendState: MapOf<AdditionalSyncBackendState>,
  ): Promise<DirectoryListing> => {
    const cursor = additionalSyncBackendState.get("cursor");
    return new Promise((resolve, reject) =>
      dbxPromise
        .then((dbx) => {
          if (cursor) {
            dbx
              .filesListFolderContinue({ cursor })
              .then((response: DropboxResponse<files.ListFolderResult>) =>
                resolve({
                  listing: transformDirectoryListing(response.result.entries),
                  hasMore: response.result.has_more,
                  additionalSyncBackendState: Map({
                    cursor: response.result.cursor,
                  }),
                }),
              );
          }
        })
        .catch(reject),
    );
  };

  const uploadFile = (path: string, contents: string) =>
    new Promise((resolve, reject) =>
      dbxPromise.then((dbx) => {
        dbx
          .filesUpload({
            path,
            contents,
            mode: {
              ".tag": "overwrite",
            },
            autorename: true,
          })
          .then(resolve)
          .catch(reject);
      }),
    );

  const updateFile = uploadFile;
  const createFile = uploadFile;

  const getFileContentsAndMetadata = (path: string) =>
    new Promise<{ contents: string; lastModifiedAt: string }>(
      (resolve, reject) =>
        dbxPromise.then((dbx) => {
          dbx
            .filesDownload({ path })
            .then((response: DropboxResponse<DropboxFileMetadata>) => {
              const reader = new FileReader();
              reader.addEventListener("loadend", () => {
                const contents = reader.result;
                resolve({
                  contents: isString(contents) ? contents : "",
                  lastModifiedAt: response.result.server_modified,
                });
              });
              const fileBlob = response.result?.fileBlob;
              fileBlob && reader.readAsText(fileBlob);
            })
            .catch((error) => {
              const objectContainsTagErrorP = (function () {
                try {
                  return (
                    JSON.parse(error.error).error.path[".tag"] === "not_found"
                  );
                } catch (e) {
                  return false;
                }
              })();
              if (
                (typeof error === "string" &&
                  error.match(/missing required field 'path'/)) ||
                objectContainsTagErrorP
              ) {
                reject();
              }
            });
        }),
    );

  const getFileContents = (path: string): Promise<string> => {
    if (isEmpty(path)) {
      return Promise.reject("No path given");
    }
    return new Promise((resolve, reject) => {
      return getFileContentsAndMetadata(path)
        .then(({ contents }) => resolve(contents))
        .catch(reject);
    });
  };

  const deleteFile = (path: string) =>
    new Promise<DropboxResponse<files.DeleteResult>>((resolve, reject) =>
      dbxPromise.then((dbx) => {
        dbx
          .filesDeleteV2({ path })
          .then(resolve)
          .catch((error: DropboxResponseError<files.DeleteError>) =>
            reject(error.error[".tag"] === "path_lookup"),
          );
      }),
    );

  const REDIRECT_URI = window.location.origin + "/org-everywhere/";

  dbxPromise = new Promise((resolve, _) => {
    const clientId = import.meta.env.VITE_REACT_APP_DROPBOX_CLIENT_ID;
    const dbxAuth = new DropboxAuth({
      clientId,
      fetch: fetch.bind(window),
    });

    const codeVerifier = getPersistedField("codeVerifier");
    codeVerifier && dbxAuth.setCodeVerifier(codeVerifier);
    if (getCodeFromUrl()) {
      dbxAuth
        .getAccessTokenFromCode(REDIRECT_URI, getCodeFromUrl())
        .then((response) => {
          const refreshToken = property(["result", "refresh_token"], response);
          refreshToken && dbxAuth.setRefreshToken(refreshToken);
          persistField("dropboxRefreshToken", refreshToken);

          resolve(new Dropbox({ auth: dbxAuth }));
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      const refreshToken = getPersistedField("dropboxRefreshToken");
      refreshToken && dbxAuth.setRefreshToken(refreshToken);
      resolve(new Dropbox({ auth: dbxAuth }));
    }
  });

  return {
    type: "Dropbox",
    isSignedIn,
    getDirectoryListing,
    getMoreDirectoryListing,
    updateFile,
    createFile,
    getFileContentsAndMetadata,
    getFileContents,
    deleteFile,
  };
};
