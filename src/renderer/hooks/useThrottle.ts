import { useCallback, useRef } from 'react';

export default function useThrottle<T>(
  delay: number,
  onCommited: (value: T) => void,
  initial: T
) {
  const timeoutLength = useRef(delay).current;
  const timeoutHandle = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const latestValue = useRef<T>(initial);

  const commitValue = useCallback(() => {
    onCommited(latestValue.current);
  }, [latestValue, onCommited]);

  const setValue = useCallback(
    (newValue: T) => {
      latestValue.current = newValue;

      if (timeoutHandle.current) {
        clearTimeout(timeoutHandle.current);
      }

      timeoutHandle.current = setTimeout(commitValue, timeoutLength);
    },
    [commitValue, timeoutLength]
  );

  return setValue;
}
