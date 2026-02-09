import { Router, Response } from 'express';
import User from '../models/User';
import Bet from '../models/Bet';
import { auth, adminOnly, AuthRequest } from '../middleware/auth';
import { calcPrizePool } from './settings';

const router = Router();

// GET /api/user/profile
router.get('/profile', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: '用户不存在' });
    return res.json(user);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// GET /api/user/leaderboard - 排行榜（所有用户可访问）
router.get('/leaderboard', auth, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ isAdmin: false })
      .select('name coins wineGlasses rounds')
      .sort({ coins: -1 });
    // 总奖池 = 当前所有用户金币总和
    const totalPrizePool = await calcPrizePool();
    return res.json({ users, totalPrizePool, userCount: users.length });
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// GET /api/user/all - 获取所有用户（管理员）
router.get('/all', auth, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ isAdmin: false }).select('-password').sort({ coins: -1 });
    return res.json(users);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// POST /api/user/:id/coins - 发放/扣减金币（管理员）
router.post('/:id/coins', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || typeof amount !== 'number' || amount === 0) {
      return res.status(400).json({ message: '请输入有效的金币数量' });
    }
    // 扣减时检查余额
    if (amount < 0) {
      const current = await User.findById(req.params.id);
      if (!current) return res.status(404).json({ message: '用户不存在' });
      if (current.coins + amount < 0) {
        return res.status(400).json({ message: `余额不足，当前金币: ${current.coins}` });
      }
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { coins: amount } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: '用户不存在' });
    return res.json(user);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// DELETE /api/user/:id - 删除用户（管理员）
router.delete('/:id', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.isAdmin) return res.status(400).json({ message: '不能删除管理员' });

    // 删除用户的所有押注
    await Bet.deleteMany({ userId: user._id });
    // 删除用户
    await User.findByIdAndDelete(req.params.id);

    // 推送更新：奖池 = 当前用户金币总和
    const io = (req as any).io;
    const dynamicPrizePool = await calcPrizePool();
    io?.emit('settingsUpdate', { totalPrizePool: dynamicPrizePool, currentPool: dynamicPrizePool });

    return res.json({ message: '用户已删除' });
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
