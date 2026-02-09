import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import themeRoutes from './routes/theme';
import betRoutes from './routes/bet';
import settingsRoutes from './routes/settings';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// 将 io 实例注入到 request
app.use((req, _res, next) => {
  (req as any).io = io;
  next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/settings', settingsRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 生产环境：提供前端静态文件
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Socket.io 连接
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  socket.on('disconnect', () => {
    console.log('用户断开:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/betting';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB 连接成功');
    httpServer.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB 连接失败:', err);
    process.exit(1);
  });
