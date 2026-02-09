import { Router, Response } from 'express';
import Theme from '../models/Theme';
import Bet from '../models/Bet';
import User from '../models/User';
import { auth, adminOnly, AuthRequest } from '../middleware/auth';
import { getSettings, calcPrizePool } from './settings';

const router = Router();

// GET /api/themes - 获取主题（用户只看open/closed，管理员看全部）
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const filter = req.isAdmin ? {} : { status: { $in: ['open', 'closed'] } };
    const themes = await Theme.find(filter).sort({ createdAt: -1 });
    return res.json(themes);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// GET /api/themes/all - 管理员获取全部主题（包括pending）
router.get('/all', auth, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const themes = await Theme.find().sort({ createdAt: -1 });
    return res.json(themes);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// POST /api/themes - 创建主题（管理员，默认pending状态）
router.post('/', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, options, settlementMode } = req.body;
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: '请填写标题和至少两个选项' });
    }
    const theme = await Theme.create({
      title,
      description: description || '',
      settlementMode: settlementMode || 'admin',
      status: 'pending',
      options: options.map((name: string) => ({ name })),
    });
    (req as any).io?.emit('themeUpdate');
    return res.status(201).json(theme);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// PUT /api/themes/:id - 修改主题标题和选项（管理员）
router.put('/:id', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ message: '主题不存在' });

    const { title, description, options } = req.body;
    if (title !== undefined) theme.title = title;
    if (description !== undefined) theme.description = description;
    if (options && Array.isArray(options)) {
      // 更新现有选项的名称，支持新增选项
      theme.options = options.map((opt: any) => {
        if (opt._id) {
          // 保留原有 _id
          return { _id: opt._id, name: opt.name };
        }
        return { name: opt.name };
      });
    }

    await theme.save();
    (req as any).io?.emit('themeUpdate');
    return res.json(theme);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// POST /api/themes/:id/start - 开始主题（pending → open）
router.post('/:id/start', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ message: '主题不存在' });
    if (theme.status !== 'pending') return res.status(400).json({ message: '只能开始未开始的主题' });

    theme.status = 'open';
    await theme.save();
    (req as any).io?.emit('themeUpdate');
    return res.json(theme);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// DELETE /api/themes/:id - 删除主题（管理员，完整回滚所有用户变化）
