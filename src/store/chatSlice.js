import { createSlice, nanoid } from '@reduxjs/toolkit'

// 会话列表 + 每个会话的消息流。一个会话 = 一个后端 thread_id。
// 结构：{ byId: {id: {id, title, messages: [...], streaming}}, order: [id...] }
// 消息：{ role: 'user'|'assistant', content, thinking?, tools: [{name,args,preview}] }

const STORAGE_KEY = 'githot_chat_sessions'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      // 刷新页面后不可能有进行中的流，统一复位
      Object.values(s.byId || {}).forEach((c) => { c.streaming = false })
      if (s.order?.length) return s
    }
  } catch { /* 损坏则重建 */ }
  const id = nanoid(10)
  return { byId: { [id]: { id, title: '新会话', messages: [], streaming: false } }, order: [id], activeId: id }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ byId: state.byId, order: state.order, activeId: state.activeId }))
  } catch { /* 存满则放弃持久化 */ }
}

const chatSlice = createSlice({
  name: 'chat',
  initialState: load(),
  reducers: {
    newSession(state) {
      const id = nanoid(10)
      state.byId[id] = { id, title: '新会话', messages: [], streaming: false }
      state.order.unshift(id)
      state.activeId = id
      save(state)
    },
    selectSession(state, { payload }) {
      state.activeId = payload
      save(state)
    },
    deleteSession(state, { payload }) {
      delete state.byId[payload]
      state.order = state.order.filter((i) => i !== payload)
      if (state.activeId === payload) {
        if (!state.order.length) {
          const id = nanoid(10)
          state.byId[id] = { id, title: '新会话', messages: [], streaming: false }
          state.order = [id]
          state.activeId = id
        } else {
          state.activeId = state.order[0]
        }
      }
      save(state)
    },
    clearMessages(state, { payload }) {
      const c = state.byId[payload]
      if (c) { c.messages = []; c.title = '新会话' }
      save(state)
    },
    pushUser(state, { payload: { sessionId, text } }) {
      const c = state.byId[sessionId]
      c.messages.push({ role: 'user', content: text })
      if (c.title === '新会话') c.title = text.slice(0, 24)
    },
    beginAssistant(state, { payload }) {
      state.byId[payload].messages.push({ role: 'assistant', content: '', thinking: '', tools: [] })
      state.byId[payload].streaming = true
    },
    appendToken(state, { payload: { sessionId, text } }) {
      const m = lastAssistant(state, sessionId)
      if (m) m.content += text
    },
    appendThinking(state, { payload: { sessionId, text } }) {
      const m = lastAssistant(state, sessionId)
      if (m) m.thinking += text
    },
    addToolCall(state, { payload: { sessionId, name, args } }) {
      const m = lastAssistant(state, sessionId)
      if (m) m.tools.push({ name, args, preview: '', done: false })
    },
    addToolResult(state, { payload: { sessionId, name, preview } }) {
      const m = lastAssistant(state, sessionId)
      if (!m) return
      const t = [...m.tools].reverse().find((x) => x.name === name && !x.done)
      if (t) { t.preview = preview; t.done = true }
    },
    finishAssistant(state, { payload: { sessionId, finalText } }) {
      const m = lastAssistant(state, sessionId)
      if (m && finalText && !m.content) m.content = finalText // 兜底：没流出来时用 final
      state.byId[sessionId].streaming = false
      save(state)
    },
    setStreamingFalse(state, { payload }) {
      if (state.byId[payload]) state.byId[payload].streaming = false
      save(state)
    },
  },
})

function lastAssistant(state, sessionId) {
  const msgs = state.byId[sessionId]?.messages || []
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'assistant') return msgs[i]
  }
  return null
}

export const {
  newSession, selectSession, deleteSession, clearMessages,
  pushUser, beginAssistant, appendToken, appendThinking,
  addToolCall, addToolResult, finishAssistant, setStreamingFalse,
} = chatSlice.actions

export function selectActive(state) {
  return state.chat.byId[state.chat.activeId]
}

export default chatSlice.reducer
