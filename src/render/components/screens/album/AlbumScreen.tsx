import { useParams } from "react-router-dom";
import { useAppSelector } from "@redux/hooks";
import TracksView from "../tracks/TracksList";
import ScreenWithImage from "../ScreenWithImage";
import { getCoverUrl } from "@render/utils";
import useAppNavigation from "@hooks/useAppNavigation";

export default function AlbumScreen() {

  const { albumId } = useParams();
  const { navigate } = useAppNavigation()
  
  const album = useAppSelector(
    (s) => s.library.data.albums[albumId ?? '']
  );

  if(!album){
    navigate('/library')
  }
  return (
    <ScreenWithImage
      cover={getCoverUrl(album?.cover)}
      header={<h1>{album?.title}</h1>}
    >
      <TracksView data={album?.tracks || []} />
    </ScreenWithImage>
  );
}
