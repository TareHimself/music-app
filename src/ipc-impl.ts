import { IRendererToMainEvents, IMainToRendererEvents } from "@types";
import { IpcRendererTyped, IpcMainTyped } from "./ipc";

export const ipcRenderer = new IpcRendererTyped<
  IRendererToMainEvents,
  IMainToRendererEvents
>();

export const ipcMain = new IpcMainTyped<
  IRendererToMainEvents,
  IMainToRendererEvents
>();
