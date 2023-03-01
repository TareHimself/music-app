import { useCallback, useEffect, useState } from "react";
import {
  IContextMenuOption,
  ICreateContextMenuEventData,
  Vector2,
} from "../../types";
import ContextMenuItem from "./ContextMenuItem";

export interface IActiveContextMenu {
  position: Vector2;
  options: IContextMenuOption[];
  callback: ICreateContextMenuEventData["callback"];
}

export default function ContextMenus() {
  const [contextMenu, setContextMenu] = useState<IActiveContextMenu | null>(
    null
  );

  const onItemSelected = useCallback(
    (selection: string) => {
      if (contextMenu) {
        contextMenu.callback(selection);
        setContextMenu(null);
      }
    },
    [contextMenu]
  );

  const onCreateNewContextMenu = useCallback(async (e: Event) => {
    const eventData = (e as CustomEvent<ICreateContextMenuEventData>).detail;
    const newMenu: IActiveContextMenu = {
      position: { x: eventData.event.clientX, y: eventData.event.clientY },
      options: eventData.options,
      callback: eventData.callback,
    };
    setContextMenu(newMenu);
  }, []);

  const onDocumentClicked = useCallback(
    (e: MouseEvent) => {
      if (contextMenu && e.target instanceof Element) {
        if (!document.querySelector(".context-menu").contains(e.target)) {
          console.log("Close the menu cus we clicked outside it");
        }
      }
    },
    [contextMenu]
  );

  useEffect(() => {
    document.addEventListener("make-context-menu", onCreateNewContextMenu);
    document.addEventListener("click", onDocumentClicked);

    return () => {
      document.removeEventListener("make-context-menu", onCreateNewContextMenu);
      document.removeEventListener("click", onDocumentClicked);
    };
  }, [onCreateNewContextMenu, onDocumentClicked]);

  if (!contextMenu) {
    return <div id="context-menus"></div>;
  }

  return (
    <div id="context-menus">
      <div
        className="context-menu"
        style={{ top: contextMenu.position.y, left: contextMenu.position.x }}
      >
        {contextMenu.options.map((a) => (
          <ContextMenuItem
            key={a.id}
            id={a.id}
            name={a.name}
            onSelected={onItemSelected}
          />
        ))}
      </div>
    </div>
  );
}
