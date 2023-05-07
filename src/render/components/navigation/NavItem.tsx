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
  return (
    <span
      onContextMenu={onContextMenu}
      role="button"
      className="nav-item"
      data-active={`${navId === activeItem}`}
      onClick={() => onSelected(navId)}
      onKeyDown={() => false}
      tabIndex={0}
    >
      <GetNavIcon
        isActive={navId === activeItem}
        ActiveElement={ActiveElement || undefined}
        InactiveElement={InactiveElement || undefined}
      />
      <h3>{display}</h3>
    </span>
  );
}
