export default function ButtonSetting({
  value,
  onClicked,
}: {
  value: string;
  onClicked: (currentValue: string) => void;
}) {
  return (
    <div className="button-setting">
      <button
        type="button"
        className="setting-button"
        onClick={() => {
          onClicked(value);
        }}
      >
        <h3>{value}</h3>
      </button>
    </div>
  );
}
