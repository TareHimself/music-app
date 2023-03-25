import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { KeyValuePair } from "../../types";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  setBackwardHistory,
  setForwardHistory,
} from "../redux/slices/navigation";

let STORED_SCROLL: KeyValuePair<string, number> = {};

export default function useAppNavigation() {
  const location = useLocation().pathname;
  const naviagteOrginal = useNavigate();

  const [forwardHistory, backwardHistory] = useAppSelector((s) => [
    s.navigation.data.forwardHistory,
    s.navigation.data.backwardHistory,
  ]);

  const dispatch = useAppDispatch();

  const navigate = useCallback(
    (path: string) => {
      if (forwardHistory) {
        dispatch(setForwardHistory([]));
      }

      if (STORED_SCROLL[path]) {
        delete STORED_SCROLL[path];
      }

      dispatch(setBackwardHistory([...backwardHistory, location]));
      naviagteOrginal(path);
    },
    [backwardHistory, dispatch, forwardHistory, location, naviagteOrginal]
  );

  const navigateBackward = useCallback(() => {
    if (backwardHistory.length) {
      dispatch(setForwardHistory([location, ...forwardHistory]));
      const newBackward = [...backwardHistory];
      naviagteOrginal(newBackward.pop() || "");
      dispatch(setBackwardHistory(newBackward));
    }
  }, [backwardHistory, dispatch, forwardHistory, location, naviagteOrginal]);

  const navigateForward = useCallback(() => {
    if (forwardHistory.length) {
      dispatch(setBackwardHistory([...backwardHistory, location]));
      const newForward = [...forwardHistory];
      naviagteOrginal(newForward.shift() || "");
      dispatch(setForwardHistory(newForward));
    }
  }, [backwardHistory, dispatch, forwardHistory, location, naviagteOrginal]);

  const onWindowResize = useCallback(() => {
    STORED_SCROLL = {};
  }, []);

  useEffect(() => {
    window.addEventListener("resize", onWindowResize);
    return () => window.removeEventListener("resize", onWindowResize);
  }, [onWindowResize]);

  return {
    navigate,
    navigateBackward,
    navigateForward,
    backwardHistory,
    forwardHistory,
    updateScroll: (update: number) => (STORED_SCROLL[location] = update),
    getScroll: () => STORED_SCROLL[location] || 0,
  };
}
