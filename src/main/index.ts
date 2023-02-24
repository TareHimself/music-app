
import { app } from 'electron';

const gotTheLock = app.requestSingleInstanceLock();

if (gotTheLock) {
  require('./app')
}
else {
  app.quit()
}