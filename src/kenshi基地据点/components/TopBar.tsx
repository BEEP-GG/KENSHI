import { AlertTriangle, CalendarDays, Coins, Maximize2, Menu, Minimize2, Send } from 'lucide-react';
import { GameState } from '../types';

export default function TopBar({
  state,
  onSubmitTurn,
  onSecretClick,
  testMode,
  hasRolledEvent,
  isFullscreen,
  onToggleFullscreen,
  onToggleMenu,
}: {
  state: GameState;
  onSubmitTurn: () => void;
  onSecretClick: (char: string) => void;
  testMode: boolean;
  hasRolledEvent: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onToggleMenu: () => void;
}) {
  const FullscreenIcon = isFullscreen ? Minimize2 : Maximize2;

  return (
    <div className="h-16 glass-panel border-b border-x-0 border-t-0 px-4 md:px-8 flex justify-between items-center z-10 sticky top-0">
      <div className="flex items-center space-x-2 text-slate-300">
        <button
          className="md:hidden mr-2 p-1 text-slate-400 hover:text-amber-400 transition-colors"
          onClick={onToggleMenu}
        >
          <Menu size={20} />
        </button>
        {testMode && (
          <div className="ml-2 md:ml-4 flex items-center space-x-1 px-3 py-1 rounded bg-red-900/40 border border-red-500/50 text-red-400 text-xs tracking-wider animate-pulse">
            <AlertTriangle size={14} />
            <span className="hidden md:inline">开发者测试模式已启用: 无视消耗要求</span>
            <span className="md:hidden">测试模式</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-6">
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex items-center justify-center gap-1 md:gap-2 border border-white/10 bg-black/30 hover:bg-white/10 text-slate-300 hover:text-amber-400 px-2 md:px-3 py-1.5 rounded-lg transition-all duration-300 shadow-[0_0_16px_rgba(0,0,0,0.35)] backdrop-blur-sm"
          aria-label={isFullscreen ? '退出全屏模式' : '进入全屏模式'}
          title={isFullscreen ? '退出全屏模式' : '进入全屏模式'}
        >
          <FullscreenIcon size={14} />
          <span className="hidden sm:inline text-xs tracking-wider">{isFullscreen ? '退出全屏' : '全屏'}</span>
        </button>

        <div
          onClick={() => onSecretClick('D')}
          className="flex items-center space-x-1 md:space-x-2 glass-card px-2 md:px-4 py-1.5 rounded-full border border-amber-900/30 cursor-pointer select-none"
        >
          <CalendarDays size={14} className="text-amber-500/70" />
          <span className="text-xs md:text-sm font-mono text-amber-500/90 tracking-widest hidden sm:inline">
            第 {state.day} 天
          </span>
          <span className="text-xs font-mono text-amber-500/90 sm:hidden">{state.day}</span>
        </div>

        <div
          onClick={() => onSecretClick('C')}
          className="flex items-center space-x-1 md:space-x-3 glass-card px-2 md:px-4 py-1.5 rounded-full bg-amber-500/5 border-amber-500/20 cursor-pointer select-none"
        >
          <Coins size={14} className="text-amber-500" />
          <div className="flex items-baseline space-x-1">
            <span className="hidden md:inline text-slate-400 text-xs">资金:</span>
            <span className="text-amber-400 font-mono font-medium text-glow text-sm md:text-base">
              {state.cats.toLocaleString()}
            </span>
            <span className="hidden sm:inline text-amber-500/50 text-xs tracking-wider">开币</span>
          </div>
        </div>

        <div className="relative group">
          <button
            onClick={hasRolledEvent ? onSubmitTurn : undefined}
            disabled={!hasRolledEvent}
            className={`flex items-center space-x-1 md:space-x-2 px-3 md:px-5 py-1.5 md:py-2.5 rounded-lg transition-all font-medium tracking-widest text-xs md:text-sm ${
              hasRolledEvent
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.3)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <Send size={14} className={hasRolledEvent ? 'text-amber-100' : 'text-slate-600'} />
            <span className="hidden sm:inline">结束回合 & 提交</span>
            <span className="sm:hidden">结束</span>
          </button>
          {!hasRolledEvent && (
            <div className="absolute top-full mt-2 right-0 bg-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 hidden md:block">
              请在“命运事件”终端掷出至少一次骰子，才能结束回合。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
