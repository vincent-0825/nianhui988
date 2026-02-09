import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Trophy, Users, Coins, TrendingUp, CheckCircle2, XCircle, Download, Gift } from 'lucide-react';
import { themeStorage, optionStorage, recordStorage, settleBets, userStorage } from '@/services/storage';
import { downloadDataFile } from '@/services/dataSync';
import type { BetTheme, BetOption, BetRecord } from '@/types';

interface AdminProps {
  onBack: () => void;
}

interface ThemeWithDetails extends BetTheme {
  options: BetOption[];
  records: BetRecord[];
  totalAmount: number;
  totalBets: number;
}

export default function Admin({ onBack }: AdminProps) {
  const [themes, setThemes] = useState<ThemeWithDetails[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeWithDetails | null>(null);
  const [newTheme, setNewTheme] = useState({ title: '', description: '', options: ['', ''] });
  const [winnerOptionId, setWinnerOptionId] = useState('');
  
  // 发放金币相关状态
  const [showGiveCoinsDialog, setShowGiveCoinsDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [giveAmount, setGiveAmount] = useState(50000);
  const [users, setUsers] = useState<{ id: string; name: string; coins: number }[]>([]);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = () => {
    const allThemes = themeStorage.getAll();
    const themesWithDetails = allThemes.map(theme => {
      const options = optionStorage.getByThemeId(theme.id);
      const records = recordStorage.getByThemeId(theme.id);
      return {
        ...theme,
        options,
        records,
        totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
        totalBets: records.length,
      };
    });
    themesWithDetails.sort((a, b) => b.createdAt - a.createdAt);
    setThemes(themesWithDetails);
  };

  const loadUsers = () => {
    const allUsers = userStorage.getAll();
    setUsers(allUsers.map(u => ({ id: u.id, name: u.name, coins: u.coins })));
  };

  const handleGiveCoins = () => {
    if (!selectedUserId || giveAmount <= 0) return;
    
    userStorage.addCoins(selectedUserId, giveAmount);
    loadUsers();
    setShowGiveCoinsDialog(false);
    setSelectedUserId('');
    setGiveAmount(50000);
    alert('金币发放成功！');
  };

  const handleCreateTheme = () => {
    if (!newTheme.title.trim() || newTheme.options.some(o => !o.trim())) return;

    const theme = themeStorage.create({
      title: newTheme.title.trim(),
      description: newTheme.description.trim(),
      status: 'open',
      winnerOptionId: null,
    });

    newTheme.options.forEach(optionName => {
      if (optionName.trim()) {
        optionStorage.create({
          themeId: theme.id,
          name: optionName.trim(),
        });
      }
    });

    setNewTheme({ title: '', description: '', options: ['', ''] });
    setShowCreateDialog(false);
    loadThemes();
  };

  const handleDeleteTheme = (themeId: string) => {
    if (confirm('确定要删除这个押注主题吗？所有相关数据将被删除。')) {
      themeStorage.delete(themeId);
      loadThemes();
    }
  };

  const handleSettleTheme = () => {
    if (!selectedTheme || !winnerOptionId) return;

    // 结算奖励
    settleBets(selectedTheme.id, winnerOptionId);
    
    // 更新主题状态
    themeStorage.setWinner(selectedTheme.id, winnerOptionId);
    
    setShowSettleDialog(false);
    setSelectedTheme(null);
    setWinnerOptionId('');
    loadThemes();
  };

  const addOption = () => {
    setNewTheme({ ...newTheme, options: [...newTheme.options, ''] });
  };

  const removeOption = (index: number) => {
    if (newTheme.options.length <= 2) return;
    const options = newTheme.options.filter((_, i) => i !== index);
    setNewTheme({ ...newTheme, options });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...newTheme.options];
    options[index] = value;
    setNewTheme({ ...newTheme, options });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回首页
          </Button>
          <h1 className="font-semibold text-lg">管理后台</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <p className="text-blue-100 text-sm">总主题数</p>
              <p className="text-2xl font-bold">{themes.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <p className="text-green-100 text-sm">进行中</p>
              <p className="text-2xl font-bold">{themes.filter(t => t.status === 'open').length}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <p className="text-purple-100 text-sm">总押注次数</p>
              <p className="text-2xl font-bold">{themes.reduce((sum, t) => sum + t.totalBets, 0)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <CardContent className="p-4">
              <p className="text-yellow-100 text-sm">总奖池</p>
              <p className="text-2xl font-bold">{themes.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            押注主题管理
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                loadUsers();
                setShowGiveCoinsDialog(true);
              }}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <Gift className="w-4 h-4 mr-2" />
              发放金币
            </Button>
            <Button
              variant="outline"
              onClick={downloadDataFile}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建主题
            </Button>
          </div>
        </div>

        {/* 主题列表 */}
        {themes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500">暂无押注主题</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
                className="mt-4"
              >
                创建第一个主题
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {themes.map(theme => (
              <Card key={theme.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{theme.title}</CardTitle>
                        <Badge 
                          variant={theme.status === 'open' ? 'default' : 'secondary'}
                          className={theme.status === 'open' ? 'bg-green-500' : 'bg-gray-500'}
                        >
                          {theme.status === 'open' ? '进行中' : '已结束'}
                        </Badge>
                      </div>
                      <CardDescription>{theme.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {theme.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTheme(theme);
                            setShowSettleDialog(true);
                          }}
                          className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                        >
                          <Trophy className="w-4 h-4 mr-1" />
                          公布结果
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTheme(theme.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">{theme.totalBets} 人参与</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-600">{theme.totalAmount.toLocaleString()} 金币奖池</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">选项:</span>
                      <span className="text-gray-700">{theme.options.length} 个</span>
                    </div>
                  </div>

                  {/* 选项详情 */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">押注详情</p>
                    <div className="space-y-2">
                      {theme.options.map(option => {
                        const optionRecords = theme.records.filter(r => r.optionId === option.id);
                        const optionAmount = optionRecords.reduce((sum, r) => sum + r.amount, 0);
                        const winRate = theme.totalAmount > 0 ? (optionAmount / theme.totalAmount * 100) : 0;
                        const isWinner = theme.winnerOptionId === option.id;
                        
                        return (
                          <div 
                            key={option.id} 
                            className={`flex items-center justify-between p-2 rounded ${
                              isWinner ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
                              <span className="text-sm font-medium">{option.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{optionRecords.length} 人</span>
                              <span>{optionAmount.toLocaleString()} 金币</span>
                              <span className="font-medium text-purple-600">{winRate.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* 创建主题对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建押注主题</DialogTitle>
            <DialogDescription>
              创建一个新的押注主题，设置标题、描述和选项。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">主题标题</label>
              <Input
                placeholder="例如：年会最佳节目"
                value={newTheme.title}
                onChange={(e) => setNewTheme({ ...newTheme, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">主题描述</label>
              <Textarea
                placeholder="描述一下这个押注主题..."
                value={newTheme.description}
                onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">押注选项</label>
              <div className="space-y-2">
                {newTheme.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`选项 ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    {newTheme.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-500"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加选项
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreateTheme}
              disabled={!newTheme.title.trim() || newTheme.options.some(o => !o.trim())}
              className="bg-gradient-to-r from-orange-500 to-red-500"
            >
              创建主题
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 发放金币对话框 */}
      <Dialog open={showGiveCoinsDialog} onOpenChange={setShowGiveCoinsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发放金币</DialogTitle>
            <DialogDescription>
              选择用户并输入发放金额
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">选择用户</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要发放金币的用户" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} (当前: {user.coins.toLocaleString()} 金币)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">发放金额</label>
              <Input
                type="number"
                value={giveAmount}
                onChange={(e) => setGiveAmount(Number(e.target.value))}
                min={1000}
                step={1000}
              />
              <div className="flex gap-2 mt-2">
                {[50000, 100000, 200000].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setGiveAmount(amount)}
                  >
                    {amount >= 10000 ? `${amount / 10000}万` : amount}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGiveCoinsDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleGiveCoins}
              disabled={!selectedUserId || giveAmount <= 0}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              <Gift className="w-4 h-4 mr-1" />
              确认发放
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 结算对话框 */}
      <Dialog open={showSettleDialog} onOpenChange={setShowSettleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>公布结果</DialogTitle>
            <DialogDescription>
              选择获胜选项，系统将自动结算奖励。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              主题: <span className="font-medium">{selectedTheme?.title}</span>
            </p>
            <Select value={winnerOptionId} onValueChange={setWinnerOptionId}>
              <SelectTrigger>
                <SelectValue placeholder="选择获胜选项" />
              </SelectTrigger>
              <SelectContent>
                {selectedTheme?.options.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-4 p-3 bg-yellow-50 rounded text-sm text-yellow-700">
              <p>⚠️ 结算规则：</p>
              <ul className="list-disc list-inside mt-1 ml-2">
                <li>输家：押注金币全部进入奖励池</li>
                <li>赢家：退还全部押注 + 按比例分奖励池</li>
                <li>此操作不可撤销</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettleDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleSettleTheme}
              disabled={!winnerOptionId}
              className="bg-gradient-to-r from-yellow-500 to-orange-500"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              确认公布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
