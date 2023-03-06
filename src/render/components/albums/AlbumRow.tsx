import { IAlbum } from "../../../types";
import AlbumItem from "./AlbumItem";
export default function AlbumRow({
  rows,
  expectedRowCount,
}: {
  rows: IAlbum[];
  expectedRowCount: number;
}) {
  const fakeRowsNeeded = expectedRowCount - rows.length;

  const fakeElements = [];

  for (let i = 0; i < fakeRowsNeeded; i++) {
    fakeElements.push(<AlbumItem key={`placeholder-${i}`} />);
  }

  return (
    <div className="library-content-row">
      {rows.map((row) => (
        <AlbumItem key={row.id} data={row} />
      ))}
      {fakeElements}
    </div>
  );
}
