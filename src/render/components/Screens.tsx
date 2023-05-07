import { Route, Routes, Navigate } from "react-router-dom";
import AppConstants from "@root/data";
import {
  AlbumScreen,
  LibraryScreen,
  PlaylistScreen,
  QueueScreen,
  VisualizerScreen,
  SettingsScreen,
} from "@components/screens/exports";

export default function Screens() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={AppConstants.NAV_ID_LIBRARY} replace />}
      />
      <Route path={AppConstants.NAV_ID_LIBRARY} element={<LibraryScreen />} />
      <Route path={AppConstants.NAV_ID_SETTINGS} element={<SettingsScreen />} />
      <Route
        path={AppConstants.NAV_ID_VISUALIZER}
        element={<VisualizerScreen />}
      />
      <Route path={AppConstants.NAV_ID_QUEUE} element={<QueueScreen />} />
      <Route path={"/playlist/*"} element={<PlaylistScreen />} />
      <Route path={"/album/*"} element={<AlbumScreen />} />
    </Routes>
  );
}
