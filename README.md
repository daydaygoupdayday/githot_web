# githot-web · 网页端

`githot` GitHub 热榜 Agent 的 Web 界面：多轮流式对话 + 公众号文章生成。
本仓库是**前端**，所有功能都通过 HTTP/SSE 调用后端 [githot](https://github.com/daydaygoupdayday/githot) 仓库里的接口——**后端入口：https://github.com/daydaygoupdayday/githot**。

> A React web UI for the [githot](https://github.com/daydaygoupdayday/githot) GitHub trending-repos agent: streaming multi-turn chat and WeChat article generation. The backend lives in the [githot](https://github.com/daydaygoupdayday/githot) repo.

---

## 功能页面 / Pages

| 页面 | 功能 |
| --- | --- |
| 💬 **热榜对话** | 多会话管理（localStorage 持久化）、逐字流式气泡、工具调用折叠可视化（参数/结果/状态）、模型思考过程展示、随时停止、一键清空、建议问题快捷入口 |
| ✍️ **生成文章** | 完整参数表单（榜单/天数/语言/最低星/条数/风格/字数）、真实数据区表格核对（仓库名/星数/链接以接口 `meta` 事件为准）、逐字流式 Markdown 预览、复制全文 / 下载 `.md` |
| ⚙️ **设置** | API Token（后端开启鉴权时填）、思考过程开关、后端在线状态探测 |

## 技术栈 / Stack

[Vite](https://vitejs.dev) · [React 18](https://react.dev) · [Ant Design v5](https://ant.design) · [Tailwind CSS](https://tailwindcss.com) · [Redux Toolkit](https://redux-toolkit.js.org) · [axios](https://axios-http.com) · react-markdown（SSE 用原生 `fetch` 读流，见 `src/api/client.js`）

## 目录结构 / Structure

```
web/
├── index.html               # 入口 HTML
├── vite.config.js           # dev server：/api 与 /health 代理到 127.0.0.1:8000
├── tailwind.config.js       # 关闭 preflight，避免与 antd 样式冲突
├── package.json
└── src/
    ├── main.jsx             # Provider / ConfigProvider / Router 装配
    ├── App.jsx              # 布局 + 菜单 + 路由 + 后端探活
    ├── api/
    │   ├── client.js        # axios 实例 + ssePost()：POST-SSE 手动解析
    │   ├── chatStream.js    # 对话 thunk：SSE 事件 → chatSlice
    │   └── articleStream.js # 文章 thunk：SSE 事件 → articleSlice
    ├── store/
    │   ├── store.js         # configureStore
    │   ├── chatSlice.js     # 会话/消息（含持久化）
    │   ├── articleSlice.js  # 文章参数与生成状态机
    │   └── settingsSlice.js # 思考开关等
    ├── pages/
    │   ├── ChatPage.jsx     # 对话页
    │   └── ArticlePage.jsx  # 文章页
    └── components/
        ├── MessageBubble.jsx    # 消息渲染（Markdown/工具卡/思考卡）
        └── SettingsPopover.jsx  # 顶栏设置气泡
```

## 快速开始 / Quick Start

前端不独立工作，**先启动后端**（接口与配置详见 [githot 仓库 README](https://github.com/daydaygoupdayday/githot) 的「HTTP/SSE 接口与网页端」一节）：

```bash
# ① 后端：FastAPI + SSE，默认 :8000
git clone https://github.com/daydaygoupdayday/githot.git
cd githot
pip install -r requirements.txt
python api/sse_api.py
```

```bash
# ② 前端：Vite dev server，默认 :5173（本仓库）
git clone https://github.com/daydaygoupdayday/githot_web.git
cd githot_web
npm install
npm run dev
```

打开 **http://localhost:5173** 即可。左侧栏底部会显示后端在线状态；若显示"离线"，先确认后端已在 8000 端口运行。

生产构建：`npm run build`（产物在 `dist/`，可用任意静态服务器托管，注意把 `/api` 反代到后端）。

## 与后端的对接 / Backend Contract

- 所有请求走 `/api/*`，由 `vite.config.js` 代理到 `http://127.0.0.1:8000`（部署时换成你自己的反向代理）。
- 对话：`POST /api/chat/stream`，事件 `meta → tool_call → tool_result → token → final → done`（出错 `error`）。
- 文章：`POST /api/article/stream`，事件 `meta`（口径 + 真实仓库条目）`→ token → done`。页面上方表格直接渲染 `meta.items`，**正文里的仓库事实以表格为准**。
- 会话 `thread_id` 由前端生成（`web-<会话id>`），多轮记忆在后端 checkpointer；后端重启后历史清空。
- 后端设置 `GITHOT_API_TOKEN` 后，在页面右上角「设置」里填同名 token。

## 常见问题 / FAQ

- **发送后报"请求失败"**：多半是后端没启动，看左侧"后端 在线/离线"标签。
- **端口 5173 被占用**：Vite 会自动换端口，以终端里打印的实际地址为准；代理目标仍是 8000，不受影响。
- **想要接口细节 / curl 示例 / 环境变量**：见 [githot 仓库 README](https://github.com/daydaygoupdayday/githot) 与后端在线文档 http://127.0.0.1:8000/docs 。
