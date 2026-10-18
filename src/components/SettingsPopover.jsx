import React from 'react'
import { Popover, Switch, Input, Space, Typography, Button, Tag } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { toggleThinking } from '../store/settingsSlice'
import { getToken, setToken } from '../api/client'

// 顶栏右侧的设置气泡：思考开关 + token + 后端状态
export default function SettingsPopover({ onCheck, backendOk }) {
  const dispatch = useDispatch()
  const showThinking = useSelector((s) => s.settings.showThinking)
  const [token, setTokenState] = React.useState(getToken())

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      title="快速设置"
      content={
        <Space direction="vertical" style={{ width: 300 }}>
          <div className="flex items-center justify-between">
            <span>展示模型思考过程</span>
            <Switch checked={showThinking} onChange={(v) => dispatch(toggleThinking(v))} />
          </div>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              API Token（后端设置 GITHOT_API_TOKEN 时才需要）
            </Typography.Text>
            <Input.Password
              size="small"
              placeholder="Bearer token"
              value={token}
              onChange={(e) => setTokenState(e.target.value)}
              onBlur={() => setToken(token.trim())}
              style={{ marginTop: 4 }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>后端状态</span>
            <Space>
              <Tag color={backendOk === null ? 'default' : backendOk ? 'success' : 'error'}>
                {backendOk === null ? '检测中' : backendOk ? '在线' : '离线'}
              </Tag>
              <Button size="small" onClick={onCheck}>重试</Button>
            </Space>
          </div>
        </Space>
      }
    >
      <Button type="text" icon={<SettingOutlined />} />
    </Popover>
  )
}
