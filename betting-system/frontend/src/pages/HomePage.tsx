import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getThemes, getThemeBets, placeBet, getProfile, skipBet } from '../services/api';
import socket from '../services/socket';
import { t } from '../services/i18n';

interface User {
  _id: string;
  name: string;
  coins: number;
  wineGlasses: number;
  rounds: number;
  isAdmin: boolean;
}

interface Settings {
  initialCoins: number;
  minBet: number;
  maxBet: number;
  totalPrizePool: number;
  currentPool: number;
  gameOver: boolean;
}

interface Option {
  _id: string;
  name: string;
}

interface Theme {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  settlementMode: 'admin' | 'random';
  winnerOptionId: string | null;
  options: Option[];
}

interface OptionStat {
  optionId: string;
  optionName: string;
  totalAmount: number;
  betCount: number;
  winRate: number;
  bets: { userName: string; amount: number }[];
}

interface Props {
  user: User;
  updateUser: (partial: Partial<User>) => void;
  settings: Settings | null;
}

export default function HomePage({ user, updateUser, settings }: Props) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, { stats: OptionStat[]; totalAmount: number; myBet: any }>>({});
  const [betAmounts, setBetAmounts] = useState<Record<string, number>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchThemes = useCallback(async () => {
    try {
      const res = await getThemes();
      setThemes(res.data);
    } catch { /* ignore */ }
  }, []);

  const fetchStats = useCallback(async (themeId: string) => {
    try {
      const res = await getThemeBets(themeId);
      setStats(prev => ({ ...prev, [themeId]: res.data }));
    } catch { /* ignore */ }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await getProfile();
      updateUser({ coins: res.data.coins, wineGlasses: res.data.wineGlasses, rounds: res.data.rounds });
    } catch { /* ignore */ }
  }, [updateUser]);

  useEffect(() => { fetchThemes(); }, [fetchThemes]);

  useEffect(() => {
    socket.on('themeUpdate', fetchThemes);
    socket.on('betUpdate', (data: { themeId: string }) => fetchStats(data.themeId));
    socket.on('settled', () => { fetchThemes(); refreshProfile(); });
    socket.on('gameOver', () => toast.error(t('gameOver')));
    return () => {
      socket.off('themeUpdate');
      socket.off('betUpdate');
      socket.off('settled');
      socket.off('gameOver');
    };
  }, [fetchThemes, fetchStats, refreshProfile]);

  useEffect(() => {
    if (expandedTheme) fetchStats(expandedTheme);
  }, [expandedTheme, fetchStats]);

  const minBet = settings?.minBet || 50000;
  const maxBet = settings?.maxBet || 10000000;

  const handleBet = async (themeId: string) => {
    const optionId = selectedOptions[themeId];
    const amount = betAmounts[themeId];
    if (!optionId) { toast.error(t('selectOption')); return; }
    if (!amount || amount < minBet) { toast.error(`${t('minBetError')} ${minBet / 10000}${t('wan')}`); return; }
    if (amount > maxBet) { toast.error(`${t('maxBetError')} ${maxBet / 10000}${t('wan')}`); return; }
    if (user.coins > 0 && amount > user.coins) { toast.error(t('insufficientCoins')); return; }

    setLoading(true);
    try {
      const res = await placeBet({ themeId, optionId, amount });
      updateUser({
        coins: res.data.remainingCoins,
        wineGlasses: res.data.wineGlasses,
      });
      if (res.data.useWineGlass) {
        toast(t('wineGlassNote'), { icon: '🍷' });
      } else {
        toast.success(t('betSuccess'));
      }
      fetchStats(themeId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('betFail'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async (themeId: string) => {
    try {
      await skipBet(themeId);
      toast.success(t('skipped'));
    } catch { /* ignore */ }
  };

  const handleAllIn = (themeId: string) => {
    const amount = user.coins > 0 ? Math.min(user.coins, maxBet) : minBet;
    setBetAmounts(prev => ({ ...prev, [themeId]: amount }));
  };

  const formatCoins = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(n % 10000 === 0 ? 0 : 1) + t('wan');
    return n.toLocaleString();
  };

  if (themes.length === 0) {
    return (
      <div className="text-center py-20 text-indigo-400">
        <div className="text-5xl mb-4">🎲</div>
        <p>{t('noThemes')}</p>
        <p className="text-sm mt-1">{t('waitingAdmin')}</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      {/* 酒杯提示 */}
      {user.coins === 0 && (
        <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-center text-sm text-pink-300">
          🍷 {t('wineGlassNote')} — {t('yourWineGlasses')}: {user.wineGlasses}
        </div>
      )}

      {themes.map(theme => {
        const isExpanded = expandedTheme === theme._id;
        const themeStat = stats[theme._id];
        const myBet = themeStat?.myBet;
        const hasBet = !!myBet;
        const isClosed = theme.status === 'closed';

        return (
          <div
            key={theme._id}
            className="bg-indigo-900/40 rounded-2xl border border-indigo-700/40 overflow-hidden backdrop-blur-sm"
          >
            {/* 主题标题 */}
            <button
              onClick={() => setExpandedTheme(isExpanded ? null : theme._id)}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isClosed
                      ? 'bg-gray-600/50 text-gray-300'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {isClosed ? t('ended') : t('ongoing')}
                  </span>
                  {theme.settlementMode === 'random' && !isClosed && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      🎲
                    </span>
                  )}
                  <h3 className="font-semibold text-white">{theme.title}</h3>
                </div>
                {theme.description && (
                  <p className="text-indigo-400 text-sm mt-1">{theme.description}</p>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-indigo-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 展开内容 */}
            {isExpanded && (
              <div className="px-5 pb-5 space-y-3">
                {/* 选项列表 & 赢率 */}
                {theme.options.map(option => {
                  const optStat = themeStat?.stats?.find(s => s.optionId === option._id);
                  const isWinner = isClosed && theme.winnerOptionId === option._id;
                  const isSelected = selectedOptions[theme._id] === option._id;
                  const isMyBetOption = myBet?.optionId === option._id;

                  return (
                    <div key={option._id} className="space-y-1">
                      <button
                        disabled={isClosed || hasBet}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, [theme._id]: option._id }))}
                        className={`w-full p-3 rounded-xl text-left transition-all ${
                          isWinner
                            ? 'bg-green-500/20 border-2 border-green-500 ring-2 ring-green-500/30'
                            : isMyBetOption
                            ? 'bg-purple-500/20 border-2 border-purple-500'
                            : isSelected
                            ? 'bg-blue-500/20 border-2 border-blue-500'
                            : 'bg-indigo-800/40 border-2 border-transparent hover:border-indigo-600'
                        } ${(isClosed || hasBet) ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center gap-2">
                            {isWinner && <span className="text-green-400">&#10003;</span>}
                            {isMyBetOption && <span className="text-purple-400 text-xs">[{t('alreadyBet').split(' ')[0]}]</span>}
                            {option.name}
                          </span>
                          <span className="text-sm text-indigo-300">
                            {optStat ? `${optStat.betCount}${t('persons')} / ${formatCoins(optStat.totalAmount)}` : `0${t('persons')}`}
                          </span>
                        </div>

                        {/* 赢率进度条 */}
                        {optStat && optStat.winRate > 0 && (
                          <div className="mt-2">
                            <div className="h-2 bg-indigo-950 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isWinner ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
                                }`}
                                style={{ width: `${optStat.winRate}%` }}
                              />
                            </div>
                            <p className="text-xs text-indigo-400 mt-1">{t('winRate')} {optStat.winRate}%</p>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}

                {/* 总押注额 */}
                {themeStat && themeStat.totalAmount > 0 && (
                  <div className="text-center text-sm text-indigo-400 py-1">
                    {t('prizePool')}: <span className="text-yellow-400 font-semibold">{formatCoins(themeStat.totalAmount)}</span> {t('coins')}
                  </div>
                )}

                {/* 押注操作 */}
                {!isClosed && !hasBet && !settings?.gameOver && (
                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          placeholder={`${t('betAmount')} (${t('minBet')} ${minBet / 10000}${t('wan')})`}
                          value={betAmounts[theme._id] || ''}
                          onChange={(e) => setBetAmounts(prev => ({
                            ...prev, [theme._id]: parseInt(e.target.value) || 0
                          }))}
                          min={minBet}
                          max={maxBet}
                          step={10000}
                          className="w-full px-3 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-600/50 text-white placeholder-indigo-500 focus:outline-none focus:border-purple-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={() => handleAllIn(theme._id)}
                        className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 active:scale-95 whitespace-nowrap"
                      >
                        {t('allIn')}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSkip(theme._id)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-indigo-400 bg-indigo-800/30 border border-indigo-700/30 hover:bg-indigo-800/50 active:scale-95"
                      >
                        {t('skipRound')}
                      </button>
                      <button
                        onClick={() => handleBet(theme._id)}
                        disabled={loading}
                        className="flex-[2] py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 active:scale-95"
                      >
                        {user.coins === 0 ? `🍷 ${t('bet')}` : t('bet')}
                      </button>
                    </div>
                  </div>
                )}

                {/* 已押注提示 */}
                {hasBet && !isClosed && (
                  <div className="text-center py-2 text-sm text-purple-400">
                    {t('alreadyBet')} <span className="text-yellow-400 font-semibold">{formatCoins(myBet.amount)}</span> {t('coins')}
                  </div>
                )}

                {/* 结果提示 */}
                {isClosed && hasBet && (
                  <div className={`text-center py-2 text-sm font-semibold ${
                    myBet.optionId === theme.winnerOptionId ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {myBet.optionId === theme.winnerOptionId ? t('youWin') : t('youLose')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
