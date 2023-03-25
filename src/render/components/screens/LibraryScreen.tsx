import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IAlbum } from "../../../types";
import useThrottle from "../../hooks/useThrottle";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import { useAppSelector } from "../../redux/hooks";
import { BiSearchAlt } from "react-icons/bi";
import useAppNavigation from "../../hooks/useAppNavigation";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AlbumItem from "../albums/AlbumItem";

const itemWidth = 200;
const itemGap = 40;
const ALBUM_ITEM_HEIGHT = 248;
const NAV_PANEL_WIDTH = 210;
const SCREEN_PADDING = 30;
const SEARCH_BAR_HEIGHT = 40;
const SEARCH_BAR_PADDING = 30;
const PLAYER_FRAME_HEIGHT = 85;
type AlbumListProps = {
  items: IAlbum[];
  expected: number;
  index: number;
};

type ALbumListConainerProps = ListChildComponentProps<
  {
    items: IAlbum[];
    expected: number;
  }[]
>;

class AlbumList extends React.Component<AlbumListProps> {
  constructor(props: AlbumListProps) {
    super(props);
  }

  render(): React.ReactNode {
    const { items, expected } = this.props;

    const rows: IAlbum[] = items || [];
    const fakesNeeded = Math.max((expected || 0) - rows.length, 0);
    return (
      <div className="library-content-row">
        {[
          ...rows.map((row) => <AlbumItem key={row.id} data={row} />),
          ...new Array(fakesNeeded)
            .fill(fakesNeeded)
            .map((_, idx) => <AlbumItem key={`placeholder-${idx}`} />),
        ]}
      </div>
    );
  }

  shouldComponentUpdate(nextProps: Readonly<AlbumListProps>): boolean {
    return (
      nextProps.expected !== this.props.expected ||
      !this.props.items.every((a, idx) => nextProps.items[idx]?.id === a.id)
    );
  }
}

function AlbumListContainer({ data, index, style }: ALbumListConainerProps) {
  return (
    <div
      style={{
        ...style,
        ...{
          display: "flex",
          justifyContent: "center",
        },
      }}
    >
      <AlbumList
        items={data[index]?.items || []}
        expected={data[index]?.expected || 0}
        index={index}
      />
    </div>
  );
}

export default function LibraryScreen() {
  const [albums, artists] = useAppSelector((s) => [
    Object.values(s.library.data.albums),
    s.library.data.artists,
  ]);

  const [currentSearch, setCurrentSearch] = useState("");

  const { width, height } = useWindowDimensions();

  const { getScroll, updateScroll } = useAppNavigation();

  const scrollElementRef = useRef<List | null>(null);

  const maxPerRow =
    Math.floor((width - NAV_PANEL_WIDTH) / (itemWidth + itemGap)) || 1;

  const buildRows = useCallback(
    (items: IAlbum[], maxPerRow: number, query = "") => {
      const currentItems = (
        query.length > 0
          ? items.filter((a) => {
              return (
                a.title.toLowerCase().includes(query) ||
                a.artists.some((art) =>
                  artists[art]?.name.toLowerCase().includes(query)
                )
              );
            })
          : items
      ).sort((a, b) => {
        if (a.title < b.title) {
          return -1;
        }
        if (a.title > b.title) {
          return 1;
        }
        return 0;
      });

      const final = [];
      const iters = Math.ceil(currentItems.length / maxPerRow);
      for (let i = 0; i < iters; i++) {
        final.push({
          items: currentItems.slice(i * maxPerRow, i * maxPerRow + maxPerRow),
          expected: maxPerRow,
        });
      }
      return final;
    },
    [artists]
  );

  const rowsData = useMemo(
    () => buildRows(albums, maxPerRow, currentSearch),
    [albums, buildRows, currentSearch, maxPerRow]
  );

  const updateSearch = useThrottle<string>(0.5 * 1000, setCurrentSearch, "");

  useEffect(() => {
    scrollElementRef.current?.scrollTo(getScroll());
  }, [getScroll]);

  return (
    <div className="screen" id="library">
      <div className="library-search">
        <BiSearchAlt />
        <input
          type={"text"}
          placeholder="Looking for something?"
          onChange={(c) => updateSearch(c.currentTarget.value.toLowerCase())}
        />
      </div>
      <List
        ref={(r) => (scrollElementRef.current = r)}
        onScroll={(p) => {
          if (scrollElementRef.current) {
            updateScroll(p.scrollOffset);
          }
        }}
        style={{
          ...({
            "--row-width": `${maxPerRow * (itemWidth + itemGap)}px`,
            "--item-width": `${itemWidth}px`,
            "--item-gap": `${itemGap}px`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as React.CSSProperties),
        }}
        itemCount={rowsData.length}
        itemSize={ALBUM_ITEM_HEIGHT + 40}
        height={
          height -
          PLAYER_FRAME_HEIGHT -
          (SCREEN_PADDING * 2 + SEARCH_BAR_HEIGHT + SEARCH_BAR_PADDING)
        }
        width={"100%"}
        itemData={rowsData}
      >
        {AlbumListContainer}
      </List>
      {/* <div
        
        id={scrollId}
        className=
        style={
          {
            "--row-width": `${maxPerRow * (itemWidth + itemGap)}px`,
            "--item-width": `${itemWidth}px`,
            "--item-gap": `${itemGap}px`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
        }
      >
      </div> */}
    </div>
  );
}
