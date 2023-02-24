import AppConstants from "../../data";
import { useAppSelector } from "../redux/hooks";
import AlbumScreen from "./screens/AlbumScreen";
import LibraryScreen from "./screens/LibraryScreen";
import PlaylistScreen from "./screens/PlaylistScreen";
import SearchScreen from "./screens/SearchScreen";


export default function Screens() {
  const currentScreenId = useAppSelector(s => s.app.data.screenId);
  if (currentScreenId === AppConstants.MAIN_NAV_IDS[0]) {
    return <SearchScreen />
  } else if (currentScreenId === AppConstants.MAIN_NAV_IDS[1]) {
    return <LibraryScreen />
  } else if (currentScreenId.startsWith('playlist-')) {
    return <PlaylistScreen />
  } else if (currentScreenId.startsWith('album-')) {
    return <AlbumScreen />
  }

  return <div id="screens" />;
}
