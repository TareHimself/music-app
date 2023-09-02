import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";
import {  
    IAlbum,
  IArtist,
  IPlaylist,
  ITrack,
  VirtualLibraryState,
} from "@types";

const initialState: VirtualLibraryState = {
  status: "loading",
  data: {
    tracks: {},
    albums: {},
    playlists: {},
    artists: {},
  },
};

export const VirtualLibarySlice = createSlice({
  name: "virtual/library",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    addVirtualAlbums: (state,action: PayloadAction<IAlbum[]>) => {
        action.payload.forEach((a)=>{
            state.data.albums[a.id] = a
        })
    },
    addVirtualTracks: (state,action: PayloadAction<ITrack[]>) => {
        action.payload.forEach((a) =>{
            state.data.tracks[a.id] = a
        })
    },
    addVirtualArtists: (state,action: PayloadAction<IArtist[]>) => {
        action.payload.forEach((a)=>{
            state.data.artists[a.id] = a
        })
    },
    addVirtualPlaylist: (state,action: PayloadAction<IPlaylist[]>) => {
        action.payload.forEach((a) => {
            state.data.playlists[a.id] = a
        })
    },    
  },
});

export const {
  addVirtualAlbums,
  addVirtualTracks,
  addVirtualArtists,
  addVirtualPlaylist
} = VirtualLibarySlice.actions;

export default VirtualLibarySlice.reducer;
