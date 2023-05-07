import useAppNavigation from "./useAppNavigation";

export default function usePathValue<T = any>(key: string, defaultValue: T) {
  const { pathData, setPathData } = useAppNavigation();

  //   const onWindowResize = useCallback(() => {
  //     STORED_SCROLL = {};
  //   }, []);

  //   useEffect(() => {
  //     window.addEventListener("resize", onWindowResize);
  //     return () => window.removeEventListener("resize", onWindowResize);
  //   }, [onWindowResize]);

  return {
    updateValue: (update: T) => setPathData({ ...pathData, [key]: update }),
    getValue: () => pathData[key] || defaultValue,
  };
}
