import { useAppSelector } from "../../redux/hooks";
import TrackItem from "../tracks/TrackItem";
import ScreenWithImage from "./ScreenWithImage";

export default function QueueScreen() {
  const [queuedTracks, currentTrack, album] = useAppSelector((s) => [
    s.player.data.queuedTracks,
    s.player.data.currentTrack,
    s.app.data.albums[s.app.data.tracks[s.player.data.currentTrack]?.album],
  ]);

  if (!currentTrack) {
    return <div className="screen"></div>;
  }

  console.log(queuedTracks, currentTrack);

  return (
    <ScreenWithImage cover={album?.cover}>
      <div className="track-items">
        {[currentTrack, ...queuedTracks].map((a, idx) => {
          return (
            <TrackItem
              trackId={a}
              key={idx}
              type={"queue"}
              activeOverride={idx === 0}
            />
          );
        })}
      </div>
    </ScreenWithImage>
  );
}
