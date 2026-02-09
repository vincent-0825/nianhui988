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
- 最小押注 5 万，支持"全压"，余额不足最低投注自动 all-in
- 金币为 0 时进入酒杯模式（固定 5 万虚拟押注）
- 自动结算：输家金币进奖池，赢家按比例分配
- Socket.io 实时推送，多人同步
- 中英文双语切换

---

## 一、服务器环境准备

### 1.1 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker
```

### 1.2 安装 Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证
docker-compose --version
```

### 1.3 安装 Git

```bash
# CentOS / RHEL
yum install -y git

# Ubuntu / Debian
apt install -y git
```

---

## 二、首次部署

### 2.1 克隆代码到服务器

```bash
cd ~
git clone <你的仓库地址> nianhui988
```

### 2.2 启动服务

```bash
cd ~/nianhui988/betting-system
docker-compose up -d --build
```

启动后会运行 3 个容器：
- **mongo** - MongoDB 数据库
- **app** - Node.js 后端（端口 3000）
- **nginx** - Nginx 反向代理（端口 80）

### 2.3 验证服务

```bash
# 查看容器状态
docker-compose ps

# 应看到 3 个容器均为 Up 状态
```

访问 `http://服务器IP` 即可使用。

---

## 三、更新部署

当代码有更新时，在服务器上执行：

```bash
cd ~/nianhui988/betting-system

# 拉取最新代码
git pull origin main

# 重新构建并启动（不影响数据库数据）
docker-compose up -d --build
```

---

## 四、日常维护指令

### 4.1 容器管理

```bash
cd ~/nianhui988/betting-system

# 查看所有容器状态
docker-compose ps

# 查看实时日志（所有服务）
docker-compose logs -f

# 查看后端日志
docker-compose logs -f app

# 查看 Nginx 日志
docker-compose logs -f nginx

# 查看 MongoDB 日志
docker-compose logs -f mongo

# 重启所有服务
docker-compose restart

# 仅重启后端
docker-compose restart app

# 停止所有服务（不删除数据）
docker-compose stop

# 启动已停止的服务
docker-compose start

# 停止并移除容器（数据卷保留）
docker-compose down

# 停止并移除容器 + 删除数据卷（⚠️ 会清空数据库）
docker-compose down -v
```

### 4.2 数据库操作

```bash
# 进入 MongoDB 容器
docker-compose exec mongo mongosh betting

# 查看所有用户
db.users.find().pretty()

# 查看所有主题
db.themes.find().pretty()

# 查看所有押注
db.bets.find().pretty()

# 查看系统设置
db.settings.find().pretty()

# 查看指定用户
db.users.findOne({ name: "张三" })

# 手动修改用户金币
db.users.updateOne({ name: "张三" }, { $set: { coins: 200000 } })

# 重置所有用户金币为 20 万
db.users.updateMany({ isAdmin: false }, { $set: { coins: 200000, wineGlasses: 0, rounds: 0 } })

# 删除所有押注记录
db.bets.deleteMany({})

# 删除所有主题
db.themes.deleteMany({})

# 查看用户数量
db.users.countDocuments()

# 退出 mongosh
exit
```

### 4.3 数据库备份与恢复

```bash
# 备份数据库到宿主机
docker-compose exec mongo mongodump --db betting --out /tmp/backup
docker cp $(docker-compose ps -q mongo):/tmp/backup ./backup_$(date +%Y%m%d)

# 恢复数据库
docker cp ./backup_20250209 $(docker-compose ps -q mongo):/tmp/restore
docker-compose exec mongo mongorestore --db betting /tmp/restore/betting --drop
```

### 4.4 磁盘空间清理

```bash
# 查看 Docker 磁盘占用
docker system df

# 清理无用的镜像、容器、网络
docker system prune -f

# 清理无用的镜像（包括悬空镜像）
docker image prune -a -f
```

---

## 五、环境变量配置

环境变量在 `docker-compose.yml` 中配置：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 后端服务端口 |
| `MONGODB_URI` | `mongodb://mongo:27017/betting` | MongoDB 连接地址 |
| `JWT_SECRET` | `betting-system-jwt-secret-2024` | JWT 签名密钥 |
| `ADMIN_PASSWORD` | `admin123` | 管理员密码 |

修改后需重新启动：

```bash
docker-compose up -d --build
```

---

## 六、管理员操作

### 6.1 登录

