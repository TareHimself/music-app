import { useCallback } from 'react';

export default function BooleanSetting({
  value,
  onValueUpdated,
}: {
  value: boolean;
  onValueUpdated: (newValue: boolean) => void;
}) {
  const onSetEnabled = useCallback(() => {
    if (!value) {
      onValueUpdated(!value);
    }
  }, [onValueUpdated, value]);

  const onSetDisabled = useCallback(() => {
    if (value) {
      onValueUpdated(!value);
    }
  }, [onValueUpdated, value]);

  return (
    <div className="boolean-setting">
      <button
        type="button"
        onClick={onSetEnabled}
        className={`boolean-setting-${value}`}
      >
        <h3>Enabled</h3>
      </button>
      <button
        type="button"
        onClick={onSetDisabled}
        className={`boolean-setting-${!value}`}
      >
        <h3>Disabled</h3>
      </button>
    </div>
  );
}
