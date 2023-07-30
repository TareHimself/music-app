export type DropdownItemType<T = unknown> = {
  label: string | ((v: T) => string);
  value: T;
  key: React.Key;
};

export type DropdownItemProps<T = unknown> = {
  data: DropdownItemType<T>;
  selected: boolean;
  onSelected: (v: DropdownItemType<T>) => void;
  onDeselected: (v: DropdownItemType<T>) => void;
};

export default function DropdownItem<T = unknown>(props: DropdownItemProps<T>) {
  const { data, onSelected, onDeselected, selected } = props;

  return (
    <div
      onClick={() => {
        if (selected) {
          onDeselected(data);
        } else {
          onSelected(data);
        }
      }}
      className="dropdown-item"
    >
      {typeof data.label === "string" ? data.label : data.label(data.value)}
    </div>
  );
}
