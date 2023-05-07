import { useId } from "react";
import { importIntoLibrary, useAppDispatch } from "@redux/exports";
import SettingItem from "./SettingItem";

export default function SettingsScreen() {
  const dispatch = useAppDispatch();

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
        <SettingItem title={"Google Account"}>
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
        <SettingItem title={"Download Track's In Background"}>
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
      </div>
    </div>
  );
}
