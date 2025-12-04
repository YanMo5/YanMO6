# 简易贴吧（Tieba Clone）

这是一个最小可运行的贴吧示例，使用 Node.js + Express + EJS，数据存储在 GitHub 上。

## 功能
- 查看板块
- 在板块内查看帖子
- 发新帖
- 回复帖子
- 自动保存数据到 GitHub（Vercel 部署时）

## 本地运行

```bash
cd f:\www\tieba
npm install
npm start
```

然后在浏览器打开 http://localhost:3000

数据文件位于 `data/db.json`。本地运行时，数据保存到本地文件。

## Vercel 部署

### 前置要求
1. GitHub 账号（用于存储数据）
2. Vercel 账号（已连接到 GitHub）
3. 个人访问令牌（Personal Access Token）

### 部署步骤

1. **创建 GitHub Personal Access Token**
   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token" (Classic)
   - 选择 `repo` 权限（允许读写仓库）
   - 复制生成的 token

2. **在 Vercel 中导入项目**
   - 访问 https://vercel.com/yanmos-projects
   - 点击 "Add New" → "Project"
   - 选择 GitHub 仓库 YanMO6
   - 点击 "Import"

3. **配置环境变量**
   在 Vercel 项目设置 → Environment Variables 中添加：
   ```
   GITHUB_TOKEN=<你的 GitHub Personal Access Token>
   GITHUB_OWNER=YanMo5
   GITHUB_REPO=YanMO6
   GITHUB_BRANCH=main
   ```

4. **配置自定义域名**
   - 在项目设置 → Domains 中
   - 点击 "Add Domain"
   - 输入 `wrx1.top`
   - 按照提示配置 DNS（CNAME 或 Nameservers）

5. **部署**
   - 点击 "Deploy"
   - Vercel 会自动从 GitHub pull 代码并部署
   - 用户创建的帖子会自动保存到 GitHub

### 工作原理

- 每当用户创建帖子或回复时，数据会：
  1. 保存到 Vercel 的临时文件系统（/tmp）
  2. 每 10 秒一次自动推送到 GitHub
  3. 下次部署时重新加载

### 局限性

- Vercel 的临时文件系统在函数调用结束后会被清除
- 频繁的数据写入可能导致 GitHub API 限流（一小时 60 次请求）
- 对于生产环境，建议改用数据库（Supabase / Postgres）

## 生产环境建议

如果需要更稳定的数据存储，可改用：
- **Vercel Postgres**（Vercel 原生集成）
- **Supabase**（免费 PostgreSQL）
- **MongoDB**（云托管）
