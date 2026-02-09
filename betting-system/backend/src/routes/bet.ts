import { Router, Response } from 'express';
import Bet from '../models/Bet';
import Theme from '../models/Theme';
import User from '../models/User';
import { auth, AuthRequest } from '../middleware/auth';
import { getSettings } from './settings';

const router = Router();

// POST /api/bets - 创建押注
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { themeId, optionId, amount } = req.body;
    const settings = await getSettings();

    if (settings.gameOver) {
      return res.status(400).json({ message: '游戏已结束，总奖池已归零' });
    }

    if (!themeId || !optionId || !amount) {
      return res.status(400).json({ message: '参数不完整' });
    }
    if (typeof amount !== 'number' || amount < settings.minBet) {
      return res.status(400).json({ message: `最小押注${settings.minBet / 10000}万金币` });
    }
    if (amount > settings.maxBet) {
      return res.status(400).json({ message: `最大押注${settings.maxBet / 10000}万金币` });
    }

    // 检查主题状态
    const theme = await Theme.findById(themeId);
    if (!theme) return res.status(404).json({ message: '主题不存在' });
    if (theme.status !== 'open') return res.status(400).json({ message: '该主题已关闭' });

    // 检查选项是否存在
    const option = theme.options.find(o => o._id.toString() === optionId);
    if (!option) return res.status(400).json({ message: '选项不存在' });

    // 检查是否已经押注过
    const existing = await Bet.findOne({ userId: req.userId, themeId });
    if (existing) return res.status(400).json({ message: '每个主题只能押注一次' });

    // 检查金币是否足够
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    let useWineGlass = false;

    if (user.coins >= amount) {
      // 正常扣除金币
      user.coins -= amount;
    } else if (user.coins === 0) {
      // 金币为0，使用酒杯计数
      useWineGlass = true;
      const glassCount = Math.ceil(amount / settings.minBet);
      user.wineGlasses += glassCount;
    } else {
      return res.status(400).json({ message: '金币不足，金币归零后可用酒杯参与' });
    }

    // 增加参与轮次
    user.rounds += 1;
    await user.save();

    const bet = await Bet.create({
      userId: req.userId,
      themeId,
      optionId,
      amount,
    });

    // 实时推送押注更新
    (req as any).io?.emit('betUpdate', { themeId });

    return res.status(201).json({
      bet,
      remainingCoins: user.coins,
      wineGlasses: user.wineGlasses,
      useWineGlass,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ message: '每个主题只能押注一次' });
    }
    return res.status(500).json({ message: '服务器错误' });
  }
});

// POST /api/bets/skip - 跳过本轮
router.post('/skip', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.body;
    if (!themeId) return res.status(400).json({ message: '参数不完整' });

    const theme = await Theme.findById(themeId);
    if (!theme) return res.status(404).json({ message: '主题不存在' });

    return res.json({ message: '已跳过本轮' });
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

// GET /api/bets/theme/:id - 获取主题押注统计
router.get('/theme/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const bets = await Bet.find({ themeId: req.params.id }).populate('userId', 'name');
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ message: '主题不存在' });

    const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);

    // 按选项分组统计
    const stats = theme.options.map(option => {
      const optionBets = bets.filter(b => b.optionId.toString() === option._id.toString());
      const optionTotal = optionBets.reduce((sum, b) => sum + b.amount, 0);
      return {
        optionId: option._id,
        optionName: option.name,
        totalAmount: optionTotal,
        betCount: optionBets.length,
        winRate: totalAmount > 0 ? Math.round((optionTotal / totalAmount) * 10000) / 100 : 0,
        bets: optionBets.map(b => ({
          userName: (b.userId as any)?.name || '未知',
          amount: b.amount,
        })),
      };
    });

    // 当前用户的押注
    const myBet = bets.find(b => (b.userId as any)?._id?.toString() === req.userId);

    return res.json({ stats, totalAmount, myBet: myBet || null });
  } catch {
    return res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
