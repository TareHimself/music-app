import { SyntheticEvent, useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
  refreshWallpapers,
  setWallpapersPendingUpload,
} from 'renderer/redux/wallpapersSlice';
import { IConvertedSystemFiles } from 'renderer/types';
import { addNotification } from '../utils';
import WallpaperUploadItem from './WallpaperUploadItem';

const clickOutClassnames = ['wp-view', 'wp-view-container'];

export default function WallpaperUploadModal() {
  const dispatch = useAppDispatch();

  const userData = useAppSelector((s) => s.currentUser);
  const wallpaperData = useAppSelector((s) => s.wallpapers);

  const [uploadingStatus, setUploadingStatus] = useState(false);

  const files = useRef(wallpaperData.dataPendingUpload || []);
  const [renders, setRenders] = useState(0);

  const updateIndex = useCallback(
    (index: number, update: IConvertedSystemFiles) => {
      if (uploadingStatus || !files) return;
      const arr = [...files.current];
      arr[index] = update;
      files.current = arr;
      setRenders(renders + 1);
    },
    [renders, uploadingStatus, files]
  );

  const elements = files.current.map(
    (upload: IConvertedSystemFiles, uploadIndex: number) => {
      const element = (
        <WallpaperUploadItem
          key={upload.id}
          data={upload}
          index={uploadIndex}
          updateFunc={updateIndex}
        />
      );
      return element;
    }
  );

  function onAttemptClickOut(event: SyntheticEvent<HTMLElement, Event>) {
    if (uploadingStatus) return;
    const element = event.target as HTMLElement;
    // eslint-disable-next-line no-empty
    if (clickOutClassnames.includes(element.className)) {
    }
  }

  const uploadWallpapers = useCallback(async () => {
    if (uploadingStatus || !files) return;

    if (
      files.current.filter((file) => file.tags.split(',').length < 3).length !==
      0
    ) {
      addNotification('All wallpapers must have atleast 3 tags');
      return;
    }

    setUploadingStatus(true);
    if (userData.loginData?.account.id && wallpaperData.data) {
      addNotification('Uploading Wallpapers');
      await window.electron.ipcRenderer?.uploadImages(
        files.current,
        userData.loginData?.account.id
      );

      addNotification('Upload Complete');

      dispatch(refreshWallpapers({ bShouldReset: false }));
    }

    setUploadingStatus(false);

    dispatch(setWallpapersPendingUpload(null));
  }, [
    uploadingStatus,
    files,
    userData.loginData?.account.id,
    wallpaperData.data,
    dispatch,
  ]);

  const cancelUpload = useCallback(async () => {
    if (uploadingStatus) return;
    dispatch(setWallpapersPendingUpload(null));
  }, [dispatch, uploadingStatus]);

  return (
    <div role="none" id="wp-upload" onClick={onAttemptClickOut}>
      <div className="wp-uploads-container">{elements}</div>
      {!uploadingStatus && (
        <div className="wp-upload-buttons">
          <button type="button" onClick={cancelUpload}>
            <h2 style={{ fontSize: '160%' }}>Cancel</h2>
          </button>
          <button type="button" onClick={uploadWallpapers}>
            <h2 style={{ fontSize: '160%' }}>Upload</h2>
          </button>
        </div>
      )}
    </div>
  );
}
