import { useCallback } from "react";
import { IPlaylistTrack, ITrack } from "../../../types";
import { useAppSelector } from "../../redux/hooks";
import { toTimeString } from "../../utils";

export default function TrackItem(props: {
  trackId?: string;
  playlistInfo?: IPlaylistTrack;
}) {
  const trackId = props.trackId || props.playlistInfo.track;

  const trackData = useAppSelector((s) => s.app.data.tracks[trackId]);

  const allTrackData = useAppSelector((s) => s.app.data.tracks);

  const albumData = useAppSelector(
    (s) => s.app.data.albums[trackData?.album || ""]
  );

  const allArtists = useAppSelector((s) => s.app.data.artists);

  const { position, title, artists, duration } = trackData || {};

  const tryPlayTrack = useCallback(async () => {
    window.utils.queueTracks({
      tracks: albumData.tracks
        .reduce((all, tId) => {
          if (allTrackData[tId].position >= trackData.position) {
            all.push(allTrackData[tId]);
          }
          return all;
        }, [] as ITrack[])
        .sort((a, b) => a.position - b.position),
      replaceQueue: true,
    });
  }, [trackData, albumData, allTrackData]);

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
    <div className="track-item" onClick={tryPlayTrack}>
      <span className="track-title">
        <h3 data-info="pos">{position}</h3>
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
