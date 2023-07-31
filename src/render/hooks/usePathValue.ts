import { useCallback } from "react";
import useAppNavigation from "./useAppNavigation";
import { getPathData } from "@redux/exports";

export default function usePathValue<T = unknown>(key: string, defaultValue: T) {
  const { setPathData } = useAppNavigation();

  //   const onWindowResize = useCallback(() => {
  //     STORED_SCROLL = {};
  //   }, []);

  //   useEffect(() => {
  //     window.addEventListener("resize", onWindowResize);
  //     return () => window.removeEventListener("resize", onWindowResize);
  //   }, [onWindowResize]);

  const updateValue = useCallback((update: T)=>{
    setPathData({ ...getPathData(), [key]: update })
  },[key, setPathData])

  const getValue = useCallback(()=>{
    return (getPathData()[key] as T) || defaultValue
  },[defaultValue, key])

  return {
    updateValue,
    getValue,
  };
}
