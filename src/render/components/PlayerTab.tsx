import { useCallback, useEffect, useState } from "react";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import {
  TbArrowsShuffle,
  TbPlayerSkipBack,
  TbPlayerSkipForward,
  TbRepeat,
  TbRepeatOff,
  TbRepeatOnce,
} from "react-icons/tb";
import { HiOutlineQueueList } from "react-icons/hi2";
import {
  ERepeatState,
  EShuffleState,
  IPlayTrackEventData,
  IQueueTrackEventData,
} from "../../types";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  addQueuedTracks,
  addRecentTracks,
  setCurrentTrack,
  replaceQueuedTracks,
  replaceRecentTracks,
  setRepeatState,
  setShuffleState,
  setIsPaused,
} from "../redux/slices/player";
import { toTimeString, wait } from "../utils";
import ControllableSlider from "./ControllableSlider";
import { useNavigate } from "react-router-dom";
import { StreamManager } from "../global";
import AppConstants from "../../data";
import { IconBaseProps } from "react-icons";
import { updateTrack } from "../redux/slices/library";

// eslint-disable-next-line @typescript-eslint/ban-types
export type PlayerTabProps = {};
export type PlayerTabState = {
  seekProgress: number | null;
  trackProgress: number;
  trackLength: number;
  isPaused: boolean;
};

function GetRepeatIcon(props: IconBaseProps) {
  const repeatState = useAppSelector((s) => s.player.data.repeatState);

  if (repeatState === ERepeatState.OFF) {
    return <TbRepeatOff {...props} />;
  } else if (repeatState === ERepeatState.REPEAT) {
    return (
      <TbRepeat {...props} className={(props.className || "") + " active"} />
    );
  }

  return (
    <TbRepeatOnce {...props} className={(props.className || "") + " active"} />
  );
}

function GetShuffleIcon(props: IconBaseProps) {
  const shuffleState = useAppSelector((s) => s.player.data.shuffleState);

  if (shuffleState === EShuffleState.OFF) {
    return <TbArrowsShuffle {...props} />;
  }

  return (
    <TbArrowsShuffle
      {...props}
      className={(props.className || "") + " active"}
    />
  );
}

