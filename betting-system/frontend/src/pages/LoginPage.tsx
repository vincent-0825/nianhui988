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
            className="px-3 py-1 text-xs rounded-full bg-indigo-800/50 text-indigo-300 border border-indigo-600/30"
          >
            {lang === 'zh' ? 'English' : '中文'}
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎰</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-orange-400 bg-clip-text text-transparent">
            {t('loginTitle')}
          </h1>
          <p className="text-indigo-300 mt-2 text-sm">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-indigo-900/50 rounded-2xl p-6 border border-indigo-700/50 backdrop-blur-sm">
            <input
              type="text"
              placeholder={t('enterName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-indigo-800/50 border border-indigo-600/50 text-white placeholder-indigo-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-center text-lg"
              autoFocus
            />

            {isAdmin && (
              <input
                type="password"
                placeholder={t('adminPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-3 px-4 py-3 rounded-xl bg-indigo-800/50 border border-indigo-600/50 text-white placeholder-indigo-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-center"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? t('loading') : t('enterGame')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAdmin(!isAdmin)}
            className="w-full text-center text-xs text-indigo-500 hover:text-indigo-400"
          >
            {isAdmin ? t('backToNormal') : t('adminLogin')}
          </button>
        </form>
      </div>
    </div>
  );
}
