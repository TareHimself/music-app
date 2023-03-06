import { useCallback } from "react";
import { IAlbum } from "../../../types";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import { useAppSelector } from "../../redux/hooks";
import AlbumRow from "../albums/AlbumRow";

const itemWidth = 200;
const itemGap = 40;

export default function LibraryScreen() {
  const albums = useAppSelector((s) => Object.values(s.app.data.albums));

  const { width } = useWindowDimensions();

  const maxPerRow = Math.floor((width - 210) / (itemWidth + itemGap)) || 1;
  const buildRows = useCallback((items: IAlbum[], maxPerRow: number) => {
    items.sort((a, b) => {
      if (a.title < b.title) {
        return -1;
      }
      if (a.title > b.title) {
        return 1;
      }
      return 0;
    });
    const final = [];
    const iters = Math.ceil(items.length / maxPerRow);
    for (let i = 0; i < iters; i++) {
      final.push(
        <AlbumRow
          key={i}
          rows={items.slice(i * maxPerRow, i * maxPerRow + maxPerRow)}
          expectedRowCount={maxPerRow}
        />
      );
    }
    return final;
  }, []);

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
        {buildRows(albums, maxPerRow)}
      </div>
    </div>
  );
}
