import { useCallback } from "react";
import DropdownItem, { DropdownItemType } from "./DropdownItem";

export type DropdownProps<T = unknown> = {
  selected: DropdownItemType<T>["value"][];
  options: DropdownItemType<T>[];
  onSelectedItemsUpdated: (data: DropdownItemType<T>["value"][]) => void;
};

export default function Dropdown<T = unknown>(props: DropdownProps<T>) {
  const { selected, options, onSelectedItemsUpdated } = props;

  const onItemSelected = useCallback(
    (item: DropdownItemType<T>) => {
      onSelectedItemsUpdated([...selected, item.value]);
    },
    [onSelectedItemsUpdated, selected]
  );

  const onItemDeselected = useCallback(
    (item: DropdownItemType<T>) => {
      const data = [...selected];
      data.splice(data.indexOf(item.value, 1));
      onSelectedItemsUpdated(data);
    },
    [onSelectedItemsUpdated, selected]
  );

  return (
    <div className="dropdown-main">
      <div className="dropdown-main-selected">Selected Item</div>
      <div className="dropdown-main-list">
        {options.map((a) => (
          <DropdownItem
            key={a.key}
            data={a}
            onSelected={onItemSelected}
            onDeselected={onItemDeselected}
            selected={selected.includes(a.value)}
          />
        ))}
      </div>
    </div>
  );
}
