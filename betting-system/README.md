# 年会押注 H5 系统

年会实时押注互动游戏，支持多人手机同步参与。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + MongoDB + Socket.io
- **部署**: Docker + Docker Compose + Nginx

## 功能

- 员工输入姓名即可参与，新用户初始 20 万金币
- 管理员创建押注主题，设置多个选项
- 实时显示各选项赢率（押注金额占比）
- 最小押注 5 万，支持"全压"，每题限押一次
- 自动结算：输家金币进奖池，赢家按比例分配
- Socket.io 实时推送，多人同步

## 腾讯云一键部署

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | sh

# 2. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. 上传项目到服务器后运行
cd betting-system
docker-compose up -d

# 4. 访问 http://服务器IP
```

## 本地开发

```bash
# 启动 MongoDB
docker run -d -p 27017:27017 mongo:7

# 后端
cd backend
npm install
# 修改 .env 中 MONGODB_URI 为 mongodb://localhost:27017/betting
npm run dev

# 前端（新终端）
cd frontend
npm install
npm run dev
```

## 管理员账号

- 用户名: `admin`
- 密码: `admin123`

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录/注册 |
| GET | /api/user/profile | 获取用户信息 |
| GET | /api/user/all | 获取所有用户（管理员） |
| POST | /api/user/:id/coins | 发放金币（管理员） |
| GET | /api/themes | 获取所有主题 |
| POST | /api/themes | 创建主题（管理员） |
| DELETE | /api/themes/:id | 删除主题（管理员） |
| POST | /api/themes/:id/settle | 公布结果（管理员） |
| POST | /api/bets | 创建押注 |
| GET | /api/bets/theme/:id | 获取主题押注统计 |
