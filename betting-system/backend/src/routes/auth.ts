import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { getSettings } from './settings';

const router = Router();

// POST /api/auth/login - 登录/注册
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: '请输入姓名' });
    }

    const trimmedName = name.trim();

    // 管理员登录
    if (trimmedName === 'admin') {
      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: '管理员密码错误' });
      }
      let admin = await User.findOne({ name: 'admin' });
      if (!admin) {
        admin = await User.create({
          name: 'admin',
          password: await bcrypt.hash(password, 10),
          isAdmin: true,
          coins: 999999999,
        });
      }
      const token = jwt.sign(
        { userId: admin._id, isAdmin: true },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: { _id: admin._id, name: admin.name, coins: admin.coins, wineGlasses: 0, rounds: 0, isAdmin: true },
      });
    }

    // 普通用户登录/自动注册
    let user = await User.findOne({ name: trimmedName });
    if (!user) {
      const settings = await getSettings();
      user = await User.create({ name: trimmedName, coins: settings.initialCoins });
    }

    const token = jwt.sign(
      { userId: user._id, isAdmin: false },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        _id: user._id, name: user.name, coins: user.coins,
        wineGlasses: user.wineGlasses, rounds: user.rounds, isAdmin: user.isAdmin,
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ message: '该姓名已被使用' });
    }
    return res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
