import { configureStore } from '@reduxjs/toolkit'
import chatReducer from './chatSlice'
import articleReducer from './articleSlice'
import settingsReducer from './settingsSlice'

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    article: articleReducer,
    settings: settingsReducer,
  },
})
