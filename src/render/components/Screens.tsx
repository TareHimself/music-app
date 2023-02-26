import AppConstants from "../../data";
import { useAppSelector } from "../redux/hooks";
import AlbumScreen from "./screens/AlbumScreen";
import ImportScreen from "./screens/ImportScreen";
import LibraryScreen from "./screens/LibraryScreen";
import PlaylistScreen from "./screens/PlaylistScreen";
import SearchScreen from "./screens/SearchScreen";
import SettingsScreen from "./screens/SettingsScreen";

export default function Screens() {
  const currentScreenId = useAppSelector((s) => s.app.data.screenId);
  if (currentScreenId === AppConstants.NAV_ID_SEARCH) {
    return <SearchScreen />;
  } else if (currentScreenId === AppConstants.NAV_ID_LIBRARY) {
    return <LibraryScreen />;
  } else if (currentScreenId === AppConstants.NAV_ID_SETTINGS) {
    return <SettingsScreen />;
  } else if (currentScreenId === AppConstants.NAV_ID_IMPORT) {
    return <ImportScreen />;
  } else if (currentScreenId.startsWith("playlist-")) {
    return <PlaylistScreen />;
  } else if (currentScreenId.startsWith("album-")) {
    return <AlbumScreen />;
  }

  return <div id="screens" />;
}
