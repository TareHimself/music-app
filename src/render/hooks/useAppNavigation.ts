import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { INavigationHistory, KeyValuePair } from "@types";
import {
  setBackwardHistory,
  setForwardHistory,
  useAppDispatch,
  useAppSelector,
  setPathData as reduxSetPathData,
} from "@redux/exports";

export default function useAppNavigation() {
  const location = useLocation().pathname;
  const naviagteOriginal = useNavigate();

  const [forwardHistory, backwardHistory, pathData] = useAppSelector((s) => [
    s.navigation.data.forwardHistory,
    s.navigation.data.backwardHistory,
    s.navigation.data.pathData,
  ]);

  const dispatch = useAppDispatch();

  const setPathData = useCallback(
    (data: INavigationHistory["data"]) => {
      dispatch(reduxSetPathData(data));
    },
    [reduxSetPathData]
  );
  const navigateToHistory = useCallback(
    (data: INavigationHistory) => {
      setPathData(data.data);
      naviagteOriginal(data.path);
    },
    [naviagteOriginal, setPathData]
  );

  const navigate = useCallback(
    (path: string) => {
      if (forwardHistory) {
        dispatch(setForwardHistory([]));
      }

      dispatch(
        setBackwardHistory([
          ...backwardHistory,
          { path: location, data: pathData },
        ])
      );

      navigateToHistory({
        path: path,
        data: {},
      });
    },
    [
      backwardHistory,
      dispatch,
      forwardHistory,
      location,
      naviagteOriginal,
      pathData,
    ]
  );

  const navigateBackward = useCallback(() => {
    if (backwardHistory.length) {
      dispatch(
        setForwardHistory([
          { path: location, data: pathData },
          ...forwardHistory,
        ])
      );
      const newBackward = [...backwardHistory];
      const to = newBackward.pop();
      if (to) navigateToHistory(to);

      dispatch(setBackwardHistory(newBackward));
    }
  }, [
    backwardHistory,
    dispatch,
    forwardHistory,
    location,
    naviagteOriginal,
    pathData,
  ]);

  const navigateForward = useCallback(() => {
    if (forwardHistory.length) {
      dispatch(
        setBackwardHistory([
          ...backwardHistory,
          { path: location, data: pathData },
        ])
      );
      const newForward = [...forwardHistory];
      const to = newForward.shift();
      if (to) navigateToHistory(to);
      dispatch(setForwardHistory(newForward));
    }
  }, [
    backwardHistory,
    dispatch,
    forwardHistory,
    location,
    naviagteOriginal,
    pathData,
  ]);
  return {
    navigate,
    navigateBackward,
    navigateForward,
    backwardHistory,
    forwardHistory,
    setPathData,
    pathData,
  };
}
