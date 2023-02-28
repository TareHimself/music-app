import { useCallback, useEffect, useRef, useState } from "react";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import {
  TbArrowsShuffle,
  TbPlayerSkipBack,
  TbPlayerSkipForward,
  TbRepeatOff,
} from "react-icons/tb";
import { IPlayTrackEventData, IQueueTrackEventData, ITrack } from "../../types";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  addQueuedTracks,
  addRecentTracks,
  setCurrentTrack,
  replaceQueuedTracks,
  replaceRecentTracks,
} from "../redux/slices/player";
import { StreamManager } from "../stream-manager";
import { toTimeString } from "../utils";
import ControllableSlider from "./ControllableSlider";

// eslint-disable-next-line @typescript-eslint/ban-types
export type PlayerTabProps = {};
export type PlayerTabState = {
  seekProgress: number | null;
  trackProgress: number;
  trackLength: number;
  isPaused: boolean;
};

export default function PlayerTab() {
  const player = useRef(
    (() => {
      const au = new Audio();
      au.volume = 0.2;
      return au;
    })()
  ).current;

  const [albums, artists] = useAppSelector((s) => [
    s.app.data.albums,
    s.app.data.artists,
  ]);

  const [currentTrack, recentTracks, queuedTracks] = useAppSelector((s) => [
    s.player.data.currentTrack,
    s.player.data.recentTracks,
    s.player.data.queuedTracks,
  ]);

  console.log(currentTrack, recentTracks, queuedTracks);
  const dispatch = useAppDispatch();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setSeekProgress] = useState<number | null>(null);

  const [trackTiming, setTrackTiming] = useState<{
    progress: number;
    length: number;
  }>({ progress: 0, length: 0 });

  const [isPaused, setIsPaused] = useState<boolean>(true);

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

  const loadAndPlayTrack = useCallback(
    async (track: ITrack) => {
      const streamInfo = await StreamManager.getStreamInfo(track);
      player.src = streamInfo.uri;
      player.play();
      dispatch(setCurrentTrack(track));
      window.bridge.updateDiscordPresence(track);
      if (queuedTracks[0]) {
        StreamManager.getStreamInfo(queuedTracks[0]);
      }
    },
    [player, dispatch, queuedTracks]
  );

  const onNextClicked = useCallback(async () => {
    if (queuedTracks.length > 0) {
      if (currentTrack) {
        dispatch(addRecentTracks([currentTrack]));
      }
      const newQueued = [...queuedTracks];
      await loadAndPlayTrack(newQueued.shift());
      dispatch(replaceQueuedTracks(newQueued));
    } else if (currentTrack) {
      player.currentTime = player.duration;
      player.pause();
    }
  }, [player, currentTrack, queuedTracks, loadAndPlayTrack, dispatch]);

  const onPreviousClicked = useCallback(async () => {
    if (recentTracks.length > 0) {
      if (currentTrack) {
        dispatch(replaceQueuedTracks([currentTrack, ...queuedTracks]));
      }

      const newRecent = [...recentTracks];

      await loadAndPlayTrack(newRecent.shift());

      dispatch(replaceRecentTracks(newRecent));
      return;
    }

    player.currentTime = 0;
  }, [
    currentTrack,
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

  const onAddQueuedTrack = useCallback(
    async (e: Event) => {
      const actualEvent = e as CustomEvent<IQueueTrackEventData>;
      if (!currentTrack || actualEvent.detail.replaceQueue) {
        await loadAndPlayTrack(actualEvent.detail.tracks.shift());
      }

      if (actualEvent.detail.replaceQueue) {
        dispatch(replaceQueuedTracks(actualEvent.detail.tracks));
      } else {
        dispatch(addQueuedTracks(actualEvent.detail.tracks));
      }
    },
    [currentTrack, dispatch, loadAndPlayTrack]
  );

  const pauseTrack = useCallback(() => {
    player.pause();
  }, [player]);

  const onPlayerPause = useCallback(() => {
    setIsPaused(true);
  }, [setIsPaused]);

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
        {currentTrack && (
          <>
            <img
              src={albums[currentTrack.album].cover}
              className="player-cover"
            ></img>
            <span className="player-title">
              <h3>{currentTrack.title}</h3>
              <p>
                {currentTrack.artists
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
