import { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import {
  IQueueTracksEventData,
  IQueueTracksEventDataWithReplace,
} from "@types";
import App from "./App";
import { PlayerTab } from "@components/player/exports";
import TopFrame from "@components/TopFrame";
import "./css/base.css";
import { useAppDispatch } from "./redux/hooks";
import { importIntoLibrary, initLibrary } from "@redux/exports";
import { store } from "./redux/store";
import { MemoryRouter } from "react-router-dom";
import { ContextMenu } from "@components/context-menu/exports";
import { Toaster } from "react-hot-toast";
import AppConstants from "@root/data";

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

      <ContextMenu />
      <App />
      <PlayerTab />
    </>
  );
}
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);

  window.utils = {
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
    skipToQueueIndex: (data: number) => {
      document.dispatchEvent(
        new CustomEvent<number>(AppConstants.RENDERER_EVENT_SKIP_TO_INDEX, {
          detail: data,
        })
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
