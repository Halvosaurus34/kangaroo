import React, { useState } from "react";
import "./App.css";
import axios from "axios";
// import jwt_decode from 'jwt-decode';
// import Video from 'twilio-video';
import twilioSdk from "./utilities/twilio";
// import { disconnect } from 'twilio-video'
import { fireAuth } from "./utilities/firebase";
import { appTheme } from "./AppTheme";
import { ThemeProvider } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import CssBaseline from "@material-ui/core/CssBaseline";
import Hallway from "./components/Hallway.js";
import NavBar from "./components/NavBar";
import SingleRoom from "./components/SingleRoom";
import Profile from "./components/Profile";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
  Redirect,
} from "react-router-dom";

import { Button, TextField, Card, CardContent } from "@material-ui/core";

function App() {
  const [state, setState] = useState({
    identity: null /* Will hold the fake name assigned to the client. The name is generated by faker on the server */,
    roomName: "" /* Will store the room name */,
    roomNameErr: false /* Track error for room name TextField. This will enable us to show an error message when this variable is true */,
    previewTracks: null,
    localMediaAvailable: false /* Represents the availability of a LocalAudioTrack(microphone) and a LocalVideoTrack(camera) */,
    hasJoinedRoom: false,
    activeRoom: null, // Track the current active room
    token: null,
    roomSID: null,
  });

  const handleRoomNameChange = (newRoomName) => {
    setState((prev) => ({
      ...prev,
      roomName: newRoomName,
    }));
  };

  const joinRoom = async (roomName) => {
    leaveRoom();
    console.log(roomName);
    handleRoomNameChange(roomName);
    const userName = `user${Math.random() * 100}`;
    const token = twilioSdk.fetchVideoToken(userName, roomName);
    const currRoom = await twilioSdk.joinMediaRoom(token, roomName);
    setState((prev) => ({
      ...prev,
      activeRoom: currRoom,
    }));
    twilioSdk.subscribeToRoomMedia(currRoom, "remote-audio");
    twilioSdk.subscribeToMediaChanges(currRoom, "remote-audio");
  };

  const createNewRoom = (roomName) => {
    handleRoomNameChange(roomName);
    axios.post(`/createRoom/${roomName}`).then((res) => {
      console.log(JSON.stringify(res));
      setState((prev) => ({
        ...prev,
        roomSID: res.data.sid,
      }));
    });
  };

  const leaveRoom = () => {
    if (state.roomName) {
      const videoRoom = state.activeRoom;
      // videoRoom.disconnect();
      console.log("leaving room");
      twilioSdk.leaveMediaRoom(videoRoom, "remote-audio");
      twilioSdk.subscribeToMediaChanges(videoRoom, "remote-audio");
      setState((prev) => ({
        ...prev,
        roomName: "",
      }));
    }
  };

  return (
    <Router>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <audio id="remote-audio" autoPlay playsInline></audio>
      </ThemeProvider>

      <Switch>
        <Route path="/profile">
          <Profile />
        </Route>
        <Route path="/room/:id">
          <NavBar createRoom={createNewRoom} />

          <SingleRoom />
          {/* <button onClick={getUserMedia}>Click Me</button> */}
          <video autoPlay playsInline></video>
        </Route>
        <Route exact path="/">
          <NavBar createRoom={createNewRoom} />

          <Grid container justify="center">
            <Hallway joinRoom={joinRoom} />
          </Grid>
        </Route>
        <Route render={() => <Redirect to={{ pathname: "/" }} />} />
      </Switch>
    </Router>
  );
}
export default App;
