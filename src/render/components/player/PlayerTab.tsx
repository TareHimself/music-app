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
  IQueueTracksEventData,
  IQueueTracksEventDataWithReplace,
} from "@types";
import { useAppDispatch, useAppSelector } from "@redux/hooks";
import {
  addRecentTracks,
  setCurrentTrack,
  replaceQueuedTracks,
  replaceRecentTracks,
  setRepeatState,
  setShuffleState,
  setIsPaused,
  loadTracksForAlbum,
  updateTracks,
} from "@redux/exports";
import { toTimeString } from "@render/utils";
import ControllableSlider from "./ControllableSlider";
import { StreamManager } from "@render/global";
import AppConstants from "../../../data";
import { IconBaseProps } from "react-icons";
import useAppNavigation from "@hooks/useAppNavigation";
import { LikeButton } from "@components/screens/exports";

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

  const { navigate } = useAppNavigation();

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
    dispatch(loadTracksForAlbum({ albumId: album }));
    navigate(`/album/${album}`);
  }, [allTracks, currentTrackId, dispatch, navigate]);

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

  const loadAndUpdateTrack = useCallback(
    async (trackId: string) => {
      const track = allTracks[trackId];
      if (!track) return;
      const album = albums[track.album];
      if (!album) return;

      if (StreamManager.fetching(trackId)) {
        return;
      }
      //console.trace(`LOAD AND UPDATE TRACK | ${trackId} | ${track.title}`);
      const streamInfo = await StreamManager.getStreamInfo({
        id: track.id,
        title: track.title,
        album: album.title,
        uri: track.uri,
        artists: track.artists.map((a) => artists[a]?.name || ""),
      });

      if (!streamInfo) {
        return streamInfo;
      }

      if (streamInfo.duration !== track.duration) {
        dispatch(
          updateTracks({
            update: [
              {
                id: track.id,
                duration: streamInfo.duration,
                uri: streamInfo.from,
              },
            ],
          })
        );
      }

      return streamInfo;
    },
    [albums, allTracks, artists, dispatch]
  );

  // Just loads and plays a track
  const loadAndPlayTrack = useCallback(
    async (trackId: string) => {
      const track = allTracks[trackId];
      if (!track) return;
      const album = albums[track.album];
      if (!album) return;

      await loadAndUpdateTrack(trackId);

      if (!StreamManager.play(trackId)) {
        console.error("No sources found for the track");
        return false;
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
      return true;
    },
    [allTracks, albums, loadAndUpdateTrack, dispatch, player, artists]
  );

  // handles switching to the next track and pre-loading the one after that
  const onNextClicked = useCallback(async () => {
    const newQueued = [...queuedTracks];
    const newRecents = [...recentTracks];
    const toPlay = newQueued.shift();
    if (toPlay && (await loadAndUpdateTrack(toPlay)) !== undefined) {
      if (currentTrackId) newRecents.push(currentTrackId);
      dispatch(replaceRecentTracks(newRecents));
      await loadAndPlayTrack(toPlay);
      dispatch(replaceQueuedTracks(newQueued));
    }
    // if (queuedTracks.length > 0 || repeatState !== ERepeatState.OFF) {
    //   const newQueued = [...queuedTracks];
    //   if (repeatState === ERepeatState.REPEAT) {
    //     if (previousCurrent) newQueued.push(previousCurrent);

    //     const pendingTrack = newQueued.shift();
    //     if (pendingTrack) {
    //       await loadAndPlayTrack(pendingTrack);
    //       dispatch(replaceQueuedTracks(newQueued));
    //       return;
    //     }
    //   } else if (repeatState === ERepeatState.REPEAT_ONE) {
    //     if (currentTrackId) {
    //       await loadAndPlayTrack(currentTrackId);
    //       return;
    //     }
    //   } else {
    //     if (previousCurrent)
    //       dispatch(replaceRecentTracks([...recentTracks, previousCurrent]));

    //     const pendingTrack = newQueued.shift();
    //     if (pendingTrack) {
    //       await loadAndPlayTrack(pendingTrack);
    //       dispatch(replaceQueuedTracks(newQueued));
    //       return;
    //     }
    //   }
    //   dispatch(setCurrentTrack(null));
    //   player.src = "";

    //   setTrackTiming({
    //     progress: 0,
    //     length: 0,
    //   });
    //   navigator.mediaSession.metadata = null;
    //   await window.bridge.clearDiscordPresence();
    // }
  }, [
    repeatState,
    queuedTracks,
    currentTrackId,
    loadAndPlayTrack,
    dispatch,
    player,
  ]);

  // handles switching to the previous track
  const onPreviousClicked = useCallback(async () => {
    console.log(
      "Recent tracks",
      recentTracks.map((a) => allTracks[a]?.title)
    );
    if (recentTracks.length > 0) {
      const previousTrackId = currentTrackId;

      const newRecent = [...recentTracks];
      const pendingTrack = newRecent.pop();
      console.log(
        "new data",
        newRecent.map((a) => allTracks[a]?.title),
        allTracks[pendingTrack!]
      );
      if (pendingTrack) {
        dispatch(replaceRecentTracks(newRecent));
        await loadAndPlayTrack(pendingTrack);
        if (previousTrackId) {
          dispatch(replaceQueuedTracks([previousTrackId, ...queuedTracks]));
        }
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

  const onEventSkipToTrack = useCallback(
    async (e: Event) => {
      const actualEvent = e as CustomEvent<number>;
      const queueCopy = [...queuedTracks];
      const toAddToRecents = queueCopy.splice(0, actualEvent.detail + 1);
      if (currentTrackId) {
        toAddToRecents.push(currentTrackId);
      }
      const toPlay = queueCopy.shift();
      dispatch(replaceQueuedTracks(queueCopy));
      if (toPlay) {
        await loadAndPlayTrack(toPlay);
      }
      dispatch(replaceRecentTracks(toAddToRecents));
    },
    [loadAndPlayTrack]
  );

  // handles external queue adds
  const onEventQueueTracks = useCallback(
    async (e: Event) => {
      const actualEvent = e as CustomEvent<IQueueTracksEventDataWithReplace>;
      // if (shuffleState === EShuffleState.ON) {
      //   actualEvent.detail.tracks.sort(() => 0.5 - Math.random());
      // }

      const trackIds = actualEvent.detail.tracks;
      if (actualEvent.detail.startIndex > 0) {
        const tracksToPushToRecents = trackIds.splice(
          0,
          actualEvent.detail.startIndex
        );
        dispatch(replaceRecentTracks(tracksToPushToRecents));
      }

      const trackToPlay = trackIds.shift();

      dispatch(replaceQueuedTracks(trackIds));

      if (trackToPlay) {
        await loadAndPlayTrack(trackToPlay);
      }
    },
    [currentTrackId, dispatch, loadAndPlayTrack]
  );

  const onEventPlayTracksNext = useCallback(
    async (e: Event) => {
      const actualEvent = e as CustomEvent<IQueueTracksEventData>;

      // if (shuffleState === EShuffleState.ON) {
      //   actualEvent.detail.tracks.sort(() => 0.5 - Math.random());
      // }

      const tracks = actualEvent.detail.tracks;

      const trackToPlay = currentTrackId === null ? tracks.shift() : undefined;

      dispatch(replaceQueuedTracks([...tracks, ...queuedTracks]));

      if (trackToPlay) {
        loadAndPlayTrack(trackToPlay);
      }
    },
    [currentTrackId, dispatch, loadAndPlayTrack, queuedTracks]
  );

  const onEventPlayTracksLater = useCallback(
    async (e: Event) => {
      const actualEvent = e as CustomEvent<IQueueTracksEventData>;

      // if (shuffleState === EShuffleState.ON) {
      //   actualEvent.detail.tracks.sort(() => 0.5 - Math.random());
      // }

      const tracks = actualEvent.detail.tracks;

      const trackToPlay =
        currentTrackId === null && queuedTracks.length === 0
          ? tracks.shift()
          : undefined;

      dispatch(replaceQueuedTracks([...queuedTracks, ...tracks]));

      if (trackToPlay) {
        loadAndPlayTrack(trackToPlay);
      }
    },
    [currentTrackId, dispatch, loadAndPlayTrack, queuedTracks]
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
    document.addEventListener(
      AppConstants.RENDERER_EVENT_SKIP_TO_INDEX,
      onEventSkipToTrack
    );

    document.addEventListener(
      AppConstants.RENDERER_EVENT_QUEUE_TRACKS,
      onEventQueueTracks
    );

    document.addEventListener(
      AppConstants.RENDERER_EVENT_PLAY_NEXT,
      onEventPlayTracksNext
    );

    document.addEventListener(
      AppConstants.RENDERER_EVENT_PLAY_LATER,
      onEventPlayTracksLater
    );

    player.addEventListener("timeupdate", onPlayerTimeUpdate);

    player.addEventListener("pause", onPlayerPause);

    player.addEventListener("playing", onPlayerPlay);

    player.addEventListener("ended", onCurrentTrackOver);

    navigator.mediaSession.setActionHandler("previoustrack", onPreviousClicked);

    navigator.mediaSession.setActionHandler("nexttrack", onNextClicked);

    return () => {
      document.removeEventListener(
        AppConstants.RENDERER_EVENT_SKIP_TO_INDEX,
        onEventSkipToTrack
      );

      document.removeEventListener(
        AppConstants.RENDERER_EVENT_QUEUE_TRACKS,
        onEventQueueTracks
      );

      document.removeEventListener(
        AppConstants.RENDERER_EVENT_PLAY_NEXT,
        onEventPlayTracksNext
      );

      document.removeEventListener(
        AppConstants.RENDERER_EVENT_PLAY_LATER,
        onEventPlayTracksLater
      );

      player.removeEventListener("timeupdate", onPlayerTimeUpdate);

      player.removeEventListener("pause", onPlayerPause);

      player.removeEventListener("playing", onPlayerPlay);

      player.removeEventListener("ended", onCurrentTrackOver);

      navigator.mediaSession.setActionHandler("previoustrack", null);

      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [
    onEventSkipToTrack,
    onEventQueueTracks,
    onPlayerTimeUpdate,
    onPlayerPause,
    onPlayerPlay,
    onCurrentTrackOver,
    player,
    onPreviousClicked,
    onNextClicked,
    onEventPlayTracksNext,
    onEventPlayTracksLater,
  ]);

  // preload next and previous tracks
  useEffect(() => {
    if (currentTrackId) {
      if (queuedTracks[0] && !StreamManager.has(queuedTracks[0])) {
        loadAndUpdateTrack(queuedTracks[0]);
      }

      const lastRecent = recentTracks[recentTracks.lastIndex()];
      if (lastRecent && !StreamManager.has(lastRecent)) {
        loadAndUpdateTrack(lastRecent);
      }
    }
  }, [currentTrackId, loadAndUpdateTrack, queuedTracks, recentTracks]);

  return (
    <div id="player-tab">
      <span
        className="player-section"
        style={{
          justifyContent: "flex-start",
        }}
      >
        {currentTrackId && (
          <span
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
            }}
          >
            <span
              style={{
                display: "flex",
                flexGrow: "1",
                alignItems: "center",
              }}
            >
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
              </span>
            </span>
            <LikeButton trackId={currentTrackId} />
          </span>
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