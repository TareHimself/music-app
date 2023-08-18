import { useParams } from "react-router-dom";
import AppConstants from "@root/data";
import { IPlaylist } from "@types";
import { useAppSelector } from "@redux/hooks";
import TracksList from "../common/tracks/TracksList";
import ScreenWithImage from "../common/ScreenWithImage";
import { useCallback, useEffect, useState } from "react";
import {
  generateContextMenu,
  generatePlaylistCover,
  getCoverUrl,
} from "@render/utils";
import useAppNavigation from "@hooks/useAppNavigation";

export default function PlaylistScreen() {
  const { playlistId } = useParams();

  const { navigate } = useAppNavigation();

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

    const target = s.library.data.playlists[playlistId ?? ""];

    if (!target) {
      const dummyBeforeReRoute: IPlaylist = {
        tracks: [],
        id: "UNDEFINED",
        title: "",
        cover: "",
        position: -1,
      };
      return dummyBeforeReRoute;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return target;
  });

  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  const [playlistCover, setPlaylistCover] = useState(
    getCoverUrl(playlist.cover ||playlist.id, false)
  );

  const generateCover = useCallback(async () => {
    if (playlistId) {
      setIsGeneratingCover(true);
      setPlaylistCover(AppConstants.DEFAULT_COVER_ART);
      generatePlaylistCover(playlistId).then((wasGenerated) => {
        if (wasGenerated) {
          setPlaylistCover(
            getCoverUrl(playlist.id, false) + `?timestamp=${Date.now()}`
          );
        }
        setIsGeneratingCover(false);
      });
    }
  }, [playlist.id, playlistId]);

  useEffect(() => {
    const newCover = getCoverUrl(playlist.cover || playlist.id, false);
    setPlaylistCover(newCover);
  }, [playlist.cover, playlist.id, playlistId]);

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
            generateCover();
          }
        },
      });
    },
    [generateCover]
  );

  if (playlist.id === "UNDEFINED") {
    navigate("/library");
  }

  return (
    <ScreenWithImage
      cover={playlistCover ?? AppConstants.DEFAULT_COVER_ART}
      header={<h1>{playlist?.title}</h1>}
      onImageContextMenu={makeCoverContextMenu}
      onImageLoadError={() => {
        if (!isGeneratingCover) {
          generateCover();
        }
      }}
    >
      <TracksList data={playlist?.tracks || []} />
    </ScreenWithImage>
  );
}
