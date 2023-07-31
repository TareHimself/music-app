import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const ICON_DIR = "./assets/icon";
const config: ForgeConfig = {
  packagerConfig: {
    icon: ICON_DIR,
    name: "musicz",
    asar: true,
    protocols: [
      {
        name: "Musicz",
        schemes: ["musicz"],
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: "musicz",
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({
      options: {
        icon: ICON_DIR,
        name: "musicz",
      },
    }),
    new MakerDeb({
      options: {
        icon: ICON_DIR,
        mimeType: ["x-scheme-handler/musicz"],
        name: "musicz",
      },
    }),
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/render/index.html",
            js: "./src/render/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/main/preload.ts",
            },
          },
        ],
      },
      devContentSecurityPolicy: `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: * blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: *; media-src 'self' 'unsafe-inline' 'unsafe-eval' data: *;`,
    }),
  ],
};

export default config;
