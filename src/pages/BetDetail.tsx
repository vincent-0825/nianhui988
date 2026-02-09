import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Coins, Users, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { themeStorage, optionStorage, recordStorage, userStorage, calculateWinRates, GAME_CONFIG } from '@/services/storage';
import type { BetTheme, BetOption } from '@/types';

interface BetDetailProps {
  user: { id: string; name: string; coins: number };
  themeId: string;
  onBack: () => void;
  onUpdateUser: (user: any) => void;
}

interface OptionWithStats extends BetOption {
  totalAmount: number;
  betCount: number;
  winRate: number;
}

interface ThemeDetails extends BetTheme {
  options: OptionWithStats[];
  totalAmount: number;
  totalBets: number;
  userBet?: { optionId: string; amount: number };
}

export default function BetDetail({ user, themeId, onBack, onUpdateUser }: BetDetailProps) {
  const [theme, setTheme] = useState<ThemeDetails | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(GAME_CONFIG.MIN_BET_AMOUNT);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultMessage, setResultMessage] = useState({ type: 'success', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadThemeDetails();
  }, [themeId, user.id]);

  const loadThemeDetails = () => {
    const themeData = themeStorage.getById(themeId);
    if (!themeData) return;

    const options = optionStorage.getByThemeId(themeId);
    const records = recordStorage.getByThemeId(themeId);
    const winRates = calculateWinRates(themeId);

    const optionsWithStats: OptionWithStats[] = options.map(option => {
      const stats = recordStorage.getOptionStats(option.id);
      return {
        ...option,
        ...stats,
        winRate: winRates.get(option.id) || 0,
      };
    });

    const userBetRecord = records.find(r => r.userId === user.id);

    setTheme({
      ...themeData,
      options: optionsWithStats,
      totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
      totalBets: records.length,
      userBet: userBetRecord ? { optionId: userBetRecord.optionId, amount: userBetRecord.amount } : undefined,
    });

    if (userBetRecord) {
      setSelectedOption(userBetRecord.optionId);
    }
  };

  const handleBet = () => {
    if (!selectedOption || betAmount <= 0) return;
    setShowConfirmDialog(true);
  };

  const confirmBet = () => {
    if (!selectedOption || !theme) return;

    setLoading(true);

    // 检查用户金币是否足够
    if (user.coins < betAmount) {
      setResultMessage({ type: 'error', message: '金币不足！' });
      setShowResultDialog(true);
      setShowConfirmDialog(false);
      setLoading(false);
      return;
    }

    // 检查用户是否已押注
    const existingBet = recordStorage.getByUserAndTheme(user.id, themeId);
    if (existingBet) {
      setResultMessage({ type: 'error', message: '您已经押注过了！' });
      setShowResultDialog(true);
      setShowConfirmDialog(false);
      setLoading(false);
      return;
    }

    // 扣除金币并创建押注记录
    const success = userStorage.deductCoins(user.id, betAmount);
    if (success) {
      recordStorage.create({
        userId: user.id,
        themeId,
        optionId: selectedOption,
        amount: betAmount,
      });

      // 更新用户数据
      const updatedUser = userStorage.getById(user.id);
      if (updatedUser) {
        onUpdateUser(updatedUser);
      }

      setResultMessage({ type: 'success', message: `成功押注 ${betAmount.toLocaleString()} 金币！` });
      loadThemeDetails();
    } else {
      setResultMessage({ type: 'error', message: '押注失败，请重试！' });
    }

    setShowResultDialog(true);
    setShowConfirmDialog(false);
    setLoading(false);
  };

  if (!theme) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  const hasBet = !!theme.userBet;
  const isClosed = theme.status === 'closed';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h1 className="font-semibold text-lg">押注详情</h1>
          <div className="flex items-center gap-1 text-yellow-300">
            <Coins className="w-4 h-4" />
            <span className="font-medium">{user.coins.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 主题信息 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl mb-2">{theme.title}</CardTitle>
                <CardDescription>{theme.description}</CardDescription>
              </div>
              <Badge 
                variant={theme.status === 'open' ? 'default' : 'secondary'}
                className={theme.status === 'open' ? 'bg-green-500' : 'bg-gray-500'}
              >
                {theme.status === 'open' ? '进行中' : '已结束'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">{theme.totalBets} 人参与</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600">奖池 {theme.totalAmount.toLocaleString()} 金币</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 押注选项 */}
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          选择押注
        </h2>

        <div className="space-y-4 mb-6">
          {theme.options.map(option => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all ${
                selectedOption === option.id 
                  ? 'ring-2 ring-purple-500 bg-purple-50' 
                  : 'hover:shadow-md'
              } ${hasBet || isClosed ? 'cursor-not-allowed opacity-80' : ''}`}
              onClick={() => {
                if (!hasBet && !isClosed) {
                  setSelectedOption(option.id);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedOption === option.id 
                        ? 'border-purple-500 bg-purple-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedOption === option.id && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="font-medium text-lg">{option.name}</span>
                  </div>
                  {theme.winnerOptionId === option.id && (
                    <Badge className="bg-yellow-500">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      获胜
                    </Badge>
                  )}
                </div>

                {/* 赢率进度条 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">赢率</span>
                    <span className="font-medium text-purple-600">{option.winRate.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={option.winRate} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{option.betCount} 人押注</span>
                    <span>{option.totalAmount.toLocaleString()} 金币</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 押注控制 */}
        {!hasBet && !isClosed && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">押注金额</span>
                    <span className="text-sm text-purple-600 font-bold">{betAmount.toLocaleString()} 金币</span>
                  </div>
                  <Slider
                    value={[betAmount]}
                    onValueChange={(value) => setBetAmount(value[0])}
                    max={user.coins}
                    min={GAME_CONFIG.MIN_BET_AMOUNT}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>{GAME_CONFIG.MIN_BET_AMOUNT.toLocaleString()}</span>
                    <span>最大: {user.coins.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {[50000, 100000, 150000].map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount(Math.min(amount, user.coins))}
                      disabled={user.coins < amount}
                      className="flex-1"
                    >
                      {amount >= 10000 ? `${amount / 10000}万` : amount}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount(user.coins)}
                    disabled={user.coins < GAME_CONFIG.MIN_BET_AMOUNT}
                    className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                  >
                    全压
                  </Button>
                </div>

                <Button
                  onClick={handleBet}
                  disabled={!selectedOption || betAmount < GAME_CONFIG.MIN_BET_AMOUNT || betAmount > user.coins}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  确认押注
                </Button>

                {betAmount < GAME_CONFIG.MIN_BET_AMOUNT && (
                  <p className="text-red-500 text-sm text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    最少押注 {GAME_CONFIG.MIN_BET_AMOUNT.toLocaleString()} 金币
                  </p>
                )}
                {betAmount > user.coins && (
                  <p className="text-red-500 text-sm text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    金币不足
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {hasBet && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">
                  您已押注 {theme.userBet?.amount.toLocaleString()} 金币
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {isClosed && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">该押注已结束</span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* 确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认押注</DialogTitle>
            <DialogDescription>
              您确定要押注 <span className="font-bold text-purple-600">{betAmount.toLocaleString()}</span> 金币吗？
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              选择: <span className="font-medium">{theme.options.find(o => o.id === selectedOption)?.name}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={confirmBet}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-500"
            >
              {loading ? '处理中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 结果对话框 */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={resultMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}>
              {resultMessage.type === 'success' ? '押注成功' : '押注失败'}
            </DialogTitle>
            <DialogDescription>{resultMessage.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
