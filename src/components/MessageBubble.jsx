import React from 'react'
import { Collapse, Tag, Typography, Space } from 'antd'
import { ToolOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// 一条消息的渲染：user 纯文本右对齐；assistant Markdown + 工具调用折叠 + 思考折叠
export default function MessageBubble({ msg, streaming }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2 bg-blue-600 text-white whitespace-pre-wrap break-words">
          {msg.content}
        </div>
      </div>
    )
  }

  const hasTools = msg.tools?.length > 0
  const hasThinking = !!msg.thinking

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] w-full">
        {hasTools && (
          <Collapse
            size="small"
            className="mb-2"
            items={msg.tools.map((t, i) => ({
              key: i,
              label: (
                <Space size={6}>
                  <ToolOutlined />
                  <Typography.Text code>{t.name}</Typography.Text>
                  <Tag color={t.done ? 'success' : 'processing'}>{t.done ? '完成' : '调用中'}</Tag>
                </Space>
              ),
              children: (
                <div className="text-xs">
                  <div><b>参数：</b><code>{t.args}</code></div>
                  {t.preview && (
                    <div className="mt-1"><b>结果预览：</b><Typography.Paragraph code copyable={false} style={{ whiteSpace: 'pre-wrap', fontSize: 12, margin: '4px 0 0' }}>{t.preview}</Typography.Paragraph></div>
                  )}
                </div>
              ),
            }))}
          />
        )}
        {hasThinking && (
          <Collapse
            size="small"
            className="mb-2"
            items={[{
              key: 'th',
              label: <Typography.Text type="secondary" style={{ fontSize: 12 }}>💭 思考过程</Typography.Text>,
              children: <div className="text-xs text-gray-500 whitespace-pre-wrap">{msg.thinking}</div>,
            }]}
          />
        )}
        <div className="rounded-2xl rounded-bl-sm px-4 py-2 bg-white shadow-sm border border-gray-100 markdown-body">
          {msg.content
            ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            : streaming
              ? <Typography.Text type="secondary">（正在生成…）</Typography.Text>
              : <Typography.Text type="secondary">（本轮只有工具调用，无正文）</Typography.Text>}
          {streaming && msg.content && <span className="animate-pulse">▍</span>}
        </div>
      </div>
    </div>
  )
}
