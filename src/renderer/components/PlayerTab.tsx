import axios from 'axios';
import React from 'react';
import { BsPauseFill, BsPlayFill } from 'react-icons/bs';
import { toTimeString } from 'renderer/utils';

export type PlayerTabProps = {};
export type PlayerTabState = {
  trackProgress: number;
  trackLength: number;
  isPaused: boolean;
};
export default class PlayerTab extends React.Component<
  PlayerTabProps,
  PlayerTabState
> {
  player: HTMLAudioElement = new Audio();

  volume: number = 0.2;

  constructor(props: PlayerTabProps) {
    super(props);
    this.player.volume = this.volume;
    this.player.ontimeupdate = this.onTimeUpdate.bind(this);
    this.player.onplaying = () => this.updateState({ isPaused: false });
    this.player.onpause = () => this.updateState({ isPaused: true });
    this.player.onerror = console.log.bind(this, 'Player Error:');
    this.state = {
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

  updateState(update: Partial<PlayerTabState>) {
    this.setState((prevState) => ({ ...prevState, ...update }));
  }

  async audioTest(search: string) {
    const url = (
      await axios.get(`http://localhost:9500/search/${search}/stream`)
    ).data;

    this.play(url);
  }

  async resume() {
    if (!this.player.src) {
      this.audioTest('ただ声一つ Audio');
    }
    this.player.play();
  }

  async play(uri?: string) {
    if (uri && !this.player.src) {
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
            <div className="player-bar">
              <div
                id="player-bar-inner"
                style={{
                  width: `${((trackProgress / trackLength) * 100).toFixed(2)}%`,
                }}
              />
            </div>
            <p className="player-bar-time">{toTimeString(trackLength)}</p>
          </span>
        </span>
        <span />
      </div>
    );
  }
}
