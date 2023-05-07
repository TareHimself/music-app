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
  EventParams,
  EventReturnType,
  IRendererToMainEvents,
  IMainToRendererEvents,
  IEventBase,
} from "@types";
// (...args: any) => any, (...args: any) => any

export type IpcCallbackItem = Map<(...args: any) => any, (...args: any) => any>;

export type EventsBase = {
  [key: string]: (...args: any[]) => Awaitable<any>;
};

export type EventReturnWithId<E extends IEventBase, T extends keyof E> = {
  data: EventReturnType<E, T>;
  id: string;
};

class IpcRendererWrapper<ToM extends IEventBase, FromM extends IEventBase> {
  _callbacks: Map<keyof ToM | keyof FromM, IpcCallbackItem> = new Map();

  exposeApi<T>(name: string, api: T) {
    console.log("Exposing Api", name);
    contextBridge.exposeInMainWorld(name, api);
  }

  on(
    event: keyof ToM | keyof FromM,
    callback: (...args: any[]) => Awaitable<any>
  ): this {
    if (!this._callbacks.get(event)) {
      this._callbacks.set(event, new Map());
    }

    const midWay = (_: IpcRendererEvent, ...args: any[]) => callback(...args);

    this._callbacks.get(event)?.set(callback, midWay);

    electronIpcRenderer.on(event as any, midWay);

    return this;
  }

  once(
    event: keyof ToM | keyof FromM,
    callback: (...args: any[]) => Awaitable<any>
  ): this {
    const midWay = (_: IpcRendererEvent, ...args: any[]) => callback(...args);

    electronIpcRenderer.once(event as any, midWay);

    return this;
  }

  off(
    event: keyof ToM | keyof FromM,
    callback: (...args: any[]) => Awaitable<any>
  ): this {
    if (!this._callbacks.get(event)) {
      return this;
    }

    const boundMidway = this._callbacks.get(event)?.get(callback);

    if (boundMidway) {
      electronIpcRenderer.off(event as any, boundMidway);
    }

    return this;
  }

  onToMain<T extends keyof ToM>(
    event: T,
    callback: (result: EventReturnWithId<ToM, T>) => Awaitable<any>
  ): this {
    this.on(event as any, callback);
    return this;
  }

  onceToMain<T extends keyof ToM>(
    event: T,
    callback: (result: EventReturnWithId<ToM, T>) => Awaitable<any>
  ): this {
    this.once(event, callback);

    return this;
  }

  offToMain<T extends keyof ToM>(
    event: T,
    callback: (result: EventReturnWithId<ToM, T>) => Awaitable<any>
  ): this {
    this.off(event, callback);

    return this;
  }

  onFromMain<T extends keyof FromM>(
    event: T,
    callback: (...args: EventParams<FromM, T>) => Awaitable<any>
  ): this {
    this.on(event, callback);
    return this;
  }

  onceFromMain<T extends keyof FromM>(
    event: T,
    callback: (...args: EventParams<FromM, T>) => Awaitable<any>
  ): this {
    this.once(event, callback);

    return this;
  }

  offFromMain<T extends keyof FromM>(
    event: T,
    callback: (...args: EventParams<FromM, T>) => Awaitable<any>
  ): this {
    this.off(event, callback);

    return this;
  }

  sendToMain<T extends keyof ToM>(
    event: T,
    messageId: string,
    ...args: EventParams<ToM, T>
  ): this {
    console.log("Sent event to channel", event);
    electronIpcRenderer.send(event as any, messageId, ...args);

    return this;
  }

  sendToMainSync<T extends keyof ToM>(
    event: T,
    ...args: EventParams<ToM, T>
  ): EventReturnType<ToM, T> {
    return electronIpcRenderer.sendSync(event as any, uuidv4(), ...args);
  }

  sendToMainAsync<T extends keyof ToM>(event: T, ...args: EventParams<ToM, T>) {
    const operationId = uuidv4();
    return new Promise<EventReturnType<ToM, T>>((resolve) => {
      const callback = ({ data, id }: EventReturnWithId<ToM, T>) => {
        if (id === operationId) {
          this.offToMain(event, callback);
          resolve(data);
        }
      };
      this.onToMain(event, callback);
      this.sendToMain(event, operationId, ...args);
    });
  }
}

export const ipcRenderer = new IpcRendererWrapper<
  IRendererToMainEvents,
  IMainToRendererEvents
>();

class IpcMainEventWrapper<FromR extends IEventBase, T extends keyof FromR> {
  channel: string;
  ref: IpcMainEvent;
  created: number = Date.now();
  id: string;
  constructor(channel: T, ref: IpcMainEvent, id: string) {
    this.id = id;
    this.channel = String(channel);
    this.ref = ref;
    startStopProfile(`${this.channel}-${this.ref.frameId}`, this.channel);
  }

  reply(data: EventReturnType<FromR, T>) {
    startStopProfile(`${this.channel}-${this.ref.frameId}`);
    this.ref.reply(this.channel, {
      data,
      id: this.id,
    });
  }

  replySync(data: EventReturnType<FromR, T>) {
    startStopProfile(`${this.channel}-${this.ref.frameId}`);
    this.ref.returnValue = data;
  }
}

class IpcMainWrapper<FromR extends IEventBase, ToR extends IEventBase> {
  _callbacks: Map<keyof FromR | keyof ToR, IpcCallbackItem> = new Map();

  onFromRenderer<T extends keyof FromR>(
    event: T,
    callback: (
      event: IpcMainEventWrapper<FromR, T>,
      ...args: EventParams<FromR, T>
    ) => Awaitable<any>
  ): this {
    if (!this._callbacks.get(event)) {
      this._callbacks.set(event, new Map());
    }

    const midWay = (
      e: IpcMainEvent,
      messageId: string,
      ...args: EventParams<FromR, T>
    ) =>
      callback(new IpcMainEventWrapper<FromR, T>(event, e, messageId), ...args);

    this._callbacks.get(event)?.set(callback, midWay);

    electronIpcMain.on(
      event as any,
      midWay as (event: Electron.IpcMainEvent, ...args: any[]) => void
    );

    return this;
  }

  onceFromRenderer<T extends keyof FromR>(
    event: T,
    callback: (
      event: IpcMainEventWrapper<FromR, T>,
      ...args: EventParams<FromR, T>
    ) => Awaitable<any>
  ): this {
    const midWay = (
      e: IpcMainEvent,
      messageId: string,
      ...args: EventParams<FromR, T>
    ) =>
      callback(new IpcMainEventWrapper<FromR, T>(event, e, messageId), ...args);

    electronIpcMain.once(
      event as any,
      midWay as (event: Electron.IpcMainEvent, ...args: any[]) => void
    );

    return this;
  }

  offFromRenderer<T extends keyof FromR>(
    event: T,
    callback: (
      event: IpcMainEventWrapper<FromR, T>,
      ...args: EventParams<FromR, T>
    ) => Awaitable<any>
  ): this {
    if (!this._callbacks.get(event)) {
      return this;
    }

    const boundMidway = this._callbacks.get(event)?.get(callback);

    if (boundMidway) {
      electronIpcMain.off(event as any, boundMidway);
    }

    return this;
  }

  sendToRenderer<T extends keyof ToR>(
    window: import("electron").BrowserWindow,
    event: T,
    ...args: EventParams<ToR, T>
  ): void {
    return window.webContents.send(event as any, ...args);
  }

  exposeApi<T>(name: string, api: T) {
    contextBridge.exposeInMainWorld(name, api);
  }
}

export const ipcMain = new IpcMainWrapper<
  IRendererToMainEvents,
  IMainToRendererEvents
>();
