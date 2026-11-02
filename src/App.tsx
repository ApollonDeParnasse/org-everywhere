import React, { useMemo } from "react";
import { Provider } from "react-redux";
import Store from "./store";
import parseQueryString from "./util/parse_query_string";
import {
  readInitialState,
  loadSettingsFromConfigFile,
  subscribeToChanges,
  getPersistedField,
} from "./util/settings_persister";
import runAllMigrations from "./migrations";
import { BrowserRouter } from "react-router-dom";
import { DragDropContext } from "react-beautiful-dnd";
import { reorderCaptureTemplate } from "./actions/capture";
import {
  reorderTags,
  reorderPropertyList,
  reorderFileSetting,
} from "./actions/org";
import { signOut } from "./actions/sync_backend";
import {
  setDisappearingLoadingMessage,
  restoreStaticFile,
} from "./actions/base";
import createDropboxSyncBackendClient from "./sync_backend_clients/dropbox_sync_backend_client";
import createWebDAVSyncBackendClient from "./sync_backend_clients/webdav_sync_backend_client";
import createGitLabSyncBackendClient, {
  createGitlabOAuth,
} from "./sync_backend_clients/gitlab_sync_backend_client";
import "./base.css";
import Turnout from "./components/Turnout";
import {
  listenToBrowserButtons,
  syncOnBecomingVisible,
  listenToNetworkConnectionEvents,
} from "./lib/initial_setup";
import { Map } from "immutable";
import { configure } from "react-hotkeys";
import type { OAuth2AuthCodePKCE } from "@bity/oauth2-auth-code-pkce";
// do handle hotkeys even if they come from within 'input', 'select' or 'textarea'
configure({
  ignoreTags: [],
});

const handleGitLabAuthResponse = async (oauthClient: OAuth2AuthCodePKCE): Promise<void> => {
  let success = false;
  try {
    success = await oauthClient.isReturningFromAuthServer();
    await oauthClient.getAccessToken();
  } catch {
    success = false;
  }
  if (!success) {
    // Edge case: somehow OAuth success redirect occurred but there isn't a code in
    // the current location's search params. This /shouldn't/ happen in practice.
    alert("Unexpected sign in error, please try again");
    return;
  }
  const syncClient = createGitLabSyncBackendClient(oauthClient);
  const isAccessible = await syncClient.isProjectAccessible();
  if (!isAccessible) {
    alert("Failed to access GitLab project - is the URL correct?");
  } else {
    window.location.search = "";
  }
};

type InitialCaptureState = {
  capturePath: string;
  captureTemplateName: string;
  captureContent: string;
  customCaptureVariables: Map<string, string>
}

const getInitialCaptureState = (): InitialCaptureState | null => {
  const CUSTOM_VARIABLE_PREFIX = "captureVariable_";
  const queryStringContents = parseQueryString(window.location.search);
  if (Object.keys(queryStringContents).length === 0) {
    return null
  }
  console.log("query: ", queryStringContents)
  const { captureFile, captureTemplateName, captureContent } =
    queryStringContents;
  const capturePath = captureFile.startsWith("/")
    ? captureFile
    : `/${captureFile}`;

  const captureVars: Array<[string, string]> = Object.entries(queryStringContents)
    .map(([key, value]: [string, string]): [string, string] | null => {
      if (key.startsWith(CUSTOM_VARIABLE_PREFIX)) {
        return [key.substring(CUSTOM_VARIABLE_PREFIX.length), value];
      }
      return null;
    })
    .filter((item) => !!item)

  const customCaptureVariables: Map<string, string> = Map(captureVars)

  if (!!captureFile && !!captureTemplateName) {
    return {
      capturePath,
      captureTemplateName,
      captureContent,
      customCaptureVariables
    }
  }
  return null
}

const App = () => {

  const store = useMemo(() => {
    runAllMigrations();
    const initialState = readInitialState();

    const authenticatedSyncService = getPersistedField(
      "authenticatedSyncService",
      true,
    );
    let client = null;

    if (!!authenticatedSyncService) {
      switch (authenticatedSyncService) {
        case "Dropbox":
          client = createDropboxSyncBackendClient();
          initialState.syncBackend = Map({
            isAuthenticated: true,
            client: client,
          });
          break;
        case "GitLab":
          const gitlabOAuth = createGitlabOAuth();
          if (gitlabOAuth.isAuthorized()) {
            client = createGitLabSyncBackendClient(gitlabOAuth);
            initialState.syncBackend = Map({
              isAuthenticated: true,
              client,
            });
          } else {
            handleGitLabAuthResponse(gitlabOAuth);
          }
          break;
        case "WebDAV":
          client = createWebDAVSyncBackendClient(
            getPersistedField("webdavEndpoint"),
            getPersistedField("webdavUsername"),
            getPersistedField("webdavPassword"),
          );
          initialState.syncBackend = Map({
            isAuthenticated: true,
            client,
          });
          break;
        default:
      }
    }


    const initialCaptureState = getInitialCaptureState()
    if (initialCaptureState) {
      initialState.org.present = initialState.org.present.set(
        "pendingCapture",
        Map(initialCaptureState),
      );
    }

    const store = Store(initialState);
    store.subscribe(subscribeToChanges(store));

    if (!!client) {
      client.isSignedIn().then((isSignedIn) => {
        if (isSignedIn) {
          loadSettingsFromConfigFile(store.dispatch, store.getState);
        } else {
          store.dispatch(signOut());
        }
      });
    } else {
      if (!!store.getState().org.present.get("pendingCapture")) {
        store.dispatch(
          setDisappearingLoadingMessage(
            `You need to sign in before you can use capture templates`,
            5000,
          ),
        );
      }
    }

    // Load static files.
    store.dispatch(restoreStaticFile("sample"));

    listenToBrowserButtons(store);
    syncOnBecomingVisible(store);
    listenToNetworkConnectionEvents(store);
    return store
  }, [])

  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    if (result.type === "TAG") {
      store.dispatch(
        reorderTags(result.source.index, result.destination.index),
      );
    } else if (result.type === "PROPERTY-LIST") {
      store.dispatch(
        reorderPropertyList(result.source.index, result.destination.index),
      );
    } else if (result.type === "CAPTURE-TEMPLATE") {
      store.dispatch(
        reorderCaptureTemplate(result.source.index, result.destination.index),
      );
    } else if (result.type === "FILE-SETTING") {
      store.dispatch(
        reorderFileSetting(result.source.index, result.destination.index),
      );
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <BrowserRouter basename={"/org-everywhere"}>
        <Provider store={store}>
          <Turnout />
        </Provider>
      </BrowserRouter>
    </DragDropContext>
  );
};
export default App;
