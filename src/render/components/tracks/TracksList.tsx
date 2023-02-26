import React from "react";
import { IPlaylistTrack } from "../../../types";
import TrackItem from "./TrackItem";

export default function TracksView(props: {
  data: string[] | IPlaylistTrack[];
}) {
  return (
    <div className="track-items">
      {props.data.map((a) => {
        if (typeof a === "string") {
          return <TrackItem trackId={a} />;
        } else {
          <TrackItem playlistInfo={a} />;
        }
      })}
    </div>
  );
}
