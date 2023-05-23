import { ITrackResource, TrackStreamInfo } from "@types";
import MusiczMediaSource from "./source";
import path from "path";
import express from "express";
import { BrowserWindow } from "electron";

// async function getAudioDuration(audioFile: string): Promise<number> {
//   const window = new BrowserWindow({
//     show: false,
//     width: 400,
//     height: 400,

//   });

//   window.webContents.executeJavaScript(`

//   `);
// }
export default class LocalSource extends MusiczMediaSource {
  localFiles: Record<string, string> = {};
  override get bSupportsStreaming() {
    return true;
  }

  get id(): string {
    return "local";
  }

  public override canFetchStream(resource: ITrackResource): boolean {
    return this.localFiles[resource.id] !== undefined;
  }

  public override async fetchStream(
    resource: ITrackResource
  ): Promise<TrackStreamInfo | null> {
    const filePath = this.localFiles[resource.id];
    if (!filePath) return null;

    return {
      uri: path.join("file:///", filePath),
      duration: 0, //await getAudioDurationInSeconds(filePath),
      from: "",
    };
  }

  public async downloadTrack(trackId: string, streamInfo: TrackStreamInfo) {
    return false;
  }
}
