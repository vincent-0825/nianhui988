import { Router, Response } from 'express';
import Settings from '../models/Settings';
import User from '../models/User';
import { auth, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// 获取或创建默认设置
async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

// 动态计算总奖池：当前所有用户金币总和
async function calcPrizePool() {
  const result = await User.aggregate([
    { $match: { isAdmin: false } },
    { $group: { _id: null, total: { $sum: '$coins' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
}

// GET /api/settings - 获取系统设置（所有用户可读）
router.get('/', auth, async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getSettings();
    const dynamicPrizePool = await calcPrizePool();
    return res.json({
      ...settings.toObject(),
      totalPrizePool: dynamicPrizePool,
      currentPool: dynamicPrizePool,
    });
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// PUT /api/settings - 更新系统设置（管理员）
router.put('/', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { initialCoins, minBet, maxBet } = req.body;
    const settings = await getSettings();

    if (initialCoins !== undefined) settings.initialCoins = initialCoins;
    if (minBet !== undefined) settings.minBet = minBet;
    if (maxBet !== undefined) settings.maxBet = maxBet;

    await settings.save();
    const dynamicPrizePool = await calcPrizePool();
    const result = {
      ...settings.toObject(),
      totalPrizePool: dynamicPrizePool,
      currentPool: dynamicPrizePool,
    };
    (req as any).io?.emit('settingsUpdate', result);
    return res.json(result);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// POST /api/settings/reset-pool - 重置奖池（管理员）
router.post('/reset-pool', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getSettings();
    settings.currentPool = settings.totalPrizePool;
    settings.gameOver = false;
    await settings.save();
    (req as any).io?.emit('settingsUpdate', settings);
    (req as any).io?.emit('gameResume');
    return res.json(settings);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

export { getSettings, calcPrizePool };
export default router;
