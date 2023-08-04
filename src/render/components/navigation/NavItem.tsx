import { useCallback, useEffect, useId, useRef } from "react";

const NO_ICON_ELEMENT = <div className="no-icon" />;

function GetNavIcon({
  isActive,
  ActiveElement,
  InactiveElement,
}: {
  isActive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ActiveElement: ((...args: any) => JSX.Element) | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  InactiveElement: ((...args: any) => JSX.Element) | undefined;
}) {
  if (!ActiveElement || !InactiveElement) {
    const ElementGiven = ActiveElement || InactiveElement;

    if (ElementGiven) {
      return <ElementGiven />;
    }

    return NO_ICON_ELEMENT;
  }

  return isActive ? <ActiveElement /> : <InactiveElement />;
}

export type NavItemProps = React.PropsWithoutRef<{
  navId: string;
  display: string;
  activeId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ActiveElement?: (...args: any) => JSX.Element;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  InactiveElement?: (...args: any) => JSX.Element;
  onSelected: (id: string) => void;
  onContextMenu?: React.MouseEventHandler<HTMLSpanElement>;
}>;
export default function NavItem({
  navId,
  display,
  activeId: activeItem,
  ActiveElement,
  InactiveElement,
  onSelected,
  onContextMenu,
}: NavItemProps) {
  const containerId = useId();
  const textId = useId();
  const isPanningText = useRef(false);
  const activeTimer = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );

  const stopPanningText = useCallback(() => {
    if (!isPanningText.current) {
      return;
    }
    isPanningText.current = false;
    if (activeTimer.current) {
      clearInterval(activeTimer.current);
      activeTimer.current = undefined;
    }

    const textElement = document.getElementById(textId);
    if (textElement) {
      textElement.style.marginLeft = "0px";
    }
  }, [textId]);

  const startPanningText = useCallback(() => {
    const containerElement = document.getElementById(containerId);
    const textElement = document.getElementById(textId);

    if (!containerElement || !textElement) {
      return;
    }

    const containerRect = containerElement.getBoundingClientRect();
    const textRect = textElement.getBoundingClientRect();
    if (textRect.width < containerRect.width) {
      return;
    }
    isPanningText.current = true;
    const marginToAnimate = textRect.width - containerRect.width;

    const step = 1;
    let currentOffset = 0;
    activeTimer.current = setInterval(() => {
      textElement.style.marginLeft = `-${currentOffset}px`;
      currentOffset = Math.min(currentOffset + step, marginToAnimate);
      if (currentOffset === marginToAnimate) {
        clearTimeout(activeTimer.current);
        setTimeout(() => {
          if (isPanningText.current) {
            textElement.style.marginLeft = "0px";
            setTimeout(() => {
              if (isPanningText.current) {
                startPanningText();
              }
            }, 1000);
          }
        }, 2000);
      }
    }, 10);
  }, [containerId, textId]);

  useEffect(() => {
    return stopPanningText;
  }, [startPanningText, stopPanningText]);

  return (
    <span
      onContextMenu={onContextMenu}
      role="button"
      className="nav-item"
      data-active={`${navId === activeItem}`}
      onClick={() => onSelected(navId)}
      onKeyDown={() => false}
      tabIndex={0}
      data-target={navId}
    >
      <GetNavIcon
        isActive={navId === activeItem}
        ActiveElement={ActiveElement || undefined}
        InactiveElement={InactiveElement || undefined}
      />
      <div
        onMouseEnter={() => startPanningText()}
        onMouseLeave={() => stopPanningText()}
        className="nav-item-text"
        id={containerId}
      >
        <h3 id={textId}>{display}</h3>
      </div>
    </span>
  );
}
