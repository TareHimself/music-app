import { IContextMenuOption, ICreateContextMenuEventData } from "@types";
export type IContextMenuItemProps = IContextMenuOption & {
  onSelected: ICreateContextMenuEventData["callback"];
};
export default function ContextMenuItem({
  id,
  name,
  onSelected,
}: IContextMenuItemProps) {
  return (
    <div className="context-menu-item" onClick={() => onSelected(id)}>
      <h2>{name}</h2>
    </div>
  );
}
