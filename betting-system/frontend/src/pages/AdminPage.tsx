import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getThemes, createTheme, deleteTheme, settleTheme, randomSettleTheme,
  getAllUsers, giveCoins, getThemeBets,
  updateSettings, resetPool,
} from '../services/api';
import socket from '../services/socket';
import { t } from '../services/i18n';

interface Theme {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  settlementMode: 'admin' | 'random';
  winnerOptionId: string | null;
  options: { _id: string; name: string }[];
}

interface UserInfo {
  _id: string;
  name: string;
  coins: number;
  wineGlasses: number;
  rounds: number;
}

interface Settings {
  initialCoins: number;
  minBet: number;
  maxBet: number;
  totalPrizePool: number;
  currentPool: number;
  gameOver: boolean;
}

interface Props {
  settings: Settings | null;
  onSettingsChange: () => void;
}

export default function AdminPage({ settings, onSettingsChange }: Props) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [tab, setTab] = useState<'themes' | 'users' | 'settings'>('themes');
  const [loading, setLoading] = useState(false);

  // 创建主题表单
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [newMode, setNewMode] = useState<'admin' | 'random'>('admin');

  // 主题统计
  const [themeStats, setThemeStats] = useState<Record<string, any>>({});

  // 发放金币
  const [coinAmounts, setCoinAmounts] = useState<Record<string, number>>({});

  // 设置表单
  const [editSettings, setEditSettings] = useState({
    initialCoins: 200000,
    minBet: 50000,
    maxBet: 10000000,
    totalPrizePool: 10000000,
  });

  useEffect(() => {
    if (settings) {
      setEditSettings({
        initialCoins: settings.initialCoins,
        minBet: settings.minBet,
        maxBet: settings.maxBet,
        totalPrizePool: settings.totalPrizePool,
      });
    }
  }, [settings]);

  const fetchThemes = useCallback(async () => {
    try {
      const res = await getThemes();
      setThemes(res.data);
    } catch { /* ignore */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchThemes();
    fetchUsers();
  }, [fetchThemes, fetchUsers]);

  useEffect(() => {
    socket.on('themeUpdate', fetchThemes);
    socket.on('betUpdate', () => fetchThemes());
    socket.on('settled', () => { fetchThemes(); fetchUsers(); });
    return () => {
      socket.off('themeUpdate');
      socket.off('betUpdate');
      socket.off('settled');
    };
  }, [fetchThemes, fetchUsers]);

  const fetchThemeStats = async (themeId: string) => {
    try {
      const res = await getThemeBets(themeId);
      setThemeStats(prev => ({ ...prev, [themeId]: res.data }));
    } catch { /* ignore */ }
  };

  const handleCreateTheme = async () => {
    if (loading) return;
    const opts = newOptions.filter(o => o.trim());
    if (!newTitle.trim()) { toast.error(t('themeTitle')); return; }
    if (opts.length < 2) { toast.error(t('options')); return; }
    setLoading(true);
    try {
      await createTheme({
        title: newTitle.trim(),
        description: newDesc.trim(),
        options: opts,
        settlementMode: newMode,
      });
      toast.success(t('create') + '!');
      setNewTitle('');
      setNewDesc('');
      setNewOptions(['', '']);
      setNewMode('admin');
      fetchThemes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (loading) return;
    if (!confirm(t('deleteConfirm'))) return;
    setLoading(true);
    try {
      await deleteTheme(id);
      toast.success(t('deleted'));
      fetchThemes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (themeId: string, optionId: string) => {
    if (loading) return;
    if (!confirm(t('settleConfirm'))) return;
    setLoading(true);
    try {
      const res = await settleTheme(themeId, optionId);
      toast.success(`${t('settled')}! ${res.data.winnerCount} winners, ${res.data.loserCount} losers`);
      fetchThemes();
      fetchUsers();
      onSettingsChange();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRandomSettle = async (themeId: string) => {
    if (loading) return;
    if (!confirm(t('settleConfirm'))) return;
    setLoading(true);
    try {
      const res = await randomSettleTheme(themeId);
      toast.success(`${t('settled')}! ${t('winner')}: ${res.data.winnerOptionName}`);
      fetchThemes();
      fetchUsers();
      onSettingsChange();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGiveCoins = async (userId: string) => {
    if (loading) return;
    const amount = coinAmounts[userId];
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      await giveCoins(userId, amount);
      toast.success(t('giveSuccess'));
      setCoinAmounts(prev => ({ ...prev, [userId]: 0 }));
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await updateSettings(editSettings);
      toast.success(t('saveSuccess'));
      onSettingsChange();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('saveFail'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPool = async () => {
    if (loading) return;
    if (!confirm(t('resetPool') + '?')) return;
    setLoading(true);
    try {
      await resetPool();
      toast.success(t('saveSuccess'));
      onSettingsChange();
    } catch { toast.error(t('saveFail')); }
    finally { setLoading(false); }
  };

  const addOption = () => setNewOptions([...newOptions, '']);
  const removeOption = (i: number) => {
    if (newOptions.length <= 2) return;
    setNewOptions(newOptions.filter((_, idx) => idx !== i));
  };

  const tabClass = (active: boolean) =>
    `flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
      active ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-indigo-800/40 text-indigo-300'
    }`;

  return (
    <div className="py-4 space-y-4">
      {/* Tab切换 */}
      <div className="flex gap-2">
        <button onClick={() => setTab('themes')} className={tabClass(tab === 'themes')}>
          {t('themeManage')}
        </button>
        <button onClick={() => setTab('users')} className={tabClass(tab === 'users')}>
          {t('userManage')}
        </button>
        <button onClick={() => setTab('settings')} className={tabClass(tab === 'settings')}>
          {t('settings')}
        </button>
      </div>

      {/* ========== 主题管理 ========== */}
      {tab === 'themes' && (
        <>
          {/* 创建主题 */}
          <div className="bg-indigo-900/40 rounded-2xl border border-indigo-700/40 p-5 space-y-3">
            <h3 className="font-semibold text-purple-300">{t('createTheme')}</h3>
            <input
              placeholder={t('themeTitlePlaceholder')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-600/50 text-white placeholder-indigo-500 focus:outline-none focus:border-purple-500 text-sm"
            />
            <input
              placeholder={t('description')}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-600/50 text-white placeholder-indigo-500 focus:outline-none focus:border-purple-500 text-sm"
            />

            {/* 开奖方式 */}
            <div className="flex gap-2 items-center">
              <span className="text-xs text-indigo-400">{t('settlementMode')}:</span>
              <button
                onClick={() => setNewMode('admin')}
                className={`px-3 py-1 text-xs rounded-full ${
                  newMode === 'admin' ? 'bg-purple-600 text-white' : 'bg-indigo-800/50 text-indigo-400'
                }`}
              >
                {t('adminPick')}
              </button>
              <button
                onClick={() => setNewMode('random')}
                className={`px-3 py-1 text-xs rounded-full ${
                  newMode === 'random' ? 'bg-blue-600 text-white' : 'bg-indigo-800/50 text-indigo-400'
                }`}
              >
                🎲 {t('systemRandom')}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-indigo-400">{t('options')}:</p>
              {newOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder={`${t('options')} ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const copy = [...newOptions];
                      copy[i] = e.target.value;
                      setNewOptions(copy);
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-indigo-800/50 border border-indigo-600/50 text-white placeholder-indigo-500 focus:outline-none focus:border-purple-500 text-sm"
                  />
                  {newOptions.length > 2 && (
                    <button onClick={() => removeOption(i)} className="text-red-400 text-sm px-2">✕</button>
                  )}
                </div>
              ))}
              <button onClick={addOption} className="text-sm text-blue-400 hover:text-blue-300">
                {t('addOption')}
              </button>
            </div>
            <button
              onClick={handleCreateTheme}
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-95 text-sm disabled:opacity-50"
            >
              {loading ? t('loading') : t('create')}
            </button>
          </div>

          {/* 主题列表 */}
          {themes.map(theme => (
            <div key={theme._id} className="bg-indigo-900/40 rounded-2xl border border-indigo-700/40 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    theme.status === 'closed' ? 'bg-gray-600/50 text-gray-300' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {theme.status === 'closed' ? t('ended') : t('ongoing')}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-800/50 text-indigo-400">
                    {theme.settlementMode === 'random' ? `🎲 ${t('systemRandom')}` : t('adminPick')}
                  </span>
                  <h4 className="font-semibold">{theme.title}</h4>
                </div>
                <button onClick={() => handleDelete(theme._id)} className="text-red-400 text-xs hover:text-red-300">
                  {t('delete')}
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => fetchThemeStats(theme._id)} className="text-xs text-blue-400 hover:text-blue-300">
                  {t('refreshStats')}
                </button>
                {theme.status === 'open' && theme.settlementMode === 'random' && (
                  <button
                    onClick={() => handleRandomSettle(theme._id)}
                    className="text-xs text-orange-400 hover:text-orange-300"
                  >
                    🎲 {t('randomSettle')}
                  </button>
                )}
              </div>

              {/* 选项 & 结算按钮 */}
              <div className="space-y-2">
                {theme.options.map(opt => {
                  const stat = themeStats[theme._id]?.stats?.find((s: any) => s.optionId === opt._id);
                  const isWinner = theme.winnerOptionId === opt._id;
                  return (
                    <div key={opt._id} className={`flex items-center justify-between p-3 rounded-xl ${
                      isWinner ? 'bg-green-500/20 border border-green-500/50' : 'bg-indigo-800/30'
                    }`}>
                      <div>
                        <span className="text-sm">{opt.name}</span>
                        {stat && (
                          <span className="text-xs text-indigo-400 ml-2">
                            {stat.betCount}{t('persons')} / {(stat.totalAmount / 10000).toFixed(0)}{t('wan')} / {stat.winRate}%
                          </span>
                        )}
                        {isWinner && <span className="text-green-400 text-xs ml-2">&#10003; {t('winner')}</span>}
                      </div>
                      {theme.status === 'open' && theme.settlementMode === 'admin' && (
                        <button
                          onClick={() => handleSettle(theme._id, opt._id)}
                          className="px-3 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                        >
                          {t('selectWinner')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ========== 用户管理 ========== */}
      {tab === 'users' && (
        <div className="space-y-3">
          <div className="text-sm text-indigo-400 px-1">
            {t('totalUsers').replace('{count}', String(users.length))}
          </div>
          {users.map(u => (
            <div key={u._id} className="bg-indigo-900/40 rounded-2xl border border-indigo-700/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.name}</p>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <span className="text-yellow-400">{u.coins.toLocaleString()} {t('coins')}</span>
                    {u.wineGlasses > 0 && (
                      <span className="text-pink-400">🍷 {u.wineGlasses}</span>
                    )}
                    <span className="text-indigo-400">{t('rounds')}: {u.rounds}</span>
                  </div>
                </div>
                <input
                  type="number"
                  placeholder={t('coins')}
                  value={coinAmounts[u._id] || ''}
                  onChange={(e) => setCoinAmounts(prev => ({
                    ...prev, [u._id]: parseInt(e.target.value) || 0
                  }))}
                  className="w-24 px-2 py-1.5 rounded-lg bg-indigo-800/50 border border-indigo-600/50 text-white text-sm focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => handleGiveCoins(u._id)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                >
                  {t('giveCoins')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== 系统设置 ========== */}
      {tab === 'settings' && (
        <div className="bg-indigo-900/40 rounded-2xl border border-indigo-700/40 p-5 space-y-4">
          <h3 className="font-semibold text-purple-300">{t('systemSettings')}</h3>

          {settings && (
            <div className="p-3 rounded-xl bg-indigo-800/30 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-indigo-400">{t('currentPool')}:</span>
                <span className={`font-semibold ${settings.gameOver ? 'text-red-400' : 'text-green-400'}`}>
                  {(settings.currentPool / 10000).toFixed(0)}{t('wan')}
                  {settings.gameOver && ` (${t('gameOver').split('!')[0]})`}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-indigo-400 mb-1 block">{t('initialCoins')} ({t('wan')})</label>
              <input
                type="number"
                value={editSettings.initialCoins / 10000}
                onChange={(e) => setEditSettings(prev => ({
                  ...prev, initialCoins: (parseFloat(e.target.value) || 0) * 10000
                }))}
                className="w-full px-3 py-2 rounded-xl bg-indigo-800/50 border border-indigo-600/50 text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-indigo-400 mb-1 block">{t('minBetAmount')} ({t('wan')})</label>
              <input
                type="number"
                value={editSettings.minBet / 10000}
                onChange={(e) => setEditSettings(prev => ({
                  ...prev, minBet: (parseFloat(e.target.value) || 0) * 10000
                }))}
                className="w-full px-3 py-2 rounded-xl bg-indigo-800/50 border border-indigo-600/50 text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-indigo-400 mb-1 block">{t('maxBetAmount')} ({t('wan')})</label>
              <input
                type="number"
                value={editSettings.maxBet / 10000}
                onChange={(e) => setEditSettings(prev => ({
                  ...prev, maxBet: (parseFloat(e.target.value) || 0) * 10000
                }))}
                className="w-full px-3 py-2 rounded-xl bg-indigo-800/50 border border-indigo-600/50 text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-indigo-400 mb-1 block">{t('totalPrizePool')} ({t('wan')})</label>
              <input
                type="number"
                value={editSettings.totalPrizePool / 10000}
                onChange={(e) => setEditSettings(prev => ({
                  ...prev, totalPrizePool: (parseFloat(e.target.value) || 0) * 10000
                }))}
                className="w-full px-3 py-2 rounded-xl bg-indigo-800/50 border border-indigo-600/50 text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveSettings}
              className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-95 text-sm"
            >
              {t('save')}
            </button>
            <button
              onClick={handleResetPool}
              className="px-4 py-2.5 rounded-xl font-semibold text-orange-400 bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30 active:scale-95 text-sm"
            >
              {t('resetPool')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
