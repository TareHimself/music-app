import '../css/Main.css';
import { ReactElement } from 'react';
import { useAppSelector } from 'renderer/redux/hooks';
import WallpaperPreview from '../components/WallpaperPreview';

export default function Home() {
  let wallpaperElements: Array<ReactElement> = [];

  const wallpapers = useAppSelector((s) => s.wallpapers.data);

  if (wallpapers?.length) {
    wallpaperElements = wallpapers.map((apiData) => (
      <WallpaperPreview key={apiData.id} data={apiData} />
    ));
  }

  return (
    <div className="page">
      <div className="item-grid">{wallpaperElements}</div>
    </div>
  );
}
