import { useCallback } from "react";
import { IAlbum } from "../../../types";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { loadTracksForAlbum, removeAlbums } from "../../redux/slices/library";
import { generateContextMenu } from "../../utils";
import { HiPlay } from "react-icons/hi2";
import useAppNavigation from "../../hooks/useAppNavigation";
import { toast } from "react-hot-toast";
import AppConstants from "../../../data";
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
          toast.error(AppConstants.UNAVAILABLE_FEATURE_ERROR);
          break;
        case "add-later":
          await dispatch(loadTracksForAlbum({ albumId: data.id }));
          window.utils.queueTracks({
            tracks: [...data.tracks],
            replaceQueue: false,
          });
          break;

        case "remove":
          dispatch(removeAlbums({ items: [data.id] }));
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
        replaceQueue: true,
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
          src={data.cover}
          onClick={selectAlbum}
          onContextMenu={makeContextMenu}
        />
      </div>
      <span>
        <h2>{data.title}</h2>
        <h3>{artists.join(" , ")}</h3>
      </span>
    </div>
  );
}
