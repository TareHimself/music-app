import "./css/base.css";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import NotificationContainer from "./components/NotificationContainer";
import PlayerTab from "./components/PlayerTab";
import TopFrame from "./components/TopFrame";
import { store } from "./redux/store";
import { IPlayTrackEventData, IQueueTrackEventData } from "../types";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { loadAlbums, setAlbumsStatus } from "./redux/slices/albums";

export function RootApp() {
  const dispatch = useAppDispatch();
  const albumsStatus = useAppSelector((s) => s.albums.status);
  useEffect(() => {
    if (albumsStatus === "empty") {
      console.log("Running use Effect");
      dispatch(setAlbumsStatus("loading"));
      dispatch(loadAlbums());
    }
  }, [dispatch]);

  return (
    <>
      <TopFrame />
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
    queueTrack: async (data: IQueueTrackEventData) => {
      document.dispatchEvent(
        new CustomEvent<IQueueTrackEventData>("custom-queue-track", {
          detail: data,
        })
      );
    },
  };

  root.render(
    <StrictMode>
      <Provider store={store}>
        <RootApp />
      </Provider>
    </StrictMode>
  );
}