- 用户名: `admin`
- 密码: `admin123`（可在 docker-compose.yml 中修改）

### 6.2 管理功能

- **创建主题**: 设置标题 + 多个选项，默认为"未开始"状态
- **开始主题**: 将主题状态从"未开始"变为"进行中"，用户可开始押注
- **编辑主题**: 修改主题标题和选项
- **结算主题**: 选择获胜选项，系统自动分配奖池
- **随机开奖**: 系统随机选择获胜选项
- **删除主题**: 完整回滚所有用户的金币/酒杯变化
- **发放金币**: 给指定用户增加金币
- **修改设置**: 调整初始金币、最低/最高押注金额

---

## 七、本地开发

```bash
# 启动 MongoDB
docker run -d -p 27017:27017 --name mongo-dev mongo:7

# 后端
cd backend
npm install
# 确保 .env 中 MONGODB_URI=mongodb://localhost:27017/betting
npm run dev    # 启动开发服务器（热重载），端口 3000

# 前端（新终端）
cd frontend
npm install
npm run dev    # 启动 Vite 开发服务器，端口 5173
```

---

## 八、项目结构

```
betting-system/
├── docker-compose.yml      # Docker Compose 编排
├── Dockerfile              # 多阶段构建（前端+后端）
├── nginx.conf              # Nginx 反向代理配置
├── backend/
│   ├── .env                # 环境变量
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts       # 入口文件
│       ├── middleware/
│       │   └── auth.ts     # JWT 认证中间件
│       ├── models/
│       │   ├── User.ts     # 用户模型
│       │   ├── Theme.ts    # 主题模型
│       │   ├── Bet.ts      # 押注模型
│       │   └── Settings.ts # 系统设置模型
│       └── routes/
│           ├── auth.ts     # 登录/注册
│           ├── user.ts     # 用户管理
│           ├── theme.ts    # 主题管理+结算
│           ├── bet.ts      # 押注操作
│           └── settings.ts # 系统设置
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx         # 根组件（路由+导航）
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── HomePage.tsx      # 主页（押注界面）
        │   ├── AdminPage.tsx     # 管理员后台
        │   ├── LeaderboardPage.tsx # 排行榜
        │   └── RulesModal.tsx    # 规则弹窗
        └── services/
            ├── api.ts      # Axios API 封装
            ├── socket.ts   # Socket.io 客户端
            └── i18n.ts     # 国际化（中/英）
```

---

## 九、API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录/注册 |
| GET | `/api/user/profile` | 获取用户信息 |
| GET | `/api/user/all` | 获取所有用户（管理员） |
| POST | `/api/user/:id/coins` | 发放金币（管理员） |
| GET | `/api/themes` | 获取所有主题 |
| GET | `/api/themes/all` | 获取全部主题含未开始（管理员） |
| POST | `/api/themes` | 创建主题（管理员） |
| PUT | `/api/themes/:id` | 修改主题（管理员） |
| DELETE | `/api/themes/:id` | 删除主题并回滚（管理员） |
| POST | `/api/themes/:id/start` | 开始主题（管理员） |
| POST | `/api/themes/:id/settle` | 结算主题（管理员） |
| POST | `/api/themes/:id/random-settle` | 随机开奖（管理员） |
| POST | `/api/bets` | 创建押注 |
| POST | `/api/bets/skip` | 跳过本轮 |
| GET | `/api/bets/theme/:id` | 获取主题押注统计 |
| GET | `/api/settings` | 获取系统设置 |
| PUT | `/api/settings` | 修改系统设置（管理员） |
| POST | `/api/settings/reset-pool` | 重置奖池（管理员） |

---

## 十、常见问题排查

### 服务无法访问

```bash
# 检查容器是否运行
docker-compose ps

# 检查端口是否被占用
netstat -tlnp | grep 80

# 检查防火墙
firewall-cmd --list-ports        # CentOS
ufw status                       # Ubuntu
```

### 容器启动失败

```bash
# 查看详细错误日志
docker-compose logs app

# 重新构建
docker-compose down
docker-compose up -d --build
```

### 数据库连接失败

```bash
# 检查 MongoDB 容器
docker-compose logs mongo

# 进入 mongo 容器测试连接
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

### 清空所有数据重新开始

```bash
cd ~/nianhui988/betting-system

# 停止并删除所有数据
docker-compose down -v

# 重新启动
docker-compose up -d --build
```
