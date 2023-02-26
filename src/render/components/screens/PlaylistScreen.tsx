import React, { useCallback, useState } from "react";
import { imageColor } from "../../utils";
import { useAppSelector } from "../../redux/hooks";
import TracksView from "../tracks/TracksList";

export default function PlaylistScreen() {
  const playlist = useAppSelector(
    (s) => s.playlists.data.playlists[s.app.data.screenId.split("-")[1]]
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
          <img src={playlist.cover} onLoad={onImageLoaded} />
          <span>
            <h1>{playlist.title}</h1>
          </span>
        </div>

        <div className="screen-content">
          <TracksView data={playlist.tracks} />
        </div>
      </div>
    </div>
  );
}
