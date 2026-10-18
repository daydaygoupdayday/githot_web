import { createSlice } from '@reduxjs/toolkit'

// 全局设置：是否展示模型思考过程（透传给后端 show_thinking）
const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    showThinking: localStorage.getItem('githot_show_thinking') === '1',
  },
  reducers: {
    toggleThinking(state, { payload }) {
      state.showThinking = payload
      localStorage.setItem('githot_show_thinking', payload ? '1' : '0')
    },
  },
})

export const { toggleThinking } = settingsSlice.actions
export default settingsSlice.reducer
