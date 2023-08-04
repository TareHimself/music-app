import { useAppSelector } from "@redux/hooks";
import TrackItem from "../common/tracks/TrackItem";
import ScreenWithImage from "../common/ScreenWithImage";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { useMemo } from "react";
import AutoSizer ,{ Size as AutoSizerState } from "react-virtualized-auto-sizer";
import { getCoverUrl } from "@render/utils";

export type IQueuedItem = {
  track: string;
  index: number;
};


type QueuedListConainerProps = ListChildComponentProps<
  IQueuedItem[]
>;

function QueuedTrackContainer(props: QueuedListConainerProps) {
  const data = props.data[props.index];
  if (!data) {
    return null;
  } else {
    return (
      <div style={props.style}>
       <TrackItem
              trackId={data.track}
              key={props.index}
              type={"queue"}
              index={data.index}
              activeOverride={props.index === 0}
            />
      </div>
    );
  }
}

export default function QueueScreen() {
  const [queuedTracks, currentTrack, album] = useAppSelector((s) => [
    s.player.data.queuedTracks,
    s.player.data.currentTrack,
    s.library.data.albums[
      s.library.data.tracks[s.player.data.currentTrack || ""]?.album || ""
    ],
  ]);


  const itemData = useMemo(() => {
    if(!currentTrack){
      return []
    }

    return [
       { track: currentTrack, index: -1 },
       ...queuedTracks.map<IQueuedItem>((a, idx) => ({
         track: a,
         index: idx,
       })),
     ]
   },[currentTrack, queuedTracks])

  if (!currentTrack) {
    return <div className="screen"></div>;
  }

  return (
    <ScreenWithImage cover={ getCoverUrl(album?.cover)}>
      <div className="track-items">
        <AutoSizer>
          {({ height, width }: AutoSizerState) => {

            return (
              <List
                style={{
                  ...({
                    overflow: "overlay",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } as React.CSSProperties),
                }}
                // className="track-items"
                itemCount={itemData.length}
                itemData={itemData}
                itemSize={70}
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                height={height!}
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                width={width!}
              >
                {QueuedTrackContainer}
              </List>
            );
          }}
        </AutoSizer>
      </div>
    </ScreenWithImage>
  );
}
