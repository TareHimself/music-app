import { useLocation } from "react-router-dom";
import { useAppSelector } from "@redux/hooks";
import TracksView from "../common/tracks/TracksList";
import ScreenWithImage from "../common/ScreenWithImage";

export default function AlbumScreen() {
  const location = useLocation();
  const album = useAppSelector(
    (s) => s.library.data.albums[location.pathname.split("/")[2] || ""]
  );

  return (
    <ScreenWithImage
      cover={album?.cover || ""}
      header={<h1>{album?.title}</h1>}
    >
      <TracksView data={album?.tracks || []} />
    </ScreenWithImage>
  );
}