import { IAlbum } from "@types";
import SearchItem from "./SearchItem";
export default function SearchRow({
  rows,
  expectedRowCount,
}: {
  rows: IAlbum[];
  expectedRowCount: number;
}) {
  const fakeRowsNeeded = expectedRowCount - rows.length;

  const fakeElements = [];

  for (let i = 0; i < fakeRowsNeeded; i++) {
    fakeElements.push(<SearchItem key={`placeholder-${i}`} />);
  }

  return (
    <div className="library-content-row">
      {rows.map((row) => (
        <SearchItem key={row.id} data={row} />
      ))}
      {fakeElements}
    </div>
  );
}
