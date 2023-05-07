import { useAppSelector } from "@redux/hooks";
import TrackItem from "../common/tracks/TrackItem";
import ScreenWithImage from "../common/ScreenWithImage";

export type IQueuedItem = {
  track: string;
  index: number;
};
export default function QueueScreen() {
  const [queuedTracks, currentTrack, album] = useAppSelector((s) => [
    s.player.data.queuedTracks,
    s.player.data.currentTrack,
    s.library.data.albums[
      s.library.data.tracks[s.player.data.currentTrack || ""]?.album || ""
    ],
  ]);

  if (!currentTrack) {
    return <div className="screen"></div>;
  }

  return (
    <ScreenWithImage cover={album?.cover || ""}>
      <div className="track-items">
        {[
          { track: currentTrack, index: -1 },
          ...queuedTracks.map<IQueuedItem>((a, idx) => ({
            track: a,
            index: idx,
          })),
        ].map((a, idx) => {
          return (
            <TrackItem
              trackId={a.track}
              key={idx}
              type={"queue"}
              index={a.index}
              activeOverride={idx === 0}
            />
          );
        })}
      </div>
    </ScreenWithImage>
  );
}
