import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { tokenField } from "@/conf.ts";
import { AppDispatch } from "./index.ts";
import { forgetMemory, setMemory } from "@/utils/memory.ts";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: "",
    init: false,
    authenticated: false,
    username: "",
  },
  reducers: {
    setToken: (state, action) => {
      const token = (action.payload as string).trim();
      state.token = token;
      axios.defaults.headers.common["Authorization"] = token;
      if (token.length > 0) setMemory(tokenField, token);
    },
    setAuthenticated: (state, action) => {
      state.authenticated = action.payload as boolean;
    },
    setUsername: (state, action) => {
      state.username = action.payload as string;
    },
    setInit: (state, action) => {
      state.init = action.payload as boolean;
    },
    logout: (state) => {
      state.token = "";
      state.authenticated = false;
      state.username = "";
      axios.defaults.headers.common["Authorization"] = "";
      forgetMemory(tokenField);

      location.reload();
    },
  },
});

export function validateToken(
  dispatch: AppDispatch,
  token: string,
  hook?: () => any,
) {
  token = token.trim();
  dispatch(setToken(token));

  if (token.length === 0) {
    dispatch(setAuthenticated(false));
    dispatch(setUsername(""));
    dispatch(setInit(true));
    return;
  } else
    axios
      .post("/state")
      .then((res) => {
        dispatch(setAuthenticated(res.data.status));
        dispatch(setUsername(res.data.user));
        dispatch(setInit(true));
        hook && hook();
      })
      .catch((err) => {
        // keep state
        console.debug(err);
      });
}

export const selectAuthenticated = (state: any) => state.auth.authenticated;
export const selectUsername = (state: any) => state.auth.username;
export const selectInit = (state: any) => state.auth.init;

export const { setToken, setAuthenticated, setUsername, logout, setInit } =
  authSlice.actions;
export default authSlice.reducer;
