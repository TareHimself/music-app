import { useCallback } from "react";
import { IAlbum } from "@types";
import {
  loadTracksForAlbum,
  useAppDispatch,
  useAppSelector,
} from "@redux/exports";
import { generateContextMenu } from "@render/utils";
import useAppNavigation from "@hooks/useAppNavigation";
export default function SearchItem({ data }: { data?: IAlbum }) {
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
        ],
        callback: onContextMenuItemSelected,
      });
    },
    [onContextMenuItemSelected]
  );

  if (!data || !artists.length) {
    return <div className="album-item placeholder"></div>;
  }

  return (
    <div
      className="album-item"
      onClick={selectAlbum}
      onContextMenu={makeContextMenu}
    >
      <div className="album-item-image-wrapper">
        <img src={data.cover} />
      </div>
      <span>
        <h2>{data.title}</h2>
        <h3>{artists.join(" , ")}</h3>
      </span>
    </div>
  );
}
