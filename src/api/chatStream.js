import { createAsyncThunk } from '@reduxjs/toolkit'
import { ssePost, getToken } from './client'
import {
  pushUser, beginAssistant, appendToken, appendThinking,
  addToolCall, addToolResult, finishAssistant, setStreamingFalse,
} from '../store/chatSlice'

// 进行中的请求中止表：sessionId -> AbortController（停止按钮用）
const controllers = new Map()

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ sessionId, text, threadId, showThinking }, { dispatch }) => {
    dispatch(pushUser({ sessionId, text }))
    dispatch(beginAssistant(sessionId))

    const ctrl = new AbortController()
    controllers.set(sessionId, ctrl)

    try {
      await ssePost(
        '/api/chat/stream',
        { message: text, thread_id: threadId, show_thinking: !!showThinking },
        (event, data) => {
          switch (event) {
            case 'token':       dispatch(appendToken({ sessionId, text: data.text })); break
            case 'thinking':    dispatch(appendThinking({ sessionId, text: data.text })); break
            case 'tool_call':   dispatch(addToolCall({ sessionId, name: data.name, args: data.args })); break
            case 'tool_result': dispatch(addToolResult({ sessionId, name: data.name, preview: data.preview })); break
            case 'final':       dispatch(finishAssistant({ sessionId, finalText: data.text })); break
            case 'error':       dispatch(appendToken({ sessionId, text: `\n⚠️ ${data.detail}` })); break
            default: break // meta / done 无需处理
          }
        },
        ctrl.signal,
      )
    } catch (e) {
      if (e.name === 'AbortError') {
        dispatch(appendToken({ sessionId, text: '\n（已停止）' }))
      } else {
        dispatch(appendToken({ sessionId, text: `\n⚠️ 请求失败：${e.message}` }))
      }
    } finally {
      controllers.delete(sessionId)
      dispatch(setStreamingFalse(sessionId))
    }
  },
)

export function stopStream(sessionId) {
  controllers.get(sessionId)?.abort()
  controllers.delete(sessionId)
}

// thread_id 直接复用会话 id（前端 nanoid 与后端无冲突，且天然一一对应）
export function threadIdFor(sessionId) {
  return `web-${sessionId}`
}

export { getToken }
