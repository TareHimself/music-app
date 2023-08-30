import { IPlaylistTrack } from "@types";
import TrackItem from "./TrackItem";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AutoSizer, { Size as AutoSizerState } from "react-virtualized-auto-sizer";
import usePathValue from "@hooks/usePathValue";
import { useMemo, useRef, useState } from "react";
import { BiSearchAlt } from "react-icons/bi";
import useThrottle from "@hooks/useThrottle";
import { useAppSelector } from "@redux/hooks";

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

  const trackData = useAppSelector((a) => a.library.data.tracks)

  const artistsData = useAppSelector((a) => a.library.data.artists)

  const { getValue: getScroll, updateValue: updateScroll } = usePathValue(
    "scroll",
    0
  );

  const scrollElementRef = useRef<List | null>(null);

  const { getValue: getSearchValue, updateValue: updateSearchValue } =
    usePathValue("search", "");

  const [currentSearch, setCurrentSearch] = useState(getSearchValue());

  const updateSearch = useThrottle<string>(
    0.5 * 1000,
    (e) => {
      setCurrentSearch(e);
      updateSearchValue(e);
    },
    ""
  );

  const itemsToDisplay = useMemo(() => {
    const query = currentSearch.trim().toLowerCase()
    if(query.length === 0){
      return props.data
    }

    if(typeof props.data[0] === 'string'){
      return (props.data as string[]).filter( a => trackData[a]?.id.toLowerCase() === query ||trackData[a]?.title.toLowerCase().includes(query) || trackData[a]?.artists.some(b => artistsData[b]?.name.trim().toLowerCase().includes(query)))
    }
    else
    {
      return (props.data as IPlaylistTrack[]).filter( a => a.track.toLowerCase() === query ||
       trackData[a.track]?.title.toLowerCase().includes(query) || trackData[a.track]?.artists.some(b => artistsData[b]?.name.trim().toLowerCase().includes(query))
      )
    }
  },[artistsData, currentSearch, props.data, trackData])
  
  if (props.data.length === 0) {
    return <div className="track-items"></div>;
  } else {
    return (
      <div className="track-items">
      <div className="library-search track-list">
        <BiSearchAlt />
        <input
          type={"text"}
          placeholder="Search Tracks"
          defaultValue={""}
          onChange={(c) => updateSearch(c.currentTarget.value)}
        />
      </div>
        <AutoSizer>
          {({ height, width }: AutoSizerState) => {
            return (
              <List
              ref={(r)=>{
                if(!scrollElementRef.current && r){
                  r.scrollTo(getScroll())
                }
                scrollElementRef.current = r
              }}
              onScroll={(p) => {
                if (scrollElementRef.current) {
                  updateScroll(p.scrollOffset);
                }
              }}
                style={{
                  ...({
                    overflow: "overlay",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } as React.CSSProperties),
                }}
                // className="track-items"
                itemCount={itemsToDisplay.length}
                itemData={
                  typeof itemsToDisplay[0] === "string"
                    ? ([...itemsToDisplay] as string[])
                    : ([...itemsToDisplay] as IPlaylistTrack[])
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
