import { useLocation } from "react-router-dom";
import AppConstants from "../../../data";
import { useAppSelector } from "../../redux/hooks";
import TracksView from "../tracks/TracksList";
import ScreenWithImage from "./ScreenWithImage";

export default function PlaylistScreen() {
  const location = useLocation();

  const playlist = useAppSelector(
    (s) => s.library.data.playlists[location.pathname.split("/")[2] || ""]
  );

  return (
    <ScreenWithImage
      cover={playlist?.cover || AppConstants.DEFAULT_COVER_ART}
      header={<h1>{playlist?.title}</h1>}
    >
      <TracksView data={playlist?.tracks || []} />
    </ScreenWithImage>
  );
}
