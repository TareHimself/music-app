/* eslint-disable react/prefer-stateless-function */
import './css/Main.css';
import React from 'react';
import NavPanel from './components/NavPanel';
import Screens from './components/Screens';

export default class App extends React.Component {
  override render(): React.ReactNode {
    return (
      <div id="sub-root">
        <NavPanel />
        <Screens />
      </div>
    );
  }
}
