import { useCallback } from "react";
import { IAlbum } from "../../../types";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { loadTracksForAlbum } from "../../redux/slices/library";
import { useNavigate } from "react-router-dom";
import { generateContextMenu } from "../../utils";
import { HiPlay } from "react-icons/hi2";
export default function AlbumItem({ data }: { data?: IAlbum }) {
  const dispatch = useAppDispatch();

  const artists = useAppSelector((s) =>
    (data?.artists || []).map((a) => s.library.data.artists[a]?.name || a)
  );

  const navigate = useNavigate();
  const selectAlbum = useCallback(() => {
    if (!data) return;

    dispatch(loadTracksForAlbum({ albumId: data.id }));
    navigate(`/album/${data.id}`);
  }, [data, dispatch, navigate]);

  const onContextMenuItemSelected = useCallback(
    async (selection: string) => {
      if (!data) return;

      switch (selection) {
        case "add":
          await dispatch(loadTracksForAlbum({ albumId: data.id }));
          window.utils.queueTracks({
            tracks: [...data.tracks],
            replaceQueue: false,
          });
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
            id: "add",
            name: "Add Album Queue",
          },
          {
            id: "remove",
            name: "Delete Album",
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
