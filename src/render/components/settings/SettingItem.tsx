import { PropsWithChildren } from "react";

export type SettingItemProps = PropsWithChildren<{
  title: string;
}>;

export default function SettingItem(props: SettingItemProps) {
  return (
    <div className="row-input">
      <h3 className="row-input-title">{props.title}</h3>{" "}
      <span style={{ display: "flex", flexDirection: "row" }}>
        {props.children}
      </span>
    </div>
  );
}
