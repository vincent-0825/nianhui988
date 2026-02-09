import { Router, Response } from 'express';
import User from '../models/User';
import { auth, adminOnly, AuthRequest } from '../middleware/auth';
import { getSettings } from './settings';

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
    const userCount = users.length;
    const settings = await getSettings();
    const settledWineGlasses = settings.settledWineGlasses || 0;
    // 总奖池 = 参与人数 × 40万 + 已结算酒杯数 × 5万
    const totalPrizePool = userCount * 400000 + settledWineGlasses * 50000;
    return res.json({ users, totalPrizePool, userCount, settledWineGlasses });
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

// POST /api/user/:id/coins - 发放金币（管理员）
router.post('/:id/coins', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: '请输入有效的金币数量' });
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

export default router;
