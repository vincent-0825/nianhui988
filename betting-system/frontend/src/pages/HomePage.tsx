import { useState, useEffect, useCallback, useRef } from 'react';
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
  status: 'pending' | 'open' | 'closed';
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

const STEP = 50000; // 5万为最小单位

export default function HomePage({ user, updateUser, settings }: Props) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, { stats: OptionStat[]; totalAmount: number; myBet: any }>>({});
  const [betAmounts, setBetAmounts] = useState<Record<string, number>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const selectTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleSelectOption = (themeId: string, optionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [themeId]: optionId }));
    const key = `${themeId}-${optionId}`;
    setJustSelected(key);
    clearTimeout(selectTimer.current);
    selectTimer.current = setTimeout(() => setJustSelected(null), 450);
  };

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

  // 加载所有主题的押注统计（用于状态标签显示）
  const fetchAllStats = useCallback(async (themeList: Theme[]) => {
    try {
      const results = await Promise.all(themeList.map(t => getThemeBets(t._id)));
      const newStats: Record<string, any> = {};
      themeList.forEach((t, i) => { newStats[t._id] = results[i].data; });
      setStats(newStats);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getThemes();
        setThemes(res.data);
        if (res.data.length > 0) fetchAllStats(res.data);
      } catch { /* ignore */ }
    })();
    // 登录后立即刷新 profile，防止 localStorage 中金币数据过期
    refreshProfile();
  }, [fetchAllStats, refreshProfile]);

  useEffect(() => {
    const handleThemeUpdate = async () => {
      try {
        const res = await getThemes();
        setThemes(res.data);
        if (res.data.length > 0) fetchAllStats(res.data);
      } catch { /* ignore */ }
    };
    socket.on('themeUpdate', handleThemeUpdate);
    socket.on('betUpdate', (data: { themeId: string }) => fetchStats(data.themeId));
    socket.on('settled', () => { handleThemeUpdate(); refreshProfile(); });
    socket.on('gameOver', () => toast.error(t('gameOver')));
    return () => {
      socket.off('themeUpdate');
      socket.off('betUpdate');
      socket.off('settled');
      socket.off('gameOver');
    };
  }, [fetchStats, fetchAllStats, refreshProfile]);

  useEffect(() => {
    if (expandedTheme) fetchStats(expandedTheme);
  }, [expandedTheme, fetchStats]);

  const minBet = settings?.minBet || 50000;
  const maxBet = settings?.maxBet || 10000000;

  const getBetAmount = (themeId: string) => betAmounts[themeId] || minBet;

  const handleSliderChange = (themeId: string, value: number) => {
    // 对齐到5万档位
    const aligned = Math.round(value / STEP) * STEP;
    const upperLimit = Math.min(maxBet, user.coins);
    const clamped = Math.max(minBet, Math.min(aligned, upperLimit));
    setBetAmounts(prev => ({ ...prev, [themeId]: clamped }));
  };

  const handleBet = async (themeId: string) => {
    const optionId = selectedOptions[themeId];
    // 酒杯模式固定5万，余额不足最低投注时 all-in，否则用选择的金额
    const amount = user.coins === 0 ? 50000 : user.coins < minBet ? user.coins : getBetAmount(themeId);
    if (!optionId) { toast.error(t('selectOption')); return; }
    if (user.coins >= minBet) {
      if (amount < minBet) { toast.error(`${t('minBetError')} ${minBet / 10000}${t('wan')}`); return; }
      if (amount > maxBet) { toast.error(`${t('maxBetError')} ${maxBet / 10000}${t('wan')}`); return; }
      if (amount > user.coins) { toast.error(t('insufficientCoins')); return; }
    }

    setLoading(true);
    try {
      const res = await placeBet({ themeId, optionId, amount });
      updateUser({ coins: res.data.remainingCoins, wineGlasses: res.data.wineGlasses });
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
    const aligned = Math.floor(amount / STEP) * STEP;
    setBetAmounts(prev => ({ ...prev, [themeId]: Math.max(aligned, minBet) }));
  };

  const formatCoins = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(n % 10000 === 0 ? 0 : 1) + t('wan');
    return n.toLocaleString();
  };

  if (themes.length === 0) {
    return (
      <div className="text-center py-20 text-red-300/60">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-3xl animate-lantern">🏮</span>
          <div className="text-5xl">🐴</div>
          <span className="text-3xl animate-lantern-alt">🏮</span>
        </div>
        <p>{t('noThemes')}</p>
        <p className="text-sm mt-1">{t('waitingAdmin')}</p>
      </div>
    );
  }

  // 获取主题卡片的状态标签
  const getStatusBadge = (theme: Theme, isWin: boolean, isLose: boolean, hasBet: boolean) => {
    const isClosed = theme.status === 'closed';
    if (!isClosed) {
      // 进行中 - 绿色脉冲指示
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-600/20 text-green-400 border border-green-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />
          {t('ongoing')}
        </span>
      );
    }
    if (isWin) {
      // 已结束 + 赢了 - 金色
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-400/40">
          🏆 {t('wonLabel')}
        </span>
      );
    }
    if (isLose) {
      // 已结束 + 输了 - 蓝灰色
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-900/30 text-blue-300 border border-blue-500/30">
          💔 {t('lostLabel')}
        </span>
      );
    }
    if (isClosed && !hasBet) {
      // 已结束 + 未参与 - 灰色
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-600/30 text-gray-400 border border-gray-500/30">
          {t('noBetLabel')}
        </span>
      );
    }
    return (
      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-600/50 text-gray-300">
        {t('ended')}
      </span>
    );
  };

  return (
    <div className="py-4 space-y-4">
      {/* 新春装饰横幅 */}
      <div className="flex items-center justify-center gap-2 text-center py-2">
        <span className="text-lg animate-lantern">🏮</span>
        <span className="text-xs text-yellow-500/60 font-medium">✦ {t('springGreeting')} ✦</span>
        <span className="text-lg animate-lantern-alt">🏮</span>
      </div>

      {user.coins === 0 && (
        <div className="p-3 rounded-xl bg-yellow-900/20 border border-yellow-600/30 text-center text-sm text-yellow-300">
          🍷 {t('wineGlassNote')} — {t('yourWineGlasses')}: {user.wineGlasses}
        </div>
      )}

      {themes.map(theme => {
        const isExpanded = expandedTheme === theme._id;
        const themeStat = stats[theme._id];
        const myBet = themeStat?.myBet;
        const hasBet = !!myBet;
        const isClosed = theme.status === 'closed';
        const isWin = isClosed && hasBet && myBet.optionId === theme.winnerOptionId;
        const isLose = isClosed && hasBet && myBet.optionId !== theme.winnerOptionId;

        return (
          <div
            key={theme._id}
            className={`rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${
              isWin
                ? 'bg-gradient-to-br from-red-900/60 via-yellow-900/30 to-red-900/60 border-2 border-yellow-500/60 animate-win-glow'
                : isLose
                ? 'bg-gradient-to-br from-blue-950/50 to-slate-900/50 border-2 border-blue-500/30 opacity-80'
                : isClosed && !hasBet
                ? 'bg-gray-900/40 border border-gray-700/30 opacity-70'
                : 'bg-red-950/40 border border-yellow-800/30 couplet-border'
            }`}
          >
            <button
              onClick={() => setExpandedTheme(isExpanded ? null : theme._id)}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(theme, isWin, isLose, hasBet)}
                  {theme.settlementMode === 'random' && !isClosed && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-400 border border-yellow-500/30">🎲</span>
                  )}
                  <h3 className={`font-semibold ${
                    isWin ? 'text-yellow-200' : isLose ? 'text-blue-200/80' : 'text-yellow-50'
                  }`}>{theme.title}</h3>
                </div>
                {theme.description && <p className={`text-sm mt-1 ${
                  isLose ? 'text-blue-300/40' : 'text-red-300/60'
                }`}>{theme.description}</p>}
              </div>
              <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''} ${
                isWin ? 'text-yellow-400' : isLose ? 'text-blue-400/50' : 'text-yellow-600'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-yellow-600/30 to-transparent -mt-1 mb-1" />
                {theme.options.map(option => {
                  const optStat = themeStat?.stats?.find(s => s.optionId === option._id);
                  const isWinner = isClosed && theme.winnerOptionId === option._id;
                  const isSelected = selectedOptions[theme._id] === option._id;
                  const isMyBetOption = myBet?.optionId === option._id;

                  return (
                    <div key={option._id} className="space-y-1">
                      <button
                        disabled={isClosed || hasBet}
                        onClick={() => handleSelectOption(theme._id, option._id)}
                        className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                          isWinner
                            ? 'bg-red-700/30 border-2 border-yellow-500 ring-2 ring-yellow-500/30'
                            : isMyBetOption
                            ? 'bg-red-800/30 border-2 border-red-400'
                            : isSelected
                            ? 'bg-yellow-700/20 border-2 border-yellow-500 shadow-md shadow-yellow-500/10'
                            : 'bg-red-900/30 border-2 border-transparent hover:border-yellow-700/50'
                        } ${(isClosed || hasBet) ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'} ${
                          justSelected === `${theme._id}-${option._id}` ? 'animate-option-select' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center gap-2">
                            {isWinner && <span className="text-yellow-400">&#10003;</span>}
                            {isMyBetOption && <span className="text-red-300 text-xs">[{t('alreadyBet')}]</span>}
                            {isSelected && !isClosed && !hasBet && <span className="text-yellow-400 text-sm">&#10003;</span>}
                            {option.name}
                          </span>
                          <span className="text-sm text-red-300/80">
                            {optStat ? `${optStat.betCount}${t('persons')} / ${formatCoins(optStat.totalAmount)}` : `0${t('persons')}`}
                          </span>
                        </div>
                        {optStat && optStat.winRate > 0 && (
                          <div className="mt-2">
                            <div className="h-2 bg-red-950 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isWinner ? 'bg-yellow-500' : 'bg-gradient-to-r from-red-500 to-yellow-600'}`}
                                style={{ width: `${optStat.winRate}%` }}
                              />
                            </div>
                            <p className="text-xs text-red-400/60 mt-1">{t('winRate')} {optStat.winRate}%</p>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}

                {themeStat && themeStat.totalAmount > 0 && (
                  <div className="text-center text-sm py-2 px-3 rounded-lg bg-gradient-to-r from-yellow-900/10 via-yellow-800/15 to-yellow-900/10 border border-yellow-700/20">
                    <span className="text-yellow-500/70">✦</span> {t('prizePool')}: <span className="text-yellow-300 font-bold">{formatCoins(themeStat.totalAmount)}</span> {t('coins')} <span className="text-yellow-500/70">✦</span>
                  </div>
                )}

                {/* 押注操作 */}
                {!isClosed && !hasBet && !settings?.gameOver && (
                  <div className="space-y-3 pt-2">
                    {user.coins === 0 ? (
                      /* 酒杯模式：固定5万 */
                      <div className="text-center py-2">
                        <div className="text-2xl font-bold text-pink-400">
                          🍷 5<span className="text-base text-pink-500">{t('wan')}</span>
                        </div>
                        <div className="text-xs text-red-400/60 mt-1">{t('wineGlassNote')}</div>
                      </div>
                    ) : user.coins < minBet ? (
                      /* 余额不足最低投注：自动 all-in */
                      <div className="text-center py-2">
                        <div className="text-2xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                          {t('allIn')} {formatCoins(user.coins)}
                        </div>
                      </div>
                    ) : (
                      /* 金币模式：滑轨选择器 */
                      <>
                        <div className="text-center">
                          <div className="text-3xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                            {getBetAmount(theme._id) / 10000}<span className="text-lg text-yellow-500">{t('wan')}</span>
                          </div>
                        </div>

                        <div className="px-1">
                          <input
                            type="range"
                            className="bet-slider"
                            min={minBet}
                            max={Math.min(maxBet, user.coins)}
                            step={STEP}
                            value={getBetAmount(theme._id)}
                            onChange={(e) => handleSliderChange(theme._id, Number(e.target.value))}
                          />
                          <div className="flex justify-between text-xs text-yellow-600/50 mt-1 px-0.5">
                            <span>{minBet / 10000}{t('wan')}</span>
                            <span>{Math.min(maxBet, user.coins) / 10000}{t('wan')}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-center flex-wrap">
                          {[5, 10, 25, 50].map(n => {
                            const val = n * 10000;
                            if (val > maxBet || val < minBet || val > user.coins) return null;
                            return (
                              <button
                                key={n}
                                onClick={() => setBetAmounts(prev => ({ ...prev, [theme._id]: val }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border active:scale-95 ${
                                  getBetAmount(theme._id) === val
                                    ? 'bg-yellow-600/30 text-yellow-300 border-yellow-500/50'
                                    : 'bg-red-900/30 text-red-300/70 border-red-800/30 hover:border-yellow-700/40'
                                }`}
                              >{n}{t('wan')}</button>
                            );
                          })}
                          <button onClick={() => handleAllIn(theme._id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-yellow-600/20 to-orange-600/20 text-yellow-300 border border-yellow-500/40 active:scale-95 shadow-sm shadow-yellow-900/10">
                            {t('allIn')}
                          </button>
                        </div>
                      </>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button onClick={() => handleSkip(theme._id)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-red-400/60 bg-red-950/50 border border-red-800/30 active:scale-95">
                        {t('skipRound')}
                      </button>
                      <button onClick={() => handleBet(theme._id)} disabled={loading} className="flex-[2] py-3 rounded-xl text-base font-bold text-yellow-100 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:via-red-500 hover:to-red-600 disabled:opacity-50 active:scale-95 border border-yellow-500/40 shadow-lg shadow-red-900/30">
                        {user.coins === 0 ? `🍷 ${t('bet')}` : `✦ ${t('bet')} ✦`}
                      </button>
                    </div>
                  </div>
                )}

                {hasBet && !isClosed && (
                  <div className="text-center py-2 text-sm text-red-300">
                    {t('alreadyBet')} <span className="text-yellow-400 font-semibold">{formatCoins(myBet.amount)}</span> {t('coins')}
                  </div>
                )}

                {isClosed && hasBet && (
                  <div className={`text-center py-3 text-sm font-bold rounded-xl ${
                    myBet.optionId === theme.winnerOptionId
                      ? 'text-yellow-200 bg-gradient-to-r from-yellow-700/20 via-yellow-600/30 to-yellow-700/20 border border-yellow-500/40 shadow-lg shadow-yellow-900/20'
                      : 'text-blue-300/80 bg-blue-950/40 border border-blue-700/30'
                  }`}>
                    {myBet.optionId === theme.winnerOptionId
                      ? <span className="flex items-center justify-center gap-2">🏆 <span className="animate-sparkle">{t('youWin')}</span> 🎉</span>
                      : `😔 ${t('youLose')}`
                    }
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
