import { useAppSelector } from "../../redux/hooks";
import AlbumItem from "./AlbumItem";
export default function AlbumRow({
  rows,
  expectedRowCount,
}: {
  rows: string[];
  expectedRowCount: number;
}) {
  const albums = useAppSelector((s) => s.app.data.albums);

  const fakeRowsNeeded = expectedRowCount - rows.length;

  const fakeElements = [];

  for (let i = 0; i < fakeRowsNeeded; i++) {
    fakeElements.push(<AlbumItem key={`placeholder-${i}`} />);
  }

  return (
    <div className="library-content-row">
      {rows.map((row) => (
        <AlbumItem key={row} data={albums[row]} />
      ))}
      {fakeElements}
    </div>
  );
}
