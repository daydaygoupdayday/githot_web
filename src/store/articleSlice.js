import { createSlice } from '@reduxjs/toolkit'

// 文章生成页状态：表单参数 + 生成结果（meta/items 来自后端真实数据，正文逐字流）
const articleSlice = createSlice({
  name: 'article',
  initialState: {
    params: {
      board: 'hot',
      days_age: 7,
      language: '',
      min_stars: null,
      rank: 5,
      style: '科技种草',
      word_count: 800,
    },
    status: 'idle', // idle | fetching | streaming | done | error
    meta: null,
    items: [],
    text: '',
    error: '',
  },
  reducers: {
    setParam(state, { payload: { key, value } }) {
      state.params[key] = value
    },
    start(state) {
      state.status = 'fetching'
      state.meta = null
      state.items = []
      state.text = ''
      state.error = ''
    },
    gotMeta(state, { payload }) {
      state.meta = payload.meta
      state.items = payload.items
      state.status = 'streaming'
    },
    appendText(state, { payload }) {
      state.text += payload.text
    },
    done(state) {
      state.status = 'done'
    },
    fail(state, { payload }) {
      state.status = 'error'
      state.error = payload
    },
    stop(state) {
      if (state.status === 'fetching' || state.status === 'streaming') state.status = 'idle'
    },
    reset(state) {
      state.meta = null; state.items = []; state.text = ''; state.error = ''; state.status = 'idle'
    },
  },
})

export const { setParam, start, gotMeta, appendText, done, fail, stop, reset } = articleSlice.actions
export default articleSlice.reducer
