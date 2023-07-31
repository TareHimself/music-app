import { useCallback } from "react";
import { IAlbum } from "@types";
import {
  importIntoLibrary,
  loadTracksForAlbum,
  removeAlbums,
  useAppDispatch,
  useAppSelector,
} from "@redux/exports";
import { generateContextMenu, getCoverUrl } from "@render/utils";
import { HiPlay } from "react-icons/hi2";
import useAppNavigation from "@hooks/useAppNavigation";
export default function AlbumItem({ data }: { data?: IAlbum }) {
  const dispatch = useAppDispatch();

  const artists = useAppSelector((s) =>
    (data?.artists || []).map((a) => s.library.data.artists[a]?.name || a)
  );

  const { navigate } = useAppNavigation();

  const selectAlbum = useCallback(() => {
    if (!data) return;

    dispatch(loadTracksForAlbum({ albumId: data.id }));
    navigate(`/album/${data.id}`);
  }, [data, dispatch, navigate]);

  const onContextMenuItemSelected = useCallback(
    async (selection: string) => {
      if (!data) return;

      switch (selection) {
        case "add-next":
          await dispatch(loadTracksForAlbum({ albumId: data.id }));
          window.utils.playNext({
            tracks: [...data.tracks],
          });
          break;
        case "add-later":
          await dispatch(loadTracksForAlbum({ albumId: data.id }));
          window.utils.playLater({
            tracks: [...data.tracks],
          });
          break;

        case "remove":
          dispatch(removeAlbums({ items: [data.id] }));
          break;

        case "reimport":
          dispatch(importIntoLibrary({ items: [data.id] }));
          break;

        default:
          break;
      }
    },
    [data, dispatch]
  );

  const makeContextMenu = useCallback(
    (e: React.MouseEvent) => {
      generateContextMenu({
        event: e,
        options: [
          {
            id: "add-next",
            name: "Play next",
          },
          {
            id: "add-later",
            name: "Play later",
          },
          {
            id: "remove",
            name: "Remove from library",
          },
          {
            id: "reimport",
            name: "Re-Import",
          },
        ],
        callback: onContextMenuItemSelected,
      });
    },
    [onContextMenuItemSelected]
  );

  const addAlbumToQueue = useCallback(async () => {
    if (data) {
      await dispatch(loadTracksForAlbum({ albumId: data.id }));
      window.utils.queueTracks({
        tracks: [...data.tracks],
        startIndex: 0,
      });
    }
  }, [data, dispatch]);

  if (!data || !artists.length) {
    return <div className="album-item placeholder"></div>;
  }

  return (
    <div className="album-item">
      <div className="album-item-image-wrapper">
        <HiPlay onClick={addAlbumToQueue} />
        <img
          src={getCoverUrl(data.cover)}
          onClick={selectAlbum}
          onContextMenu={makeContextMenu}
          alt={`album cover for ${data.title}`}
        />
      </div>
      <span>
        <h2>{data.title}</h2>
        <h3>{artists.join(" , ")}</h3>
      </span>
    </div>
  );
}
