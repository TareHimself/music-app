import React from 'react';

const NO_ICON_ELEMENT = <div className="no-icon" />;

function GetNavIcon({
  isActive,
  ActiveElement,
  InactiveElement,
}: {
  isActive: boolean;
  ActiveElement?: (...args: any) => JSX.Element;
  InactiveElement?: (...args: any) => JSX.Element;
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
export default function NavItem({
  navId,
  display,
  activeId: activeItem,
  ActiveElement,
  InactiveElement,
  onSelected,
}: {
  navId: string;
  display: string;
  activeId: string;
  ActiveElement?: (...args: any) => JSX.Element;
  InactiveElement?: (...args: any) => JSX.Element;
  onSelected: (id: string) => void;
}) {
  return (
    <span
      role="button"
      className="nav-item"
      data-active={`${navId === activeItem}`}
      onClick={() => onSelected(navId)}
      onKeyDown={() => false}
      tabIndex={0}
    >
      <GetNavIcon
        isActive={navId === activeItem}
        ActiveElement={ActiveElement}
        InactiveElement={InactiveElement}
      />
      <h3>{display}</h3>
    </span>
  );
}
