import { useCallback } from 'react';
import { BiLeftArrowAlt, BiRightArrowAlt } from 'react-icons/bi';

export default function BooleanSetting({
  value,
  onValueUpdated,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
  onValueUpdated: (newValue: number) => void;
}) {
  const Increment = useCallback(() => {
    onValueUpdated(Math.min(max, value + 1));
  }, [max, onValueUpdated, value]);

  const Decrement = useCallback(() => {
    onValueUpdated(Math.max(min, value - 1));
  }, [min, onValueUpdated, value]);

  return (
    <div className="range-setting">
      <button
        type="button"
        onClick={Decrement}
        className="range-setting-button"
      >
        <BiLeftArrowAlt />
      </button>
      <h3>{value}</h3>
      <button
        type="button"
        onClick={Increment}
        className="range-setting-button"
      >
        <BiRightArrowAlt />
      </button>
    </div>
  );
}
