import { useCallback } from "react";
import { BsFileEarmarkMusic, BsFileEarmarkMusicFill } from "react-icons/bs";
import { MdOutlineLibraryAdd } from "react-icons/md";
import { RiSettings4Fill, RiSettings4Line } from "react-icons/ri";
import AppConstants from "@root/data";
import {
  createPlaylist,
  loadTracks,
  removePlaylists,
  useAppDispatch,
  useAppSelector,
} from "@redux/exports";
import { useLocation } from "react-router-dom";
import NavItem from "./NavItem";
import useAppNavigation from "@hooks/useAppNavigation";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { generateContextMenu } from "@render/utils";
import { toast } from "react-hot-toast";
import { IPlaylist } from "@types";

export default function NavPanel() {
  const location = useLocation();
  const {
    navigate,
    backwardHistory,
    forwardHistory,
    navigateBackward,
    navigateForward,
  } = useAppNavigation();

  const selectedItem = location.pathname;

  const [playlistData, likedTracks] = useAppSelector((s) => [
    Object.values(s.library.data.playlists),
    Object.keys(s.library.data.likedTracks),
  ]);

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
  }, [playlistData.length, dispatch]);

  const onPlaylistSelected = useCallback(
    (playlist: IPlaylist, playlist_id: string) => {
      navigate(playlist_id);
      dispatch(
        loadTracks({
          trackIds: playlist.tracks.map((a) => a.track),
        })
      );
    },
    [dispatch, navigate]
  );

  return (
    <div id="nav-panel">
      <span className="nav-main">
        <IoChevronBack
          className={backwardHistory.length > 0 ? "active" : ""}
          onClick={() => {
            navigateBackward();
          }}
        />
        <IoChevronForward
          className={forwardHistory.length > 0 ? "active" : ""}
          onClick={() => {
            navigateForward();
          }}
        />
      </span>
      <div className="nav-items">
        <NavItem
          navId={AppConstants.NAV_ID_LIBRARY}
          display="Library"
          activeId={selectedItem}
          ActiveElement={BsFileEarmarkMusicFill}
          InactiveElement={BsFileEarmarkMusic}
          onSelected={onItemSelected}
        />
        {/* <NavItem
          navId={AppConstants.NAV_ID_VISUALIZER}
          display="Visualizer"
          activeId={selectedItem}
          ActiveElement={BsSoundwave}
          InactiveElement={BsSoundwave}
          onSelected={onItemSelected}
        /> */}
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
        {likedTracks.length > 0 && (
          <NavItem
            navId={`/playlist/liked`}
            display={"Liked"}
            activeId={selectedItem}
            onSelected={() => navigate("/playlist/liked")}
          />
        )}
        {playlistData
          .sort((a, b) => {
            const posA: number = a.position;
            const posB: number = b.position;
            if (posA === -1 && posA === posB) {
              return 0;
            } else if (posA === -1) {
              return 1;
            } else if (posB === -1) {
              return -1;
            }
            return posA - posB;
          })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map((playlist, _idx) => (
            <NavItem
              onContextMenu={(e) => {
                generateContextMenu({
                  event: e,
                  options: [
                    {
                      id: `delete|${playlist.id}`,
                      name: "Delete",
                    },
                    {
                      id: `rename|${playlist.id}`,
                      name: "Rename",
                    },
                    {
                      id: `export|${playlist.id}`,
                      name: "Export",
                    },
                  ],
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  callback: (s) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [operation, playlist_id] = s.split("|") as [
                      string,
                      string
                    ];
                    switch (operation) {
                      case "delete":
                        {
                          dispatch(
                            removePlaylists({
                              items: [playlist_id],
                            })
                          );
                        }
                        break;
                      case "rename":
                        {
                          toast.error(AppConstants.UNAVAILABLE_FEATURE_ERROR);
                        }
                        break;
                      case "export":
                        {
                          toast.error(AppConstants.UNAVAILABLE_FEATURE_ERROR);
                        }
                        break;
                    }
                  },
                });
              }}
              navId={`/playlist/${playlist.id}`}
              display={
                playlist.title // + ` index ${idx}, position ${playlist.position}`
              }
              activeId={selectedItem}
              onSelected={(s) => onPlaylistSelected(playlist, s)}
              key={playlist.id}
            />
          ))}
      </div>
    </div>
  );
}
