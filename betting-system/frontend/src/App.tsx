import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { t, getLang, setLang, onLangChange } from './services/i18n';
import { getSettings as fetchSettings } from './services/api';
import socket from './services/socket';

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

type Page = 'home' | 'leaderboard' | 'admin';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('home');
  const [lang, setLangState] = useState(getLang());
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    return onLangChange(() => setLangState(getLang()));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetchSettings();
      setSettings(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (user) loadSettings();
  }, [user, loadSettings]);

  useEffect(() => {
    socket.on('settingsUpdate', (s: Settings) => setSettings(s));
    return () => { socket.off('settingsUpdate'); };
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    setPage('home');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (partial: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...partial };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  const toggleLang = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
  };

  void lang;

  if (!user) {
    return (
      <>
        <Toaster position="top-center" />
        <LoginPage onLogin={handleLogin} toggleLang={toggleLang} lang={lang} />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      {/* 顶部导航 - 马年新春风格 */}
      <header className="sticky top-0 z-50 bg-red-950/95 backdrop-blur-md border-b border-yellow-800/30">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-300 via-red-400 to-yellow-300 bg-clip-text text-transparent flex items-center gap-1.5">
              🐴 {t('appName')}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLang}
                className="px-2 py-1 text-xs rounded-full bg-red-900/50 text-yellow-300 border border-yellow-700/30"
              >
                {lang === 'zh' ? 'EN' : '中'}
              </button>
              {user.isAdmin && (
                <button
                  onClick={() => setPage(page === 'admin' ? 'home' : 'admin')}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    page === 'admin'
                      ? 'bg-yellow-600/30 text-yellow-300 border-yellow-500/40'
                      : 'bg-orange-600/20 text-orange-400 border-orange-500/30'
                  }`}
                >
                  {page === 'admin' ? t('back') : t('admin')}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-xs rounded-full bg-red-800/30 text-red-300 border border-red-600/30"
              >
                {t('logout')}
              </button>
            </div>
          </div>
          {/* 用户信息栏 */}
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-yellow-200/80">{user.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 font-semibold">
                {user.coins.toLocaleString()} {t('coins')}
              </span>
              {user.wineGlasses > 0 && (
                <span className="text-pink-400 font-semibold">🍷 {user.wineGlasses}</span>
              )}
              {settings && (
                <span className="text-green-400 text-xs">
                  {t('prizePool')}: {(settings.totalPrizePool / 10000).toFixed(0)}{t('wan')}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-20">
        {settings?.gameOver && (
          <div className="mt-4 p-4 rounded-2xl bg-red-800/30 border border-yellow-600/30 text-center text-yellow-300 font-semibold">
            {t('gameOver')}
          </div>
        )}

        {page === 'admin' && user.isAdmin ? (
          <AdminPage settings={settings} onSettingsChange={loadSettings} />
        ) : page === 'leaderboard' ? (
          <LeaderboardPage />
        ) : (
          <HomePage user={user} updateUser={updateUser} settings={settings} />
        )}
      </main>

      {/* 底部导航栏 */}
      {page !== 'admin' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-red-950/95 backdrop-blur-md border-t border-yellow-800/30 z-50">
          <div className="max-w-lg mx-auto flex">
            <button
              onClick={() => setPage('home')}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all ${
                page === 'home'
                  ? 'text-yellow-300 border-t-2 border-yellow-400'
                  : 'text-red-400/60'
              }`}
            >
              🎲 {t('bet')}
            </button>
            <button
              onClick={() => setPage('leaderboard')}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all ${
                page === 'leaderboard'
                  ? 'text-yellow-300 border-t-2 border-yellow-400'
                  : 'text-red-400/60'
              }`}
            >
              🏆 {t('leaderboard')}
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
