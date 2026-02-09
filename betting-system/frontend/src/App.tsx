import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
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
    setShowAdmin(false);
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

  // force re-render on lang change
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
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-indigo-950/90 backdrop-blur-md border-b border-indigo-800/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {t('appName')}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLang}
                className="px-2 py-1 text-xs rounded-full bg-indigo-800/50 text-indigo-300 border border-indigo-600/30"
              >
                {lang === 'zh' ? 'EN' : '中'}
              </button>
              {user.isAdmin && (
                <button
                  onClick={() => setShowAdmin(!showAdmin)}
                  className="px-3 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30"
                >
                  {showAdmin ? t('back') : t('admin')}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30"
              >
                {t('logout')}
              </button>
            </div>
          </div>
          {/* 用户信息栏 */}
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-indigo-300">{user.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 font-semibold">
                {user.coins.toLocaleString()} {t('coins')}
              </span>
              {user.wineGlasses > 0 && (
                <span className="text-pink-400 font-semibold">
                  🍷 {user.wineGlasses}
                </span>
              )}
              {settings && (
                <span className="text-green-400 text-xs">
                  {t('prizePool')}: {(settings.currentPool / 10000).toFixed(0)}{t('wan')}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {settings?.gameOver && (
          <div className="mt-4 p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-center text-red-300 font-semibold">
            {t('gameOver')}
          </div>
        )}
        {showAdmin && user.isAdmin ? (
          <AdminPage settings={settings} onSettingsChange={loadSettings} />
        ) : (
          <HomePage user={user} updateUser={updateUser} settings={settings} />
        )}
      </main>
    </>
  );
}
