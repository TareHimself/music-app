import { useLocation } from "react-router-dom";
import AppConstants from "../../../data";
import { IPlaylist } from "../../../types";
import { useAppSelector } from "../../redux/hooks";
import TracksView from "../tracks/TracksList";
import ScreenWithImage from "./ScreenWithImage";

export default function PlaylistScreen() {
  const location = useLocation();

  const playlist = useAppSelector((s) => {
    const playlistId = location.pathname.split("/")[2] || "";
    if (playlistId === "liked") {
      const fakePlaylist: IPlaylist = {
        tracks: s.library.data.likedTracks,
        id: "liked",
        title: "Liked",
        cover: AppConstants.DEFAULT_COVER_ART,
        position: -1,
      };
      return fakePlaylist;
    }

    return s.library.data.playlists[playlistId];
  });

  return (
    <ScreenWithImage
      cover={playlist?.cover || AppConstants.DEFAULT_COVER_ART}
      header={<h1>{playlist?.title}</h1>}
    >
      <TracksView data={playlist?.tracks || []} />
    </ScreenWithImage>
  );
}
