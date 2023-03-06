import { useId } from "react";
import { useAppDispatch } from "../../redux/hooks";
import { importIntoLibrary } from "../../redux/slices/app";

export default function SettingsScreen() {
  const dispatch = useAppDispatch();

  //const [gDriveApiKey] = useAppSelector((s) => [s.app.data.googleDriveApiKey]);

  const importUrisTextInputId = useId();
  return (
    <div className="screen">
      <div className="screen-fg">
        <div className="row-input">
          <h3 className="row-input-title">Import Uri's</h3>{" "}
          <span style={{ display: "flex", flexDirection: "row" }}>
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
          </span>
        </div>
        <div className="row-input">
          <h3 className="row-input-title">Google Account</h3>{" "}
          <span style={{ display: "flex", flexDirection: "row" }}>
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
          </span>
        </div>
      </div>
    </div>
  );
}
