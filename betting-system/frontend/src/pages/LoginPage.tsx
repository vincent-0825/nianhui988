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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
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
          <div className="text-6xl mb-2">🐴</div>
          <p className="text-yellow-400 text-sm mb-2">{t('springGreeting')}</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 via-red-400 to-yellow-300 bg-clip-text text-transparent">
            {t('loginTitle')}
          </h1>
          <p className="text-red-300/80 mt-2 text-sm">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-950/60 rounded-2xl p-6 border border-yellow-700/30 backdrop-blur-sm shadow-lg shadow-red-950/50">
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
              className="w-full mt-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 disabled:opacity-50 transition-all active:scale-95 border border-yellow-600/30 shadow-lg"
            >
              {loading ? t('loading') : t('enterGame')}
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
      </div>
    </div>
  );
}
