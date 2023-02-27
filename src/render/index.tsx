import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { IPlayTrackEventData, IQueueTrackEventData } from "../types";
import App from "./App";
import NotificationContainer from "./components/NotificationContainer";
import PlayerTab from "./components/PlayerTab";
import TopFrame from "./components/TopFrame";
import "./css/base.css";
import { useAppDispatch } from "./redux/hooks";
import { initApp } from "./redux/slices/app";
import { store } from "./redux/store";
import { MemoryRouter } from 'react-router-dom'

export function RootApp() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log("Loading App inital Data");
    dispatch(initApp());
  }, []);

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
    <MemoryRouter>
      <Provider store={store}>
        <RootApp />
      </Provider>
    </MemoryRouter>
  );
}
