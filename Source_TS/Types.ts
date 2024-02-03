
type ConfirmationMode = 'All' | 'Safe' | 'None';

type BuildingEffect = 'producing' | 'improving' | 'delaying';
type UpgradeThingy = 'upgrades' | 'researches' | 'researchesExtra' | 'researchesAuto' | 'ASR';

export type overlimit = [number, number];

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Version = 
    | '0.0.0'
    | `v0.${0|1}.${Digit}`
    ;

export const Tabs = ['stage', 'settings', 'upgrade', 'strangeness'] as const;

export type Tab = 
    typeof Tabs[number]
    | 'Elements'
    ;

export const VALID_SUBTABS = {
  stageSubtabs: ['Structures', 'Advanced'],
  settingsSubtabs: ['Settings', 'History', 'Stats'],
  upgradeSubtabs: ['Upgrades', 'Elements'],
  strangenessSubtabs: ['Matter', 'Milestones'],
  ElementsSubtabs: [] as string[],
} as const;

export interface playerType {
  version: Version;
  fileName: string;
  separator: string[];
  stage: Stage;
  discharge: Discharge;
  vaporization: Vaporization;
  accretion: Accretion;
  collapse: Collapse;
  inflation: Inflation;
  intervals: Intervals;
  time: TimeStats;
  buildings: Buildings;
  strange: Strange[];
  upgrades: number[][];
  researches: number[][];
  researchesExtra: number[][];
  researchesAuto: number[];
  ASR: number[];
  elements: number[];
  strangeness: number[][];
  milestones: number[][];
  challenges: Challenges;
  toggles: Toggles;
  history: History;
  event: boolean;
}
  
export interface globalType {
  tab: Tab;
  subtab: SubTabInfo;
  tabList: TabList;
  debug: Debug;
  trueActive: number;
  lastSave: number;
  paused: boolean;
  footer: boolean;
  mobileDevice: boolean;
  screenReader: boolean;
  supportSettings: boolean[];
  automatization: Automatization;
  theme: number | undefined;
  dischargeInfo: DischargeInfo;
  vaporizationInfo: VaporizationInfo;
  accretionInfo: AccretionInfo;
  collapseInfo: CollapseInfo;
  inflationInfo: InflationInfo;
  intervalsId: Partial<Intervals>;
  stageInfo: StageInfo;
  buildingsInfo: BuildingsInfo;
  strangeInfo: StrangeInfo;
  upgradesInfo: UpgradeInfo[];
  researchesInfo: ResearchInfo[];
  researchesExtraInfo: ResearchExtraInfo[];
  researchesAutoInfo: ResearchesAutoInfo;
  ASRInfo: ASRInfo;
  elementsInfo: ElementsInfo;
  strangenessInfo: StrangenessInfo[];
  lastUpgrade: Array<[number, UpgradeThingy]>;
  lastElement: number;
  lastStrangeness: [number, number];
  lastMilestone: [number, number];
  lastChallenge: [number, number];
  milestonesInfo: MilestoneInfo[];
  challengesInfo: ChallengesInfo;
  historyStorage: {
    stage: number[][];
  };
}
  
interface Stage {
  true: number;
  current: number;
  active: number;
  resets: number;
  export: number;
  best: number;
  time: number;
  input: number;
}

interface Discharge {
  energy: number;
  energyMax: number;
  current: number;
}

interface Vaporization {
  clouds: overlimit;
  cloudsMax: overlimit;
  input: number;
}

interface Accretion {
  rank: number;
}

interface Collapse {
  mass: number;
  massMax: number;
  stars: [number, number, number];
  show: number;
  input: number;
}

interface Inflation {
  vacuum: boolean;
  age: number;
}

interface Intervals {
  main: number;
  numbers: number;
  visual: number;
  autoSave: number;
}

interface TimeStats {
  updated: number;
  started: number;
  offline: number;
  online: number;
  stage: number;
  universe: number;
}

interface BuildingStat {
  current: overlimit;
  total: overlimit;
  trueTotal: overlimit;
  highest: overlimit;
}

interface TrueBuildingStat extends BuildingStat {
  true: number;
}

type Buildings = Array<[
  BuildingStat, ...TrueBuildingStat[],
]>;

interface Strange {
  current: number;
  total: number;
}

