import { useCallback, useState } from "react";
import { IAlbum } from "../../../types";
import useThrottle from "../../hooks/useThrottle";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import { useAppSelector } from "../../redux/hooks";
import AlbumRow from "../albums/AlbumRow";
import { BiSearchAlt } from "react-icons/bi";
const itemWidth = 200;
const itemGap = 40;

export default function LibraryScreen() {
  const [albums, artists] = useAppSelector((s) => [
    Object.values(s.library.data.albums),
    s.library.data.artists,
  ]);

  const [currentSearch, setCurrentSearch] = useState("");

  const { width } = useWindowDimensions();

  const maxPerRow = Math.floor((width - 210) / (itemWidth + itemGap)) || 1;
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
        final.push(
          <AlbumRow
            key={i}
            rows={currentItems.slice(i * maxPerRow, i * maxPerRow + maxPerRow)}
            expectedRowCount={maxPerRow}
          />
        );
      }
      return final;
    },
    [artists]
  );

  const updateSearch = useThrottle<string>(0.5 * 1000, setCurrentSearch, "");

  return (
    <div className="screen" id="library">
      <div
        className="library-content"
        style={
          {
            "--row-width": `${maxPerRow * (itemWidth + itemGap)}px`,
            "--item-width": `${itemWidth}px`,
            "--item-gap": `${itemGap}px`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
        }
      >
        <div className="library-search">
          <BiSearchAlt />
          <input
            type={"text"}
            placeholder="Looking for something ?"
            onChange={(c) => updateSearch(c.currentTarget.value.toLowerCase())}
          />
        </div>
        {buildRows(albums, maxPerRow, currentSearch)}
      </div>
    </div>
  );
}
