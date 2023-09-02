
import { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import {
  IAlbum,
  IQueueTracksEventData,
  IQueueTracksEventDataWithReplace,
  ITrack,
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
// import { ToastContainer } from "react-toastify";
import { ToastContainer, toast} from './react-basic-toast'
import './react-basic-toast/styles.css'
import { addVirtualAlbums, addVirtualArtists, addVirtualTracks } from "@redux/slices/virtualLibrary";
// import "react-toastify/dist/ReactToastify.css";
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
    window.utils.virtualTrackTest = () => {
      console.log("Adding virtual data")
      dispatch(addVirtualArtists([{
        id: "xyz",
        name: "Oyintare Ebelo"
      }]))
      
      dispatch(addVirtualAlbums([{
        id: "xyzxyz",
        tracks: ["ttyt"],
        title: "Virtual Album Test",
        cover: "https://c4.wallpaperflare.com/wallpaper/760/955/638/artwork-landscape-sky-mountains-wallpaper-preview.jpg",
        released: 2020,
        artists: ["xyz"],
        genre: "Rege"
      }]))
      
      dispatch(addVirtualTracks([{
        id: "ttyt",
        title: "Ashniko Daisy",
        album: "xyzxyz",
        uri: "https://www.youtube.com/watch?v=32R3MHhW1sQ",
        artists: ["xyz"],
        duration: 0,
        position: 0
      }]))

      console.log("Adding track to play next")
      setTimeout(()=>{
        window.utils.playNext({
          tracks: ['ttyt']
        })
      },1000)
    }
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
    toast: toast,
    virtualTrackTest: () => {
      console.log("hello")
    },
  };

  root.render(
    <MemoryRouter>
      <Provider store={store}>
        
        {/* <ToastContainer
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
            
          }}
        /> */}
        <RootApp />
        <ToastContainer style={{bottom: "100px"}}/>
      </Provider>
    </MemoryRouter>
  );
}
