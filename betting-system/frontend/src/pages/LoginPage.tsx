import { useState } from 'react';
import toast from 'react-hot-toast';
import { login } from '../services/api';
import { t } from '../services/i18n';

interface Props {
  onLogin: (user: any) => void;
  toggleLang: () => void;
  lang: string;
}

export default function LoginPage({ onLogin, toggleLang, lang }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('pleaseEnterName'));
      return;
    }
    setLoading(true);
    try {
      const res = await login(name.trim(), isAdmin ? password : undefined);
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
      toast.success(t('loginSuccess'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('loginFail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* 装饰灯笼 */}
      <div className="absolute top-4 left-6 text-4xl animate-lantern opacity-80">🏮</div>
      <div className="absolute top-8 right-8 text-3xl animate-lantern-alt opacity-70">🏮</div>
      <div className="absolute top-2 left-1/3 text-2xl animate-lantern-alt opacity-50">🧧</div>
      <div className="absolute top-6 right-1/3 text-2xl animate-lantern opacity-50">🧧</div>

      {/* 装饰金色光点 */}
      <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-yellow-400/40 animate-sparkle" />
      <div className="absolute top-32 right-12 w-1.5 h-1.5 rounded-full bg-yellow-300/30 animate-sparkle" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-40 left-8 w-2 h-2 rounded-full bg-yellow-400/30 animate-sparkle" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 right-10 w-1.5 h-1.5 rounded-full bg-yellow-300/40 animate-sparkle" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* 语言切换 */}
        <div className="text-right mb-4">
          <button
            onClick={toggleLang}
            className="px-3 py-1 text-xs rounded-full bg-red-900/50 text-yellow-300 border border-yellow-600/30"
          >
            {lang === 'zh' ? 'English' : '中文'}
          </button>
        </div>

        <div className="text-center mb-8">
          {/* 新春横幅 */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-3xl animate-lantern">🏮</span>
            <div className="text-6xl">🐴</div>
            <span className="text-3xl animate-lantern-alt">🏮</span>
          </div>
          <div className="inline-block px-6 py-1 rounded-full bg-gradient-to-r from-yellow-600/20 via-red-600/20 to-yellow-600/20 border border-yellow-500/30 mb-3">
            <p className="text-yellow-400 text-sm font-medium">{t('springGreeting')}</p>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 via-red-400 to-yellow-300 bg-clip-text text-transparent">
            {t('loginTitle')}
          </h1>
          <p className="text-red-300/80 mt-2 text-sm">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-950/60 rounded-2xl p-6 border-2 border-yellow-700/40 backdrop-blur-sm shadow-lg shadow-red-950/50 couplet-border">
            <input
              type="text"
              placeholder={t('enterName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-red-900/40 border border-yellow-700/30 text-yellow-50 placeholder-red-400/60 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-center text-lg"
              autoFocus
            />

            {isAdmin && (
              <input
                type="password"
                placeholder={t('adminPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-3 px-4 py-3 rounded-xl bg-red-900/40 border border-yellow-700/30 text-yellow-50 placeholder-red-400/60 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-center"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:via-red-500 hover:to-red-600 disabled:opacity-50 transition-all active:scale-95 border border-yellow-500/40 shadow-lg shadow-red-900/50 text-base"
            >
              {loading ? t('loading') : `🎊 ${t('enterGame')}`}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAdmin(!isAdmin)}
            className="w-full text-center text-xs text-red-400/60 hover:text-red-300"
          >
            {isAdmin ? t('backToNormal') : t('adminLogin')}
          </button>
        </form>

        {/* 底部装饰 */}
        <div className="text-center mt-8 text-red-400/30 text-xs flex items-center justify-center gap-2">
          <span>✦</span>
          <span>{t('springGreeting')}</span>
          <span>✦</span>
        </div>
      </div>
    </div>
  );
}
