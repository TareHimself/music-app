import React, { Component } from "react";
import { NavPanel } from "@components/navigation/exports";
import Screens from "@components/Screens";
import "./css/base.css";

export default class App extends Component {
  override render(): React.ReactNode {
    return (
      <div id="sub-root">
        <NavPanel />
        <Screens />
      </div>
    );
  }
}
