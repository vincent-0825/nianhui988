import { Router, Response } from 'express';
import Settings from '../models/Settings';
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

// GET /api/settings - 获取系统设置（所有用户可读）
router.get('/', auth, async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getSettings();
    return res.json(settings);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// PUT /api/settings - 更新系统设置（管理员）
router.put('/', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { initialCoins, minBet, maxBet, totalPrizePool } = req.body;
    const settings = await getSettings();

    if (initialCoins !== undefined) settings.initialCoins = initialCoins;
    if (minBet !== undefined) settings.minBet = minBet;
    if (maxBet !== undefined) settings.maxBet = maxBet;
    if (totalPrizePool !== undefined) {
      const oldTotal = settings.totalPrizePool;
      settings.totalPrizePool = totalPrizePool;
      // 重新计算当前奖池（如果增大了总额）
      if (totalPrizePool > oldTotal) {
        settings.currentPool += (totalPrizePool - oldTotal);
      }
      settings.gameOver = settings.currentPool <= 0;
    }

    await settings.save();
    (req as any).io?.emit('settingsUpdate', settings);
    return res.json(settings);
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

export { getSettings };
export default router;
