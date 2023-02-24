import AppConstants from 'data';
import { useCallback, useState } from 'react';
import { BsFileEarmarkMusic, BsFileEarmarkMusicFill } from 'react-icons/bs';
import { RiSearch2Line, RiSearch2Fill } from 'react-icons/ri';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import NavItem from './NavItem';

export default function NavPanel() {
  const [selectedItem, setSelectedItem] = useState(
    AppConstants.MAIN_NAV_IDS[1]
  );

  const onItemSelected = useCallback(
    (selectedId: string) => {
      setSelectedItem(selectedId);
    },
    [setSelectedItem]
  );

  const onCreatePlaylists = useCallback(() => {
    console.log('Creating Playlist');
  }, []);

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
        <NavItem
          navId="playlist-some playlist id"
          display="Sample Playlist"
          activeId={selectedItem}
          onSelected={onCreatePlaylists}
        />
      </div>
    </div>
  );
}
