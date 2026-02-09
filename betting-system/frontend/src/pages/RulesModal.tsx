import { t } from '../services/i18n';

interface Props {
  onClose: () => void;
}

export default function RulesModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-md mx-4 max-h-[85vh] flex flex-col bg-gradient-to-br from-red-950 via-red-900 to-red-950 rounded-2xl border border-yellow-700/40 shadow-2xl shadow-black/50 overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-yellow-700/30">
          <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">📜</span> {t('rulesTitle')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-800/50 border border-red-700/30 text-red-300 flex items-center justify-center hover:bg-red-700/50 active:scale-90 text-lg"
          >
            ×
          </button>
        </div>

        {/* 规则内容 - 可滚动 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap text-sm text-yellow-100/90 leading-relaxed font-sans">
            {t('rulesContent')}
          </pre>
        </div>

        {/* 底部按钮 */}
        <div className="px-5 py-4 border-t border-yellow-700/30">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-base font-bold text-yellow-100 bg-gradient-to-r from-red-700 via-red-600 to-red-700 border border-yellow-500/40 active:scale-95 shadow-lg shadow-red-900/30"
          >
            {t('rulesClose')}
          </button>
        </div>
      </div>
    </div>
  );
}
