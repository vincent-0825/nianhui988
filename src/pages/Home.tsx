import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, LogOut, Shield, Trophy, TrendingUp, User } from 'lucide-react';
import { themeStorage, recordStorage } from '@/services/storage';
import type { BetTheme, BetRecord } from '@/types';

interface HomeProps {
  user: { id: string; name: string; coins: number; isAdmin: boolean };
  onLogout: () => void;
  onNavigate: (page: string, params?: any) => void;
}

interface ThemeWithStats extends BetTheme {
  totalAmount: number;
  totalBets: number;
  userBet?: BetRecord;
}

export default function Home({ user, onLogout, onNavigate }: HomeProps) {
  const [themes, setThemes] = useState<ThemeWithStats[]>([]);
  const [myBets, setMyBets] = useState<BetRecord[]>([]);

  useEffect(() => {
    loadThemes();
    loadMyBets();
  }, [user.id]);

  const loadThemes = () => {
    const allThemes = themeStorage.getAll();
    const themesWithStats = allThemes.map(theme => {
      const records = recordStorage.getByThemeId(theme.id);
      const userBet = records.find(r => r.userId === user.id);
      return {
        ...theme,
        totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
        totalBets: records.length,
        userBet,
      };
    });
    // 按创建时间倒序排列
    themesWithStats.sort((a, b) => b.createdAt - a.createdAt);
    setThemes(themesWithStats);
  };

  const loadMyBets = () => {
    const bets = recordStorage.getByUserId(user.id);
    setMyBets(bets);
  };

  const handleEnterTheme = (themeId: string) => {
    onNavigate('bet', { themeId });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold">{user.name}</h1>
              <div className="flex items-center gap-1 text-yellow-300">
                <Coins className="w-4 h-4" />
                <span className="text-sm font-medium">{user.coins.toLocaleString()} 金币</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!user.isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('login')}
                className="text-white hover:bg-white/20"
              >
                <Shield className="w-4 h-4 mr-1" />
                管理员入口
              </Button>
            )}
            {user.isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('admin')}
                className="text-white hover:bg-white/20"
              >
                <Shield className="w-4 h-4 mr-1" />
                管理后台
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-1" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 我的押注统计 */}
        {myBets.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              我的押注
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <p className="text-blue-100 text-sm">总押注次数</p>
                  <p className="text-2xl font-bold">{myBets.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <p className="text-purple-100 text-sm">总押注金额</p>
                  <p className="text-2xl font-bold">
                    {myBets.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* 押注主题列表 */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            押注主题
          </h2>
          
          {themes.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-500">暂无押注主题，敬请期待！</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map(theme => (
                <Card 
                  key={theme.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    theme.status === 'closed' ? 'opacity-75' : ''
                  }`}
                  onClick={() => handleEnterTheme(theme.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{theme.title}</CardTitle>
                      <Badge 
                        variant={theme.status === 'open' ? 'default' : 'secondary'}
                        className={theme.status === 'open' ? 'bg-green-500' : 'bg-gray-500'}
                      >
                        {theme.status === 'open' ? '进行中' : '已结束'}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {theme.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500">
                          总押注: <span className="font-medium text-gray-700">{theme.totalBets}人</span>
                        </span>
                        <span className="text-gray-500">
                          奖池: <span className="font-medium text-yellow-600">{theme.totalAmount.toLocaleString()}</span>
                          <Coins className="w-3 h-3 inline ml-1" />
                        </span>
                      </div>
                    </div>
                    {theme.userBet && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-purple-600">
                          您已押注 {theme.userBet.amount.toLocaleString()} 金币
                        </p>
                      </div>
                    )}
                    {theme.status === 'closed' && theme.winnerOptionId && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          <Trophy className="w-3 h-3 mr-1" />
                          已公布结果
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
