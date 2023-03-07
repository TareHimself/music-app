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
} from "../redux/slices/player";
import { toTimeString, wait } from "../utils";
import ControllableSlider from "./ControllableSlider";
import { useNavigate } from "react-router-dom";
import { StreamManager } from "../global";
import AppConstants from "../../data";
import { IconBaseProps } from "react-icons";

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
  ] = useAppSelector((s) => [
    s.app.data.albums,
    s.app.data.artists,
    s.player.data.repeatState,
    s.player.data.shuffleState,
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
      const streamInfo = await StreamManager.getStreamInfo({
        id: allTracks[trackId].id,
        title: allTracks[trackId].title,
        album: albums[allTracks[trackId].album].title,
        uri: allTracks[trackId].uri,
        artists: allTracks[trackId].artists.map((a) => artists[a].name),
      });
      if (streamInfo) {
        player.src = streamInfo.uri;
        player.play();
      } else {
        console.log("No sources found for the track");
        return;
      }

      dispatch(setCurrentTrack(trackId));
      window.bridge.updateDiscordPresence(allTracks[trackId]);
    },
    [allTracks, albums, player, dispatch, artists]
  );

  // handles switching to the next track and pre-loading the one after that
  const onNextClicked = useCallback(async () => {
    console.log(repeatState);
    if (queuedTracks.length > 0 || repeatState !== ERepeatState.OFF) {
      const newQueued = [...queuedTracks];
      if (repeatState === ERepeatState.REPEAT) {
        if (currentTrackId) {
          newQueued.push(currentTrackId);
        }

        const pendingTrack = newQueued.shift();
        console.log("Pending track", currentTrackId, newQueued);
        await loadAndPlayTrack(pendingTrack);
        dispatch(replaceQueuedTracks(newQueued));
      } else if (repeatState === ERepeatState.REPEAT_ONE) {
        await loadAndPlayTrack(currentTrackId);
        return;
      } else {
        if (currentTrackId) {
          dispatch(addRecentTracks([currentTrackId]));
        }

        const pendingTrack = newQueued.shift();
        await loadAndPlayTrack(pendingTrack);
        dispatch(replaceQueuedTracks(newQueued));
      }

      // Preload Stream URI
      if (newQueued[0]) {
        await wait(1000);
        StreamManager.getStreamInfo({
          id: allTracks[newQueued[0]].id,
          title: allTracks[newQueued[0]].title,
          album: albums[allTracks[newQueued[0]].album].title,
          uri: allTracks[newQueued[0]].uri,
          artists: allTracks[newQueued[0]].artists.map((a) => artists[a].name),
        });
      }
    } else {
      dispatch(setCurrentTrack(null));
      player.src = "";

      setTrackTiming({
        progress: 0,
        length: 0,
      });

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
      await loadAndPlayTrack(pendingTrack);
      dispatch(replaceRecentTracks(newRecent));

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
        const queueTrackId = actualEvent.detail.tracks[0];
        StreamManager.getStreamInfo({
          id: allTracks[queueTrackId].id,
          title: allTracks[queueTrackId].title,
          album: albums[allTracks[queueTrackId].album].title,
          uri: allTracks[queueTrackId].uri,
          artists: allTracks[queueTrackId].artists.map((a) => artists[a].name),
        });
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
