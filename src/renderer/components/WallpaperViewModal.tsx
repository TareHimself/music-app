/* eslint-disable react/jsx-no-bind */
import {
  BsArrowsFullscreen,
  BsDownload,
  BsChevronCompactLeft,
  BsChevronCompactRight,
} from 'react-icons/bs';
import { CgClose } from 'react-icons/cg';
import { VscInfo } from 'react-icons/vsc';
import { IoResizeOutline } from 'react-icons/io5';
import { SyntheticEvent, useCallback, useState } from 'react';
import { MdOutlineArrowBackIos } from 'react-icons/md';
import axios from 'axios';
import {
  refreshWallpapers,
  setCurrentWallpaper,
} from 'renderer/redux/wallpapersSlice';
import { IWallpaperData } from 'renderer/types';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { addNotification, getDatabaseUrl, SqlIntegerToTime } from '../utils';

const clickOutClassnames = ['wp-view', 'wp-view-container'];

export default function WallpaperViewModal({ data }: { data: IWallpaperData }) {
  const dispatch = useAppDispatch();

  const wallpapers = useAppSelector((s) => s.wallpapers.data);

  const userData = useAppSelector((s) => s.currentUser);

  const [currentIndex, setCurrentIndex] = useState<number>(
    wallpapers.findIndex((w) => w.id === data.id) || 0
  );

  const [isEditingTags, setEditingTags] = useState<boolean>(false);

  const currentWallpaper = wallpapers[currentIndex] || data;

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [isShowingInformation, setShouldShowInformation] =
    useState<boolean>(false);

  const bisOwnerOfWallpaper: boolean =
    userData.loginData?.account.id === currentWallpaper.uploader;

  function gotoNextWallpaper() {
    if (!wallpapers) return;

    if (currentIndex < wallpapers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function gotoPreviousWallpaper() {
    if (!wallpapers) return;

    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      gotoPreviousWallpaper();
    } else if (event.key === 'ArrowRight') {
      gotoNextWallpaper();
    }
  }

  function onAttemptClickOut(event: SyntheticEvent<HTMLElement, Event>) {
    const element = event.target as HTMLElement;
    if (clickOutClassnames.includes(element.className)) {
      document.removeEventListener('keypress', handleKeyPress);
      dispatch(setCurrentWallpaper(null));
    }
  }

  const deleteOrReportWallpaper = useCallback(async () => {
    if (bisOwnerOfWallpaper) {
      await axios
        .delete(
          `${await getDatabaseUrl()}/wallpapers?ids=${currentWallpaper.id}`,
          {
            headers: {
              Authorization: `Bearer ${await window.electron.ipcRenderer?.getToken()}`,
            },
          }
        )
        .catch((e) => addNotification(e.message));

      dispatch(setCurrentWallpaper(null));

      dispatch(refreshWallpapers({ bShouldReset: false }));
    } else {
      addNotification('This does not work yet, Tare is lazy');
    }
  }, [bisOwnerOfWallpaper, currentWallpaper.id, dispatch]);

  const toggleEditWallpaper = useCallback(async () => {
    if (isEditingTags) {
      setEditingTags(false);

      const element = document.getElementById('tags-edit');

      if (element) {
        const tagsEdit = element as HTMLTextAreaElement;
        const newTags = tagsEdit.value.toLowerCase();
        tagsEdit.value = newTags;
        axios
          .post(
            `${await getDatabaseUrl()}/wallpapers`,
            [{ ...currentWallpaper, tags: newTags.replaceAll(`'`, `''`) }],
            {
              headers: {
                Authorization: `Bearer ${await window.electron.ipcRenderer?.getToken()}`,
              },
            }
          )
          .catch((e) => addNotification(e.message));
      }
    } else {
      setEditingTags(true);
    }
  }, [currentWallpaper, isEditingTags]);

  const downloadWallpaper = useCallback(() => {
    if (wallpapers[currentIndex]) {
      const wallpaperToDownload = document.getElementById(
        'wp-in-view'
      ) as HTMLImageElement;

      const xhr = new XMLHttpRequest();
      xhr.open('get', wallpaperToDownload.src);

      xhr.responseType = 'blob';

      xhr.onload = async () => {
        await window.electron.ipcRenderer?.downloadImage({
          id: `${wallpapers[currentIndex].tags} ${wallpapers[currentIndex].id}`,
          data: await (xhr.response as Blob).arrayBuffer(),
          dir: userData.settings?.downloadPath || '',
        });

        addNotification('Wallpaper Downloaded!');
      };

      xhr.onerror = () => addNotification('Error downloading wallpaper');

      xhr.send();
    }
  }, [currentIndex, userData.settings?.downloadPath, wallpapers]);

  /* useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);* */

  return (
    <div role="none" className="wp-view" onClick={onAttemptClickOut}>
      <BsChevronCompactLeft
        data-interact="true"
        className={
          currentIndex !== undefined && currentIndex > 0
            ? 'next-item-left'
            : 'next-item-disabled'
        }
        onClick={gotoPreviousWallpaper}
      />
      <div className="wp-view-container">
        <div className="wp-view-panel-top">
          <VscInfo
            data-interact="true"
            onClick={() => {
              setShouldShowInformation(true);
            }}
          />
          <span>
            <h2>{`${currentWallpaper.width}x${currentWallpaper.height}`}</h2>
            <IoResizeOutline data-interact="false" />
          </span>
        </div>
        <img
          src={`https://wallpaperz.nyc3.cdn.digitaloceanspaces.com/wallpapers/${currentWallpaper.id}.png`}
          alt="wallpaper"
          id="wp-in-view"
          draggable="false"
        />
        <div className="wp-view-panel-bottom">
          <CgClose
            data-interact="true"
            onClick={() => {
              document.removeEventListener('keypress', handleKeyPress);
              dispatch(setCurrentWallpaper(null));
            }}
          />
          <BsDownload data-interact="true" onClick={downloadWallpaper} />
          <BsArrowsFullscreen
            data-interact="true"
            onClick={() => {
              setIsFullscreen(true);
              addNotification('Double Click To Exit');
            }}
          />
        </div>
      </div>

      <BsChevronCompactRight
        className={
          currentIndex !== undefined &&
          currentIndex < (wallpapers ? wallpapers.length - 1 : 0)
            ? 'next-item-right'
            : 'next-item-disabled'
        }
        onClick={gotoNextWallpaper}
      />
      {isFullscreen && (
        <div className="wp-view-fullscreen">
          <img
            src={`https://wallpaperz.nyc3.cdn.digitaloceanspaces.com/wallpapers/${currentWallpaper.id}.png`}
            alt="wallpaper"
            id="wp-in-view-fullscreen"
            draggable="false"
            onDoubleClick={() => {
              setIsFullscreen(false);
            }}
          />
        </div>
      )}
      {isShowingInformation && (
        <div
          className="wp-view-info"
          onClick={(event) => {
            if ((event.target as HTMLElement).className === 'wp-view-info') {
              setShouldShowInformation(false);
            }
          }}
          role="none"
        >
          <div className="wp-view-info-content">
            <MdOutlineArrowBackIos
              onClick={() => {
                setShouldShowInformation(false);
              }}
            />
            <span className="wp-view-info-content-data">
              <h2>Upload Date</h2>
              <h3>
                {SqlIntegerToTime(
                  currentWallpaper.uploaded_at
                ).toLocaleDateString()}
              </h3>
              <h2>Tags</h2>
              <textarea
                id="tags-edit"
                spellCheck={false}
                defaultValue={currentWallpaper.tags}
                readOnly={!isEditingTags}
              />
            </span>

            <span className="wp-view-info-content-btns">
              {userData.loginData && (
                <button onClick={deleteOrReportWallpaper} type="button">
                  {bisOwnerOfWallpaper ? 'Delete' : 'Report'}
                </button>
              )}
              {bisOwnerOfWallpaper && (
                <button onClick={toggleEditWallpaper} type="button">
                  {isEditingTags ? 'Save' : 'Edit'}
                </button>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
