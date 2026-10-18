import React from 'react'
import {
  Form, Select, InputNumber, Input, Button, Segmented, Space, Table, Tag,
  Card, Statistic, Progress, Empty, Alert, Typography, message,
} from 'antd'
import { PlayCircleOutlined, StopOutlined, CopyOutlined, DownloadOutlined, LinkOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import api from '../api/client'
import { generateArticleStream, stopArticle } from '../api/articleStream'
import { reset } from '../store/articleSlice'

export default function ArticlePage() {
  const dispatch = useDispatch()
  const { params, status, meta, items, text, error } = useSelector((s) => s.article)
  const [styles, setStyles] = React.useState(['科技种草', '热点资讯', '轻松段子', '深度解读'])

  React.useEffect(() => {
    api.get('/api/article/styles').then(({ data }) => setStyles(data.styles)).catch(() => {})
  }, [])

  const busy = status === 'fetching' || status === 'streaming'

  const run = () => dispatch(generateArticleStream(params))

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); message.success('已复制全文') }
    catch { message.error('复制失败，请手动选择') }
  }
  const download = () => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `githot-article-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex gap-3 items-start">
      {/* 参数面板 */}
      <Card title="生成参数" className="w-80 shrink-0" size="small">
        <Form layout="vertical" size="small">
          <Form.Item label="榜单类型">
            <Segmented
              block
              value={params.board}
              onChange={(v) => dispatch({ type: 'article/setParam', payload: { key: 'board', value: v } })}
              options={[{ label: '星标总量', value: 'hot' }, { label: '涨星速度', value: 'rising' }]}
            />
          </Form.Item>
          <Form.Item label="最近天数（days_age）">
            <InputNumber min={1} max={365} className="w-full" value={params.days_age}
              onChange={(v) => dispatch({ type: 'article/setParam', payload: { key: 'days_age', value: v ?? 7 } })} />
          </Form.Item>
          <Form.Item label="语言（留空=不限）">
            <Input allowClear placeholder="如 Python / Go / Rust" value={params.language}
              onChange={(e) => dispatch({ type: 'article/setParam', payload: { key: 'language', value: e.target.value } })} />
          </Form.Item>
          <Form.Item label="最低星数（留空=榜单默认）">
            <InputNumber min={0} max={100000} className="w-full" placeholder="hot 默认 50 / rising 默认 10" value={params.min_stars}
              onChange={(v) => dispatch({ type: 'article/setParam', payload: { key: 'min_stars', value: v } })} />
          </Form.Item>
          <Form.Item label="仓库条数（rank，≤30）">
            <InputNumber min={1} max={30} className="w-full" value={params.rank}
              onChange={(v) => dispatch({ type: 'article/setParam', payload: { key: 'rank', value: v ?? 5 } })} />
          </Form.Item>
          <Form.Item label="写作风格">
            <Select value={params.style}
              onChange={(v) => dispatch({ type: 'article/setParam', payload: { key: 'style', value: v } })}
              options={styles.map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item label="目标字数">
            <InputNumber min={200} max={5000} step={100} className="w-full" value={params.word_count}
              onChange={(v) => dispatch({ type: 'article/setParam', payload: { key: 'word_count', value: v } })} />
          </Form.Item>
          <Space className="w-full">
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={run} disabled={busy} block>
              {busy ? '生成中…' : '开始生成'}
            </Button>
            {busy && <Button danger icon={<StopOutlined />} onClick={stopArticle}>停止</Button>}
          </Space>
        </Form>
      </Card>

      {/* 结果区 */}
      <div className="flex-1 min-w-0">
        {status === 'error' && error && (
          <Alert type="error" showIcon message="生成失败" description={error} className="mb-3"
            action={<Button size="small" onClick={() => dispatch(reset())}>关闭</Button>} />
        )}

        {meta && (
          <Card size="small" className="mb-3">
            <div className="grid grid-cols-4 gap-2">
              <Statistic title="榜单" value={meta.board_label} valueStyle={{ fontSize: 15 }} />
              <Statistic title="口径" value={`${meta.days_age}天 / ${meta.min_stars}星起`} valueStyle={{ fontSize: 15 }} />
              <Statistic title="语言" value={meta.language || '不限'} valueStyle={{ fontSize: 15 }} />
              <Statistic title="条目" value={meta.count} valueStyle={{ fontSize: 15 }} />
            </div>
            <Table
              size="small"
              rowKey="path"
              className="mt-3"
              dataSource={items}
              pagination={false}
              columns={[
                { title: '#', dataIndex: 'rank', width: 40 },
                {
                  title: '仓库', dataIndex: 'path',
                  render: (v, r) => (
                    <Space size={4}>
                      <a href={r.details} target="_blank" rel="noreferrer">{v} <LinkOutlined style={{ fontSize: 11 }} /></a>
                    </Space>
                  ),
                },
                { title: '星标', dataIndex: 'stars', width: 70, render: (v) => <Tag color="gold">{v}</Tag> },
                ...(meta.board === 'rising'
                  ? [{ title: '涨星/天', dataIndex: 'stars_per_day', width: 90, render: (v) => <Tag color="volcano">↑{v}</Tag> }]
                  : []),
                {
                  title: '描述', dataIndex: 'description', ellipsis: true,
                  render: (v) => v || <Typography.Text type="secondary">暂无描述</Typography.Text>,
                },
              ]}
            />
          </Card>
        )}

        <Card
          title="文章正文（Markdown）"
          size="small"
          extra={
            <Space>
              {status === 'streaming' && <Tag color="processing">逐字生成中…</Tag>}
              {status === 'done' && <Tag color="success">完成</Tag>}
              <Button size="small" icon={<CopyOutlined />} disabled={!text} onClick={copy}>复制</Button>
              <Button size="small" icon={<DownloadOutlined />} disabled={!text} onClick={download}>下载 .md</Button>
            </Space>
          }
        >
          {status === 'fetching' && <Alert type="info" showIcon message="正在抓取榜单数据…" className="mb-3" />}
          {text || status === 'streaming' ? (
            <div className="markdown-body max-h-[60vh] overflow-auto thin-scroll">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              {status === 'streaming' && <span className="animate-pulse">▍</span>}
            </div>
          ) : status === 'idle' && !error ? (
            <Empty description="设置左侧参数后点击「开始生成」" />
          ) : null}
          {text && (
            <div className="text-xs text-gray-400 mt-2 border-t pt-2">
              字数约 {text.length} · 仓库名/星数/链接以上方数据区为准（模型只负责行文，数据由后端程序化传入）
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
