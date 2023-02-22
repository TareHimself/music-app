import { BsSquare } from 'react-icons/bs';
import { IoCloseOutline } from 'react-icons/io5';
import { AiOutlineMinus } from 'react-icons/ai';

export default function TopFrame() {
  return (
    <div id="top-frame">
      <span data-type="drag" />
      <span data-type="icons">
        <span>
          <AiOutlineMinus
            fontSize={20}
            onClick={() => {
              window.electron.ipcRenderer.windowMinimize();
            }}
          />
        </span>
        <span>
          <BsSquare
            fontSize={12}
            onClick={() => {
              window.electron.ipcRenderer.windowMaximize();
            }}
          />
        </span>
        <span>
          <IoCloseOutline
            fontSize={22}
            onClick={() => {
              window.electron.ipcRenderer.windowClose();
            }}
          />
        </span>
      </span>
    </div>
  );
}
