import { useCallback, useEffect } from "react";
import { IActiveContextMenu, ICreateContextMenuEventData } from "@types";
import { useAppDispatch, useAppSelector, setContextMenu } from "@redux/exports";

import ContextMenuItem from "./ContextMenuItem";

const CONTEXT_MENU_WIDTH = 150;
const CONTEXT_MENU_SCREEN_PADDING = 50;

export default function ContextMenu() {
  const contextMenu = useAppSelector((s) => s.navigation.data.contextMenu);
  const dispatch = useAppDispatch();

  const onItemSelected = useCallback(
    (selection: string) => {
      if (contextMenu) {
        contextMenu.callback(selection);
        dispatch(setContextMenu(null));
      }
    },
    [contextMenu, dispatch]
  );

  const onCreateNewContextMenu = useCallback(
    async (e: Event) => {
      const eventData = (e as CustomEvent<ICreateContextMenuEventData>).detail;
      const predictedMenuHeight = eventData.options.length * 45;
      const offsetX =
        window.innerWidth - eventData.event.clientX <
        CONTEXT_MENU_WIDTH + CONTEXT_MENU_SCREEN_PADDING
          ? CONTEXT_MENU_WIDTH * -1
          : 0;
      const offsetY =
        window.innerHeight - eventData.event.clientY < predictedMenuHeight
          ? predictedMenuHeight * -1
          : 0;

      const newMenu: IActiveContextMenu = {
        position: {
          x: eventData.event.clientX + offsetX,
          y: eventData.event.clientY + offsetY,
        },
        options: eventData.options,
        callback: eventData.callback,
      };
      dispatch(setContextMenu(newMenu));
    },
    [dispatch]
  );

  useEffect(() => {
    document.addEventListener("make-context-menu", onCreateNewContextMenu);
    return () => {
      document.removeEventListener("make-context-menu", onCreateNewContextMenu);
    };
  }, [onCreateNewContextMenu]);

  if (!contextMenu) {
    return <div id="context-menus"></div>;
  }

  return (
    <div id="context-menus" style={{ zIndex: 50 }}>
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "transparent",
          pointerEvents: "all",
        }}
        onMouseDown={() => {
          dispatch(setContextMenu(null));
        }}
      />
      <div
        className="context-menu"
        style={{
          top: contextMenu.position.y,
          left: contextMenu.position.x,
          width: `${CONTEXT_MENU_WIDTH}px`,
        }}
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
