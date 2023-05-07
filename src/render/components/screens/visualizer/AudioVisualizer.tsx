import { useEffect, useId } from "react";
import { StreamManager } from "@render/global";

export type AudioVisualizerProps = {
  fftSize: number;
  barWidth?: number;
  smoothing?: number;
};

export default function AudioVisualizer({
  fftSize,
  barWidth = 10,
  smoothing = 0.6,
}: AudioVisualizerProps) {
  const visualizerId = useId();

  useEffect(() => {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(StreamManager.player);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = fftSize * 2;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.smoothingTimeConstant = smoothing;

    const waveform = new Uint8Array(analyser.frequencyBinCount);

    const canvas = document.getElementById(visualizerId) as HTMLCanvasElement;
    const canvasCtx = canvas.getContext("2d");
    //canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    let bShouldKeepRendering = true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onRenderFrame = (_timestamp: number) => {
      if (!bShouldKeepRendering || !canvasCtx) return;
      window.requestAnimationFrame(onRenderFrame);
      canvasCtx.clearRect(
        0,
        0,
        canvasCtx.canvas.width,
        canvasCtx.canvas.height
      );
      analyser.getByteFrequencyData(waveform);

      let actualBarWidth = barWidth;

      if (canvas.width - barWidth * waveform.length < 0) {
        actualBarWidth = canvas.width / waveform.length;
      }

      waveform.forEach((value, i, arr) => {
        i = (i + Math.round(arr.length / 2)) % arr.length;
        const maxHeight = canvas.height - 10;
        const scaledValue = (value / 255) * maxHeight;
        canvasCtx.fillStyle = "white";
        canvasCtx.fillRect(
          i * actualBarWidth,
          canvas.height / 2 - scaledValue / 2,
          actualBarWidth,
          scaledValue
        );
        canvasCtx.restore();
      });
    };

    window.requestAnimationFrame(onRenderFrame);

    return () => {
      bShouldKeepRendering = false;
      analyser.disconnect(audioCtx.destination);
      source.disconnect(analyser);
      audioCtx.close();
      StreamManager.player.play();
    };
  }, [barWidth, fftSize, smoothing, visualizerId]);

  return <canvas id={visualizerId} />;
}
