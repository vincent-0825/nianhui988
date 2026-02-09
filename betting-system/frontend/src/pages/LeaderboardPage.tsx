import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard } from '../services/api';
import { t } from '../services/i18n';
import socket from '../services/socket';

interface UserInfo {
  _id: string;
  name: string;
  coins: number;
  wineGlasses: number;
  rounds: number;
}

// 固定奖金等级
function getPrizeTier(rank: number): number {
  if (rank === 1) return 3000000; // 300万
  if (rank === 2) return 1500000; // 150万
  if (rank === 3) return 1000000; // 100万
  if (rank >= 4 && rank <= 10) return 500000; // 50万
  if (rank >= 11 && rank <= 25) return 100000; // 10万
  return 0;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [totalPrizePool, setTotalPrizePool] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await getLeaderboard();
      setUsers(res.data.users);
      setTotalPrizePool(res.data.totalPrizePool);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    socket.on('settled', fetchData);
    return () => { socket.off('settled'); };
  }, [fetchData]);

  // 按金币排序（降序）
  const sorted = [...users].sort((a, b) => b.coins - a.coins);
  const totalCoins = sorted.reduce((sum, u) => sum + u.coins, 0);

  const getRankStyle = (index: number) => {
    if (index === 0) return 'text-yellow-300 text-lg';
    if (index === 1) return 'text-gray-300 text-lg';
    if (index === 2) return 'text-orange-400 text-lg';
    return 'text-red-400/60 text-sm';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <div className="py-4 space-y-4">
      {/* 总奖池 & 总金币 */}
      <div className="bg-gradient-to-br from-red-950/50 via-red-900/30 to-red-950/50 rounded-2xl border border-yellow-700/40 p-4 text-center space-y-2 couplet-border">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-sm animate-lantern">🏮</span>
          <span className="text-xs text-yellow-500/60">✦</span>
          <span className="text-sm animate-lantern-alt">🏮</span>
        </div>
        <div>
          <p className="text-xs text-red-300/60">{t('prizePool')}（{t('totalUsers').replace('{count}', String(users.length))}）</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {(totalPrizePool / 10000).toFixed(0)}<span className="text-sm text-green-500">{t('wan')}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-red-300/60">{t('totalCoinsAll')}</p>
          <p className="text-xl font-bold text-yellow-300">
            {(totalCoins / 10000).toFixed(0)}<span className="text-sm text-yellow-500">{t('wan')}</span>
          </p>
        </div>
      </div>

      {/* 奖金等级说明 */}
      <div className="bg-red-950/40 rounded-2xl border border-yellow-800/30 p-3">
        <p className="text-xs text-red-300/60 mb-2 text-center">{t('prizeTier')}</p>
        <div className="grid grid-cols-3 gap-1 text-xs text-center">
          <div className="text-yellow-300">🥇 300{t('wan')}</div>
          <div className="text-gray-300">🥈 150{t('wan')}</div>
          <div className="text-orange-400">🥉 100{t('wan')}</div>
          <div className="text-red-300/80">4-10 50{t('wan')}</div>
          <div className="text-red-300/80">11-25 10{t('wan')}</div>
          <div className="text-red-400/40">26+ 0</div>
        </div>
      </div>

      {/* 排行表头 */}
      <div className="flex items-center px-4 py-2 text-xs text-red-400/60">
        <span className="w-10">{t('rank')}</span>
        <span className="flex-1">Name</span>
        <span className="w-20 text-right">{t('coins')}</span>
        <span className="w-16 text-right">{t('proportion')}</span>
        <span className="w-20 text-right">{t('estimatedPrize')}</span>
      </div>

      {/* 排行列表 */}
      {sorted.length === 0 ? (
        <div className="text-center py-10 text-red-300/60">{t('noUsers')}</div>
      ) : (
        sorted.slice(0, 25).map((u, i) => {
          const proportion = totalCoins > 0 ? u.coins / totalCoins : 0;
          const prize = getPrizeTier(i + 1);
          return (
            <div
              key={u._id}
              className={`flex items-center px-4 py-3 rounded-xl ${
                i < 3
                  ? 'bg-red-900/40 border border-yellow-700/20'
                  : 'bg-red-950/30 border border-red-900/20'
              }`}
            >
              <span className={`w-10 font-bold ${getRankStyle(i)}`}>
                {getRankIcon(i)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-yellow-50 truncate">{u.name}</p>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  {u.wineGlasses > 0 && <span className="text-pink-400">🍷{u.wineGlasses}</span>}
                  <span className="text-red-400/60">{t('rounds')}: {u.rounds}</span>
                </div>
              </div>
              <span className="w-20 text-right text-yellow-400 font-semibold text-sm">
                {(u.coins / 10000).toFixed(0)}{t('wan')}
              </span>
              <span className="w-16 text-right text-red-300/80 text-sm">
                {(proportion * 100).toFixed(1)}%
              </span>
              <span className={`w-20 text-right font-semibold text-sm ${prize > 0 ? 'text-green-400' : 'text-red-400/40'}`}>
                {prize > 0 ? `${(prize / 10000).toFixed(0)}${t('wan')}` : '-'}
              </span>
            </div>
          );
        })
      )}

      {/* 计算说明 */}
      <div className="text-center text-xs text-red-400/40 py-2">
        {t('prizePool')} = {t('totalCoinsAll')}
      </div>
    </div>
  );
}
