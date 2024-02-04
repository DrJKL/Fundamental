
type ConfirmationMode = 'All' | 'Safe' | 'None';

type BuildingEffect = 'producing' | 'improving' | 'delaying';
type UpgradeThingy = 'upgrades' | 'researches' | 'researchesExtra' | 'researchesAuto' | 'ASR';

export type overlimit = [number, number];

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Version = 
    | '0.0.0'
    | `v0.${0|1}.${Digit}`
    ;

const Tabs = ['stage', 'settings', 'upgrade', 'strangeness'] as const;

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
  separator: readonly string[];
  readonly stage: Stage;
  readonly discharge: Discharge;
  readonly vaporization: Vaporization;
  accretion: Accretion;
  collapse: Collapse;
  inflation: Inflation;
  intervals: Intervals;
  readonly time: TimeStats;
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
  readonly subtab: SubTabInfo;
  readonly tabList: TabList;
  readonly debug: Debug;
  trueActive: number;
  lastSave: number;
  paused: boolean;
  readonly footer: boolean;
  mobileDevice: boolean;
  screenReader: boolean;
  readonly supportSettings: boolean[];
  readonly automatization: Automatization;
  readonly theme: number | undefined;
  readonly dischargeInfo: DischargeInfo;
  readonly vaporizationInfo: VaporizationInfo;
  readonly accretionInfo: AccretionInfo;
  readonly collapseInfo: CollapseInfo;
  readonly inflationInfo: InflationInfo;
  readonly intervalsId: Partial<Intervals>;
  readonly stageInfo: StageInfo;
  readonly buildingsInfo: BuildingsInfo;
  readonly strangeInfo: StrangeInfo;
  readonly upgradesInfo: readonly UpgradeInfo[];
  readonly researchesInfo: readonly ResearchInfo[];
  readonly researchesExtraInfo: readonly ResearchExtraInfo[];
  readonly researchesAutoInfo: ResearchesAutoInfo;
  readonly ASRInfo: ASRInfo;
  readonly elementsInfo: ElementsInfo;
  readonly strangenessInfo: readonly StrangenessInfo[];
  readonly lastUpgrade: Array<[number, UpgradeThingy]>;
  lastElement: number;
  lastStrangeness: [number, number];
  lastMilestone: [number, number];
  lastChallenge: [number, number];
  readonly milestonesInfo: readonly MilestoneInfo[];
  readonly challengesInfo: ChallengesInfo;
  readonly historyStorage: {
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
  buildings: readonly boolean[][];
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
    best: readonly number[];
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

const rankU = [1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 5] as const; // Upgrades
const rankR = [1, 1, 2, 2, 3, 3, 3, 4, 5] as const; // Researches
const rankE = [2, 3, 4, 5, 3] as const; // Researches Extra
// const rankCost = [5.9722e27, 1e-7, 1e10, 1e24, 5e29, 2.455_760_45e31, 0] as const;
const rankColors =  ['blue', 'cyan', 'gray', 'gray', 'gray', 'darkviolet', 'orange'] as const;
const rankNames = ['Ocean world', 'Cosmic dust', 'Meteoroid', 'Asteroid', 'Planet', 'Jovian planet', 'Protostar'] as const;
const rankImages = ['Ocean%20world.png', 'Dust.png', 'Meteoroids.png', 'Asteroid.png', 'Planet.png', 'Giant.png', 'Protostar.png'] as const;

interface AccretionInfo {
  effective: number;
  rankU: typeof rankU;
  rankR: typeof rankR;
  rankE: typeof rankE;
  rankCost: number[];
  rankColor: typeof rankColors;
  rankName: typeof rankNames;
  rankImage: typeof rankImages;
}

interface CollapseInfo {
  massEffect: number;
  starEffect: [number, number, number];
  unlockB: readonly number[];
  unlockG: readonly number[];
  unlockU: readonly number[];
  unlockR: readonly number[];
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

const word = ['', 'Microworld', 'Submerged', 'Accretion', 'Interstellar', 'Intergalactic', 'Void'] as const;
const textColor = ['', 'cyan', 'blue', 'gray', 'orange', 'darkorchid', 'darkviolet'] as const;
const buttonBorder = ['', 'darkcyan', '#386cc7', '#424242', '#a35700', '#8f004c', '#6c1ad1'] as const;
const imageBorderColor = ['', '#008b8b', '#1460a8', '#5b5b75', '#e87400', '#b324e2', '#5300c1'] as const;

interface StageInfo {
  word: typeof word;
  textColor: typeof textColor;
  buttonBorder: typeof buttonBorder;
  imageBorderColor: typeof imageBorderColor;
  activeAll: number[];
}

interface BuildingsInfo {
  maxActive: number[];
  name: readonly string[][];
  hoverText: readonly string[][];
  type: ReadonlyArray<['', ...BuildingEffect[]]>;
  firstCost: number[][];
  startCost: number[][];
  increase: readonly number[][];
  producing: overlimit[][];
}

interface StrangeInfo {
  gain(stage: number): number;
  name: ['Strange quarks', 'Strangelets'];
  stageBoost: Array<number | undefined>;
  instability: number;
}

interface UpgradeInfo {
  name: readonly string[];
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
  startCost: readonly number[];
  scaling: readonly number[];
  max: number[];
  maxActive: number;
}

interface ResearchesAutoInfo {
  name: [
    'Upgrade automatization',
    'More toggles',
  ];
  effectText: Array<() => string>;
  costRange: readonly number[][];
  max: readonly number[];
  autoStage: readonly number[][];
}

interface ASRInfo {
  name: 'Auto Structures';
  effectText(): string;
  costRange: number[][];
  max: number[];
}

interface ElementsInfo {
  name: readonly string[];
  effectText: Array<() => string>;
  startCost: readonly number[];
}

interface StrangenessInfo {
  name: readonly string[];
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
  scalingOld: readonly number[][];
  needText: Array<() => string>;
  rewardText: Array<() => string>;
}

interface ChallengesInfo {
  name: readonly string[];
  description: readonly string[];
  effectText: Array<() => string>;
  needText: readonly string[][][];
  rewardText: readonly string[][][];
  color: readonly string[];
}