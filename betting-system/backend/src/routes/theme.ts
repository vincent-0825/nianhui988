import { Router, Response } from 'express';
import Theme from '../models/Theme';
import Bet from '../models/Bet';
import User from '../models/User';
import { auth, adminOnly, AuthRequest } from '../middleware/auth';
import { getSettings } from './settings';

const router = Router();

// GET /api/themes - 获取所有主题
router.get('/', auth, async (_req: AuthRequest, res: Response) => {
  try {
    const themes = await Theme.find().sort({ createdAt: -1 });
    return res.json(themes);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// POST /api/themes - 创建主题（管理员）
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
      options: options.map((name: string) => ({ name })),
    });
    (req as any).io?.emit('themeUpdate');
    return res.status(201).json(theme);
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// DELETE /api/themes/:id - 删除主题（管理员）
router.delete('/:id', auth, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ message: '主题不存在' });

    // 如果主题还没结算，退还所有押注
    if (theme.status === 'open') {
      const bets = await Bet.find({ themeId: theme._id });
      for (const bet of bets) {
        await User.findByIdAndUpdate(bet.userId, { $inc: { coins: bet.amount } });
      }
      await Bet.deleteMany({ themeId: theme._id });
    }

    await Theme.findByIdAndDelete(req.params.id);
    (req as any).io?.emit('themeUpdate');
    return res.json({ message: '已删除' });
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// 结算核心逻辑
async function settleTheme(themeId: string, winnerOptionId: string, io: any) {
  const theme = await Theme.findById(themeId);
  if (!theme) throw new Error('主题不存在');
  if (theme.status === 'closed') throw new Error('该主题已结算');

  const winnerOption = theme.options.find(o => o._id.toString() === winnerOptionId);
  if (!winnerOption) throw new Error('选项不存在');

  const allBets = await Bet.find({ themeId: theme._id });
  const winnerBets = allBets.filter(b => b.optionId.toString() === winnerOptionId);
  const loserBets = allBets.filter(b => b.optionId.toString() !== winnerOptionId);

  // 计算奖励池（输家的押注总额）
  const prizePool = loserBets.reduce((sum, b) => sum + b.amount, 0);
  const winnerTotalBet = winnerBets.reduce((sum, b) => sum + b.amount, 0);

  // 结算：赢家退还押注 + 按比例分配奖励池
  for (const bet of winnerBets) {
    const ratio = winnerTotalBet > 0 ? bet.amount / winnerTotalBet : 0;
    const reward = Math.floor(bet.amount + prizePool * ratio);
    await User.findByIdAndUpdate(bet.userId, { $inc: { coins: reward } });
  }

  // 如果没有赢家，退还所有人的押注
  if (winnerBets.length === 0) {
    for (const bet of loserBets) {
      await User.findByIdAndUpdate(bet.userId, { $inc: { coins: bet.amount } });
    }
  }

  // 从总奖池中扣除（输家损失的金币从系统总奖池中减少）
  const settings = await getSettings();
  if (allBets.length > 0) {
    // 总奖池减少 = 输家损失的金额（即奖励池金额）
    // 赢家之间的金币流转不影响总奖池，只有输家的损失从总奖池扣除
    settings.currentPool -= prizePool;
    if (settings.currentPool <= 0) {
      settings.currentPool = 0;
      settings.gameOver = true;
    }
    await settings.save();
  }

  // 更新主题状态
  theme.status = 'closed';
  theme.winnerOptionId = winnerOption._id;
  await theme.save();

  io?.emit('themeUpdate');
  io?.emit('settled', { themeId: theme._id });
  if (settings.gameOver) {
    io?.emit('gameOver');
  }
  io?.emit('settingsUpdate', settings);

  return {
    message: '结算完成',
    prizePool,
    winnerCount: winnerBets.length,
    loserCount: loserBets.length,
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
