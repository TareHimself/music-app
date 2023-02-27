import { IPlaylistTrack } from "../../../types";
import { useAppSelector } from "../../redux/hooks";
import TrackItem from "./TrackItem";

export default function TracksView(props: {
  data: string[] | IPlaylistTrack[];
}) {

  const tracks = useAppSelector(s => s.app.data.tracks)

  if (props.data.length === 0) {
    return (
      <div className="track-items">
      </div>
    )
  }
  else if (typeof props.data[0] === 'string') {
    return (
      <div className="track-items">
        {([...props.data] as string[]).sort((a, b) => {
          return (tracks[a]?.position || 0) - (tracks[b]?.position || 0)
        }).map((a) => {
          return <TrackItem trackId={a} key={a} />;
        })}
      </div>
    );
  }
  else {
    return (
      <div className="track-items">
        {([...props.data] as IPlaylistTrack[]).sort((a, b) => {
          return a.added - b.added
        }).map((a) => {
          return <TrackItem playlistInfo={a} key={a.track} />;
        })}
      </div>
    );
  }
}
