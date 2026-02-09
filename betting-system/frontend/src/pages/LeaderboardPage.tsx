import { useState, useEffect, useCallback } from 'react';
import { getAllUsers } from '../services/api';
import { t } from '../services/i18n';
import socket from '../services/socket';

interface UserInfo {
  _id: string;
  name: string;
  coins: number;
  wineGlasses: number;
  rounds: number;
}

const TOTAL_PRIZE = 10000000; // 1000万

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    socket.on('settled', fetchUsers);
    return () => { socket.off('settled'); };
  }, [fetchUsers]);

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
      {/* 总计 */}
      <div className="bg-red-950/40 rounded-2xl border border-yellow-800/30 p-4 text-center">
        <p className="text-xs text-red-300/60">{t('totalCoinsAll')}</p>
        <p className="text-2xl font-bold text-yellow-300 mt-1">
          {(totalCoins / 10000).toFixed(0)}<span className="text-sm text-yellow-500">{t('wan')}</span>
        </p>
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
        sorted.map((u, i) => {
          const proportion = totalCoins > 0 ? u.coins / totalCoins : 0;
          const prize = proportion * TOTAL_PRIZE;
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
              <span className="w-20 text-right text-green-400 font-semibold text-sm">
                {(prize / 10000).toFixed(0)}{t('wan')}
              </span>
            </div>
          );
        })
      )}

      {/* 计算说明 */}
      <div className="text-center text-xs text-red-400/40 py-2">
        {t('estimatedPrize')} = {t('proportion')} × 1000{t('wan')}
      </div>
    </div>
  );
}
