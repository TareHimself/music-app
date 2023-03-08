/**
 * This file exists because I can no longer handle the lack of generic typing in electrons ipcMain and ipcRenderer and as such have made wrappers to type them for me
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  contextBridge,
  ipcMain as electronIpcMain,
  IpcMainEvent,
  ipcRenderer as electronIpcRenderer,
  IpcRendererEvent,
} from "electron";
import {
  Awaitable,
  BridgeEventParams,
  BridgeEventReturn,
  IBridgeEvents,
} from "./types";
// (...args: any) => any, (...args: any) => any

export type IpcCallbackItem = Map<(...args: any) => any, (...args: any) => any>;

class IpcRendererWrapper {
  _callbacks: Map<string, IpcCallbackItem> = new Map();

  on<T extends keyof IBridgeEvents>(
    event: T,
    callback: (result: BridgeEventReturn<T>) => Awaitable<any>
  ): this {
    if (!this._callbacks.get(event)) {
      this._callbacks.set(event, new Map());
    }

    const midWay = (_: IpcRendererEvent, data: BridgeEventReturn<T>) =>
      callback(data);

    this._callbacks.get(event)?.set(callback, midWay);

    electronIpcRenderer.on(event, midWay);

    return this;
  }

  once<T extends keyof IBridgeEvents>(
    event: T,
    callback: (result: BridgeEventReturn<T>) => Awaitable<any>
  ): this {
    const midWay = (_: IpcRendererEvent, data: BridgeEventReturn<T>) =>
      callback(data);

    electronIpcRenderer.once(event, midWay);

    return this;
  }

  off<T extends keyof IBridgeEvents>(
    event: T,
    callback: (result: BridgeEventReturn<T>) => Awaitable<any>
  ): this {
    if (!this._callbacks.get(event)) {
      return this;
    }

    const boundMidway = this._callbacks.get(event)?.get(callback);

    if (boundMidway) {
      electronIpcRenderer.off(event, boundMidway);
    }

    return this;
  }

  send<T extends keyof IBridgeEvents>(
    event: T,
    ...args: BridgeEventParams<T>
  ): this {
    console.log("Sent event to channel", event);
    electronIpcRenderer.send(event, ...args);

    return this;
  }

  sendSync<T extends keyof IBridgeEvents>(
    event: T,
    ...args: BridgeEventParams<T>
  ): BridgeEventReturn<T> {
    return electronIpcRenderer.sendSync(event, ...args);
  }

  exposeApi<T>(name: string, api: T) {
    console.log("Exposing Api", name);
    contextBridge.exposeInMainWorld(name, api);
  }

  asyncEventCall<T extends keyof IBridgeEvents>(
    event: T,
    ...args: BridgeEventParams<T>
  ) {
    return new Promise<BridgeEventReturn<T>>((resolve) => {
      this.once(event, (d) => {
        resolve(d);
      });
      this.send(event, ...args);
    });
  }
}

export const ipcRenderer = new IpcRendererWrapper();

class IpcMainEventWrapper<T extends keyof IBridgeEvents> {
  channel: T;
  ref: IpcMainEvent;
  created: number = Date.now();
  constructor(channel: T, ref: IpcMainEvent) {
    this.channel = channel;
    this.ref = ref;
  }

  reply(data: BridgeEventReturn<T>) {
    console.log(
      `Sending reply on channel [${this.channel}] Took ${
        (Date.now() - this.created) / 1000
      } seconds`
    );
    this.ref.reply(this.channel, data);
  }

  replySync(data: BridgeEventReturn<T>) {
    console.log(
      `Sending reply on channel [${this.channel}] Took ${
        (Date.now() - this.created) / 1000
      } seconds`
    );
    this.ref.returnValue = data;
  }
}

class IpcMainWrapper {
  _callbacks: Map<string, IpcCallbackItem> = new Map();

  on<T extends keyof IBridgeEvents>(
    event: T,
    callback: (
      event: IpcMainEventWrapper<T>,
      ...args: BridgeEventParams<T>
    ) => Awaitable<any>
  ): this {
    if (!this._callbacks.get(event)) {
      this._callbacks.set(event, new Map());
    }

    const midWay = (e: IpcMainEvent, ...args: BridgeEventParams<T>) =>
      callback(new IpcMainEventWrapper<T>(event, e), ...args);

    this._callbacks.get(event)?.set(callback, midWay);

    electronIpcMain.on(
      event,
      midWay as (event: Electron.IpcMainEvent, ...args: any[]) => void
    );

    return this;
  }

  once<T extends keyof IBridgeEvents>(
    event: T,
    callback: (
      event: IpcMainEventWrapper<T>,
      ...args: BridgeEventParams<T>
    ) => Awaitable<any>
  ): this {
    const midWay = (e: IpcMainEvent, ...args: BridgeEventParams<T>) =>
      callback(new IpcMainEventWrapper<T>(event, e), ...args);

    electronIpcMain.once(
      event,
      midWay as (event: Electron.IpcMainEvent, ...args: any[]) => void
    );

    return this;
  }

  off<T extends keyof IBridgeEvents>(
    event: T,
    callback: (
      event: IpcMainEventWrapper<T>,
      ...args: BridgeEventParams<T>
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

  sendSync<T extends keyof IBridgeEvents>(
    event: T,
    ...args: BridgeEventParams<T>
  ): BridgeEventReturn<T> {
    return electronIpcRenderer.sendSync(event, ...args);
  }

  exposeApi<T>(name: string, api: T) {
    contextBridge.exposeInMainWorld(name, api);
  }
}

export const ipcMain = new IpcMainWrapper();
