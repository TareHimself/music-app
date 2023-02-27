import React, { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { imageColor } from "../../utils";
import TracksView from "../tracks/TracksList";

export default function AlbumScreen() {
  const location = useLocation();
  const album = useAppSelector(
    (s) => s.app.data.albums[location.pathname.split("/")[2]]
  );

  const onImageLoaded = useCallback(
    (ev: React.SyntheticEvent<HTMLImageElement>) => {
      const color = imageColor.getColor(ev.currentTarget);
      const container = document.querySelector<HTMLDivElement>(".screen");
      if (container) {
        container.style.setProperty(
          "--prominent-color",
          `rgb(${color[0]},${color[1]},${color[2]})`
        );
      }
    },
    []
  );
  return (
    <div className="screen">
      <div className="screen-bg">
        <div className="screen-bg-start" />
        <div className="screen-bg-end" />
      </div>
      <div className="screen-fg">
        <div className="screen-top">
          <img src={album.cover} onLoad={onImageLoaded} />
          <span>
            <h1>{album.title}</h1>
          </span>
        </div>

        <div className="screen-content">
          <TracksView data={album.tracks} />
        </div>
      </div>
    </div>
  );
}