export default function PlayerTab() {
  const player = StreamManager.player;

  const [
    albums,
    artists,
    repeatState,
    shuffleState,
    currentTrackId,
    allTracks,
    recentTracks,
    queuedTracks,
    isPaused,
    currentAlbum,
    currentTrack,
  ] = useAppSelector((s) => [
    s.library.data.albums,
    s.library.data.artists,
    s.player.data.repeatState,
    s.player.data.shuffleState,
    s.player.data.currentTrack,
    s.library.data.tracks,
    s.player.data.recentTracks,
    s.player.data.queuedTracks,
    s.player.data.isPaused,
    s.library.data.albums[
      s.library.data.tracks[s.player.data.currentTrack || ""]?.album || ""
    ],
    s.library.data.tracks[s.player.data.currentTrack || ""],
  ]);

  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setSeekProgress] = useState<number | null>(null);

  const [trackTiming, setTrackTiming] = useState<{
    progress: number;
    length: number;
  }>({ progress: 0, length: 0 });

  const navigateToCurrentAlbum = useCallback(() => {
    if (!currentTrackId) return;
    const album = allTracks[currentTrackId]?.album;
    if (!album) return;
    navigate(`/album/${album}`);
  }, [allTracks, currentTrackId, navigate]);

  const onPlayerTimeUpdate = useCallback(() => {
    setTrackTiming({
      progress: Math.round(player.currentTime),
      length: Math.round(player.duration),
    });
  }, [setTrackTiming, player]);

  const onVolumeSliderChanged = useCallback(
    (update: number) => {
      player.volume = update;
    },
    [player]
  );

  const onSeekSliderChanged = useCallback(
    (update: number, done: boolean) => {
      if (!done) {
        setSeekProgress(update);
        return;
      }

      player.currentTime = update;

      setTrackTiming({
        ...trackTiming,
        progress: update,
      });
    },
    [setSeekProgress, player, setTrackTiming, trackTiming]
  );

  const resumeTrack = useCallback(() => {
    if (!player.src) {
      return;
    }
    player.play();
  }, [player]);

  // Just loads and plays a track
  const loadAndPlayTrack = useCallback(
    async (trackId: string) => {
      const track = allTracks[trackId];
      if (!track) return;
      const album = albums[track.album];
      if (!album) return;

      const streamInfo = await StreamManager.getStreamInfo({
        id: track.id,
        title: track.title,
        album: album.title,
        uri: track.uri,
        artists: track.artists.map((a) => artists[a]?.name || ""),
      });

      console.log("Gotten stream Info", streamInfo);

      if (streamInfo) {
        player.src = streamInfo.uri;
        player.play();

        if (streamInfo.duration !== track.duration) {
          dispatch(
            updateTrack({
              update: {
                id: track.id,
                duration: streamInfo.duration,
                uri: streamInfo.from,
              },
            })
          );
        }
      } else {
        console.error("No sources found for the track");
        return;
      }

      dispatch(setCurrentTrack(trackId));

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artists
          .map((a) => artists[a]?.name || `unk=${a}`)
          .join(" , "),
        album: album.title,
        artwork: [{ src: album.cover, sizes: "512x512", type: "image/png" }],
      });
      window.bridge.updateDiscordPresence(track);
    },
    [allTracks, albums, player, dispatch, artists]
  );

  // handles switching to the next track and pre-loading the one after that
  const onNextClicked = useCallback(async () => {
    if (queuedTracks.length > 0 || repeatState !== ERepeatState.OFF) {
      const newQueued = [...queuedTracks];
      if (repeatState === ERepeatState.REPEAT) {
        if (currentTrackId) {
          newQueued.push(currentTrackId);
        }

        const pendingTrack = newQueued.shift();
        if (pendingTrack) {
          await loadAndPlayTrack(pendingTrack);
          dispatch(replaceQueuedTracks(newQueued));
        }
      } else if (repeatState === ERepeatState.REPEAT_ONE) {
        if (currentTrackId) {
          await loadAndPlayTrack(currentTrackId);
          return;
        }
      } else {
        if (currentTrackId) {
          dispatch(addRecentTracks([currentTrackId]));
        }

        const pendingTrack = newQueued.shift();
        if (pendingTrack) {
          await loadAndPlayTrack(pendingTrack);
          dispatch(replaceQueuedTracks(newQueued));
        }
      }

      // Preload Stream URI
      const trackId = newQueued[0];
      if (trackId) {
        await wait(1000);
        const track = allTracks[trackId];
        if (!track) return;
        const album = albums[track.album];
        if (!album) return;

        const streamInfo = await StreamManager.getStreamInfo({
          id: track.id,
          title: track.title,
          album: album.title,
          uri: track.uri,
          artists: track.artists.map((a) => artists[a]?.name || ""),
        });

        if (streamInfo) {
          if (streamInfo.duration !== track.duration) {
            dispatch(
              updateTrack({
                update: {
                  id: track.id,
                  duration: streamInfo.duration,
                  uri: streamInfo.from,
                },
              })
            );
          }
        }
      }
    } else {
      dispatch(setCurrentTrack(null));
      player.src = "";

      setTrackTiming({
        progress: 0,
        length: 0,
      });
      navigator.mediaSession.metadata = null;
      await window.bridge.clearDiscordPresence();
    }
  }, [
    repeatState,
    queuedTracks,
    currentTrackId,
    loadAndPlayTrack,
    dispatch,
    allTracks,
    albums,
    artists,
    player,
  ]);

  // handles switching to the previous track
  const onPreviousClicked = useCallback(async () => {
    if (recentTracks.length > 0) {
      if (currentTrackId) {
        dispatch(replaceQueuedTracks([currentTrackId, ...queuedTracks]));
      }

      const newRecent = [...recentTracks];
      const pendingTrack = newRecent.shift();
      if (pendingTrack) {
        await loadAndPlayTrack(pendingTrack);
        dispatch(replaceRecentTracks(newRecent));
      }
      return;
    }

    player.currentTime = 0;
  }, [
    currentTrackId,
    dispatch,
    loadAndPlayTrack,
    player,
    queuedTracks,
    recentTracks,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const onToggleShuffleState = useCallback(() => {
    if (shuffleState === EShuffleState.OFF) {
      dispatch(setShuffleState(EShuffleState.ON));
    } else {
      dispatch(setShuffleState(EShuffleState.OFF));
    }
  }, [dispatch, shuffleState]);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const onToggleRepeatState = useCallback(() => {
    if (repeatState === ERepeatState.OFF) {
      dispatch(setRepeatState(ERepeatState.REPEAT));
    } else if (repeatState === ERepeatState.REPEAT) {
      dispatch(setRepeatState(ERepeatState.REPEAT_ONE));
    } else {
      dispatch(setRepeatState(ERepeatState.OFF));
    }
  }, [dispatch, repeatState]);

  // handles the end of the current track
  const onCurrentTrackOver = useCallback(async () => {
    await onNextClicked();
  }, [onNextClicked]);

  const onPlayTrack = useCallback(
    async (e: Event) => {
      const actualEvent = e as CustomEvent<IPlayTrackEventData>;
      await loadAndPlayTrack(actualEvent.detail.track);
    },
    [loadAndPlayTrack]
  );

  // handles external queue adds
  const onAddQueuedTrack = useCallback(
    async (e: Event) => {
      const actualEvent = e as CustomEvent<IQueueTrackEventData>;

      const toPlay =
        !currentTrackId || actualEvent.detail.replaceQueue
          ? actualEvent.detail.tracks.shift()
          : null;

      if (toPlay) {
        await loadAndPlayTrack(toPlay);
      }

      if (actualEvent.detail.replaceQueue) {
        dispatch(replaceQueuedTracks(actualEvent.detail.tracks));
      } else {
        dispatch(addQueuedTracks(actualEvent.detail.tracks));
      }

      // Preload Stream URI
      if (queuedTracks.length === 0 && actualEvent.detail.tracks.length > 1) {
        await wait(1000);
        // Preload Stream URI
        const trackId = actualEvent.detail.tracks[0];
        if (trackId) {
          await wait(1000);
          const track = allTracks[trackId];
          if (!track) return;
          const album = albums[track.album];
          if (!album) return;

          const streamInfo = await StreamManager.getStreamInfo({
            id: track.id,
            title: track.title,
            album: album.title,
            uri: track.uri,
            artists: track.artists.map((a) => artists[a]?.name || ""),
          });

          if (streamInfo) {
            if (streamInfo.duration !== track.duration) {
              dispatch(
                updateTrack({
                  update: {
                    id: track.id,
                    duration: streamInfo.duration,
                    uri: streamInfo.from,
                  },
                })
              );
            }
          }
        }
      }
    },
    [
      albums,
      allTracks,
      artists,
      currentTrackId,
      dispatch,
      loadAndPlayTrack,
      queuedTracks.length,
    ]
  );

  // pauses the current track
  const pauseTrack = useCallback(() => {
    player.pause();
  }, [player]);

  // handle when the current track is paused
  const onPlayerPause = useCallback(() => {
    dispatch(setIsPaused(true));
  }, [dispatch]);

  // handle when the current track is played
  const onPlayerPlay = useCallback(() => {
    dispatch(setIsPaused(false));
  }, [dispatch]);

  useEffect(() => {
    document.addEventListener("custom-play-track", onPlayTrack);

    document.addEventListener("custom-queue-track", onAddQueuedTrack);

    player.addEventListener("timeupdate", onPlayerTimeUpdate);

    player.addEventListener("pause", onPlayerPause);

    player.addEventListener("playing", onPlayerPlay);

    player.addEventListener("ended", onCurrentTrackOver);

    navigator.mediaSession.setActionHandler("previoustrack", onPreviousClicked);

    navigator.mediaSession.setActionHandler("nexttrack", onNextClicked);

    return () => {
      document.removeEventListener("custom-play-track", onPlayTrack);

      document.removeEventListener("custom-queue-track", onAddQueuedTrack);

      player.removeEventListener("timeupdate", onPlayerTimeUpdate);

      player.removeEventListener("pause", onPlayerPause);

      player.removeEventListener("playing", onPlayerPlay);

      player.removeEventListener("ended", onCurrentTrackOver);

      navigator.mediaSession.setActionHandler("previoustrack", null);

      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [
    onPlayTrack,
    onAddQueuedTrack,
    onPlayerTimeUpdate,
    onPlayerPause,
    onPlayerPlay,
    onCurrentTrackOver,
    player,
    onPreviousClicked,
    onNextClicked,
  ]);

  return (
    <div id="player-tab">
      <span
        className="player-section"
        style={{
          justifyContent: "flex-start",
        }}
      >
        {currentTrackId && (
          <>
            <img
              src={currentAlbum?.cover}
              className="player-cover"
              onClick={navigateToCurrentAlbum}
            ></img>
            <span className="player-title">
              <h3>{currentTrack?.title || ""}</h3>
              <p>
                {(currentTrack?.artists || [])
                  .map((a) => artists[a]?.name || `unk=${a}`)
                  .join(" , ")}
              </p>
              {/* <h3>Title</h3>
              <p>Artist</p> */}
            </span>
          </>
        )}
      </span>
      <span className="player-section">
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <span className="player-controls">
            <GetShuffleIcon
              className="icon"
              style={{
                width: 20,
                height: 20,
              }}
              onClick={onToggleShuffleState}
            />
            <TbPlayerSkipBack
              className="icon"
              style={{
                width: 20,
                height: 20,
              }}
              onClick={onPreviousClicked}
            />
            {!isPaused ? (
              <BsPauseFill className="icon" size={50} onClick={pauseTrack} />
            ) : (
              <BsPlayFill className="icon" size={50} onClick={resumeTrack} />
            )}
            <TbPlayerSkipForward
              className="icon"
              style={{
                width: 20,
                height: 20,
              }}
              onClick={onNextClicked}
            />
            <GetRepeatIcon
              className="icon"
              style={{
                width: 20,
                height: 20,
              }}
              onClick={onToggleRepeatState}
            />
          </span>
          <span
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
            }}
          >
            <p className="player-bar-time">
              {toTimeString(trackTiming.progress * 1000)}
            </p>
            <ControllableSlider
              min={0}
              max={trackTiming.length}
              value={trackTiming.progress}
              onUserUpdate={onSeekSliderChanged}
            />
            <p className="player-bar-time">
              {toTimeString((trackTiming.length || 0) * 1000)}
            </p>
          </span>
        </span>
      </span>
      <span
        className="player-section"
        style={{
          justifyContent: "flex-end",
        }}
      >
        <HiOutlineQueueList
          className="icon"
          style={{
            width: 20,
            height: 20,
            margin: "0px 10px",
          }}
          onClick={() => navigate(AppConstants.NAV_ID_QUEUE)}
        />
        <ControllableSlider
          style={{
            maxWidth: "100px",
          }}
          min={0}
          max={0.5}
          defaultValue={player.volume}
          step={0.001}
          onUserUpdate={onVolumeSliderChanged}
        />
      </span>
    </div>
  );
}
