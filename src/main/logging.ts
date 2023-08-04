/* eslint-disable @typescript-eslint/no-non-null-assertion */
import log from "electron-log";
import path from "path";
import { getLogDir } from "./utils";
log.transports.file.resolvePath = () => path.join(getLogDir(),'main.log')
console.log = (...args) => {
  log.log(...args);
};

console.info = (...args) => {
  log.info(...args);
};

console.warn = (...args) => {
  log.warn(...args);
};

console.error = (...args) => {
  log.error(...args);
};
