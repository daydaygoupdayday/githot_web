import React from 'react'
import { Button, Input, Space, Empty, Popconfirm, Tooltip, Alert } from 'antd'
import {
  PlusOutlined, DeleteOutlined, ClearOutlined, SendOutlined,
  StopOutlined, ThunderboltOutlined, HistoryOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  newSession, selectSession, deleteSession, clearMessages, selectActive,
} from '../store/chatSlice'
import { sendMessage, stopStream, threadIdFor } from '../api/chatStream'
import MessageBubble from '../components/MessageBubble'

const SUGGESTIONS = [
  '最近7天 Python 高星新仓库，前5',
  '换成涨星速度最快的',
  '再看看 Rust 最近一个月的',
  '把最近7天 Go 涨星最快的仓库写成一篇公众号文章，800字，轻松点',
]

export default function ChatPage() {
  const dispatch = useDispatch()
  const { order, byId, activeId } = useSelector((s) => s.chat)
  const showThinking = useSelector((s) => s.settings.showThinking)
  const active = useSelector(selectActive)
  const [input, setInput] = React.useState('')
  const scrollRef = React.useRef(null)

  const streaming = active?.streaming

  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [active?.messages?.length, active?.messages?.at(-1)?.content])

  const send = (text) => {
    const t = (text ?? input).trim()
    if (!t || streaming) return
    setInput('')
    dispatch(sendMessage({ sessionId: activeId, text: t, threadId: threadIdFor(activeId), showThinking }))
  }

  return (
    <div className="flex h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* 会话列表 */}
      <div className="w-56 shrink-0 bg-white rounded-lg shadow-sm p-2 flex flex-col mr-3">
        <Button type="primary" block icon={<PlusOutlined />} onClick={() => dispatch(newSession())}>
          新建会话
        </Button>
        <div className="mt-2 flex-1 overflow-auto thin-scroll">
          {order.map((id) => {
            const c = byId[id]
            return (
              <div
                key={id}
                onClick={() => dispatch(selectSession(id))}
                className={`group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer mb-1 text-sm ${id === activeId ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
              >
                <span className="truncate">{c.title}</span>
                <Popconfirm title="删除该会话？" okText="删除" cancelText="取消" onConfirm={(e) => { e?.stopPropagation(); dispatch(deleteSession(id)) }}>
                  <DeleteOutlined className="opacity-0 group-hover:opacity-100 text-gray-400 hover:!text-red-500" onClick={(e) => e.stopPropagation()} />
                </Popconfirm>
              </div>
            )
          })}
        </div>
        <div className="text-xs text-gray-400 px-2 py-1">共 {order.length} 个会话</div>
      </div>

      {/* 对话主区 */}
      <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col min-w-0">
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <Space size={6}>
            <HistoryOutlined className="text-gray-400" />
            <span className="text-sm text-gray-600">thread: <code>{threadIdFor(activeId)}</code></span>
          </Space>
          <Popconfirm title="清空当前会话消息？" okText="清空" cancelText="取消"
            onConfirm={() => dispatch(clearMessages(activeId))}>
            <Button size="small" icon={<ClearOutlined />} disabled={!active?.messages?.length}>清空</Button>
          </Popconfirm>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto thin-scroll p-4 bg-gray-50">
          {!active?.messages?.length ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <Empty description="开始一段对话，查询 GitHub 热榜或生成文章" />
              <div className="flex flex-wrap gap-2 justify-center max-w-xl">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} size="small" icon={<ThunderboltOutlined />} onClick={() => send(s)}>{s}</Button>
                ))}
              </div>
            </div>
          ) : (
            active.messages.map((m, i) => (
              <MessageBubble key={i} msg={m} streaming={streaming && i === active.messages.length - 1 && m.role === 'assistant'} />
            ))
          )}
        </div>

        <div className="p-3 border-t">
          {streaming && (
            <Alert type="info" showIcon message="模型正在流式回答，可随时停止" className="mb-2"
              action={<Button size="small" danger icon={<StopOutlined />} onClick={() => stopStream(activeId)}>停止</Button>}
            />
          )}
          <Space.Compact className="w-full">
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="问点什么？Enter 发送，Shift+Enter 换行。多轮会自动沿用上一轮的语言/天数条件"
              autoSize={{ minRows: 1, maxRows: 5 }}
              disabled={streaming}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={() => send()} disabled={!input.trim() || streaming} className="!px-6">
              发送
            </Button>
          </Space.Compact>
          <div className="text-xs text-gray-400 mt-1">
            提示：说「写成公众号文章」会调用文章工具；<Tooltip title="后端把生成文章时用的真实仓库条目单独返回，文章页可核对">「生成文章」页</Tooltip>可核对数据。
          </div>
        </div>
      </div>
    </div>
  )
}
