import React from 'react';
import { BsPauseFill, BsPlayFill } from 'react-icons/bs';
import { toTimeString } from 'renderer/utils';
import ControllableSlider from './ControllableSlider';

export type PlayerTabProps = {};
export type PlayerTabState = {
  seekProgress: number | null;
  trackProgress: number;
  trackLength: number;
  isPaused: boolean;
};
export default class PlayerTab extends React.Component<
  PlayerTabProps,
  PlayerTabState
> {
  player: HTMLAudioElement = new Audio();

  volume: number = 0.05;

  maxVolume: number = 0.5;

  constructor(props: PlayerTabProps) {
    super(props);
    this.player.volume = this.volume;
    this.player.ontimeupdate = this.onTimeUpdate.bind(this);
    this.player.onplaying = () => {
      this.updateState({ isPaused: false });
    };
    this.player.onpause = () => this.updateState({ isPaused: true });
    // eslint-disable-next-line no-console
    this.player.onerror = console.error.bind(this, 'Player Error:');
    this.state = {
      seekProgress: null,
      trackProgress: 0,
      trackLength: 0,
      isPaused: true,
    };
  }

  onTimeUpdate() {
    this.updateState({
      trackLength: Math.round(this.player.duration),
      trackProgress: Math.round(this.player.currentTime),
    });
  }

  onVolumeSliderChanged(update: number) {
    this.volume = update;
    this.player.volume = update;
  }

  onSeekSliderChanged(update: number, done: boolean) {
    if (!done) {
      this.updateState({ seekProgress: update });
      return;
    }

    this.player.currentTime = update;
    this.updateState({ trackProgress: update });
  }

  updateState(update: Partial<PlayerTabState>) {
    this.setState((prevState) => ({ ...prevState, ...update }));
  }

  async audioTest(search: string) {
    const uri = await window.electron.bridge.searchForStream(search);
    // eslint-disable-next-line no-console
    console.log('Got Uri', uri);
    this.play(uri);
  }

  async resume() {
    if (!this.player.src) {
      await this.audioTest('Sincerely by TRUE Japanese Audio');
      return;
    }
    this.player.play();
  }

  async play(uri?: string) {
    if (uri && this.player.src !== uri) {
      this.player.src = uri;
    }

    if (this.player) {
      this.player.play();
    }
  }

  async pause() {
    this.player.pause();
  }

  override render(): React.ReactNode {
    const { isPaused, trackProgress, trackLength } = this.state;
    return (
      <div id="player-tab">
        <span />
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span className="player-controls">
            {!isPaused ? (
              <BsPauseFill
                className="icon"
                size={50}
                onClick={() => this.pause()}
              />
            ) : (
              <BsPlayFill
                className="icon"
                size={50}
                onClick={() => this.resume()}
              />
            )}
          </span>
          <span
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <p className="player-bar-time">{toTimeString(trackProgress)}</p>
            <ControllableSlider
              min={0}
              max={trackLength}
              value={trackProgress}
              style={{ width: '500px' }}
              onUserUpdate={(u, d) => this.onSeekSliderChanged(u, d)}
            />
            <p className="player-bar-time">{toTimeString(trackLength)}</p>
          </span>
        </span>
        <span className="volume-control">
          <ControllableSlider
            min={0}
            max={this.maxVolume}
            defaultValue={this.volume}
            step={0.001}
            style={{ width: '100px' }}
            onUserUpdate={(u) => this.onVolumeSliderChanged(u)}
          />
        </span>
      </div>
    );
  }
}

/* <div className="player-bar">
              <div
                id="player-bar-inner"
                style={{
                  width: `${((trackProgress / trackLength) * 100).toFixed(2)}%`,
                }}
              />
            </div> */
