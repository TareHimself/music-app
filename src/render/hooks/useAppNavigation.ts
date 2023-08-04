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
      if(path === location){
        return false
      }

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

      return true
    },
    [backwardHistory, dispatch, forwardHistory, location, navigateToHistory]
  );

  const navigateBackward = useCallback((delta = 1) => {
    if (backwardHistory.length >= delta) {
      const thisHistory: INavigationHistory = { path: location, data: getPathData() }
      const newBackward = [...backwardHistory]
      const newForward = [thisHistory,...forwardHistory]
      const itemsRemoved = newBackward.splice(newBackward.length - delta,delta)
      
      const to = itemsRemoved.shift();
      dispatch(setForwardHistory([...itemsRemoved,...newForward]))
      dispatch(setBackwardHistory(newBackward));

      if (to) navigateToHistory(to);
    }
  }, [backwardHistory, dispatch, forwardHistory, location, navigateToHistory]);

  const navigateForward = useCallback((delta = 1) => {
    if (forwardHistory.length >= delta) {
      const thisHistory: INavigationHistory = { path: location, data: getPathData() }
      const newBackward = [...backwardHistory,thisHistory]
      const newForward = [...forwardHistory]

      const itemsRemoved = newForward.splice(0,delta)

      const to = itemsRemoved.pop();
      
      dispatch(
        setBackwardHistory([...newBackward,...itemsRemoved])
      );

      dispatch(setForwardHistory([...newForward]))

      if (to) navigateToHistory(to);
    }
  }, [backwardHistory, dispatch, forwardHistory, location, navigateToHistory]);
  console.log(backwardHistory,forwardHistory)
  return {
    navigate,
    navigateBackward,
    navigateForward,
    backwardHistory,
    forwardHistory,
    setPathData
  };
}
