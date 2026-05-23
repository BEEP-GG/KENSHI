import { useEffect, useRef, useState } from 'react';
import { initialGameState, FACILITY_BLUEPRINTS } from './data';
import { TabState, Outpost } from './types';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Facilities from './components/Facilities';
import Personnel from './components/Personnel';
import Events from './components/Events';
import Outposts from './components/Outposts';
import Modal from './components/Modal';
import { CheckCircle } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState(initialGameState);
  const [activeTab, setActiveTab] = useState<TabState>('outposts');
  const [showCodeModal, setShowCodeModal] = useState(false);

  const [clickSeq, setClickSeq] = useState('');
  const [testMode, setTestMode] = useState(false);

  const [hasRolledEvent, setHasRolledEvent] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeReport, setIncomeReport] = useState<{ cats: number; resources: Record<string, number> }>({
    cats: 0,
    resources: {},
  });
  const [hasCollectedIncome, setHasCollectedIncome] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const fullscreenToggleLockRef = useRef(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    onFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const handleSecretClick = (char: string) => {
    setClickSeq(prev => {
      const next = (prev + char).slice(-8);
      if (next === 'CCCCDDCC' && !testMode) {
        setTestMode(true);
      }
      return next;
    });
  };

  const handleToggleFullscreen = async () => {
    if (fullscreenToggleLockRef.current) {
      return;
    }

    fullscreenToggleLockRef.current = true;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // ignore browser fullscreen policy errors
    } finally {
      window.setTimeout(() => {
        fullscreenToggleLockRef.current = false;
      }, 220);
    }
  };

  const handleBuild = (blueprintId: string, cost: Record<string, number> | undefined, targetLevel: number = 1) => {
    setGameState(prev => {
      let newResources = { ...prev.resources };
      if (!testMode && cost) {
        for (const [res, amount] of Object.entries(cost)) {
          newResources[res] = (newResources[res] || 0) - amount;
        }
      }

      return {
        ...prev,
        resources: newResources,
        facilities: [
          ...prev.facilities,
          {
            id: `fac-${Date.now()}`,
            blueprintId,
            outpostId: prev.currentOutpostId,
            level: targetLevel,
            workers: [],
            status: 'constructing',
          },
        ],
      };
    });
  };

  const handleUpgrade = (facilityId: string, cost: Record<string, number> | undefined) => {
    setGameState(prev => {
      const facility = prev.facilities.find(f => f.id === facilityId);
      if (!facility) return prev;

      const bp = FACILITY_BLUEPRINTS.find(b => b.id === facility.blueprintId);
      if (!bp || !bp.levels[facility.level + 1]) {
      consreturn prev; // At max level or invalid
      }

      let newResources = { ...prev.resources };
      if (!testMode && cost) {
        for (const [res, amount] of Object.entries(cost)) {
          newResources[res] = (newResources[res] || 0) - amount;
        }
      }

      return {
        ...prev,
        resources: newResources,
        facilities: prev.facilities.map(f => (f.id === facilityId ? { ...f, level: f.level + 1 } : f)),
      };
    });
  };

  const handleAssign = (employeeId: string, facilityId: string | undefined) => {
    setGameState(prev => {
      return {
        ...prev,
        employees: prev.employees.map(e =>
          e.id === employeeId ? { ...e, facilityId, status: facilityId ? 'working' : 'idle' } : e,
        ),
        facilities: prev.facilities.map(f => {
          let workers = f.workers.filter(id => id !== employeeId);
          if (f.id === facilityId) {
            workers.push(employeeId);
          }
          return { ...f, workers };
        }),
      };
    });
  };

  const handleAssignMultiple = (assignments: Record<string, string | undefined>) => {
    setGameState(prev => {
      let newEmployees = [...prev.employees];
      let newFacilities = [...prev.facilities];

      for (const [empId, facId] of Object.entries(assignments)) {
        newEmployees = newEmployees.map(e =>
          e.id === empId ? { ...e, facilityId: facId, status: facId ? 'working' : 'idle' } : e,
        );

        // Update facilities workers array
        newFacilities = newFacilities.map(f => {
          let workers = f.workers.filter(id => id !== empId); // remove from all first
          if (f.id === facId) {
            workers.push(empId);
          }
          return { ...f, workers };
        });
      }
      return {
        ...prev,
        employees: newEmployees,
        facilities: newFacilities,
      };
    });
  };

  const handleSelectOutpost = (id: string) => {
    setGameState(prev => ({ ...prev, currentOutpostId: id }));
    setActiveTab('dashboard'); // Switch to dashboard of selected outpost
  };

  const handleUpdateOutpost = (id: string, updates: any, cost?: Record<string, number>) => {
    setGameState(prev => {
      let newResources = { ...prev.resources };
      if (!testMode && cost) {
        for (const [res, amount] of Object.entries(cost)) {
          newResources[res] = (newResources[res] || 0) - amount;
        }
      }
      return {
        ...prev,
        resources: newResources,
        outposts: prev.outposts.map(o => (o.id === id ? { ...o, ...updates } : o)),
      };
    })cons
  };

  const handleCreateOutpost = (name: string, location: string) => {
    setGameState(prev => {
      const costCats = 3000;
      let nextCats = prev.cats;
      let nextResources = { ...prev.resources };

      if (!testMode) {
        nextCats -= costCats;
        nextResources['建筑材料'] = (nextResources['建筑材料'] || 0) - 10;
      }

      const newOutpost: Outpost = {
        id: `out-${Date.now()}`,
        name: name,
        location: location,
        status: 'operational',
        description: '一处新建的房屋基地，您的废土传奇由此续写。',
        level: 1, // Starts as 房屋 Level 1
      };

      return {
        ...prev,
        cats: nextCats,
        resources: nextResources,
        outposts: [...prev.outposts, newOutpost],
        currentOutpostId: newOutpost.id, // Auto select the new outpost
      };
    });
    setActiveTab('dashboard'); // Jump to dashboard of new outpost
  };

  const handleGenerateCode = () => {
    // 压缩当前核心状态用于后续接入后端读取（Base64编码JSON）
    const minState = {
      day: gameState.day,
      cats: gameState.cats,
      res: gameState.resources,
      fac: gameState.facilities.map(f => ({
        id: f.id,
        bp: f.blueprintId,
        lvl: f.level,
        st: f.status,
      })),
      emp: gameState.employees.map(e => ({
        id: e.id,
        n: e.name,
        r: e.role,
        hp: e.hp,
        maxHp: e.maxHp,
        fac: e.facilityId || 0,
        s: e.stats,
        t: e.traits,
      })),
    };

    // 生成一串包含特定标识的Base64字符串作为状态序列号
    const rawJson = JSON.stringify(minState);
    const base64Code = btoa(unescape(encodeURIComponent(rawJson)));
    const formattedCode = `KNS-${base64Code}`;

    // 开发者需求：在前端不显示具体代码，而是放在后台/控制台供后续获取
    console.log('[Dev] 提报至后台的状态数据:', formattedCode);

    // Increase day count and reset hasRolledEvent
    setGameState(prev => ({
      ...prev,
      day: prev.day + 1,
    }));
    setHasRolledEvent(false);
    setHasCollectedIncome(false);

    setShowCodeModal(true);
  };

  const handleCollectIncome = () => {
    if (hasCollectedIncome) return;
    setHasCollectedIncome(true);
    let earnedCats = 0;
    let earnedResources: Record<string, number> = {};

    setGameState(prev => {
      let nextState = { ...prev, cats: prev.cats, resources: { ...prev.resources } };

      prev.facilities.forEach(fac => {
        if (fac.status === 'active') {
          const bp = FACILITY_BLUEPRINTS.find(b => b.id === fac.blueprintId);
          if (bp) {
            const levelData = bp.levels[fac.level];
            if (levelData && levelData.productionType) {
              const rate =
                typeof levelData.productionRate === 'number'
                  ? levelData.productionRate
                  : parseInt(levelData.productionRate.toString()) || 0;

              if (levelData.productionType === 'Cats/天') {
                earnedCats += rate;
                nextState.cats += rate;
              } else if (levelData.productionType.endsWith('/天')) {
                const resName = levelData.productionType.replace('/天', '');
                earnedResources[resName] = (earnedResources[resName] || 0) + rate;
                nextState.resources[resName] = (nextState.resources[resName] || 0) + rate;
              }
            }
          }
        }
      });

      return nextState;
    });

    setIncomeReport({ cats: earnedCats, resources: earnedResources });
    setShowIncomeModal(true);
  };

  const handleRenameFacility = (facId: string, customName: string) => {
    setGameState(prev => ({
      ...prev,
      facilities: prev.facilities.map(f => (f.id === facId ? { ...f, customName } : f)),
    }));
  };

  return (
    <div className="min-h-screen flex text-slate-300 overflow-hidden font-sans select-none selection:bg-amber-500/30 selection:text-white">
      {/* Structural Layout */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={tab => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative scroll-smooth overflow-x-hidden">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-900/10 blur-[120px] rounded-full pointer-events-none" />

        <TopBar
          state={gameState}
          onSubmitTurn={handleGenerateCode}
          onSecretClick={handleSecretClick}
          testMode={testMode}
          hasRolledEvent={hasRolledEvent}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleMenu={() => setIsMobileMenuOpen(true)}
        />

        <div className="flex-1 relative z-10 max-w-7xl mx-auto w-full pb-20">
          {activeTab === 'dashboard' && (
            <Dashboard
              state={gameState}
              onCollectIncome={handleCollectIncome}
              hasCollectedIncome={hasCollectedIncome}
            />
          )}
          {activeTab === 'outposts' && (
            <Outposts
              state={gameState}
              onSelectOutpost={handleSelectOutpost}
              onUpdateOutpost={handleUpdateOutpost}
              onCreateOutpost={handleCreateOutpost}
              testMode={testMode}
            />
          )}
          {activeTab === 'facilities' && (
            <Facilities
              state={gameState}
              testMode={testMode}
              onBuild={handleBuild}
              onUpgrade={handleUpgrade}
              onAssign={handleAssign}
              onAssignMultiple={handleAssignMultiple}
              onRenameFacility={handleRenameFacility}
            />
          )}
          {activeTab === 'personnel' && <Personnel state={gameState} />}
          {activeTab === 'events' && <Events state={gameState} onRollEvent={() => setHasRolledEvent(true)} />}
        </div>
      </main>

      <Modal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        title="回合状态已提交"
        icon={<CheckCircle size={20} />}
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-400 leading-relaxed text-center">
            本回合的设施调配与人员部署已被记录，并流转至后端运算模块。
          </p>

          <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-6 relative group overflow-hidden border-dashed">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none"></div>
            <div className="flex flex-col items-center justify-center space-y-4 relative z-10 py-4">
              <CheckCircle size={48} className="text-emerald-500 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <div className="text-xl text-emerald-400 tracking-widest font-mono font-medium">数据提报完成</div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowCodeModal(false)}
              className="px-8 py-2.5 rounded-lg font-medium tracking-widest transition-all bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/40 hover:text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            >
              返回演习终端
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showIncomeModal} onClose={() => setShowIncomeModal(false)} title="今日产出清算报告">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">基地内各生产线和商业设施已经完成了今日的产出。以下物品已入库：</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 border border-white/5 p-4 rounded-lg">
              <div className="text-xs text-slate-500 mb-1 tracking-wider uppercase">记账资金库藏 (Cats)</div>
              <div className="text-xl text-amber-500 font-mono">+{incomeReport.cats.toLocaleString()}</div>
            </div>

            {Object.entries(incomeReport.resources).map(([res, amount]) => (
              <div key={res} className="bg-black/30 border border-white/5 p-4 rounded-lg">
                <div className="text-xs text-slate-500 mb-1 tracking-wider">{res}</div>
                <div className="text-xl text-emerald-400 font-mono">+{amount}</div>
              </div>
            ))}

            {incomeReport.cats === 0 && Object.keys(incomeReport.resources).length === 0 && (
              <div className="col-span-2 text-center text-slate-500 py-6 border border-white/5 border-dashed rounded bg-white/5">
                没有任何产出。请确保您的设施处于活动状态并具有生产能力。
              </div>
            )}
          </div>
          <button
            onClick={() => setShowIncomeModal(false)}
            className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium tracking-widest text-sm transition-colors border border-white/10"
          >
            确认并继续
          </button>
        </div>
      </Modal>
    </div>
  );
}
