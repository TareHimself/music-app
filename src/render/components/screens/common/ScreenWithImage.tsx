import React, { PropsWithChildren, useCallback, useEffect, useId } from "react";
import { imageColor } from "@render/utils";
import usePathValue from "@hooks/usePathValue";

export type ScreenWithImageProps = PropsWithChildren<{
  cover: string;
  header?: React.ReactNode;
}>;
export default function ScreenWithImage(props: ScreenWithImageProps) {
  const { getValue: getScroll, updateValue: updateScroll } = usePathValue(
    "scroll",
    0
  );

  const scrollId = useId();

  useEffect(() => {
    document.getElementById(scrollId)?.scroll({
      top: getScroll(),
    });
  }, [getScroll, scrollId]);

  const onImageLoaded = useCallback(
    (ev: React.SyntheticEvent<HTMLImageElement>) => {
      /* for brightest in pallet, not sure about using this though
            imageColor.getPalette(ev.currentTarget)?.sort((a, b) => {
              return (((b[0] + b[1] + b[2]) / 3) - ((a[0] + a[1] + a[2]) / 3))
            })[1] || 
            */
      const color = imageColor.getColor(ev.currentTarget);
      const container = document.querySelector<HTMLDivElement>(".screen");
      if (container) {
        container.style.setProperty(
          "--prominent-color",
          `rgb(${color[0]},${color[1]},${color[2]})`
        );
      }
    },
    []
  );
  return (
    <div className="screen">
      <div className="screen-bg">
        <div className="screen-bg-start" />
        <div className="screen-bg-end" />
      </div>
      <div className="screen-fg">
        <div className="screen-top">
          <img src={props.cover} onLoad={onImageLoaded} />
          <span>{props.header}</span>
        </div>

        <div
          id={scrollId}
          onScroll={(e) => {
            updateScroll(e.currentTarget.scrollTop);
          }}
          className="screen-content"
        >
          {props.children}
        </div>
      </div>
    </div>
  );
}
