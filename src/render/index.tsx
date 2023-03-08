import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { IPlayTrackEventData, IQueueTrackEventData } from "../types";
import App from "./App";
import NotificationContainer from "./components/NotificationContainer";
import PlayerTab from "./components/PlayerTab";
import TopFrame from "./components/TopFrame";
import "./css/base.css";
import { useAppDispatch } from "./redux/hooks";
import { initLibrary } from "./redux/slices/library";
import { store } from "./redux/store";
import { MemoryRouter } from "react-router-dom";
import ContextMenus from "./components/ContextMenus";
import { toast, Toaster } from "react-hot-toast";

export function RootApp() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log("Loading App inital Data");
    dispatch(initLibrary()).then(() => {
      toast.success("Library loaded");
    });
  }, [dispatch]);

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
