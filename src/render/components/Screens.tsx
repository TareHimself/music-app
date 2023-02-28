import { Route, Routes, Navigate } from "react-router-dom";
import AppConstants from "../../data";
import AlbumScreen from "./screens/AlbumScreen";
import ImportScreen from "./screens/ImportScreen";
import LibraryScreen from "./screens/LibraryScreen";
import PlaylistScreen from "./screens/PlaylistScreen";
import SearchScreen from "./screens/SearchScreen";
import SettingsScreen from "./screens/SettingsScreen";

export default function Screens() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={AppConstants.NAV_ID_LIBRARY} replace />}
      />
      <Route path={AppConstants.NAV_ID_LIBRARY} element={<LibraryScreen />} />
      <Route path={AppConstants.NAV_ID_SEARCH} element={<SearchScreen />} />
      <Route path={AppConstants.NAV_ID_SETTINGS} element={<SettingsScreen />} />
      <Route path={AppConstants.NAV_ID_IMPORT} element={<ImportScreen />} />
      <Route path={"/playlist/*"} element={<PlaylistScreen />} />
      <Route path={"/album/*"} element={<AlbumScreen />} />
    </Routes>
  );
}
