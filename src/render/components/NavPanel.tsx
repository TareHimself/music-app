import AppConstants from '../../data';
import { useCallback, useEffect, useState } from 'react';
import { BsFileEarmarkMusic, BsFileEarmarkMusicFill } from 'react-icons/bs';
import { RiSearch2Line, RiSearch2Fill } from 'react-icons/ri';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import NavItem from './NavItem';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { createPlaylist, loadPlaylists, setStatus } from '../redux/slices/playlists';
import { setScreenId } from '../redux/slices/app';

export default function NavPanel() {

  const playlistData = useAppSelector((s) => s.playlists)

  const selectedItem = useAppSelector(s => s.app.data.screenId)

  const dispatch = useAppDispatch()

  const onItemSelected = useCallback(
    (selectedId: string) => {
      dispatch(setScreenId(selectedId));
    },
    [dispatch, setScreenId]
  );

  const onCreatePlaylists = useCallback(() => {
    if (playlistData.status !== 'loaded') return;
    dispatch(createPlaylist({ title: "New Playlist", position: playlistData.data.ids.length }))
  }, [playlistData.data.ids.length, playlistData.status, dispatch, createPlaylist]);

  const onPlaylistSelected = useCallback((playlist_id: string) => {
    console.log("Selected playlist", playlist_id)
    dispatch(setScreenId(playlist_id))
  }, [])

  useEffect(() => {
    console.log("Playlist Data Status", playlistData.status)
    if (playlistData.status === 'empty') {
      dispatch(setStatus('loading'));
      dispatch(loadPlaylists())
    }
  }, [dispatch, setStatus, loadPlaylists])

  return (
    <div id="nav-panel">
      <div className="nav-items">
        <NavItem
          navId={AppConstants.MAIN_NAV_IDS[0]}
          display="Search"
          activeId={selectedItem}
          ActiveElement={RiSearch2Fill}
          InactiveElement={RiSearch2Line}
          onSelected={onItemSelected}
        />
        <NavItem
          navId={AppConstants.MAIN_NAV_IDS[1]}
          display="Library"
          activeId={selectedItem}
          ActiveElement={BsFileEarmarkMusicFill}
          InactiveElement={BsFileEarmarkMusic}
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
        {playlistData.data.ids.map((p_id) =>
          <NavItem
            navId={`playlist-${p_id}`}
            display={playlistData.data.lookup[p_id].title}
            activeId={selectedItem}
            onSelected={onPlaylistSelected}
            key={p_id}
          />
        )}
      </div>
    </div>
  );
}
