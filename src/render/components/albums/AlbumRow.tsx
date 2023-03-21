import { useCallback, useEffect, useRef, useState } from "react";
import { IAlbum } from "../../../types";
import AlbumItem from "./AlbumItem";
export default function AlbumRow({
  items: rows,
  expectedRowCount,
  scrollId,
  index,
  rowHeight,
  rowGap,
}: {
  items: IAlbum[];
  expectedRowCount: number;
  scrollId: string;
  index: number;
  rowHeight: number;
  rowGap: number;
}) {
  const fakeRowsNeeded = expectedRowCount - rows.length;

  const pendingOperation = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isVirtualized, setIsVirtualized] = useState(true);

  const isIndexOnScreen = useCallback(
    (index: number, div: HTMLDivElement) => {
      const position = rowHeight * index + rowGap * index;
      return (
        (position + rowHeight >= div.scrollTop || position >= div.scrollTop) &&
        position <= div.scrollTop + div.offsetHeight
      );
    },
    [rowGap, rowHeight]
  );

  const updateVirtualizedState = useCallback(
    (div: HTMLDivElement) => {
      const shouldDisplayElement =
        isIndexOnScreen(index, div) ||
        isIndexOnScreen(index - 1, div) ||
        isIndexOnScreen(index + 1, div);

      if (shouldDisplayElement !== !isVirtualized) {
        setIsVirtualized(!shouldDisplayElement);
      }
    },
    [index, isIndexOnScreen, isVirtualized]
  );

  const onScroll = useCallback(
    (e: Event) => {
      if (pendingOperation.current !== null) {
        return;
      }
      pendingOperation.current = setTimeout(
        () => (pendingOperation.current = null),
        50
      );
      updateVirtualizedState(e.target as HTMLDivElement);
    },
    [updateVirtualizedState]
  );

  useEffect(() => {
    document.getElementById(scrollId)?.addEventListener("scroll", onScroll);
    updateVirtualizedState(document.getElementById(scrollId) as HTMLDivElement);
    return () =>
      document
        .getElementById(scrollId)
        ?.removeEventListener("scroll", onScroll);
  }, [onScroll, scrollId, updateVirtualizedState]);

  if (isVirtualized) {
    return (
      <div className="library-content-row" style={{ height: rowHeight }}></div>
    );
  }

  return (
    <div className="library-content-row" data-fakes={fakeRowsNeeded}>
      {[
        ...rows.map((row) => <AlbumItem key={row.id} data={row} />),
        ...new Array(fakeRowsNeeded)
          .fill(fakeRowsNeeded)
          .map((a, idx) => <AlbumItem key={`placeholder-${idx}`} />),
      ]}
    </div>
  );
}
