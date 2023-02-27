import { useCallback } from "react";
import { BsFileEarmarkMusic, BsFileEarmarkMusicFill } from "react-icons/bs";
import { MdOutlineLibraryAdd } from "react-icons/md";
import {
  RiAddCircleFill,
  RiAddCircleLine,
  RiSearch2Fill,
  RiSearch2Line,
  RiSettings4Fill,
  RiSettings4Line,
} from "react-icons/ri";
import AppConstants from "../../data";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { createPlaylist, setScreenId } from "../redux/slices/app";
import { useNavigate, useLocation } from "react-router-dom";
import NavItem from "./NavItem";

export default function NavPanel() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedItem = location.pathname;

  const playlistData = useAppSelector((s) =>
    Object.values(s.app.data.playlists)
  );

  const dispatch = useAppDispatch();

  const onItemSelected = useCallback(
    (selectedId: string) => {
      navigate(selectedId);
    },
    [navigate]
  );

  const onCreatePlaylists = useCallback(() => {
    dispatch(
      createPlaylist({
        title: "New Playlist",
        position: playlistData.length,
      })
    );
  }, [playlistData.length, dispatch, createPlaylist]);

  const onPlaylistSelected = useCallback(
    (playlist_id: string) => {
      navigate(playlist_id);
    },
    [navigate]
  );

  return (
    <div id="nav-panel">
      <div className="nav-items">
        <NavItem
          navId={AppConstants.NAV_ID_SEARCH}
          display="Search"
          activeId={selectedItem}
          ActiveElement={RiSearch2Fill}
          InactiveElement={RiSearch2Line}
          onSelected={onItemSelected}
        />
        <NavItem
          navId={AppConstants.NAV_ID_LIBRARY}
          display="Library"
          activeId={selectedItem}
          ActiveElement={BsFileEarmarkMusicFill}
          InactiveElement={BsFileEarmarkMusic}
          onSelected={onItemSelected}
        />
        <NavItem
          navId={AppConstants.NAV_ID_IMPORT}
          display="Import"
          activeId={selectedItem}
          ActiveElement={RiAddCircleFill}
          InactiveElement={RiAddCircleLine}
          onSelected={onItemSelected}
        />
        <NavItem
          navId={AppConstants.NAV_ID_SETTINGS}
          display="Settings"
          activeId={selectedItem}
          ActiveElement={RiSettings4Fill}
          InactiveElement={RiSettings4Line}
          onSelected={onItemSelected}
        />
        <NavItem
          navId="none-playlist-create"
          display="Create Playlist"
          activeId={selectedItem}
          ActiveElement={MdOutlineLibraryAdd}
          InactiveElement={MdOutlineLibraryAdd}
          onSelected={onCreatePlaylists}
        />
      </div>
      <span className="nav-divider" />
      <div className="playlists">
        {playlistData
          .sort((a, b) => a.position - b.position)
          .map((playlist) => (
            <NavItem
              navId={`/playlist/${playlist.id}`}
              display={playlist.title + ` ${playlist.position}`}
              activeId={selectedItem}
              onSelected={onPlaylistSelected}
              key={playlist.id}
            />
          ))}
      </div>
    </div>
  );
}
