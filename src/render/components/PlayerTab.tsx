import { useCallback, useEffect, useState } from "react";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import {
  TbArrowsShuffle,
  TbPlayerSkipBack,
  TbPlayerSkipForward,
  TbRepeatOff,
} from "react-icons/tb";
import { HiOutlineQueueList } from "react-icons/hi2";
import { IPlayTrackEventData, IQueueTrackEventData } from "../../types";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  addQueuedTracks,
  addRecentTracks,
  setCurrentTrack,
  replaceQueuedTracks,
  replaceRecentTracks,
} from "../redux/slices/player";
import { toTimeString } from "../utils";
import ControllableSlider from "./ControllableSlider";
import { useNavigate } from "react-router-dom";
import { StreamManager } from "../global";
import AppConstants from "../../data";

// eslint-disable-next-line @typescript-eslint/ban-types
export type PlayerTabProps = {};
export type PlayerTabState = {
  seekProgress: number | null;
  trackProgress: number;
  trackLength: number;
  isPaused: boolean;
};

export default function PlayerTab() {
  const player = StreamManager.player;

  const [albums, artists] = useAppSelector((s) => [
    s.app.data.albums,
    s.app.data.artists,
  ]);

  const [currentTrackId, allTracks, recentTracks, queuedTracks] =
    useAppSelector((s) => [
      s.player.data.currentTrack,
      s.app.data.tracks,
      s.player.data.recentTracks,
      s.player.data.queuedTracks,
    ]);

  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setSeekProgress] = useState<number | null>(null);

  const [trackTiming, setTrackTiming] = useState<{
    progress: number;
    length: number;
  }>({ progress: 0, length: 0 });

  const [isPaused, setIsPaused] = useState<boolean>(true);

  const navigateToCurrentAlbum = useCallback(() => {
    navigate(`/album/${allTracks[currentTrackId].album}`);
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
      const streamInfo = await StreamManager.getStreamInfo(allTracks[trackId]);
      player.src = streamInfo.uri;
      player.play();
      dispatch(setCurrentTrack(trackId));
      window.bridge.updateDiscordPresence(allTracks[trackId]);
    },
    [allTracks, player, dispatch]
  );

  // handles switching to the next track and pre-loading the one after that
  const onNextClicked = useCallback(async () => {
    if (queuedTracks.length > 0) {
      if (currentTrackId) {
        dispatch(addRecentTracks([currentTrackId]));
      }
      const newQueued = [...queuedTracks];
      const pendingTrack = newQueued.shift();
      dispatch(replaceQueuedTracks(newQueued));
      await loadAndPlayTrack(pendingTrack);

      // Preload Stream URI
      if (newQueued[0]) {
        StreamManager.getStreamInfo(allTracks[newQueued[0]]);
      }
    } else if (currentTrackId) {
      player.currentTime = player.duration;
      player.pause();
    }
  }, [
    queuedTracks,
    currentTrackId,
    dispatch,
    loadAndPlayTrack,
    allTracks,
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
      dispatch(replaceRecentTracks(newRecent));
      await loadAndPlayTrack(pendingTrack);

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
  const onToggleShuffleState = useCallback(() => {}, []);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const onToggleRepeatState = useCallback(() => {}, []);

  // handles the end of the current track
  const onCurrentTrackOver = useCallback(async () => {
    if (queuedTracks.length > 0) {
      await onNextClicked();
    } else {
      dispatch(setCurrentTrack(null));
      player.src = "";

      setTrackTiming({
        progress: 0,
        length: 0,
      });

      await window.bridge.clearDiscordPresence();
    }
  }, [player, queuedTracks, dispatch, onNextClicked]);

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

      if (actualEvent.detail.replaceQueue) {
        dispatch(replaceQueuedTracks(actualEvent.detail.tracks));
      } else {
        dispatch(addQueuedTracks(actualEvent.detail.tracks));
      }

      if (toPlay) {
        await loadAndPlayTrack(toPlay);
      }

      // Preload Stream URI
      if (queuedTracks.length === 0 && actualEvent.detail.tracks.length > 1) {
        StreamManager.getStreamInfo(allTracks[actualEvent.detail.tracks[0]]);
      }
    },
    [allTracks, currentTrackId, dispatch, loadAndPlayTrack, queuedTracks.length]
  );

  // pauses the current track
  const pauseTrack = useCallback(() => {
    player.pause();
  }, [player]);

  // handle when the current track is paused
  const onPlayerPause = useCallback(() => {
    setIsPaused(true);
  }, [setIsPaused]);

  // handle when the current track is played
  const onPlayerPlay = useCallback(() => {
    setIsPaused(false);
  }, [setIsPaused]);

  useEffect(() => {
    document.addEventListener("custom-play-track", onPlayTrack);

    document.addEventListener("custom-queue-track", onAddQueuedTrack);

    player.addEventListener("timeupdate", onPlayerTimeUpdate);

    player.addEventListener("pause", onPlayerPause);

    player.addEventListener("playing", onPlayerPlay);

    player.addEventListener("ended", onCurrentTrackOver);

    return () => {
      document.removeEventListener("custom-play-track", onPlayTrack);

      document.removeEventListener("custom-queue-track", onAddQueuedTrack);

      player.removeEventListener("timeupdate", onPlayerTimeUpdate);

      player.removeEventListener("pause", onPlayerPause);

      player.removeEventListener("playing", onPlayerPlay);

      player.removeEventListener("ended", onCurrentTrackOver);
    };
  }, [
    onPlayTrack,
    onAddQueuedTrack,
    onPlayerTimeUpdate,
    onPlayerPause,
    onPlayerPlay,
    onCurrentTrackOver,
    player,
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
              src={albums[allTracks[currentTrackId].album].cover}
              className="player-cover"
              onClick={navigateToCurrentAlbum}
            ></img>
            <span className="player-title">
              <h3>{allTracks[currentTrackId].title}</h3>
              <p>
                {allTracks[currentTrackId].artists
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
            <TbArrowsShuffle
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
            <TbRepeatOff
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
              {toTimeString(trackTiming.progress)}
            </p>
            <ControllableSlider
              min={0}
              max={trackTiming.length}
              value={trackTiming.progress}
              onUserUpdate={onSeekSliderChanged}
            />
            <p className="player-bar-time">
              {toTimeString(trackTiming.length || 0)}
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
