import { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import {
  IPlayTrackEventData,
  IQueueTracksEventData,
  IQueueTracksEventDataWithReplace,
} from "../types";
import App from "./App";
import NotificationContainer from "./components/NotificationContainer";
import PlayerTab from "./components/PlayerTab";
import TopFrame from "./components/TopFrame";
import "./css/base.css";
import { useAppDispatch } from "./redux/hooks";
import { importIntoLibrary, initLibrary } from "./redux/slices/library";
import { store } from "./redux/store";
import { MemoryRouter } from "react-router-dom";
import ContextMenus from "./components/ContextMenus";
import { Toaster } from "react-hot-toast";
import AppConstants from "../data";

export function RootApp() {
  const dispatch = useAppDispatch();

  const onImportFromMain = useCallback(
    (items: string) => {
      dispatch(
        importIntoLibrary({
          items: items.split(","),
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    console.log("Loading App inital Data");
    dispatch(initLibrary());
  }, [dispatch]);

  useEffect(() => {
    window.bridge.onFromMain("onImport", onImportFromMain);
    return () => {
      window.bridge.offFromMain("onImport", onImportFromMain);
    };
  }, [onImportFromMain]);

  return (
    <>
      {window.bridge?.getPlatform() === "win32" && <TopFrame />}

      <ContextMenus />
      <App />
      <PlayerTab />
      <NotificationContainer />
    </>
  );
}
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);

  window.utils = {
    playTrack: (data: IPlayTrackEventData) => {
      document.dispatchEvent(
        new CustomEvent<IPlayTrackEventData>(
          AppConstants.RENDERER_EVENT_PLAY_SINGLE,
          {
            detail: data,
          }
        )
      );
    },
    queueTracks: (data: IQueueTracksEventDataWithReplace) => {
      document.dispatchEvent(
        new CustomEvent<IQueueTracksEventDataWithReplace>(
          AppConstants.RENDERER_EVENT_QUEUE_TRACKS,
          {
            detail: data,
          }
        )
      );
    },
    playLater: (data) => {
      document.dispatchEvent(
        new CustomEvent<IQueueTracksEventData>(
          AppConstants.RENDERER_EVENT_PLAY_LATER,
          {
            detail: data,
          }
        )
      );
    },
    playNext: (data) => {
      document.dispatchEvent(
        new CustomEvent<IQueueTracksEventData>(
          AppConstants.RENDERER_EVENT_PLAY_NEXT,
          {
            detail: data,
          }
        )
      );
    },
  };

  root.render(
    <MemoryRouter>
      <Provider store={store}>
        <Toaster
          position="bottom-center"
          reverseOrder={true}
          containerStyle={{
            bottom: 100,
          }}
          toastOptions={{
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          }}
        />

        <RootApp />
      </Provider>
    </MemoryRouter>
  );
}
