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
import AppConstants from "@root/data";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
    window.bridge.on("onImport", onImportFromMain);
    return () => {
      window.bridge.off("onImport", onImportFromMain);
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
    skipCurrentTrack: () => {
      document.dispatchEvent(
        new CustomEvent<null>(AppConstants.RENDERER_EVENT_SKIP_CURRENT_TRACK, {
          detail: null,
        })
      );
    },
  };

  root.render(
    <MemoryRouter>
      <Provider store={store}>
        <ToastContainer
          position="bottom-center"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          limit={5}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={false}
          pauseOnHover={false}
          theme="dark"
          style={{
            bottom: "100px",
          }}
        />
        <RootApp />
      </Provider>
    </MemoryRouter>
  );
}
