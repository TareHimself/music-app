import { IPlaylistTrack } from "@types";
import TrackItem from "./TrackItem";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

type TrackListConainerProps = ListChildComponentProps<
  string[] | IPlaylistTrack[]
>;

function TrackContainer(props: TrackListConainerProps) {
  const data = props.data[props.index];
  if (!data) {
    return null;
  }
  if (typeof data === "string") {
    return (
      <div style={props.style}>
        <TrackItem trackId={data} key={data} type={"album"} />
      </div>
    );
  } else {
    return (
      <div style={props.style}>
        <TrackItem playlistInfo={data} key={data.track} type={"playlist"} />
      </div>
    );
  }
}

export default function TracksList(props: {
  data: string[] | IPlaylistTrack[];
}) {
  if (props.data.length === 0) {
    return <div className="track-items"></div>;
  } else {
    return (
      <div className="track-items">
        <AutoSizer>
          {({ height, width }) => {
            console.log(height, width);
            return (
              <List
                style={{
                  ...({
                    overflow: "overlay",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } as React.CSSProperties),
                }}
                // className="track-items"
                itemCount={props.data.length}
                itemData={
                  typeof props.data[0] === "string"
                    ? ([...props.data] as string[])
                    : ([...props.data] as IPlaylistTrack[])
                }
                itemSize={70}
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                height={height!}
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                width={width!}
              >
                {TrackContainer}
              </List>
            );
          }}
        </AutoSizer>
      </div>
    );
  }
}
