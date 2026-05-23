import { TabState } from '../types';
import { LayoutGrid, Factory, Users, Dices, Settings, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: TabState;
  onTabChange: (tab: TabState) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ activeTab, onTabChange, isOpen = false, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const tabs: { id: TabState; label: string; icon: any }[] = [
    { id: 'outposts', label: '资产据点', icon: Settings },
    { id: 'dashboard', label: '统御核心', icon: LayoutGrid },
    { id: 'facilities', label: '设施阵列', icon: Factory },
    { id: 'personnel', label: '人员编制', icon: Users },
    { id: 'events', label: '命运事件', icon: Dices },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      <div className={`glass-panel border-r border-t-0 border-b-0 border-l-0 flex flex-col h-full fixed md:relative z-50 left-0 top-0 transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'md:w-20' : 'w-64'}`}>
        <div className={`p-6 flex items-center justify-between ${isCollapsed ? 'md:justify-center' : ''}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 shrink-0 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
              <Settings size={18} className="text-amber-500" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="md:block block">
                <h1 className={`text-xl font-semibold tracking-widest text-slate-100 text-glow whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'md:hidden' : ''}`}>指挥中枢</h1>
              </div>
            )}
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={onToggleCollapse}
          className="hidden md:flex absolute top-7 -right-3 w-6 h-6 bg-slate-800 border border-white/10 rounded-full items-center justify-center text-slate-400 hover:text-white hover:border-amber-500/50 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2 py-6' : 'px-4 py-6'} space-y-2`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                title={isCollapsed ? tab.label : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-4 px-4'} py-3 rounded-lg transition-all duration-300 relative group
                  ${isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-8 bg-amber-500 rounded-r-md shadow-[0_0_10px_rgba(217,119,6,0.8)]"
                  />
                )}
                <Icon size={20} className={isActive ? 'opacity-100 shrink-0' : 'opacity-70 shrink-0 group-hover:opacity-100 transition-opacity'} />
                {(!isCollapsed || isOpen) && (
                  <span className={`font-medium tracking-wide whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'md:hidden' : ''}`}>{tab.label}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </>
  );
}
