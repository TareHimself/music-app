import { useLocation } from "react-router-dom";
import AppConstants from "@root/data";
import { IPlaylist } from "@types";
import { useAppSelector } from "@redux/hooks";
import TracksList from "../common/tracks/TracksList";
import ScreenWithImage from "../common/ScreenWithImage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  generateContextMenu,
  generatePlaylistCover,
  getCoverUrl,
} from "@render/utils";

export default function PlaylistScreen() {
  const location = useLocation();

  const playlistId = useMemo(() => {
    return location.pathname.split("/")[2] || "";
  }, [location.pathname]);

  

  const playlist = useAppSelector((s) => {
    if (playlistId === "liked") {
      const fakePlaylist: IPlaylist = {
        tracks: s.library.data.likedTracks,
        id: "liked",
        title: "Liked",
        cover: "",
        position: -1,
      };
      return fakePlaylist;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return s.library.data.playlists[playlistId]!;
  });

  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  const [playlistCover,setPlaylistCover] = useState(getCoverUrl(playlist.cover || playlist.id,false))

  const generateCover = useCallback(async ()=>{
    setIsGeneratingCover(true);
    setPlaylistCover(AppConstants.DEFAULT_COVER_ART)
    generatePlaylistCover(playlistId).then(() => {
      setPlaylistCover(getCoverUrl(playlist.id,false) + `?timestamp=${Date.now()}`)
      setIsGeneratingCover(false);
    });
  },[playlist.id, playlistId])


  useEffect(()=>{
    const newCover = getCoverUrl(playlist.cover || playlist.id,false)
    setPlaylistCover(newCover)
  },[playlist.cover, playlist.id, playlistId])

  const makeCoverContextMenu = useCallback(
    (e: React.MouseEvent) => {
      generateContextMenu({
        event: e,
        options: [
          {
            id: "regenerate",
            name: "Regenerate Cover",
          },
        ],
        callback: (s) => {
          if (s === "regenerate") {
            generateCover()
          }
        },
      });
    },
    [generateCover]
  );

  return (
    <ScreenWithImage
      cover={playlistCover ?? AppConstants.DEFAULT_COVER_ART}
      header={<h1>{playlist?.title}</h1>}
      onImageContextMenu={makeCoverContextMenu}
      onImageLoadError={() => {
        if(!isGeneratingCover){
          generateCover()
        }
      }}
    >
      <TracksList data={playlist?.tracks || []} />
    </ScreenWithImage>
  );
}
