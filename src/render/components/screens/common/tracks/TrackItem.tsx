import { useCallback } from "react";
import { IContextMenuOption, IPlaylistTrack } from "@types";
import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { loadTracksForAlbum, updateTracks } from "@redux/slices/library";
import { generateContextMenu, toTimeString } from "@render/utils";
import { HiPause, HiPlay } from "react-icons/hi2";
import { StreamManager } from "@render/global";
import { useLocation } from "react-router";
import { toast } from "react-hot-toast";
import AppConstants from "@root/data";
import useAppNavigation from "@hooks/useAppNavigation";
import LikeButton from "./LikeButton";

export type TrackItemProps =
  | { type: "playlist"; playlistInfo: IPlaylistTrack }
  | { type: "queue"; trackId: string; index: number }
  | { type: "album"; trackId: string };
export default function TrackItem(
  props: TrackItemProps & { activeOverride?: boolean }
) {
  const trackId =
    props.type === "playlist" ? props.playlistInfo.track : props.trackId;

  const { navigate } = useAppNavigation();

  const location = useLocation().pathname.split("/");

  const contextId = location[2];

  const isLikedPlaylist = location[1] === "playlist" && contextId === "liked";

  const [trackData, currentTrack, isPaused, likedTracks, playlistsIndex] =
    useAppSelector((s) => [
      s.library.data.tracks[trackId],
      s.player.data.currentTrack,
      s.player.data.isPaused,
      s.library.data.likedTracks,
      s.library.data.playlists,
    ]);

  const dispatch = useAppDispatch();

  const albumData = useAppSelector(
    (s) => s.library.data.albums[trackData?.album || ""]
  );

  const allArtists = useAppSelector((s) => s.library.data.artists || {});

  const queueIndex = props.type === "queue" ? props.index : null;

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

    if (props.type === "queue" && queueIndex !== null) {
      const currentIndex = queueIndex;
      window.utils.skipToQueueIndex(currentIndex);
    } else if (props.type === "album") {
      // add the albums tracks to recent to account for

      await dispatch(loadTracksForAlbum({ albumId: trackData.album }));

      window.utils.queueTracks({
        tracks: [...albumData.tracks],
        startIndex: albumData.tracks.indexOf(trackId),
      });
    } else if (props.type === "playlist") {
      if (isLikedPlaylist) {
        const thisIndex = likedTracks.findIndex(
          (a) => a.track === trackData.id
        );

        window.utils.queueTracks({
          tracks: likedTracks.map((a) => a.track),
          startIndex: thisIndex,
        });
      } else {
        const currentPlaylist = playlistsIndex[contextId || ""];

        if (currentPlaylist) {
          const thisIndex = currentPlaylist.tracks.findIndex(
            (a) => a.track === trackData.id
          );

          window.utils.queueTracks({
            tracks: currentPlaylist.tracks.map((a) => a.track),
            startIndex: thisIndex,
          });
        }
      }
    }
  }, [
    albumData,
    contextId,
    dispatch,
    isActiveTrack,
    isLikedPlaylist,
    isPaused,
    likedTracks,
    playlistsIndex,
    props.type,
    queueIndex,
    trackData,
    trackId,
  ]);

  const onContextMenuItemSelected = useCallback(
    async (selection: string) => {
      if (!trackData) return;

      switch (selection) {
        case "queue-next":
          window.utils.playNext({
            tracks: [trackData.id],
          });
          break;

        case "queue-later":
          window.utils.playLater({
            tracks: [trackData.id],
          });
          break;

        case "remove":
          toast.error(AppConstants.UNAVAILABLE_FEATURE_ERROR);
          break;

        case "uri-edit":
          toast.error(AppConstants.UNAVAILABLE_FEATURE_ERROR);
          break;

        case "uri-reset":
          StreamManager.remove(trackData.id);
          dispatch(
            updateTracks({
              update: [
                {
                  id: trackData.id,
                  duration: 0,
                  uri: "",
                },
              ],
            })
          );
          break;

        default:
          break;
      }
    },
    [dispatch, trackData]
  );

  const makeContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const extraOptions: IContextMenuOption[] = [];

      if (props.type === "playlist") {
        if (!isLikedPlaylist) {
          extraOptions.push({
            id: `playlist-remove`,
            name: "Remove from playlist",
          });
        }
      } else {
        extraOptions.push({
          id: `playlist-add`,
          name: "Add to playlist",
        });
      }

      if (props.type === "queue") {
        extraOptions.push({
          id: "remove",
          name: "Remove from queue",
        });
      }

      generateContextMenu({
        event: e,
        options: [
          {
            id: "queue-next",
            name: "Play next",
          },
          {
            id: "queue-later",
            name: "Play later",
          },
          {
            id: "uri-edit",
            name: "Modify source",
          },
          ...((trackData?.uri.length || 0) > 0
            ? [
                {
                  id: "uri-reset",
                  name: "Reset source",
                },
              ]
            : []),
          ...extraOptions,
        ],
        callback: onContextMenuItemSelected,
      });
    },
    [
      isLikedPlaylist,
      onContextMenuItemSelected,
      props.type,
      trackData?.uri.length,
    ]
  );

  const openTrackAlbum = useCallback(() => {
    if (!albumData?.id) return;
    dispatch(loadTracksForAlbum({ albumId: albumData?.id }));
    navigate(`/album/${albumData?.id}`);
  }, [albumData?.id, dispatch, navigate]);

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
      data--id={trackId}
      data--index={props.type === "queue" ? props.index : "none"}
    >
      <span className="track-icon">
        {isActiveTrack && !isPaused ? (
          <HiPause onClick={tryPlayTrack} />
        ) : (
          <HiPlay onClick={tryPlayTrack} />
        )}
      </span>

      <span className="track-title">
        {props.type !== "album" && (
          <img
            onClick={openTrackAlbum}
            src={albumData?.cover || AppConstants.DEFAULT_COVER_ART}
            className="track-album-cover"
          />
        )}
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

      <span
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <LikeButton trackId={trackId} />
        <h3
          style={{
            width: "60px",
            textAlign: "right",
          }}
        >
          {duration === 0 ? "--:--" : toTimeString(duration)}
        </h3>
      </span>
    </div>
  );
}
