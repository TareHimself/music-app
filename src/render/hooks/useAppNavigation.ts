import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { INavigationHistory } from "@types";
import {
  setBackwardHistory,
  setForwardHistory,
  useAppDispatch,
  useAppSelector,
  setPathData as reduxSetPathData,
  getPathData,
} from "@redux/exports";

export default function useAppNavigation() {
  const location = useLocation().pathname;
  const naviagteOriginal = useNavigate();
  const [forwardHistory, backwardHistory] = useAppSelector((s) => [
    s.navigation.data.forwardHistory,
    s.navigation.data.backwardHistory,
  ]);

  const dispatch = useAppDispatch();

  const setPathData = useCallback(
    (data: INavigationHistory["data"]) => {
      reduxSetPathData(data);
    },
    []
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
          { path: location, data: getPathData() },
        ])
      );

      navigateToHistory({
        path: path,
        data: {},
      });
    },
    [backwardHistory, dispatch, forwardHistory, location, navigateToHistory]
  );

  const navigateBackward = useCallback(() => {
    if (backwardHistory.length) {
      dispatch(
        setForwardHistory([
          { path: location, data: getPathData() },
          ...forwardHistory,
        ])
      );
      const newBackward = [...backwardHistory];
      const to = newBackward.pop();
      if (to) navigateToHistory(to);

      dispatch(setBackwardHistory(newBackward));
    }
  }, [backwardHistory, dispatch, forwardHistory, location, navigateToHistory]);

  const navigateForward = useCallback(() => {
    if (forwardHistory.length) {
      dispatch(
        setBackwardHistory([
          ...backwardHistory,
          { path: location, data: getPathData() },
        ])
      );
      const newForward = [...forwardHistory];
      const to = newForward.shift();
      if (to) navigateToHistory(to);
      dispatch(setForwardHistory(newForward));
    }
  }, [backwardHistory, dispatch, forwardHistory, location, navigateToHistory]);
  return {
    navigate,
    navigateBackward,
    navigateForward,
    backwardHistory,
    forwardHistory,
    setPathData
  };
}
