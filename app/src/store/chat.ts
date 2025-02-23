import { createSlice } from "@reduxjs/toolkit";
import { ConversationInstance, Model } from "@/conversation/types.ts";
import { Message } from "@/conversation/types.ts";
import { insertStart } from "@/utils/base.ts";
import { RootState } from "./index.ts";
import { supportModels } from "@/conf.ts";
import { getMemory, setMemory } from "@/utils/memory.ts";

type initialStateType = {
  history: ConversationInstance[];
  messages: Message[];
  model: string;
  web: boolean;
  current: number;
};

function GetModel(model: string | undefined | null): string {
  return model &&
    supportModels.filter((item: Model) => item.id === model).length
    ? model
    : supportModels[0].id;
}

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    history: [],
    messages: [],
    model: GetModel(getMemory("model")),
    web: false,
    current: -1,
  } as initialStateType,
  reducers: {
    setHistory: (state, action) => {
      state.history = action.payload as ConversationInstance[];
    },
    removeHistory: (state, action) => {
      state.history = state.history.filter(
        (item) => item.id !== (action.payload as number),
      );
    },
    addHistory: (state, action) => {
      const name = action.payload.message as string;
      const id = state.history.length
        ? Math.max(...state.history.map((item) => item.id)) + 1
        : 1;

      state.history = insertStart(state.history, { id, name, message: [] });
      state.current = id;
      action.payload.hook(id);
    },
    setMessages: (state, action) => {
      state.messages = action.payload as Message[];
    },
    setModel: (state, action) => {
      setMemory("model", action.payload as string);
      state.model = action.payload as string;
    },
    setWeb: (state, action) => {
      state.web = action.payload as boolean;
    },
    setCurrent: (state, action) => {
      state.current = action.payload as number;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload as Message);
    },
    setMessage: (state, action) => {
      state.messages[state.messages.length - 1] = action.payload as Message;
    },
  },
});

export const {
  setHistory,
  removeHistory,
  addHistory,
  setCurrent,
  setMessages,
  setModel,
  setWeb,
  addMessage,
  setMessage,
} = chatSlice.actions;
export const selectHistory = (state: RootState): ConversationInstance[] =>
  state.chat.history;
export const selectMessages = (state: RootState): Message[] =>
  state.chat.messages;
export const selectModel = (state: RootState): string => state.chat.model;
export const selectWeb = (state: RootState): boolean => state.chat.web;
export const selectCurrent = (state: RootState): number => state.chat.current;

export default chatSlice.reducer;
