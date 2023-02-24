import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ControllableSliderProps } from 'types';

const DEFAULT_PROPS = {
  style: {},
  onUserUpdate: () => {},
  step: 1,
};
export default function ControllableSlider(props: ControllableSliderProps) {
  const {
    min,
    max,
    onUserUpdate,
    style,
    step,
    defaultValue,
    value,
  }: ControllableSliderProps = {
    ...DEFAULT_PROPS,
    ...props,
  };

  const [pendingUpdate, setPendingUpdate] = useState<undefined | number>(
    defaultValue
  );

  const isMouseDown = useRef(false);

  const elementRef = useRef<HTMLDivElement | null>(null);

  const onMouseMove = useCallback(
    (e: MouseEvent | React.MouseEvent<HTMLDivElement>) => {
      if (!isMouseDown.current || !elementRef.current) return;

      const distFromStartOfBar = Math.min(
        Math.max(e.pageX - elementRef.current.offsetLeft, 0),
        elementRef.current.offsetWidth
      );
      const percentX = distFromStartOfBar / elementRef.current.offsetWidth || 0;
      const newRangedValue =
        Math.round(((max - min) * percentX + min) / step) * step;

      if (pendingUpdate !== newRangedValue) {
        setPendingUpdate(newRangedValue);
        onUserUpdate(newRangedValue, false);
      }
    },
    [max, min, step, pendingUpdate, onUserUpdate]
  );

  useEffect(() => {
    const sendFinalUpdate = () => {
      if (!isMouseDown.current) return;

      if (pendingUpdate) {
        onUserUpdate(pendingUpdate, true);
        if (value !== undefined) {
          setPendingUpdate(undefined);
        }
      }
      isMouseDown.current = false;
    };

    document.addEventListener('mouseup', sendFinalUpdate);
    return () => {
      document.removeEventListener('mouseup', sendFinalUpdate);
    };
  }, [onMouseMove, onUserUpdate, pendingUpdate, value]);

  const actualCurrentValue =
    (pendingUpdate === undefined ? value : pendingUpdate) || 0;
  const percentProgress = `${((actualCurrentValue / max) * 100).toFixed(2)}%`;
  return (
    <div
      ref={(r) => {
        elementRef.current = r;
      }}
      role="slider"
      className="slider-bar"
      style={style}
      onMouseDown={(e) => {
        if (value) {
          setPendingUpdate(value);
        }
        isMouseDown.current = true;
        document.addEventListener('mousemove', onMouseMove, false);
        onMouseMove(e);
      }}
      tabIndex={0}
      aria-controls="volume"
      aria-valuenow={actualCurrentValue}
    >
      <div className="slider-knob" style={{ left: percentProgress }} />
      <div
        className="slider-progress"
        style={{
          width: percentProgress,
        }}
      />
    </div>
  );
}
