import { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { IPlayTrackEventData, IQueueTrackEventData } from "../types";
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
    playTrack: async (data: IPlayTrackEventData) => {
      document.dispatchEvent(
        new CustomEvent<IPlayTrackEventData>("custom-play-track", {
          detail: data,
        })
      );
    },
    queueTracks: async (data: IQueueTrackEventData) => {
      document.dispatchEvent(
        new CustomEvent<IQueueTrackEventData>("custom-queue-track", {
          detail: data,
        })
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    addTracksToLater: async (_data) => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    addTracksToNext: async (_data) => {},
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
