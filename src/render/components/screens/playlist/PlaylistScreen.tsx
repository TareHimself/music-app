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
  getCachedCover,
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

    return s.library.data.playlists[playlistId];
  });


  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  const playlistCover = useMemo(() => {
    if(isGeneratingCover)
    {
      return AppConstants.DEFAULT_COVER_ART
    }

    return playlist?.cover || getCachedCover(playlistId)
  },[playlist?.cover, playlistId,isGeneratingCover])


  useEffect(() => {
    if (!playlistCover && !isGeneratingCover) {
      setIsGeneratingCover(true);
      generatePlaylistCover(playlistId).then(() => {
        setIsGeneratingCover(false);
      });
    }
  }, [isGeneratingCover, playlistCover, playlistId]);

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
            setIsGeneratingCover(true);
            generatePlaylistCover(playlistId,true).then(() => {
              setIsGeneratingCover(false);
            });
          }
        },
      });
    },
    [playlistId]
  );

  return (
    <ScreenWithImage
      cover={playlistCover  || AppConstants.DEFAULT_COVER_ART}
      header={<h1>{playlist?.title}</h1>}
      onImageContextMenu={makeCoverContextMenu}
    >
      <TracksList data={playlist?.tracks || []} />
    </ScreenWithImage>
  );
}
