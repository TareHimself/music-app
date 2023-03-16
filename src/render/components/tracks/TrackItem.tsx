import { useCallback } from "react";
import { IContextMenuOption, IPlaylistTrack } from "../../../types";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { loadTracksForAlbum } from "../../redux/slices/library";
import { generateContextMenu, toTimeString } from "../../utils";
import { HiPause, HiPlay } from "react-icons/hi2";
import { StreamManager } from "../../global";
import { addRecentTracks } from "../../redux/slices/player";

export type TrackItemProps =
  | { type: "playlist"; playlistInfo: IPlaylistTrack }
  | { type: "queue"; trackId: string }
  | { type: "album"; trackId: string };
export default function TrackItem(
  props: TrackItemProps & { activeOverride?: boolean }
) {
  const trackId =
    props.type === "playlist" ? props.playlistInfo.track : props.trackId;

  const [trackData, currentTrack, isPaused] = useAppSelector((s) => [
    s.library.data.tracks[trackId],
    s.player.data.currentTrack,
    s.player.data.isPaused,
  ]);

  const dispatch = useAppDispatch();

  const albumData = useAppSelector(
    (s) => s.library.data.albums[trackData?.album || ""]
  );

  const allArtists = useAppSelector((s) => s.library.data.artists || {});

  const { title, artists, duration } = trackData || {
    title: "",
    artists: [],
    duration: 0,
  };

  const isActiveTrack =
    props.activeOverride === undefined
      ? currentTrack === trackData?.id
      : props.activeOverride;

  const tryPlayTrack = useCallback(async () => {
    if (!trackData?.album || !albumData) return;

    if (isActiveTrack) {
      if (isPaused) {
        StreamManager.player.play();
      } else {
        StreamManager.player.pause();
      }
      return;
    }

    await dispatch(loadTracksForAlbum({ albumId: trackData.album }));
    const thisIndex = albumData.tracks.indexOf(trackId);

    // add the albums tracks to recent to account for
    if (thisIndex !== 0) {
      const newRecent = [...albumData.tracks.slice(0, thisIndex)];
      newRecent.reverse();

      dispatch(addRecentTracks(newRecent));
    }

    window.utils.queueTracks({
      tracks: albumData.tracks.slice(thisIndex),
      replaceQueue: true,
    });
  }, [albumData, dispatch, isActiveTrack, isPaused, trackData?.album, trackId]);

  const onContextMenuItemSelected = useCallback(
    async (selection: string) => {
      if (!trackData) return;

      switch (selection) {
        case "add":
          window.utils.queueTracks({
            tracks: [trackData.id],
            replaceQueue: false,
          });
          break;

        default:
          break;
      }
    },
    [trackData]
  );

  const onRemoveTrackFromQueue = useCallback(
    async (selection: string) => {
      if (!trackData) return;

      console.log("This will work soon:", selection);
    },
    [trackData]
  );

  const makeContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const extraOptions: IContextMenuOption[] = [];

      if (props.type === "playlist") {
        extraOptions.push({
          id: `playlist-remove`,
          name: "Remove From Playlist",
        });
      } else {
        extraOptions.push({
          id: `playlist-add`,
          name: "Add To Playlist",
        });
      }

      if (props.type === "queue") {
        generateContextMenu({
          event: e,
          options: [
            {
              id: "remove",
              name: "Remove Track",
            },
            ...extraOptions,
          ],
          callback: onRemoveTrackFromQueue,
        });
        return;
      }
      generateContextMenu({
        event: e,
        options: [
          {
            id: "add",
            name: "Add Track Queue",
          },
          ...extraOptions,
        ],
        callback: onContextMenuItemSelected,
      });
    },
    [onContextMenuItemSelected, onRemoveTrackFromQueue, props.type]
  );

  if (!trackData) {
    return (
      <div
        className="track-item"
        style={{ display: "flex", alignItems: "center" }}
      >
        <h3 style={{ margin: 0 }}>Loading</h3>
      </div>
    );
  }

  return (
    <div
      className={isActiveTrack ? "track-item active" : "track-item"}
      onContextMenu={makeContextMenu}
    >
      <span className="track-icon">
        {isActiveTrack && !isPaused ? (
          <HiPause onClick={tryPlayTrack} />
        ) : (
          <HiPlay onClick={tryPlayTrack} />
        )}
      </span>
      <span className="track-title">
        <span data--info="text">
          <h2>{title}</h2>
          <p>
            {artists
              .map((a) => allArtists[a]?.name || "")
              .join(" , ")
              .trim()}
          </p>
        </span>
      </span>
      <span>
        <h3>{duration === 0 ? "-:--" : toTimeString(duration)}</h3>
      </span>
    </div>
  );
}
