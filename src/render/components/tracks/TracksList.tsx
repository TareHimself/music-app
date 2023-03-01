import { IPlaylistTrack } from "../../../types";
import TrackItem from "./TrackItem";

export default function TracksView(props: {
  data: string[] | IPlaylistTrack[];
}) {
  if (props.data.length === 0) {
    return <div className="track-items"></div>;
  } else if (typeof props.data[0] === "string") {
    return (
      <div className="track-items">
        {([...props.data] as string[]).map((a) => {
          return <TrackItem trackId={a} key={a} type={"album"} />;
        })}
      </div>
    );
  } else {
    return (
      <div className="track-items">
        {([...props.data] as IPlaylistTrack[]).map((a) => {
          return <TrackItem playlistInfo={a} key={a.track} type={"playlist"} />;
        })}
      </div>
    );
  }
}
