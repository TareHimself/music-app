import { useCallback, useEffect, useRef, useState } from "react";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { TbPlayerSkipBack, TbPlayerSkipForward } from "react-icons/tb";
import { IPlayTrackEventData, IQueueTrackEventData, ITrack } from "../../types";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setCurrentTrack } from "../redux/slices/app";
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

  const [albums, artists, currentTrack] = useAppSelector((s) => [
    s.app.data.albums,
    s.app.data.artists,
    s.app.data.currentTrack,
  ]);

  const dispatch = useAppDispatch();

  const [recentTracks, setRecentTracks] = useState<ITrack[]>([]);

  const [queuedTracks, setQueuedTracks] = useState<ITrack[]>([]);

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
    [
      player,
      dispatch,
      setCurrentTrack,
      setRecentTracks,
      recentTracks,
      queuedTracks,
    ]
  );

  const onNextClicked = useCallback(async () => {
    if (queuedTracks.length > 0) {
      if (currentTrack) {
        setRecentTracks([currentTrack, ...recentTracks]);
      }
      await loadAndPlayTrack(queuedTracks.shift());
      setQueuedTracks([...queuedTracks]);
    } else if (currentTrack) {
      player.currentTime = player.duration;
      player.pause();
    }
  }, [
    player,
    recentTracks,
    currentTrack,
    queuedTracks,
    setCurrentTrack,
    setQueuedTracks,
    loadAndPlayTrack,
    setRecentTracks,
  ]);

  const onPreviousClicked = useCallback(async () => {
    if (recentTracks.length > 0) {
      if (currentTrack) {
        setQueuedTracks([currentTrack, ...queuedTracks]);
      }

      await loadAndPlayTrack(recentTracks.shift());

      setRecentTracks([...recentTracks]);

      return;
    }

    player.currentTime = 0;
  }, [
    player,
    recentTracks,
    currentTrack,
    queuedTracks,
    setCurrentTrack,
    setQueuedTracks,
    loadAndPlayTrack,
    setRecentTracks,
  ]);

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
  }, [player, queuedTracks, dispatch, onNextClicked, setCurrentTrack]);

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
      if (!currentTrack) {
        await loadAndPlayTrack(actualEvent.detail.tracks.shift());
      }

      setQueuedTracks([...queuedTracks, ...actualEvent.detail.tracks]);
    },
    [setQueuedTracks, currentTrack, onPlayTrack, queuedTracks]
  );

  const pauseTrack = useCallback(() => {
    player.pause();
  }, [player]);

  const onPlayerPause = useCallback(() => {
    setIsPaused(true);
  }, [setIsPaused]);

  const onPlayerPlay = useCallback(() => {
    setIsPaused(false);
  }, [setIsPaused, currentTrack]);

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
