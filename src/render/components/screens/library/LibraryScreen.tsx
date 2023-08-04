import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  Component,
} from "react";
import { IAlbum } from "@types";
import useThrottle from "@hooks/useThrottle";
import useWindowDimensions from "@hooks/useWindowDimensions";
import { useAppSelector } from "@redux/hooks";
import { BiSearchAlt } from "react-icons/bi";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AlbumItem from "../album/AlbumItem";
import usePathValue from "@hooks/usePathValue";
import AutoSizer ,{ Size as AutoSizerState } from "react-virtualized-auto-sizer";

const itemWidth = 200;
const itemGap = 40;
const ALBUM_ITEM_HEIGHT = 248;
const NAV_PANEL_WIDTH = 210;

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

class AlbumList extends Component<AlbumListProps> {
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

  const { getValue: getScroll, updateValue: updateScroll } = usePathValue(
    "scroll",
    0
  );

  const { getValue: getSearchValue, updateValue: updateSearchValue } =
    usePathValue("search", "");

  const [currentSearch, setCurrentSearch] = useState(getSearchValue());

  const { width } = useWindowDimensions();

  const scrollElementRef = useRef<List | null>(null);

  const cssContentMargin = useMemo(() => 20,[])

  const maxPerRow =
    Math.floor(((width - NAV_PANEL_WIDTH) - (cssContentMargin * 2)) / (itemWidth + itemGap)) || 1;

  const buildRows = useCallback(
    (items: IAlbum[], maxPerRow: number, query = "") => {
      const currentItems = (
        query.length > 0
          ? items.filter((a) => {
              return (
                a.id.toLowerCase() === query || a.title.toLowerCase().includes(query) ||
                a.artists.some((art) =>
                  artists[art]?.name.toLowerCase().includes(query)
                )
              );
            })
          : items
      ).sort((a, b) => {
        if (a.title.toLowerCase() < b.title.toLowerCase()) {
          return -1;
        }
        if (a.title.toLowerCase() > b.title.toLowerCase()) {
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
    () => buildRows(albums, maxPerRow, currentSearch.trim().toLowerCase()),
    [albums, buildRows, currentSearch, maxPerRow]
  );

  const updateSearch = useThrottle<string>(
    0.5 * 1000,
    (e) => {
      setCurrentSearch(e);
      updateSearchValue(e);
    },
    ""
  );

  
  return (
    <div className="screen" id="library">
      <div className="library-search">
        <BiSearchAlt />
        <input
          type={"text"}
          placeholder="Looking for something?"
          defaultValue={getSearchValue()}
          onChange={(c) => updateSearch(c.currentTarget.value)}
        />
      </div>
      <div className="library-content">
      <AutoSizer>
          {({ height, width }: AutoSizerState) => {
            return (
              <List
        ref={(r) => {

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
            "--row-width": `${maxPerRow * (itemWidth + itemGap)}px`,
            "--item-width": `${itemWidth}px`,
            "--item-gap": `${itemGap}px`,
            overflowY: "overlay" as string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as React.CSSProperties),
        }}
        itemCount={rowsData.length}
        itemSize={ALBUM_ITEM_HEIGHT + 40}
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        height={height!}
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        width={width!}
        itemData={rowsData}
      >
        {AlbumListContainer}
      </List>
            );
          }}
        </AutoSizer>
      </div>
      
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
