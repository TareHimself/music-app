/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  contextBridge,
  ipcRenderer as electronIpcRenderer,
  IpcRendererEvent,
} from "electron";
import {
  Awaitable,
  RendererToMainEventParams,
  RendererToMainEventReturn,
  IRendererToMainEvents,
  IMainToRendererEvents,
  MainToRendererEventParams,
} from "../types";
// (...args: any) => any, (...args: any) => any

export type IpcCallbackItem = Map<(...args: any) => any, (...args: any) => any>;

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
    callback: (result: RendererToMainEventReturn<T>) => Awaitable<any>
  ): this {
    this.on(event, callback);
    return this;
  }

  onceToMain<T extends keyof IRendererToMainEvents>(
    event: T,
    callback: (result: RendererToMainEventReturn<T>) => Awaitable<any>
  ): this {
    this.once(event, callback);

    return this;
  }

  offToMain<T extends keyof IRendererToMainEvents>(
    event: T,
    callback: (result: RendererToMainEventReturn<T>) => Awaitable<any>
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
    ...args: RendererToMainEventParams<T>
  ): this {
    console.log("Sent event to channel", event);
    electronIpcRenderer.send(event, ...args);

    return this;
  }

  sendToMainSync<T extends keyof IRendererToMainEvents>(
    event: T,
    ...args: RendererToMainEventParams<T>
  ): RendererToMainEventReturn<T> {
    return electronIpcRenderer.sendSync(event, ...args);
  }

  sendToMainAsync<T extends keyof IRendererToMainEvents>(
    event: T,
    ...args: RendererToMainEventParams<T>
  ) {
    return new Promise<RendererToMainEventReturn<T>>((resolve) => {
      this.onceToMain(event, (d) => {
        resolve(d);
      });
      this.sendToMain(event, ...args);
    });
  }
}

const ipcRenderer = new IpcRendererWrapper();

export default ipcRenderer;
