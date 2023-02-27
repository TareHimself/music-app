import { useCallback } from "react";
import { IAlbum } from "../../../types";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { loadTracksForAlbum } from "../../redux/slices/app";
import { useNavigate } from 'react-router-dom'
export default function AlbumItem({ data }: { data?: IAlbum }) {
  const dispatch = useAppDispatch();

  const artists = useAppSelector((s) => (data?.artists || []).map(a => s.app.data.artists[a]?.name || a));

  const navigate = useNavigate()
  const selectAlbum = useCallback(() => {
    dispatch(loadTracksForAlbum({ albumId: data.id }));
    navigate(`/album/${data.id}`)
  }, [dispatch]);

  if (!data || !artists.length) {
    return <div className="album-item placeholder"></div>;
  }

  return (
    <div className="album-item" onClick={selectAlbum}>
      <div className="album-item-image-wrapper">
        <img src={data.cover} />
      </div>
      <span>
        <h2>{data.title}</h2>
        <h3>{artists.join(" , ")}</h3>
      </span>
    </div>
  );
}
