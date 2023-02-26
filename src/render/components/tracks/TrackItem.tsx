import React, { useCallback } from "react";
import { IPlaylistTrack } from "../../../types";
import { useAppSelector } from "../../redux/hooks";
import { toTimeString } from "../../utils";

export default function TrackItem(props: {
  trackId?: string;
  playlistInfo?: IPlaylistTrack;
}) {
  const trackId = props.trackId || props.playlistInfo.track;

  const trackData = useAppSelector((s) => s.tracks.data[trackId]);

  if (!trackData) {
    return <div className="track-item">Loading</div>;
  }

  const { position, title, artists, duration } = trackData;

  const tryPlayTrack = useCallback(async () => {
    window.utils.playTrack({ track: trackData });
  }, []);

  return (
    <div className="track-item" onClick={tryPlayTrack}>
      <span className="track-title">
        <h3 data-info="pos">{position + 1}</h3>
        <span data--info="text">
          <h2>{title}</h2>
          <p>{artists.join(" , ").trim()}</p>
        </span>
      </span>

      <span>
        <h3>{duration === 0 ? "-:--" : toTimeString(duration)}</h3>
      </span>
    </div>
  );
}
