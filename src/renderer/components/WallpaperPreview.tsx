import '../css/Main.css';
import { BiSearchAlt } from 'react-icons/bi';
import { IoResizeOutline } from 'react-icons/io5';
import { IWallpaperData } from 'renderer/types';
import { useAppDispatch } from 'renderer/redux/hooks';
import { setCurrentWallpaper } from 'renderer/redux/wallpapersSlice';

export default function WallpaperPreview({ data }: { data: IWallpaperData }) {
  const uri = `https://resize.oyintare.dev/600x338/https://wallpaperz.nyc3.cdn.digitaloceanspaces.com/wallpapers/${data.id}.png`;
  const dispatch = useAppDispatch();
  return (
    <div
      role="none"
      className="grid-item"
      onClick={() => {
        dispatch(setCurrentWallpaper(data.id));
      }}
    >
      <img
        id={`thumb-${data.id}`}
        src={uri}
        alt={`${data.id} preview`}
        draggable="false"
        loading="lazy"
        decoding="async"
      />
      <BiSearchAlt className="wp-preview-icon" />
      <div className="wp-preview-size">
        <h3>{`${data.width}x${data.height}`}</h3> <IoResizeOutline />
      </div>
    </div>
  );
}
