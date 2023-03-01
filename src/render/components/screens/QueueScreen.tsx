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

  return (
    <ScreenWithImage cover={album?.cover}>
      <div className="track-items">
        {[currentTrack, ...queuedTracks].map((a) => {
          return <TrackItem trackId={a} key={a} type={"queue"} />;
        })}
      </div>
    </ScreenWithImage>
  );
}
