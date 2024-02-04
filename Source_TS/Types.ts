
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

const VALID_SUBTABS = {
  stageSubtabs: ['Structures', 'Advanced'],
  settingsSubtabs: ['Settings', 'History', 'Stats'],
  upgradeSubtabs: ['Upgrades', 'Elements'],
  strangenessSubtabs: ['Matter', 'Milestones'],
  ElementsSubtabs: [] as string[],
} as const;

export type ValidSubtab<T extends Tab> = typeof VALID_SUBTABS[`${T}Subtabs`][number];

export interface playerType {
  version: Version;
  fileName: string;
  separator: [string, string];
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
  footer: boolean;
  mobileDevice: boolean;
  screenReader: boolean;
  readonly supportSettings: boolean[];
  readonly automatization: Automatization;
  theme: number | undefined;
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
  readonly confirm: ConfirmationMode[];
  readonly buildings: readonly boolean[][];
  hover: boolean[];
  max: boolean[];
  readonly auto: boolean[];
  readonly shop: {
    howMany: number;
    input: number;
    readonly wait: number[];
  };
}

interface History {
  readonly stage: {
    best: readonly number[];
    list: number[][];
    readonly input: [number, number];
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
  readonly autoU: number[][];
  readonly autoR: number[][];
  readonly autoE: number[][];
  readonly elements: number[];
}

interface DischargeInfo {
  getEnergy: (index: number, stageIndex: number) => number;
  readonly energyType: number[][];
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
  readonly rankU: typeof rankU;
  readonly rankR: typeof rankR;
  readonly rankE: typeof rankE;
  readonly rankCost: number[];
  readonly rankColor: typeof rankColors;
  readonly rankName: typeof rankNames;
  readonly rankImage: typeof rankImages;
}

interface CollapseInfo {
  massEffect: number;
  starEffect: [number, number, number];
  readonly unlockB: readonly number[];
  readonly unlockG: readonly number[];
  readonly unlockU: readonly number[];
  readonly unlockR: readonly number[];
  newMass: number;
  readonly starCheck: [number, number, number];
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
  readonly word: typeof word;
  readonly textColor: typeof textColor;
  readonly buttonBorder: typeof buttonBorder;
  readonly imageBorderColor: typeof imageBorderColor;
  activeAll: number[];
}

interface BuildingsInfo {
  readonly maxActive: number[];
  readonly name: readonly string[][];
  readonly hoverText: readonly string[][];
  readonly type: ReadonlyArray<['', ...BuildingEffect[]]>;
  readonly firstCost: number[][];
  readonly startCost: number[][];
  readonly increase: readonly number[][];
  readonly producing: overlimit[][];
}

interface StrangeInfo {
  gain(stage: number): number;
  readonly name: ['Strange quarks', 'Strangelets'];
  readonly stageBoost: Array<number | undefined>;
  instability: number;
}

interface UpgradeInfo {
  readonly name: readonly string[];
  readonly effectText: Array<() => string>;
  readonly startCost: number[];
  maxActive: number;
}

interface ResearchInfo {
  readonly name: string[];
  readonly effectText: Array<() => string>;
  cost: number[];
  readonly startCost: number[];
  readonly scaling: number[];
  readonly max: number[];
  maxActive: number;
}

interface ResearchExtraInfo {
  readonly name: string[];
  readonly effectText: Array<() => string>;
  cost: number[];
  readonly startCost: readonly number[];
  readonly scaling: readonly number[];
  readonly max: number[];
  maxActive: number;
}

interface ResearchesAutoInfo {
  readonly name: [
    'Upgrade automatization',
    'More toggles',
  ];
  readonly effectText: Array<() => string>;
  readonly costRange: readonly number[][];
  readonly max: readonly number[];
  readonly autoStage: readonly number[][];
}

interface ASRInfo {
  readonly name: 'Auto Structures';
  effectText(): string;
  readonly costRange: number[][];
  readonly max: number[];
}

interface ElementsInfo {
  readonly name: readonly string[];
  readonly effectText: Array<() => string>;
  readonly startCost: readonly number[];
}

interface StrangenessInfo {
  readonly name: readonly string[];
  readonly effectText: Array<() => string>;
  cost: number[];
  readonly startCost: number[];
  readonly scaling: number[];
  readonly max: number[];
  maxActive: number;
}

interface MilestoneInfo {
  readonly name: string[];
  readonly need: overlimit[];
  readonly reward: number[];
  readonly scalingOld: readonly number[][];
  readonly needText: Array<() => string>;
  readonly rewardText: Array<() => string>;
}

interface ChallengesInfo {
  readonly name: readonly string[];
  readonly description: readonly string[];
  readonly effectText: Array<() => string>;
  readonly needText: readonly string[][][];
  readonly rewardText: readonly string[][][];
  readonly color: readonly string[];
}