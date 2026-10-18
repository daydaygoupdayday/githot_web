import React from 'react'
import { Layout, Menu, Button, Tag, Space } from 'antd'
import { MessageOutlined, FileTextOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import ChatPage from './pages/ChatPage'
import ArticlePage from './pages/ArticlePage'
import SettingsPopover from './components/SettingsPopover'
import api from './api/client'

const { Sider, Content, Header } = Layout

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [backendOk, setBackendOk] = React.useState(null)
  const dispatch = useDispatch()

  const checkHealth = React.useCallback(async () => {
    try {
      const { data } = await api.get('/health', { timeout: 5000 })
      setBackendOk(data.status === 'ok')
    } catch {
      setBackendOk(false)
    }
  }, [])

  React.useEffect(() => { checkHealth() }, [checkHealth])

  const selected = location.pathname.startsWith('/article') ? 'article'
    : location.pathname.startsWith('/settings') ? 'settings' : 'chat'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200} breakpoint="lg" collapsedWidth={0} className="!bg-white border-r border-gray-200">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-100">
          <span className="text-lg font-bold">🔥 githot</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selected]}
          onClick={({ key }) => navigate(key === 'chat' ? '/' : `/${key}`)}
          style={{ borderRight: 0 }}
          items={[
            { key: 'chat', icon: <MessageOutlined />, label: '热榜对话' },
            { key: 'article', icon: <FileTextOutlined />, label: '生成文章' },
            { key: 'settings', icon: <SettingOutlined />, label: '设置' },
          ]}
        />
        <div className="px-4 mt-4 text-xs text-gray-500">
          <Space>
            后端
            <Tag color={backendOk === null ? 'default' : backendOk ? 'success' : 'error'}>
              {backendOk === null ? '检测中' : backendOk ? '在线' : '离线'}
            </Tag>
            <Button size="small" type="text" icon={<ReloadOutlined />} onClick={checkHealth} />
          </Space>
        </div>
      </Sider>
      <Layout>
        <Header className="!bg-white !px-6 border-b border-gray-200 flex items-center justify-between" style={{ height: 56, lineHeight: '56px' }}>
          <span className="font-medium">
            {selected === 'article' ? '公众号文章生成' : selected === 'settings' ? '设置' : 'GitHub 热榜多轮对话'}
          </span>
          <SettingsPopover onCheck={checkHealth} backendOk={backendOk} />
        </Header>
        <Content className="p-4 overflow-auto" style={{ background: '#f5f5f5' }}>
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/article" element={<ArticlePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

// 设置页复用 SettingsPopover 的详情版
function SettingsPage() {
  const showThinking = useSelector((s) => s.settings.showThinking)
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">设置</h2>
      <p className="text-gray-500 text-sm mb-4">这些设置保存在浏览器本地。后端地址由 Vite 代理固定为 127.0.0.1:8000。</p>
      <div className="flex items-center justify-between py-3 border-b">
        <div>
          <div className="font-medium">展示模型思考过程</div>
          <div className="text-xs text-gray-400">开启后对话里额外显示 reasoning（需模型支持，如 Qwen enable_thinking）</div>
        </div>
        <span className="text-sm">当前：{showThinking ? '开' : '关'}</span>
      </div>
      <div className="py-3 text-sm text-gray-600">
        API Token：<span>{localStorage.getItem('githot_token') ? '已设置' : '未设置（本机开发可不填）'}</span>
      </div>
    </div>
  )
}
