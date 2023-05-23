import { useEffect, useId, useState } from "react";
import { importIntoLibrary, useAppDispatch } from "@redux/exports";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";
import SettingItem from "./SettingItem";

export interface ISelectableAudioDevice {
  label: string;
  value: string;
}

export default function SettingsScreen() {
  const dispatch = useAppDispatch();

  const [audioDeviceInfo, setAudioDeviceInfo] = useState<{
    selected: string;
    devices: ISelectableAudioDevice[];
  }>({
    selected: "",
    devices: [],
  });

  useEffect(() => {
    let isMounted = true;
    window.navigator.mediaDevices.getUserMedia();
    window.navigator.mediaDevices.enumerateDevices().then((d) => {
      if (isMounted) {
        setAudioDeviceInfo((a) => {
          return {
            ...a,
            selected: streamManager.deviceId,
            devices: d
              .filter((a) => a.kind === "audiooutput")
              .map((a) => ({
                label: a.label,
                value: a.deviceId,
              })),
          };
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);
  //const [gDriveApiKey] = useAppSelector((s) => [s.app.data.googleDriveApiKey]);

  const importUrisTextInputId = useId();
  return (
    <div className="screen">
      <div className="screen-fg">
        <SettingItem title={"Import Uri's"}>
          <input id={importUrisTextInputId} type={"text"}></input>
          <button
            className="row-input-confirm"
            onClick={() => {
              dispatch(
                importIntoLibrary({
                  items: (
                    document.getElementById(
                      importUrisTextInputId
                    ) as HTMLInputElement
                  ).value.split(","),
                })
              );
            }}
          ></button>
        </SettingItem>
        <SettingItem title={"Output Device"}>
          <Dropdown
            options={audioDeviceInfo.devices}
            value={audioDeviceInfo.selected}
          />
        </SettingItem>
      </div>
    </div>
  );
}