router.delete('/:id', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ message: '主题不存在' });

    const bets = await Bet.find({ themeId: theme._id });
    const coinBets = bets.filter(b => !b.useWineGlass);
    const wineGlassBets = bets.filter(b => b.useWineGlass);

    if (theme.status === 'open') {
      // 退还金币押注
      for (const bet of coinBets) {
        await User.findByIdAndUpdate(bet.userId, { $inc: { coins: bet.amount } });
      }
      // 减少酒杯计数
      for (const bet of wineGlassBets) {
        await User.findByIdAndUpdate(bet.userId, { $inc: { wineGlasses: -1 } });
      }
      // 减少参与轮次
      for (const bet of bets) {
        await User.findByIdAndUpdate(bet.userId, { $inc: { rounds: -1 } });
      }
    } else if (theme.status === 'closed') {
      // 回滚结算：逆向计算结算时给予的奖励
      const winnerOptionId = theme.winnerOptionId?.toString();
      const winnerCoinBets = coinBets.filter(b => b.optionId.toString() === winnerOptionId);
      const loserCoinBets = coinBets.filter(b => b.optionId.toString() !== winnerOptionId);

      const loserPool = loserCoinBets.reduce((sum, b) => sum + b.amount, 0);
      const winnerTotalBet = winnerCoinBets.reduce((sum, b) => sum + b.amount, 0);

      // 回滚金币赢家的奖励（退还押注+分得的奖池）
      for (const bet of winnerCoinBets) {
        const ratio = winnerTotalBet > 0 ? bet.amount / winnerTotalBet : 0;
        const reward = Math.floor(bet.amount + loserPool * ratio);
        await User.findByIdAndUpdate(bet.userId, { $inc: { coins: -reward } });
      }

      // 如果没有金币赢家，结算时退还了输家的押注，需要扣回
      if (winnerCoinBets.length === 0 && loserCoinBets.length > 0) {
        for (const bet of loserCoinBets) {
          await User.findByIdAndUpdate(bet.userId, { $inc: { coins: -bet.amount } });
        }
      }

      // 退还所有金币押注（回到押注前的状态）
      for (const bet of coinBets) {
        await User.findByIdAndUpdate(bet.userId, { $inc: { coins: bet.amount } });
      }

      // 回滚酒杯赢家的5万金币奖励
      const wineGlassWinners = wineGlassBets.filter(b => b.optionId.toString() === winnerOptionId);
      for (const bet of wineGlassWinners) {
        await User.findByIdAndUpdate(bet.userId, { $inc: { coins: -50000 } });
      }

      // 减少酒杯计数
      for (const bet of wineGlassBets) {
        await User.findByIdAndUpdate(bet.userId, { $inc: { wineGlasses: -1 } });
      }

      // 减少参与轮次
      for (const bet of bets) {
        await User.findByIdAndUpdate(bet.userId, { $inc: { rounds: -1 } });
      }

      // 回滚settledWineGlasses
      if (wineGlassBets.length > 0) {
        const settings = await getSettings();
        settings.settledWineGlasses = Math.max(0, (settings.settledWineGlasses || 0) - wineGlassBets.length);
        await settings.save();
      }
    }

    // 删除所有相关押注和主题
    await Bet.deleteMany({ themeId: theme._id });
    await Theme.findByIdAndDelete(req.params.id);

    // 推送更新
    const io = (req as any).io;
    io?.emit('themeUpdate');
    const settings = await getSettings();
    const dynamicPrizePool = await calcPrizePool();
    io?.emit('settingsUpdate', {
      ...settings.toObject(),
      totalPrizePool: dynamicPrizePool,
      currentPool: dynamicPrizePool,
    });

    return res.json({ message: '已删除' });
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// GET /api/themes/:id/wine-glass-stats - 获取主题酒杯统计
router.get('/:id/wine-glass-stats', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const bets = await Bet.find({ themeId: req.params.id, useWineGlass: true })
      .populate('userId', 'name');
    // 按用户聚合酒杯数
    const userMap = new Map<string, { name: string; count: number }>();
    for (const bet of bets) {
      const u = bet.userId as any;
      const userId = u._id.toString();
      if (userMap.has(userId)) {
        userMap.get(userId)!.count += 1;
      } else {
        userMap.set(userId, { name: u.name || '未知', count: 1 });
      }
    }
    const stats = Array.from(userMap.values()).sort((a, b) => b.count - a.count);
    return res.json({ stats, total: bets.length });
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// 结算核心逻辑
async function settleTheme(themeId: string, winnerOptionId: string, io: any) {
  const theme = await Theme.findById(themeId);
  if (!theme) throw new Error('主题不存在');
  if (theme.status === 'closed') throw new Error('该主题已结算');
  if (theme.status === 'pending') throw new Error('主题尚未开始');

  const winnerOption = theme.options.find(o => o._id.toString() === winnerOptionId);
  if (!winnerOption) throw new Error('选项不存在');

  const allBets = await Bet.find({ themeId: theme._id });

  // 分离金币押注和酒杯押注
  const coinBets = allBets.filter(b => !b.useWineGlass);
  const wineGlassBets = allBets.filter(b => b.useWineGlass);

  // === 金币押注结算 ===
  const winnerCoinBets = coinBets.filter(b => b.optionId.toString() === winnerOptionId);
  const loserCoinBets = coinBets.filter(b => b.optionId.toString() !== winnerOptionId);

  const prizePool = loserCoinBets.reduce((sum, b) => sum + b.amount, 0);
  const winnerTotalBet = winnerCoinBets.reduce((sum, b) => sum + b.amount, 0);

  // 赢家退还押注 + 按比例分配输家的押注
  for (const bet of winnerCoinBets) {
    const ratio = winnerTotalBet > 0 ? bet.amount / winnerTotalBet : 0;
    const reward = Math.floor(bet.amount + prizePool * ratio);
    await User.findByIdAndUpdate(bet.userId, { $inc: { coins: reward } });
  }

  // 如果没有金币赢家，退还所有金币输家的押注
  if (winnerCoinBets.length === 0 && loserCoinBets.length > 0) {
    for (const bet of loserCoinBets) {
      await User.findByIdAndUpdate(bet.userId, { $inc: { coins: bet.amount } });
    }
  }

  // === 酒杯押注结算 ===
  const wineGlassWinners = wineGlassBets.filter(b => b.optionId.toString() === winnerOptionId);
  // 酒杯赢家获得5万金币
  for (const bet of wineGlassWinners) {
    await User.findByIdAndUpdate(bet.userId, { $inc: { coins: 50000 } });
  }

  // 记录已结算酒杯数
  const settings = await getSettings();
  if (wineGlassBets.length > 0) {
    settings.settledWineGlasses = (settings.settledWineGlasses || 0) + wineGlassBets.length;
    await settings.save();
  }

  // 更新主题状态
  theme.status = 'closed';
  theme.winnerOptionId = winnerOption._id;
  await theme.save();

  // 计算动态奖池并推送
  const dynamicPrizePool = await calcPrizePool();
  const settingsData = {
    ...settings.toObject(),
    totalPrizePool: dynamicPrizePool,
    currentPool: dynamicPrizePool,
  };

  io?.emit('themeUpdate');
  io?.emit('settled', { themeId: theme._id });
  io?.emit('settingsUpdate', settingsData);

  const winnerBets = allBets.filter(b => b.optionId.toString() === winnerOptionId);
  const loserBets = allBets.filter(b => b.optionId.toString() !== winnerOptionId);

  return {
    message: '结算完成',
    prizePool,
    winnerCount: winnerBets.length,
    loserCount: loserBets.length,
    wineGlassCount: wineGlassBets.length,
    winnerOptionName: winnerOption.name,
    gameOver: settings.gameOver,
  };
}

// POST /api/themes/:id/settle - 管理员选择结果结算
router.post('/:id/settle', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { winnerOptionId } = req.body;
    if (!winnerOptionId) {
      return res.status(400).json({ message: '请选择获胜选项' });
    }
    const result = await settleTheme(req.params.id, winnerOptionId, (req as any).io);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message || '服务器错误' });
  }
});

// POST /api/themes/:id/random-settle - 系统随机开奖
router.post('/:id/random-settle', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ message: '主题不存在' });
    if (theme.status === 'closed') return res.status(400).json({ message: '该主题已结算' });
    if (theme.status === 'pending') return res.status(400).json({ message: '主题尚未开始' });

    // 随机选择一个选项
    const randomIndex = Math.floor(Math.random() * theme.options.length);
    const winnerOptionId = theme.options[randomIndex]._id.toString();

    const result = await settleTheme(req.params.id, winnerOptionId, (req as any).io);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message || '服务器错误' });
  }
});

export default router;
