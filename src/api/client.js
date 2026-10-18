import axios from 'axios'

// axios 实例：普通 JSON 接口用；SSE 流用原生 fetch（axios 不支持读流）。
// GITHOT_API_TOKEN 设置后，把 token 存 localStorage，这里统一加 Authorization 头。
const api = axios.create({ baseURL: '', timeout: 180000 })

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('githot_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export function getToken() {
  return localStorage.getItem('githot_token') || ''
}
export function setToken(t) {
  if (t) localStorage.setItem('githot_token', t)
  else localStorage.removeItem('githot_token')
}

/**
 * 以 POST + SSE 读取服务端事件流（fetch 手动解析，可携带请求体与 AbortController）。
 * onEvent(event, dataJSON) 每个事件回调一次；网络/解析错误抛给调用方。
 */
export async function ssePost(url, body, onEvent, signal) {
  const headers = { 'Content-Type': 'application/json', Accept: 'text/event-stream' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (!resp.ok) {
    // 流开始前的错误（422 校验 / 401 鉴权 / 404）——后端返回的是 JSON
    let detail = `HTTP ${resp.status}`
    try {
      const j = await resp.json()
      detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
    } catch { /* 忽略解析失败 */ }
    throw new Error(detail)
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE 帧以空行分隔；残帧留在 buffer 等下一块
    let idx
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      let event = 'message'
      const dataLines = []
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
      }
      if (!dataLines.length) continue
      let data = null
      try { data = JSON.parse(dataLines.join('\n')) } catch { data = { raw: dataLines.join('\n') } }
      onEvent(event, data)
    }
  }
}

export default api
