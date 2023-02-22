import { useCallback, useRef } from 'react';
import { AiOutlineCloudUpload, AiOutlineLoading } from 'react-icons/ai';
import { BiSearchAlt } from 'react-icons/bi';
import { FiSettings, FiFilter } from 'react-icons/fi';
import { IoMdRefresh } from 'react-icons/io';
import useThrottle from 'renderer/hooks/useThrottle';
import { setSettingsState } from 'renderer/redux/appStateSlice';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
  fetchWallpapers,
  refreshWallpapers,
  setWallpapersPendingUpload,
} from 'renderer/redux/wallpapersSlice';
import { IConvertedSystemFiles } from 'renderer/types';
import { addNotification } from '../utils';

const typingThrottle = 500;

export default function Dashboard() {
  const dispatch = useAppDispatch();

  const wallpaperData = useAppSelector((s) => s.wallpapers);

  const userData = useAppSelector((s) => s.currentUser);

  const updateSearchText = useThrottle<string>(
    typingThrottle,
    (value) => {
      dispatch(
        fetchWallpapers({
          page: 0,
          maxItems:
            userData.settings?.maxItemsPerPage || wallpaperData.maxItems,
          query: value,
        })
      );
    },
    ''
  );

  const isUploading = useRef(false);

  const uploadFiles = useCallback(async () => {
    if (!userData.loginData) {
      /* if (setSettingsState) {
        setSettingsState('open');
      } */
      addNotification('You Must Be Logged In To Upload');
      return;
    }
    if (isUploading.current) return;

    isUploading.current = true;
    const response = await window.electron.ipcRenderer?.uploadFiles('', []);

    const images: IConvertedSystemFiles[] = [];

    if (!response?.result) {
      isUploading.current = false;
      return;
    }

    if (response?.files.length) {
      response?.files.forEach(
        ([image, index, tags]: [string, number, string]) => {
          images.push({
            id: index,
            file: image,
            width: 0,
            height: 0,
            tags,
          });
        }
      );
    }

    isUploading.current = false;
    dispatch(setWallpapersPendingUpload(images));
  }, [dispatch, userData.loginData]);

  return (
    <div id="dashboard">
      <FiFilter
        className="dashboard-icon"
        onClick={() => {
          addNotification('Filters coming soon!');
        }}
      />
      <AiOutlineCloudUpload className="dashboard-icon" onClick={uploadFiles} />
      <div id="search">
        <BiSearchAlt />
        <input
          type="text"
          onChange={(e) => {
            updateSearchText(e.target.value);
          }}
          id="search-input"
          draggable="false"
        />
      </div>
      {userData.settings ? (
        <FiSettings
          className="dashboard-icon"
          onClick={() => {
            dispatch(setSettingsState('open'));
          }}
        />
      ) : (
        <AiOutlineLoading className="dashboard-icon rotate-svg" />
      )}
      <IoMdRefresh
        className="dashboard-icon"
        onClick={() => {
          dispatch(refreshWallpapers({ bShouldReset: false }));
          addNotification('Refreshing');
        }}
      />
    </div>
  );
}