interface Challenges {
  active: number;
  void: number[];
}

interface Toggles {
  normal: boolean[];
  confirm: ConfirmationMode[];
  buildings: boolean[][];
  hover: boolean[];
  max: boolean[];
  auto: boolean[];
  shop: {
    howMany: number;
    input: number;
    wait: number[];
  };
}

interface History {
  stage: {
    best: number[];
    list: number[][];
    input: [number, number];
  };
}
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
// Too clever? Maybe...
type SubTabInfo = {
  [K in Tab as `${K}Current`]: typeof VALID_SUBTABS[`${K}Subtabs`][number] | string; // TODO fix Update code to eliminate never assignment issue
  
};
type TabList = {
  tabs: Tab[];
} & {
  [K in Tab as `${K}Subtabs`]: Mutable<typeof VALID_SUBTABS[`${K}Subtabs`]> | string[];
};

interface Debug {
  errorID: boolean;
  errorQuery: boolean;
  errorGain: boolean;
  rankUpdated: number;
  historyStage: number;
}

interface Automatization {
  autoU: number[][];
  autoR: number[][];
  autoE: number[][];
  elements: number[];
}

interface DischargeInfo {
  getEnergy: (index: number, stageIndex: number) => number;
  energyType: number[][];
  energyTrue: number;
  tritium: overlimit;
  base: number;
  total: number;
  next: number;
}

interface VaporizationInfo {
  strength: overlimit;
  dropsEff: overlimit;
  tension: number;
  stress: number;
  research0: number;
  research1: number;
  get: overlimit;
}

interface AccretionInfo {
  effective: number;
  rankU: number[];
  rankR: number[];
  rankE: number[];
  rankCost: number[];
  rankColor: string[];
  rankName: string[];
  rankImage: string[];
}

interface CollapseInfo {
  massEffect: number;
  starEffect: [number, number, number];
  unlockB: number[];
  unlockG: number[];
  unlockU: number[];
  unlockR: number[];
  newMass: number;
  starCheck: [number, number, number];
  trueStars: number;
}

interface InflationInfo {
  globalSpeed: number;
  preonCap: overlimit;
  dustCap: overlimit;
  massCap: number;
  preonTrue: overlimit;
  dustTrue: overlimit;
}

interface StageInfo {
  word: string[];
  textColor: string[];
  buttonBorder: string[];
  imageBorderColor: string[];
  activeAll: number[];
}

interface BuildingsInfo {
  maxActive: number[];
  name: string[][];
  hoverText: string[][];
  type: Array<['', ...BuildingEffect[]]>;
  firstCost: number[][];
  startCost: number[][];
  increase: number[][];
  producing: overlimit[][];
}

interface StrangeInfo {
  gain(stage: number): number;
  name: string[];
  stageBoost: Array<number | undefined>;
  instability: number;
}

interface UpgradeInfo {
  name: string[];
  effectText: Array<() => string>;
  startCost: number[];
  maxActive: number;
}

interface ResearchInfo {
  name: string[];
  effectText: Array<() => string>;
  cost: number[];
  startCost: number[];
  scaling: number[];
  max: number[];
  maxActive: number;
}

interface ResearchExtraInfo {
  name: string[];
  effectText: Array<() => string>;
  cost: number[];
  startCost: number[];
  scaling: number[];
  max: number[];
  maxActive: number;
}

interface ResearchesAutoInfo {
  name: string[];
  effectText: Array<() => string>;
  costRange: number[][];
  max: number[];
  autoStage: number[][];
}

interface ASRInfo {
  name: string;
  effectText(): string;
  costRange: number[][];
  max: number[];
}

interface ElementsInfo {
  name: string[];
  effectText: Array<() => string>;
  startCost: number[];
}

interface StrangenessInfo {
  name: string[];
  effectText: Array<() => string>;
  cost: number[];
  startCost: number[];
  scaling: number[];
  max: number[];
  maxActive: number;
}

interface MilestoneInfo {
  name: string[];
  need: overlimit[];
  reward: number[];
  scalingOld: number[][];
  needText: Array<() => string>;
  rewardText: Array<() => string>;
}

interface ChallengesInfo {
  name: string[];
  description: string[];
  effectText: Array<() => string>;
  needText: string[][][];
  rewardText: string[][][];
  color: string[];
}