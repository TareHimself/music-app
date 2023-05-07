/**
 * This file exists because I can no longer handle the lack of generic typing in electrons ipcMain and ipcRenderer and as such have made wrappers to type them for me
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from "uuid";
import {
  contextBridge,
  ipcMain as electronIpcMain,
  IpcMainEvent,
  ipcRenderer as electronIpcRenderer,
  IpcRendererEvent,
} from "electron";
import { startStopProfile } from "@root/global-utils";
import {
  Awaitable,
  RendererToMainEventParams,
  RendererToMainEventReturn,
  IRendererToMainEvents,
  IMainToRendererEvents,
  MainToRendererEventParams,
} from "@types";
// (...args: any) => any, (...args: any) => any

export type IpcCallbackItem = Map<(...args: any) => any, (...args: any) => any>;
export type RendererToMainEventReturnWithId<
  T extends keyof IRendererToMainEvents
> = {
  data: RendererToMainEventReturn<T>;
  id: string;
};
class IpcRendererWrapper {
  _callbacks: Map<string, IpcCallbackItem> = new Map();

  exposeApi<T>(name: string, api: T) {
    console.log("Exposing Api", name);
    contextBridge.exposeInMainWorld(name, api);
  }

  on(event: string, callback: (...args: any[]) => Awaitable<any>): this {
    if (!this._callbacks.get(event)) {
      this._callbacks.set(event, new Map());
    }

    const midWay = (_: IpcRendererEvent, ...args: any[]) => callback(...args);

    this._callbacks.get(event)?.set(callback, midWay);

    electronIpcRenderer.on(event, midWay);

    return this;
  }

  once(event: string, callback: (...args: any[]) => Awaitable<any>): this {
    const midWay = (_: IpcRendererEvent, ...args: any[]) => callback(...args);

    electronIpcRenderer.once(event, midWay);

    return this;
  }

  off(event: string, callback: (...args: any[]) => Awaitable<any>): this {
    if (!this._callbacks.get(event)) {
      return this;
    }

    const boundMidway = this._callbacks.get(event)?.get(callback);

    if (boundMidway) {
      electronIpcRenderer.off(event, boundMidway);
    }

    return this;
  }

  onToMain<T extends keyof IRendererToMainEvents>(
    event: T,
    callback: (result: RendererToMainEventReturnWithId<T>) => Awaitable<any>
  ): this {
    this.on(event, callback);
    return this;
  }

  onceToMain<T extends keyof IRendererToMainEvents>(
    event: T,
    callback: (result: RendererToMainEventReturnWithId<T>) => Awaitable<any>
  ): this {
    this.once(event, callback);

    return this;
  }

  offToMain<T extends keyof IRendererToMainEvents>(
    event: T,
    callback: (result: RendererToMainEventReturnWithId<T>) => Awaitable<any>
  ): this {
    this.off(event, callback);

    return this;
  }

  onFromMain<T extends keyof IMainToRendererEvents>(
    event: T,
    callback: (...args: MainToRendererEventParams<T>) => Awaitable<any>
  ): this {
    this.on(event, callback);
    return this;
  }

  onceFromMain<T extends keyof IMainToRendererEvents>(
    event: T,
    callback: (...args: MainToRendererEventParams<T>) => Awaitable<any>
  ): this {
    this.once(event, callback);

    return this;
  }

  offFromMain<T extends keyof IMainToRendererEvents>(
    event: T,
    callback: (...args: MainToRendererEventParams<T>) => Awaitable<any>
  ): this {
    this.off(event, callback);

    return this;
  }

  sendToMain<T extends keyof IRendererToMainEvents>(
    event: T,
    messageId: string,
    ...args: RendererToMainEventParams<T>
  ): this {
    console.log("Sent event to channel", event);
    electronIpcRenderer.send(event, messageId, ...args);

    return this;
  }

  sendToMainSync<T extends keyof IRendererToMainEvents>(
    event: T,
    ...args: RendererToMainEventParams<T>
  ): RendererToMainEventReturn<T> {
    return electronIpcRenderer.sendSync(event, uuidv4(), ...args);
  }

  sendToMainAsync<T extends keyof IRendererToMainEvents>(
    event: T,
    ...args: RendererToMainEventParams<T>
  ) {
    const operationId = uuidv4();
    return new Promise<RendererToMainEventReturn<T>>((resolve) => {
      const callback = ({ data, id }: RendererToMainEventReturnWithId<T>) => {
        if (id === operationId) {
          this.offToMain(event, callback);
        }
        resolve(data);
      };
      this.onToMain(event, callback);
      this.sendToMain(event, operationId, ...args);
    });
  }
}

export const ipcRenderer = new IpcRendererWrapper();

class IpcMainEventWrapper<T extends keyof IRendererToMainEvents> {
  channel: T;
  ref: IpcMainEvent;
  created: number = Date.now();
  id: string;
  constructor(channel: T, ref: IpcMainEvent, id: string) {
    this.id = id;
    this.channel = channel;
    this.ref = ref;
    startStopProfile(`${this.channel}-${this.ref.frameId}`, this.channel);
  }

  reply(data: RendererToMainEventReturn<T>) {
    startStopProfile(`${this.channel}-${this.ref.frameId}`);
    this.ref.reply(this.channel, {
      data,
      id: this.id,
    });
  }

  replySync(data: RendererToMainEventReturn<T>) {
    startStopProfile(`${this.channel}-${this.ref.frameId}`);
    this.ref.returnValue = data;
  }
}

class IpcMainWrapper {
  _callbacks: Map<string, IpcCallbackItem> = new Map();

  onFromRenderer<T extends keyof IRendererToMainEvents>(
    event: T,
    callback: (
      event: IpcMainEventWrapper<T>,
      ...args: RendererToMainEventParams<T>
    ) => Awaitable<any>
  ): this {
    if (!this._callbacks.get(event)) {
      this._callbacks.set(event, new Map());
    }

    const midWay = (
      e: IpcMainEvent,
      messageId: string,
      ...args: RendererToMainEventParams<T>
    ) => callback(new IpcMainEventWrapper<T>(event, e, messageId), ...args);

    this._callbacks.get(event)?.set(callback, midWay);

    electronIpcMain.on(
      event,
      midWay as (event: Electron.IpcMainEvent, ...args: any[]) => void
    );

    return this;
  }

  onceFromRenderer<T extends keyof IRendererToMainEvents>(
    event: T,
    callback: (
      event: IpcMainEventWrapper<T>,
      ...args: RendererToMainEventParams<T>
    ) => Awaitable<any>
  ): this {
    const midWay = (
      e: IpcMainEvent,
      messageId: string,
      ...args: RendererToMainEventParams<T>
    ) => callback(new IpcMainEventWrapper<T>(event, e, messageId), ...args);

    electronIpcMain.once(
      event,
      midWay as (event: Electron.IpcMainEvent, ...args: any[]) => void
    );

    return this;
  }

  offFromRenderer<T extends keyof IRendererToMainEvents>(
    event: T,
    callback: (
      event: IpcMainEventWrapper<T>,
      ...args: RendererToMainEventParams<T>
    ) => Awaitable<any>
  ): this {
    if (!this._callbacks.get(event)) {
      return this;
    }

    const boundMidway = this._callbacks.get(event)?.get(callback);

    if (boundMidway) {
      electronIpcMain.off(event, boundMidway);
    }

    return this;
  }

  sendToRenderer<T extends keyof IMainToRendererEvents>(
    window: import("electron").BrowserWindow,
    event: T,
    ...args: MainToRendererEventParams<T>
  ): void {
    return window.webContents.send(event, ...args);
  }

  exposeApi<T>(name: string, api: T) {
    contextBridge.exposeInMainWorld(name, api);
  }
}

export const ipcMain = new IpcMainWrapper();
