export interface EmployeeStats {
  力量: number;
  敏捷: number;
  感知: number;
  体质: number;
  智力: number;
  意志: number;
  魅力: number;
}

export interface FacilityLevel {
  level: number;
  name: string;
  description: string;
  productionRate: number | string;
  productionType: string;
  maxWorkers: number;
  upgradeCost?: Record<string, number>; // 例如: {'建筑材料': 5, '铁原板': 2}
  requiredOutpostLevel?: number;
}

export interface FacilityBlueprint {
  id: string;
  category: '防御' | '生产' | '锻造' | '基建' | '娱乐' | '囚禁';
  icon: string;
  statScaling: Array<keyof EmployeeStats>;
  levels: Record<number, FacilityLevel>;
}

export interface Outpost {
  id: string;
  name: string;
  location: string;
  status: 'operational' | 'under-siege' | 'abandoned';
  description: string;
  level: number;
}

export interface Facility {
  id: string;
  blueprintId: string;
  outpostId: string;
  level: number;
  customName?: string;
  workers: string[];
  status: 'active' | 'constructing' | 'idle';
}

export interface Employee {
  id: string;
  name: string;
  race: string;
  role: string;
  status: 'working' | 'idle' | 'injured';
  facilityId?: string;
  outpostId: string;
  traits: string[];
  hp: number;
  maxHp: number;
  stats: EmployeeStats;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  rollRequired: boolean;
  type: 'good' | 'bad' | 'neutral' | 'urgent';
  resolved: boolean;
  target?: number;
}

export interface GameState {
  cats: number; // Currency
  resources: Record<string, number>; // 存储物品及数量
  day: number;
  currentOutpostId: string;
  outposts: Outpost[];
  facilities: Facility[];
  employees: Employee[];
  events: GameEvent[];
}

export type TabState = 'dashboard' | 'facilities' | 'personnel' | 'events' | 'outposts';
