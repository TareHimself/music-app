import { useCallback } from "react";
import { IPlaylistTrack } from "../../../types";
import { GiSoundWaves } from "react-icons/gi";
import { FaPlay } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { loadTracksForAlbum } from "../../redux/slices/app";
import { generateContextMenu, toTimeString } from "../../utils";

export type TrackItemProps =
  | { type: "playlist"; playlistInfo: IPlaylistTrack }
  | { type: "queue"; trackId: string }
  | { type: "album"; trackId: string };
export default function TrackItem(
  props: TrackItemProps & { activeOverride?: boolean }
) {
  const currentTrack = useAppSelector((s) => s.player.data.currentTrack);

  const trackId =
    props.type === "playlist" ? props.playlistInfo.track : props.trackId;

  const trackData = useAppSelector((s) => s.app.data.tracks[trackId]);

  const dispatch = useAppDispatch();

  const albumData = useAppSelector(
    (s) => s.app.data.albums[trackData?.album || ""]
  );

  const allArtists = useAppSelector((s) => s.app.data.artists);

  const { title, artists, duration } = trackData || {};

  const tryPlayTrack = useCallback(async () => {
    await dispatch(loadTracksForAlbum({ albumId: trackData.album }));
    window.utils.queueTracks({
      tracks: albumData.tracks.slice(albumData.tracks.indexOf(trackId)),
      replaceQueue: true,
    });
  }, [albumData?.tracks, dispatch, trackData?.album, trackId]);

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
      if (props.type === "queue") {
        generateContextMenu({
          event: e,
          options: [
            {
              id: "remove",
              name: "Remove Track",
            },
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

  const isActive =
    props.activeOverride === undefined
      ? currentTrack === trackData?.id
      : props.activeOverride;

  return (
    <div
      className={isActive ? "track-item active" : "track-item"}
      onClick={tryPlayTrack}
      onContextMenu={makeContextMenu}
    >
      <span className="track-icon">
        {isActive ? <GiSoundWaves /> : <FaPlay />}
      </span>
      <span className="track-title">
        <span data--info="text">
          <h2>{title}</h2>
          <p>
            {artists
              .map((a) => allArtists[a].name)
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
