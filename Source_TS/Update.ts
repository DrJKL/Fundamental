import { checkTab } from './Check';
import Limit from './Limit';
import { getClass, getId, getQuery } from './Main';
import { global, player } from './Player';
import { MDStrangenessPage, playEvent, specialHTML, switchTheme } from './Special';
import { autoElementsBuy, autoElementsSet, autoResearchesBuy, autoResearchesSet, autoUpgradesBuy, autoUpgradesSet, buyBuilding, calculateBuildingsCost, gainBuildings, assignBuildingInformation, collapseResetCheck, dischargeResetCheck, rankResetCheck, stageResetCheck, toggleSwap, vaporizationResetCheck, assignDischargeInformation, assignVaporizationInformation, assignCollapseInformation, gainStrange, switchStage, setActiveStage, calculateEffects } from './Stage';
import type { Tab, VALID_SUBTABS, overlimit } from './Types';
import { updateUnknown } from './Vacuum';

export function switchTab<T extends Tab>(tab: T, subtab?: typeof VALID_SUBTABS[`${T}Subtabs`][number]) {
  if (subtab === undefined) {
    const oldTab = global.tab;
    getId(`${oldTab}Tab`).style.display = 'none';
    getId(`${oldTab}TabBtn`).classList.remove('tabActive');
    const oldSubtabs = global.tabList[`${oldTab}Subtabs`];
    for (const inside of oldSubtabs) {
      getId(`${oldTab}SubtabBtn${inside}`).style.display = 'none';
    }

    global.tab = tab;
    let subtabAmount = 0;
    getId(`${tab}Tab`).style.display = '';
    getId(`${tab}TabBtn`).classList.add('tabActive');
    const newSubtabs = global.tabList[`${tab}Subtabs`];
    for (const inside of newSubtabs) {
      if (checkTab(tab, inside)) {
        getId(`${tab}SubtabBtn${inside}`).style.display = '';
        subtabAmount++;
      } else if (global.subtab[`${tab}Current`] === inside) {
        switchTab(tab, newSubtabs[0]);
      }
    }
    getId('subtabs').style.display = subtabAmount > 1 ?
      '' :
      'none';
    if (global.screenReader) {
      getId('SRTab').textContent = `Current tab is '${tab}'${subtabAmount > 1 ?
        ` and subtab is '${global.subtab[`${tab}Current`]}'` :
        ''}`;
    }
  } else {
    const oldSubtab = global.subtab[`${tab}Current`];
    getId(`${tab}Subtab${oldSubtab}`).style.display = 'none';
    getId(`${tab}SubtabBtn${oldSubtab}`).classList.remove('tabActive');

    global.subtab[`${tab}Current`] = subtab;
    getId(`${tab}Subtab${subtab}`).style.display = '';
    getId(`${tab}SubtabBtn${subtab}`).classList.add('tabActive');
    if (global.screenReader) { getId('SRTab').textContent = `Current subtab is '${subtab}', part of '${tab}' tab`; }
  }

  const active = player.stage.active;
  if (global.trueActive !== active) {
    switchStage(global.trueActive);
  } else if (active !== 4 && active !== 5 && ((global.tab === 'upgrade' && global.subtab.upgradeCurrent === 'Elements') || tab === 'Elements')) {
    if ((tab === 'upgrade' && subtab === undefined) || !global.stageInfo.activeAll.includes(4)) {
      switchTab('upgrade', 'Upgrades');
    } else {
      setActiveStage(4, active);
      stageUpdate();
    }
  } else {
    visualUpdate();
    numbersUpdate();
  }
}

export function maxOfflineTime(): number {
  return player.stage.true >= 6 ?
    43_200 :
    Math.min(3600 * player.stage.true + Math.max((player.stage.resets - 4) * 1800, 0), 43_200);
}
export function exportMultiplier(): number {
  return (1 + player.stage.best / 16) * (player.strangeness[4][7] + 1);
}

export function timeUpdate(timeWarp = 0, tick = 1) {
  const { time } = player;
  const { auto, buildings: autoBuy } = player.toggles;
  const { maxActive, type } = global.buildingsInfo;
  const { autoU, autoR, autoE, elements: autoElements } = global.automatization;
  const vacuum = player.inflation.vacuum;

  let passedSeconds: number;
  if (timeWarp > 0) {
    const extraTime = Math.min(tick, timeWarp);
    passedSeconds = extraTime;
    timeWarp -= extraTime;
  } else {
    const currentTime = Date.now();
    passedSeconds = (currentTime - time.updated) / 1000;
    time.updated = currentTime;
    time.online += passedSeconds;
    global.lastSave += passedSeconds;
    player.stage.export = Math.min(player.stage.export + passedSeconds, 86_400);
    if (passedSeconds < 0) {
      time.offline += passedSeconds;
      return;
    } else if (passedSeconds > 60) {
      time.offline = Math.min(time.offline + passedSeconds - 60, maxOfflineTime());
      passedSeconds = 60;
    }
  }
  time.stage += passedSeconds;
  time.universe += passedSeconds;
  const strangelets = passedSeconds;

  let globalSpeed = 1;
  if (vacuum && player.strangeness[5][0] >= 1 && player.challenges.active !== 0) { globalSpeed *= 1.2; }
  global.inflationInfo.globalSpeed = globalSpeed;
  passedSeconds *= globalSpeed;

  player.stage.time += passedSeconds;
  player.inflation.age += passedSeconds;

  if (vacuum && auto[0]) { stageResetCheck(5, true); }
  for (let i = 0; i < player.strangeness[5][10]; i++) {
    gainStrange(i, strangelets);
  }
  assignBuildingInformation();
  for (const s of global.stageInfo.activeAll) {
    if (!vacuum && auto[0]) { stageResetCheck(s, true); }
    switch (s) {
    case 4: {
      collapseResetCheck(auto[4], true);
      if (autoElements.length > 0) { autoElementsBuy(); }

      break;
    }
    case 3: {
      if (auto[3]) { rankResetCheck(true); }

      break;
    }
    case 2: {
      vaporizationResetCheck(auto[2], passedSeconds);

      break;
    }
    case 1: {
      if (auto[1]) { dischargeResetCheck(true); }

      break;
    }
            // No default
    }

    if (autoU[s].length > 0) { autoUpgradesBuy(s); }
    if (autoR[s].length > 0) { autoResearchesBuy('researches', s); }
    if (autoE[s].length > 0) { autoResearchesBuy('researchesExtra', s); }

    for (let i = maxActive[s] - 1; i >= 1; i--) {
      if (autoBuy[s][i] && player.ASR[s] >= i) { buyBuilding(i, s, true); }
      if (type[s][i] === 'producing') {
        gainBuildings(i - 1, s, passedSeconds);
        assignBuildingInformation();
      }
    }
    if (s === 1) { // Molecules from Radiation
      if (player.upgrades[1][8] === 1) { gainBuildings(5, 1, passedSeconds); }
    } else if (s === 5) { // Stars from Nebulas
      const research = player.researches[5][0];

      if (research >= 1) { gainBuildings(1, 5, passedSeconds); }
      if (research >= 2) { gainBuildings(2, 5, passedSeconds); }
      if (research >= 3) { gainBuildings(3, 5, passedSeconds); }
    }
  }

  if (timeWarp > 0) { timeUpdate(timeWarp, tick); }
}

export function numbersUpdate() {
  const { tab, subtab } = global;
  const active = player.stage.active;
  const buildings = player.buildings[active];

  if (global.footer) {
    switch (active) {
    case 1: {
      getId('footerStat1Span').textContent = Limit(buildings[0].current).format({ padding: true });
      getId('footerStat2Span').textContent = format(player.discharge.energy, { padding: player.discharge.energy >= 1e6 });

      break;
    }
    case 2: {
      getId('footerStat1Span').textContent = Limit(player.vaporization.clouds).format({ padding: true });
      getId('footerStat2Span').textContent = Limit(buildings[0].current).format({ padding: true });
      getId('footerStat3Span').textContent = Limit(buildings[1].current).format({ padding: buildings[2].current[0] > 0 });

      break;
    }
    case 3: {
      getId('footerStat1Span').textContent = Limit(buildings[0].current).format({ padding: true });

      break;
    }
    case 4:
    case 5: {
      const stars = player.buildings[4];

      getId('footerStat1Span').textContent = format(player.collapse.mass, { padding: true });
      getId('footerStat2Span').textContent = Limit(stars[0].current).format({ padding: true });
      if (active === 5) {
        getId('footerStat3Span').textContent = Limit(stars[1].current).plus(stars[2].current, stars[3].current, stars[4].current, stars[5].current).format({ padding: true });
      }

      break;
    }
            // No default
    }
  }
  switch (tab) {
  case 'stage': {
    if (subtab.stageCurrent === 'Structures') {
      const { buildingsInfo } = global;
      const howMany = player.stage.resets < 1 && player.discharge.current < 1 ?
        1 :
        player.toggles.shop.howMany;

      for (let i = 1; i < buildingsInfo.maxActive[active]; i++) {
        const trueCountID = getId(`building${i}True`);
        getId(`building${i}Cur`).textContent = Limit(buildings[i].current).format({ padding: trueCountID.style.display !== 'none' });
        getId(`building${i}Prod`).textContent = Limit(buildingsInfo.producing[active][i]).format({ padding: true });
        trueCountID.textContent = `[${format(buildings[i as 1].true)}]`;

        if (active === 4 || active === 5) {
          const unlock = global.collapseInfo[active === 4 ?
            'unlockB' :
            'unlockG'][i];
          if (player.collapse.mass < unlock && player.buildings[5][3].true < 1) {
            getId(`building${i}`).classList.remove('availableBuilding');
            getId(`building${i}Btn`).textContent = `Unlocked at ${format(unlock)} Mass`;
            getId(`building${i}BuyX`).textContent = 'Locked';
            continue;
          }
        }

        let costName: string;
        let currency: number | overlimit;
        let free = false;
        if (active === 5 && i === 3) { // Galaxy
          costName = 'Mass';
          currency = player.collapse.mass;
        } else {
          let e = i - 1;
          let extra = active;
          if (active === 1) {
            if (i === 1 && player.inflation.vacuum) { free = player.strangeness[1][10] >= 1; }
          } else if (active === 2) {
            if (i !== 1) { e = 1; }
          } else if (active >= 3) {
            e = 0;
            if (active === 5) { extra = 4; }
          }

          costName = buildingsInfo.name[extra][e];
          currency = player.buildings[extra][e].current;
        }

        let buy = 1;
        let cost = calculateBuildingsCost(i, active);
        if (howMany !== 1) {
          const scaling = buildingsInfo.increase[active][i];
          if (free) {
            buy = howMany === -1 ?
              Math.max(Math.floor(Limit(currency).divide(cost).log(scaling).toNumber()) + 1, 1) :
              howMany;
            if (buy > 1) { cost = Limit(scaling).power(buy - 1).multiply(cost).toArray(); }
          } else {
            buy = howMany === -1 ?
              Math.max(Math.floor(Limit(currency).multiply(scaling - 1).divide(cost).plus('1').log(scaling).toNumber()), 1) :
              howMany;
            if (buy > 1) { cost = Limit(scaling).power(buy).minus('1').divide(scaling - 1).multiply(cost).toArray(); }
          }
        }

        getId(`building${i}`).classList[Limit(cost).lessOrEqual(currency) ?
          'add' :
          'remove']('availableBuilding');
        getId(`building${i}Btn`).textContent = `Need: ${Limit(cost).format({ padding: true })} ${costName}`;
        getId(`building${i}BuyX`).textContent = format(buy);
      }
      switch (active) {
      case 1: {
        assignDischargeInformation();
        const effect = document.getElementById('dischargeBase');
        if (effect !== null) { effect.textContent = format(global.dischargeInfo.base); }
        getId('reset1Button').textContent = `Next goal is ${format(global.dischargeInfo.next)} Energy`;
        getId('tritiumEffect').textContent = Limit(global.dischargeInfo.tritium).format({ padding: true });
        getId('dischargeEffectStat').textContent = Limit(global.dischargeInfo.base).power(global.dischargeInfo.total).format({ padding: true });
        if (player.inflation.vacuum) {
          getId('preonCapStat').textContent = Limit(global.inflationInfo.preonCap).format({ padding: true });
          getId('preonCapRatio').textContent = Limit(global.inflationInfo.preonTrue).divide(global.inflationInfo.preonCap).format({ padding: true });
        }

        break;
      }
      case 2: {
        assignVaporizationInformation();
        getId('reset1Button').textContent = global.vaporizationInfo.get[0] === 0 ?
          `Waiting for ${format(calculateEffects.S2Upgrade2(), { padding: true })} Drops` :
          `Reset for ${Limit(global.vaporizationInfo.get).format({ padding: true })} Clouds`;
        getId('cloudEffectStat').textContent = Limit(global.vaporizationInfo.strength).format({ padding: true });
        if (player.inflation.vacuum) {
          getId('molesProductionStat').textContent = Limit(global.dischargeInfo.tritium).divide('6.02214076e23').format({ padding: true });
          getId('effectiveDropsStat').textContent = Limit(global.vaporizationInfo.dropsEff).format({ padding: true });
        }

        break;
      }
      case 3: {
        if (player.inflation.vacuum) {
          getId('massProductionStat').textContent = Limit(buildingsInfo.producing[1][1]).multiply('1.78266192e-33').format({ padding: true });
          getId('dustCapStat').textContent = Limit(global.inflationInfo.dustCap).format({ padding: true });
          getId('dustCapRatio').textContent = Limit(global.inflationInfo.dustTrue).divide(global.inflationInfo.dustCap).format({ padding: true });
        }

        break;
      }
      case 4: {
        const { collapse } = player;
        const { collapseInfo } = global;
        assignCollapseInformation();

        getId('reset1Button').textContent = `Collapse to ${format(collapseInfo.newMass, { padding: true })} Mass`;
        getId('solarMassCurrent').textContent = format(collapseInfo.massEffect, { padding: true });
        for (let i = 1; i <= 3; i++) {
          getId(`special${i}Cur`).textContent = format(collapse.stars[i - 1]);
          getId(`special${i}Get`).textContent = format(collapseInfo.starCheck[i - 1]);
          getId(`star${i}Current`).textContent = format(collapseInfo.starEffect[i - 1], { padding: true });
        }
        if (player.inflation.vacuum) {
          getId('mainCapStat').textContent = Limit(buildingsInfo.producing[1][1]).multiply('8.96499278339628e-67', global.inflationInfo.massCap).format({ padding: true });
          getId('mainCapTill').textContent = format(Limit(player.buildings[1][0].current).divide(buildingsInfo.producing[1][1]).minus(global.inflationInfo.massCap).divide(global.inflationInfo.globalSpeed).toNumber() * -1, { type: 'time' });
        }

        break;
      }
                    // No default
      }

      getId('stageTime').textContent = format(player.stage.time, { type: 'time' });
      getId('stageTimeRealStat').textContent = format(player.time.stage, { type: 'time' });
    } else if (subtab.stageCurrent === 'Advanced') {
      if (!player.inflation.vacuum) { getId('vacuumEffect').textContent = format(global.strangeInfo.instability); }
      getId('globalSpeedStat').textContent = format(global.inflationInfo.globalSpeed, { padding: true });
      getId('universeAge').textContent = format(player.inflation.age, { type: 'time' });
      getId('universeAgeTime').textContent = format(player.time.universe, { type: 'time' });
    }

    break;
  }
  case 'upgrade':
  case 'Elements': {
    const trueSubtab = tab === 'Elements' ?
      tab :
      subtab.upgradeCurrent;
    if (trueSubtab === 'Upgrades') {
      const last = global.lastUpgrade[active];
      if (last[0] >= 0) { getUpgradeDescription(last[0], last[1]); }
    } else if (trueSubtab === 'Elements') {
      if (global.lastElement >= 1) { getUpgradeDescription(global.lastElement, 'elements'); }
    }

    break;
  }
  case 'strangeness': {
    if (subtab.strangenessCurrent === 'Matter') {
      const stageGain = global.strangeInfo.gain(active) / 1e12 ** player.strangeness[5][10];
      getId('strangeGain').textContent = `${format(stageGain)} ${global.strangeInfo.name[player.strangeness[5][10]]}`;
      getId('strangeTime').textContent = format(stageGain / player.time.stage, { type: 'income', padding: true });
      getId('strange0Cur').textContent = format(player.strange[0].current);
      getId('strange1Cur').textContent = format(player.strange[1].current);
      if (global.lastStrangeness[0] >= 0) { getStrangenessDescription(global.lastStrangeness[0], global.lastStrangeness[1], 'strangeness'); }
    }

    break;
  }
  case 'settings': {
    if (subtab.settingsCurrent === 'Settings') {
      const perSecond = exportMultiplier() / 86_400 / 1e12 ** player.strangeness[5][10];
      getId('exportGain').textContent = format(player.stage.export * perSecond, { padding: true });
      getId('exportSecond').textContent = format(perSecond, { type: 'income', padding: true });
      if (global.lastSave >= 1) { getId('isSaved').textContent = `${format(global.lastSave, { type: 'time' })} ago`; }
    } else if (subtab.settingsCurrent === 'Stats') {
      getId('firstPlay').title = `Total online time is ${format(player.time.online, { type: 'time' })}`;
      getId('firstPlayStat').textContent = `${new Date(player.time.started).toLocaleString()} (${format((Date.now() - player.time.started) / 1000, { type: 'time' })} ago)`;
      getId('stageResetsCount').textContent = format(player.stage.resets);
      getId('stageHighestGain').textContent = format(player.stage.best / 1e12 ** player.strangeness[5][10]);
      getId('offlineStat').textContent = format(player.time.offline, { type: 'time', padding: false });
      getId('maxOfflineStat').textContent = format(maxOfflineTime(), { type: 'time', padding: false });
      getId('maxExportStat').textContent = format(exportMultiplier() / 1e12 ** player.strangeness[5][10]);
      switch (active) {
      case 1: {
        getId('maxEnergyStat').textContent = format(player.discharge.energyMax);
        getId('dischargeStat').textContent = format(global.dischargeInfo.total);
        getId('dischargeStatTrue').textContent = ` [${player.discharge.current}]`;
        if (player.strangeness[1][11] < 1) { getId('energySpent').textContent = format(global.dischargeInfo.energyTrue - player.discharge.energy); }

        break;
      }
      case 2: {
        assignVaporizationInformation();

        const clouds = Limit(calculateEffects.clouds(true)).divide(global.vaporizationInfo.strength).toNumber();
        getId('cloudEffectAfter').textContent = `x${format(clouds, { padding: true })}`;
        const rainBefore = calculateEffects.S2Extra1_2();
        const rainAfter = calculateEffects.S2Extra1_2(true);
        const rain = rainAfter[0] / rainBefore[0];
        const storm = rainAfter[1] / rainBefore[1];
        getId('rainEffectAfter').textContent = `x${format(rain, { padding: true })}`;
        getId('stormEffectAfter').textContent = `x${format(storm, { padding: true })}`;
        getId('cloudEffectTotal').textContent = `x${format(clouds * rain * storm, { padding: true })}`;
        getId('maxCloudStat').textContent = Limit(player.vaporization.cloudsMax).format();

        if (player.inflation.vacuum) {
          const moles = player.buildings[1][5];

          buildings[0].total = Limit(moles.total).divide('6.02214076e23').toArray();
          buildings[0].trueTotal = Limit(moles.trueTotal).divide('6.02214076e23').toArray();
          buildings[0].highest = Limit(moles.highest).divide('6.02214076e23').toArray();
        }

        break;
      }
      case 3: {
        getId('effectiveRank').textContent = format(global.accretionInfo.effective);
        getId('actualRank').textContent = ` [${player.accretion.rank}]`;
        if (player.inflation.vacuum) {
          const mass = player.buildings[1][0];

          buildings[0].total = Limit(mass.total).multiply('1.78266192e-33').toArray();
          buildings[0].trueTotal = Limit(mass.trueTotal).multiply('1.78266192e-33').toArray();
          buildings[0].highest = Limit(mass.highest).multiply('1.78266192e-33').toArray();
        }

        break;
      }
      case 4:
      case 5: {
        getId('maxSolarMassStat').textContent = format(player.collapse.massMax);
        if (active === 4) {
          assignCollapseInformation();
          const collapseInfo = global.collapseInfo;
          const auto2 = player.strangeness[4][5] >= 2;

          const mass = calculateEffects.mass(true) / collapseInfo.massEffect;
          getId('massEffectAfter').textContent = `x${format(mass, { padding: true })}`;
          const star0 = auto2 ?
            1 :
            calculateEffects.star[0](true) / collapseInfo.starEffect[0];
          const star1 = auto2 ?
            1 :
            calculateEffects.star[1](true) / collapseInfo.starEffect[1];
          const star2 = auto2 ?
            1 :
            calculateEffects.star[2](true) / collapseInfo.starEffect[2];
          if (!auto2) {
            getId('star1After').textContent = `x${format(star0, { padding: true })}`;
            getId('star2After').textContent = `x${format(star1, { padding: true })}`;
            getId('star3After').textContent = `x${format(star2, { padding: true })}`;
          }
          const gamma = calculateEffects.S4Research4(true) / calculateEffects.S4Research4();
          getId('gammaRayAfter').textContent = `x${format(gamma, { padding: true })}`;
          getId('starTotal').textContent = `x${format(mass * star0 * star1 * star2 * gamma, { padding: true })}`;
        } else {
          getId('starsStatTrue').textContent = format(global.collapseInfo.trueStars);
          const stars = player.buildings[4];

          buildings[0].current = Limit(stars[1].current).plus(stars[2].current, stars[3].current, stars[4].current, stars[5].current).toArray();
          buildings[0].total = Limit(stars[1].total).plus(stars[2].total, stars[3].total, stars[4].total, stars[5].total).toArray();
          buildings[0].trueTotal = Limit(stars[1].trueTotal).plus(stars[2].trueTotal, stars[3].trueTotal, stars[4].trueTotal, stars[5].trueTotal).toArray();
          buildings[0].highest = Limit(stars[1].highest).plus(stars[2].highest, stars[3].highest, stars[4].highest, stars[5].highest).toArray();
        }

        break;
      }
                    // No default
      }
      for (const [i, building] of buildings.entries()) {
        getId(`building${i}StatTotal`).textContent = Limit(building.total).format({ padding: true });
        getId(`building${i}StatTrueTotal`).textContent = Limit(building.trueTotal).format({ padding: true });
        getId(`building${i}StatHighest`).textContent = Limit(building.highest).format({ padding: true });
      }

      const { strange } = player;
      const strangeMax = Math.floor(strange[1].current * 1e12);
      for (const [i, element] of strange.entries()) {
        getId(`strange${i}StatTotal`).textContent = format(element.total, { padding: true });
      }
      getId('strange0StatProd').textContent = format(strangeMax, { padding: true });
      getId('strange1StatProd').textContent = format(strangeMax / 600, { padding: true });
    }

    break;
  }
        // No default
  }
}

export function visualUpdate() {
  const { tab, subtab } = global;
  const active = player.stage.active;

  if (!player.event) {
    switch (player.stage.true) {
    case 5: {
      if (player.strange[0].total > 0) {
        if (player.buildings[5][3].true >= 1) { void playEvent(6); }
      } else if (active === 5) { void playEvent(5); }

      break;
    }
    case 4: {
      if (player.elements.includes(0.5)) { void playEvent(4); }

      break;
    }
    case 3: {
      if (Limit(player.buildings[3][0].current).moreOrEqual('5e29')) { void playEvent(3); }

      break;
    }
    case 2: {
      assignVaporizationInformation();
      if (Limit(global.vaporizationInfo.get).plus(player.vaporization.clouds).moreThan('1e4')) { void playEvent(2); }

      break;
    }
    case 1: {
      if (player.upgrades[1][5] === 1) { void playEvent(1); }

      break;
    }
            // No default
    }
  }

  if (global.footer) {
    const elementsTab = document.getElementById('ElementsTabBtn');
    if (elementsTab !== null) {
      elementsTab.style.display = player.upgrades[4][1] === 1 ?
        '' :
        'none';
    }
    if (active === 1) {
      if (player.stage.resets < 1) {
        getId('footerStat2').style.display = player.discharge.energyMax >= (player.inflation.vacuum ?
          40 :
          9) ?
          '' :
          'none';
        getId('upgradeTabBtn').style.display = player.discharge.energyMax >= (player.inflation.vacuum ?
          40 :
          9) ?
          '' :
          'none';
      }
    } else if (active === 2) {
      getId('footerStat1').style.display = player.upgrades[2][2] === 1 ?
        '' :
        'none';
    }
  }

  switch (tab) {
  case 'stage': {
    if (subtab.stageCurrent === 'Structures') {
      const buildings = player.buildings[active];
      const multiMake = player.stage.resets >= 1 || player.discharge.current >= 1;
      const ASR = player.ASR[active];

      if (!player.inflation.vacuum) {
        const resetMessage = active >= 4 ?
          'Return back to start' :
          (active === player.stage.current ?
            'Enter next Stage' :
            'Reset this Stage');
        const failMessage = (active >= 4 ?
          player.strange[0].total <= 0 :
          active === player.stage.current) ?
          'Not ready for more' :
          'Not ready for reset';
        getId('stageReset').textContent = (active >= 4 ?
          player.stage.current >= 5 && (player.stage.true >= 6 || player.strange[0].total > 0 || player.event) :
          stageResetCheck(active)) ?
          resetMessage :
          failMessage;
      }

      getId('buildingToggles').style.display = multiMake ?
        '' :
        'none';
      getId('autoWaitInput').style.display = player.strangeness[1][7] >= 1 ?
        '' :
        'none';
      getId('toggleBuilding0').style.display = player.researchesAuto[1] >= 1 ?
        '' :
        'none';
      getId('stageTimeReal').style.display = player.stage.time === player.time.stage ?
        'none' :
        '';
      getId('offlineWarning').style.display = player.time.offline > 0 && player.time.offline >= maxOfflineTime() ?
        '' :
        'none';
      for (let i = 1; i < global.buildingsInfo.maxActive[active]; i++) {
        getId(`building${i}True`).style.display = Limit(buildings[i].current).notEqual(buildings[i as 1].true) ?
          '' :
          'none';
        getId(`toggleBuilding${i}`).style.display = ASR >= i ?
          '' :
          'none';
        getId(`building${i}BuyDiv`).style.display = multiMake ?
          '' :
          'none';
      }
      switch (active) {
      case 1: {
        getId('reset1Main').style.display = player.upgrades[1][5] === 1 ?
          '' :
          'none';
        getId('building2').style.display = Limit(buildings[1].trueTotal).moreOrEqual(player.inflation.vacuum ?
          '4' :
          '11') ?
          '' :
          'none';
        getId('building3').style.display = Limit(buildings[2].trueTotal).moreOrEqual('2') ?
          '' :
          'none';
        if (player.inflation.vacuum) {
          getId('building4').style.display = Limit(buildings[3].trueTotal).moreOrEqual('8') ?
            '' :
            'none';
          getId('building5').style.display = Limit(buildings[4].trueTotal).moreOrEqual('2') ?
            '' :
            'none';
        }
        getId('stageInfo').style.display = global.dischargeInfo.total > 0 ?
          '' :
          'none';
        getId('tritium').style.display = player.upgrades[1][8] === 1 ?
          '' :
          'none';
        if (player.stage.true < 2) {
          getId('resetStage').style.display = player.upgrades[1][9] === 1 ?
            '' :
            'none';
        }

        break;
      }
      case 2: {
        getId('reset1Main').style.display = player.upgrades[2][2] === 1 ?
          '' :
          'none';
        getId('building2').style.display = Limit(buildings[1].trueTotal).moreOrEqual('2e2') ?
          '' :
          'none';
        getId('building3').style.display = Limit(buildings[1].trueTotal).moreOrEqual('4e6') ?
          '' :
          'none';
        getId('building4').style.display = Limit(buildings[1].trueTotal).moreOrEqual('4e17') ?
          '' :
          'none';
        getId('building5').style.display = Limit(buildings[1].trueTotal).moreOrEqual('4e22') ?
          '' :
          'none';
        getId('cloudEffect').style.display = player.vaporization.clouds[0] > 0 ?
          '' :
          'none';
        if (player.inflation.vacuum) {
          getId('building6').style.display = player.strangeness[2][8] >= 1 && Limit(buildings[1].trueTotal).moreOrEqual('8e24') ?
            '' :
            'none';
        } else {
          getId('stageInfo').style.display = player.vaporization.clouds[0] > 0 ?
            '' :
            'none';
        }

        break;
      }
      case 3: {
        const upgrades = player.upgrades[3];

        getId('buildings').style.display = player.accretion.rank >= 1 ?
          '' :
          'none';
        getId('building2').style.display = upgrades[2] === 1 ?
          '' :
          'none';
        getId('building3').style.display = upgrades[4] === 1 ?
          '' :
          'none';
        getId('building4').style.display = upgrades[8] === 1 ?
          '' :
          'none';
        if (player.inflation.vacuum) {
          getId('building5').style.display = upgrades[11] === 1 && player.strangeness[3][8] >= 1 ?
            '' :
            'none';
        }
        updateRankInfo();

        break;
      }
      case 4: {
        const stars = player.collapse.stars;
        const nova = player.researchesExtra[4][0];
        const galaxy = player.buildings[5][3].true >= 1;

        getId('specials').style.display = buildings[2].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('special2').style.display = buildings[3].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('special3').style.display = buildings[4].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('reset1Main').style.display = player.upgrades[4][0] === 1 ?
          '' :
          'none';
        getId('building2').style.display = nova >= 1 ?
          '' :
          'none';
        getId('building3').style.display = nova >= 2 ?
          '' :
          'none';
        getId('building4').style.display = nova >= 3 ?
          '' :
          'none';
        getId('star1Effect').style.display = galaxy || stars[0] > 0 ?
          '' :
          'none';
        getId('star2Effect').style.display = galaxy || stars[1] > 0 ?
          '' :
          'none';
        getId('star3Effect').style.display = galaxy || stars[2] > 0 ?
          '' :
          'none';
        if (player.inflation.vacuum) {
          getId('building5').style.display = player.strangeness[4][9] >= 1 && (galaxy || stars[2] > 0) ?
            '' :
            'none';
        }

        break;
      }
      case 5: {
        if (!player.inflation.vacuum) {
          getId('buildings').style.display = player.milestones[2][0] >= 6 || player.milestones[3][0] >= 7 ?
            '' :
            'none';
          getId('building1').style.display = player.milestones[2][0] >= 6 ?
            '' :
            'none';
          getId('building2').style.display = player.milestones[3][0] >= 7 ?
            '' :
            'none';
        }
        getId('building3').style.display = player.strangeness[5][6] >= 1 ?
          '' :
          'none';

        break;
      }
                    // No default
      }
    } else if (subtab.stageCurrent === 'Advanced') {
      getId('globalSpeed').style.display = global.inflationInfo.globalSpeed === 1 ?
        'none' :
        '';
      getId('universeAgeReal').style.display = player.inflation.age === player.time.universe ?
        'none' :
        '';
      getId('challenge1').style.display = player.inflation.vacuum && player.strangeness[5][0] >= 1 ?
        '' :
        'none';
    }

    break;
  }
  case 'upgrade':
  case 'Elements': {
    const trueSubtab = tab === 'Elements' ?
      tab :
      subtab.upgradeCurrent;
    if (trueSubtab === 'Upgrades') {
      getId('researchToggles').style.display = player.strangeness[1][7] >= 2 ?
        '' :
        'none';
      if (player.inflation.vacuum) {
        getId('researchAuto1').style.display = player.researchesExtra[1][2] >= 2 ?
          '' :
          'none';
        getId('researchAuto2').style.display = player.researchesExtra[1][2] >= 1 ?
          '' :
          'none';
      }
      switch (active) {
      case 1: {
        const superposition = player.upgrades[1][5] === 1;

        getId('upgrade7').style.display = superposition ?
          '' :
          'none';
        getId('upgrade8').style.display = superposition ?
          '' :
          'none';
        getId('upgrade9').style.display = superposition ?
          '' :
          'none';
        getId('upgrade10').style.display = superposition ?
          '' :
          'none';
        getId('researches').style.display = player.discharge.current >= 4 ?
          '' :
          'none';
        if (player.inflation.vacuum) {
          getId('extraResearches').style.display = player.discharge.current >= 5 ?
            '' :
            'none';
          getId('researchExtra2').style.display = player.researchesExtra[1][2] >= 2 ?
            '' :
            'none';
          getId('researchExtra4').style.display = player.researchesExtra[1][2] >= 1 ?
            '' :
            'none';
          getId('researchExtra5').style.display = player.accretion.rank >= 6 ?
            '' :
            'none';
        }

        break;
      }
      case 2: {
        const buildings = player.buildings[2];

        getId('upgrade2').style.display = buildings[2].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('upgrade3').style.display = buildings[3].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('upgrade4').style.display = buildings[2].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('upgrade5').style.display = buildings[2].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('upgrade6').style.display = buildings[3].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('upgrade7').style.display = buildings[4].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('upgrade8').style.display = player.strangeness[2][2] >= 3 && buildings[5].trueTotal[0] > 0 ?
          '' :
          'none';
        if (player.inflation.vacuum) {
          getId('upgrade9').style.display = player.strangeness[2][10] >= 3 && buildings[6].trueTotal[0] > 0 ?
            '' :
            'none';
        }
        getId('research2').style.display = buildings[2].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('research3').style.display = buildings[2].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('research4').style.display = buildings[2].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('research5').style.display = buildings[3].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('research6').style.display = buildings[4].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('extraResearches').style.display = player.vaporization.clouds[0] > 0 ?
          '' :
          'none';
        getId('researchExtra3').style.display = buildings[5].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('researchExtra4').style.display = player.accretion.rank >= 6 ?
          '' :
          'none';

        break;
      }
      case 3: {
        const rank = player.accretion.rank;
        const planetesimal = player.buildings[3][2].trueTotal[0] > 0;

        getId('upgrade3').style.display = rank >= 2 ?
          '' :
          'none';
        getId('upgrade4').style.display = planetesimal ?
          '' :
          'none';
        getId('upgrade5').style.display = rank >= 3 ?
          '' :
          'none';
        getId('upgrade6').style.display = rank >= 4 || player.upgrades[3][4] === 1 ?
          '' :
          'none';
        getId('upgrade7').style.display = rank >= 4 ?
          '' :
          'none';
        getId('upgrade8').style.display = rank >= 4 && player.strangeness[3][2] >= 3 ?
          '' :
          'none';
        getId('upgrade9').style.display = rank >= 4 ?
          '' :
          'none';
        getId('upgrade10').style.display = rank >= 4 ?
          '' :
          'none';
        getId('upgrade11').style.display = rank >= 5 ?
          '' :
          'none';
        getId('upgrade12').style.display = rank >= 5 ?
          '' :
          'none';
        getId('upgrade13').style.display = rank >= 5 ?
          '' :
          'none';
        getId('research3').style.display = planetesimal ?
          '' :
          'none';
        getId('research4').style.display = planetesimal ?
          '' :
          'none';
        getId('research5').style.display = rank >= 3 ?
          '' :
          'none';
        getId('research6').style.display = rank >= 3 ?
          '' :
          'none';
        getId('research7').style.display = rank >= 4 || player.upgrades[3][4] === 1 ?
          '' :
          'none';
        getId('research8').style.display = rank >= 4 ?
          '' :
          'none';
        getId('research9').style.display = rank >= 5 ?
          '' :
          'none';
        getId('extraResearches').style.display = rank >= 2 ?
          '' :
          'none';
        getId('researchExtra2').style.display = rank >= 3 ?
          '' :
          'none';
        getId('researchExtra3').style.display = rank >= 4 ?
          '' :
          'none';
        getId('researchExtra4').style.display = rank >= 5 ?
          '' :
          'none';
        if (player.inflation.vacuum) {
          getId('researchExtra5').style.display = rank >= 3 && player.researchesExtra[1][2] >= 2 ?
            '' :
            'none';
        } else {
          getId('upgrades').style.display = rank >= 1 ?
            '' :
            'none';
          getId('stageResearches').style.display = rank >= 1 ?
            '' :
            'none';
        }

        break;
      }
      case 4: {
        const stars = player.collapse.stars;
        const galaxy = player.buildings[5][3].true >= 1;

        getId('upgrade4').style.display = player.strangeness[4][2] >= 1 ?
          '' :
          'none';
        getId('research4').style.display = (galaxy || stars[0] > 0) && player.strangeness[4][2] >= 2 ?
          '' :
          'none';
        getId('research5').style.display = galaxy || stars[2] > 0 ?
          '' :
          'none';
        getId('researchExtra2').style.display = galaxy || stars[0] > 0 ?
          '' :
          'none';
        getId('researchExtra3').style.display = (galaxy || stars[0] > 0) && player.strangeness[4][2] >= 3 ?
          '' :
          'none';

        break;
      }
      case 5: {
        if (!player.inflation.vacuum) {
          const nebula = player.milestones[2][0] >= 6;
          const cluster = player.milestones[3][0] >= 7;

          getId('upgrades').style.display = nebula || cluster ?
            '' :
            'none';
          getId('upgrade1').style.display = nebula ?
            '' :
            'none';
          getId('upgrade2').style.display = cluster ?
            '' :
            'none';
          getId('stageResearches').style.display = nebula || cluster ?
            '' :
            'none';
          getId('research1').style.display = nebula ?
            '' :
            'none';
          getId('research2').style.display = cluster ?
            '' :
            'none';
        }
        getId('upgrade3').style.display = player.buildings[5][3].true >= 1 ?
          '' :
          'none';

        break;
      }
                    // No default
      }
    } else if (trueSubtab === 'Elements') {
      const upgrades = player.upgrades[4];
      const neutron = player.upgrades[4][2] === 1 && (player.collapse.stars[1] > 0 || player.buildings[5][3].true >= 1);
      const grid = getId('elementsGrid');

      grid.style.display = upgrades[2] === 1 ?
        '' :
        'flex';
      grid.classList[!neutron && upgrades[2] === 1 ?
        'add' :
        'remove']('Elements10App');
      for (let i = 6; i <= 10; i++) {
        getId(`element${i}`).style.display = upgrades[2] === 1 ?
          '' :
          'none';
      }
      for (let i = 11; i <= 26; i++) {
        getId(`element${i}`).style.display = neutron ?
          '' :
          'none';
      }
      getId('element27').style.display = upgrades[3] === 1 ?
        '' :
        'none';
      getId('element28').style.display = upgrades[3] === 1 ?
        '' :
        'none';
    }

    break;
  }
  case 'strangeness': {
    if (subtab.strangenessCurrent === 'Matter') {
      const vacuum = player.inflation.vacuum;
      const bound = player.strangeness[5][5] >= 1;

      getId('strange1').style.display = player.strangeness[5][10] >= 1 ?
        '' :
        'none';
      getId('strange4Stage5').style.display = (vacuum ?
        bound :
        player.milestones[2][0] >= 6) ?
        '' :
        'none';
      getId('strange5Stage5').style.display = (vacuum ?
        bound :
        player.milestones[3][0] >= 7) ?
        '' :
        'none';
      getId('strange7Stage5').style.display = bound ?
        '' :
        'none';
      getId('strange8Stage5').style.display = (vacuum ?
        bound :
        player.milestones[2][0] >= 6) ?
        '' :
        'none';
      if (vacuum) {
        const voidProgress = player.challenges.void;

        getId('strange10Stage1').style.display = voidProgress[1] >= 1 ?
          '' :
          'none';
        getId('strange11Stage1').style.display = voidProgress[1] >= 2 ?
          '' :
          'none';
        getId('strange12Stage1').style.display = voidProgress[4] >= 2 ?
          '' :
          'none';
        getId('strange10Stage2').style.display = voidProgress[2] >= 1 ?
          '' :
          'none';
        getId('strange11Stage2').style.display = voidProgress[2] >= 2 ?
          '' :
          'none';
        getId('strange10Stage3').style.display = voidProgress[4] >= 4 ?
          '' :
          'none';
        getId('strange11Stage3').style.display = voidProgress[1] >= 3 ?
          '' :
          'none';
        getId('strange11Stage4').style.display = voidProgress[4] >= 3 ?
          '' :
          'none';
        getId('strange9Stage5').style.display = voidProgress[4] >= 1 ?
          '' :
          'none';
        getId('strange10Stage5').style.display = bound ?
          '' :
          'none';
        getId('strange11Stage5').style.display = voidProgress[3] >= 5 ?
          '' :
          'none';
      } else {
        const strange5 = player.milestones[4][0] >= 8;

        getId('strange9Stage1').style.display = strange5 ?
          '' :
          'none';
        getId('strange8Stage2').style.display = strange5 ?
          '' :
          'none';
        getId('strange8Stage3').style.display = strange5 ?
          '' :
          'none';
        getId('strange9Stage4').style.display = strange5 ?
          '' :
          'none';
        getId(`strangeness${global.mobileDevice ?
          'Page' :
          'Section'}5`).style.display = strange5 ?
          '' :
          'none';
        getId('strange6Stage5').style.display = player.milestones[2][0] >= 6 || player.milestones[3][0] >= 7 ?
          '' :
          'none';
      }
    } else if (subtab.strangenessCurrent === 'Milestones') {
      if (!player.inflation.vacuum) {
        getId('milestone1Stage5Div').style.display = player.strangeness[5][8] >= 1 ?
          '' :
          'none';
        getId('milestone2Stage5Div').style.display = player.strangeness[5][8] >= 1 && player.strangeness[5][6] >= 1 ?
          '' :
          'none';
      }
    }

    break;
  }
  case 'settings': {
    switch (subtab.settingsCurrent) {
    case 'Settings': {
      const { researchesAuto, strangeness } = player;
      const trueStage = player.stage.true;

      getId('toggleAuto0').style.display = strangeness[5][2] >= 1 ?
        '' :
        'none';
      getId('toggleAuto0Main').style.display = strangeness[5][2] >= 1 ?
        '' :
        'none';
      getId('exportSpecial').style.display = player.strange[0].total > 0 ?
        '' :
        'none';
      getId('exportType').textContent = global.strangeInfo.name[strangeness[5][10]];
      getId('saveNameMatter').style.display = strangeness[5][10] >= 1 ?
        '' :
        'none';
      getId('allStructuresHotkey').style.display = researchesAuto[1] >= 1 ?
        '' :
        'none';
      getId('autoToggle5').style.display = researchesAuto[0] >= 1 ?
        '' :
        'none';
      getId('autoToggle6').style.display = researchesAuto[0] >= 2 ?
        '' :
        'none';
      getId('autoToggle7').style.display = researchesAuto[0] >= 3 ?
        '' :
        'none';
      getId('autoToggle8').style.display = strangeness[4][4] >= 2 ?
        '' :
        'none';
      getId('toggleAuto1').style.display = strangeness[1][3] >= 1 ?
        '' :
        'none';
      getId('toggleAuto2').style.display = strangeness[2][4] >= 1 ?
        '' :
        'none';
      getId('toggleAuto2Main').style.display = strangeness[2][4] >= 1 ?
        '' :
        'none';
      getId('toggleAuto3').style.display = strangeness[3][4] >= 1 ?
        '' :
        'none';
      getId('toggleAuto4').style.display = strangeness[4][5] >= 1 ?
        '' :
        'none';
      getId('toggleAuto4Main').style.display = strangeness[4][5] >= 1 ?
        '' :
        'none';
      getId('stageReward').textContent = global.strangeInfo.name[strangeness[5][10]];
      if (trueStage < 2) {
        getId('resetToggles').style.display = player.discharge.current >= 1 ?
          '' :
          'none';
        getId('dischargeHotkey').style.display = player.upgrades[1][5] === 1 ?
          '' :
          'none';
        getId('stageHotkey').style.display = player.upgrades[1][9] === 1 ?
          '' :
          'none';
      }
      if (trueStage < 3) {
        getId('vaporizationToggleReset').style.display = player.vaporization.clouds[0] > 0 ?
          '' :
          'none';
        getId('vaporizationHotkey').style.display = player.upgrades[2][2] === 1 ?
          '' :
          'none';
      }
      if (trueStage < 4) {
        getId('rankToggleReset').style.display = player.accretion.rank >= 2 ?
          '' :
          'none';
      }
      if (trueStage < 5) {
        getId('collapseToggleReset').style.display = player.collapse.mass > 0.012_35 ?
          '' :
          'none';
        getId('collapseHotkey').style.display = player.upgrades[4][0] === 1 ?
          '' :
          'none';
        getId('elementsAsTab').style.display = player.upgrades[4][1] === 1 ?
          '' :
          'none';
      }
      if (trueStage < 7) {
        getId('switchTheme6').style.display = trueStage === 6 && strangeness[5][0] >= 1 ?
          '' :
          'none';
      }

      break;
    }
    case 'History': {
      updateHistory( /* 'stage'*/);

      break;
    }
    case 'Stats': {
      const { strange, strangeness } = player;
      const buildings = player.buildings[active];

      getId('maxExportStats').style.display = strange[0].total > 0 ?
        '' :
        'none';
      getId('maxExportType').textContent = global.strangeInfo.name[strangeness[5][10]];
      getId('stageHighestType').textContent = global.strangeInfo.name[strangeness[5][10]];
      getId('stageResets').style.display = player.stage.resets > 0 ?
        '' :
        'none';
      getId('stageHighest').style.display = strange[0].total > 0 ?
        '' :
        'none';
      for (let i = 1; i < global.buildingsInfo.maxActive[active]; i++) {
        getId(`building${i}Stats`).style.display = buildings[i].trueTotal[0] > 0 ?
          '' :
          'none';
      }
      getId('strangeAllStats').style.display = strange[0].total > 0 ?
        '' :
        'none';
      for (let i = 1; i < strange.length; i++) {
        getId(`strange${i}Stats`).style.display = strange[i].total > 0 ?
          '' :
          'none';
      }
      getId('strange0StatProdDiv').style.display = strangeness[5][10] >= 1 ?
        '' :
        'none';

      if (!player.inflation.vacuum) { updateUnknown(); }
      switch (active) {
      case 1: {
        getId('energyTrue').style.display = strangeness[1][11] < 1 && player.discharge.energyMax >= (player.inflation.vacuum ?
          40 :
          9) ?
          '' :
          'none';
        getId('energyStats').style.display = player.discharge.energyMax >= (player.inflation.vacuum ?
          40 :
          9) ?
          '' :
          'none';
        getId('dischargeStats').style.display = global.dischargeInfo.total > 0 ?
          '' :
          'none';
        getId('dischargeStatTrue').style.display = player.discharge.current === global.dischargeInfo.total ?
          'none' :
          '';

        break;
      }
      case 2: {
        getId('vaporizationBoost').style.display = player.upgrades[2][2] === 1 ?
          '' :
          'none';
        getId('rainEffect').style.display = player.researchesExtra[2][1] >= 1 ?
          '' :
          'none';
        getId('stormEffect').style.display = player.researchesExtra[2][2] >= 1 ?
          '' :
          'none';
        getId('cloudStats').style.display = player.vaporization.cloudsMax[0] > 0 ?
          '' :
          'none';

        break;
      }
      case 3: {
        getId('actualRank').style.display = player.accretion.rank === global.accretionInfo.effective ?
          'none' :
          '';
        if (player.inflation.vacuum) {
          getId('rankStat0').style.display = strangeness[2][9] >= 1 ?
            '' :
            'none';
        }
        for (let i = 1; i < global.accretionInfo.rankImage.length; i++) {
          getId(`rankStat${i}`).style.display = player.accretion.rank >= i ?
            '' :
            'none';
        }

        break;
      }
      case 4: {
        const auto2 = player.strangeness[4][5] >= 2;
        getId('star1Stat').style.display = !auto2 && buildings[2].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('star2Stat').style.display = !auto2 && buildings[3].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('star3Stat').style.display = !auto2 && buildings[4].trueTotal[0] > 0 ?
          '' :
          'none';
        getId('gammaRayStat').style.display = player.researches[4][4] >= 1 ?
          '' :
          'none';

        break;
      }
                        // No default
      }

      break;
    }
                // No default
    }

    break;
  }
        // No default
  }
}

function stageToCostName(stageIndex: number) {
  switch(stageIndex) {
  case 1:  return 'Energy';
  case 2:  return 'Drops';
  case 3:  return 'Mass';
  default: return 'Elements';
  }
}

export function getUpgradeDescription(index: number, type: 'upgrades' | 'researches' | 'researchesExtra' | 'researchesAuto' | 'ASR' | 'elements') {
  if (type === 'elements') {
    const pointer = global.elementsInfo;

    getId('elementText').textContent = `${pointer.name[index]}.`;
    getId('elementEffect').textContent = player.elements[index] >= 1 || (player.collapse.show >= index && index !== 0) ?
      pointer.effectText[index]() :
      'Effect is not yet known.';
    getId('elementCost').textContent = player.elements[index] >= 1 ?
      'Obtained.' :
      (player.elements[index] > 0 ?
        'Awaiting Collapse.' :
        `${format(pointer.startCost[index])} Elements.`);
    return;
  }

  const stageIndex = player.stage.active;
  const costName = stageToCostName(stageIndex);
  switch (type) {
  case 'upgrades': {
    const pointer = global[`${type}Info`][stageIndex];

    getId('upgradeText').textContent = `${pointer.name[index]}.`;
    getId('upgradeEffect').textContent = pointer.effectText[index]();
    getId('upgradeCost').textContent = player.upgrades[stageIndex][index] === 1 ?
      'Created.' :
      (stageIndex === 4 && global.collapseInfo.unlockU[index] > player.collapse.mass && player.buildings[5][3].true < 1 ?
        `Unlocked at ${format(global.collapseInfo.unlockU[index])} Mass.` :
        `${format(pointer.startCost[index])} ${costName}.`);

    break;
  }
  case 'researches':
  case 'researchesExtra': {
    const pointer = global[`${type}Info`][stageIndex];
    const level = player[type][stageIndex][index];
    if (type === 'researchesExtra' && stageIndex === 4 && index === 0) { pointer.name[0] = ['Nova', 'Supernova', 'Hypernova'][Math.min(level, 2)]; }

    getId('upgradeText').textContent = `${pointer.name[index]}.`;
    getId('upgradeEffect').textContent = pointer.effectText[index]();
    if (level >= pointer.max[index]) {
      getId('upgradeCost').textContent = 'Maxed.';
    } else if (stageIndex === 4 && type === 'researches' && global.collapseInfo.unlockR[index] > player.collapse.mass && player.buildings[5][3].true < 1) {
      getId('upgradeCost').textContent = `Unlocked at ${format(global.collapseInfo.unlockR[index])} Mass.`;
    } else {
      let newLevels = 1;
      let cost = pointer.cost[index];
      if (player.toggles.max[0] && player.strangeness[1][7] >= 2 && pointer.max[index] > 1) {
        const scaling = pointer.scaling[index];
        if (stageIndex === 1) {
          if (player.strangeness[1][11] >= 1) {
            newLevels = Math.min(Math.max(Math.floor((player.discharge.energy - cost) / scaling + 1), 1), pointer.max[index] - level);
            if (newLevels > 1) { cost += (newLevels - 1) * scaling; }
          } else {
            const simplify = cost - scaling / 2;
            newLevels = Math.min(Math.max(Math.floor(((simplify ** 2 + 2 * scaling * player.discharge.energy) ** 0.5 - simplify) / scaling), 1), pointer.max[index] - level);
            if (newLevels > 1) { cost = newLevels * (newLevels * scaling / 2 + simplify); }
          }
        } else {
          const currency = stageIndex === 2 ?
            player.buildings[2][1].current :
            (stageIndex === 3 ?
              player.buildings[3][0].current :
              player.buildings[4][0].current);
          newLevels = Math.min(Math.max(Math.floor(Limit(currency).multiply(scaling - 1).divide(cost).plus('1').log(scaling).toNumber()), 1), pointer.max[index] - level);
          if (newLevels > 1) { cost = Limit(scaling).power(newLevels).minus('1').divide(scaling - 1).multiply(cost).toNumber(); }
        }
      }

      getId('upgradeCost').textContent = `${format(cost)} ${costName}.${newLevels > 1 ?
        ` [x${format(newLevels)}]` :
        ''}`;
    }

    break;
  }
  case 'researchesAuto': {
    const pointer = global.researchesAutoInfo;
    const level = player.researchesAuto[index];

    getId('upgradeText').textContent = `${pointer.name[index]}.`;
    getId('upgradeEffect').textContent = pointer.effectText[index]();
    if (level >= pointer.max[index]) {
      getId('upgradeCost').textContent = 'Maxed.';
    } else {
      const autoStage = pointer.autoStage[index][level];
      getId('upgradeCost').textContent = (autoStage === stageIndex || (stageIndex === 5 && autoStage === 4)) ?
        `${format(pointer.costRange[index][level])} ${costName}.` :
        `This level can only be created while inside '${global.stageInfo.word[autoStage]}'.`;
    }

    break;
  }
  default: {
    const pointer = global.ASRInfo;
    const level = player.ASR[stageIndex];

    getId('upgradeText').textContent = `${pointer.name}.`;
    getId('upgradeEffect').textContent = pointer.effectText();
    getId('upgradeCost').textContent = level >= pointer.max[stageIndex] ?
      'Maxed.' :
      (stageIndex === 3 && player.accretion.rank < 1 ?
        "Cannot be created at 'Ocean world' Rank." :
        `${format(pointer.costRange[stageIndex][level])} ${costName}.`);
  }
  }
}

export function getStrangenessDescription(index: number, stageIndex: number, type: 'strangeness' | 'milestones') {
  const stageText = getId(`${type}Stage`);
  stageText.style.color = `var(--${global.stageInfo.textColor[stageIndex]}-text)`;
  stageText.textContent = `${global.stageInfo.word[stageIndex]}. `;
  if (type === 'strangeness') {
    const pointer = global.strangenessInfo[stageIndex];

    getId('strangenessText').textContent = `${pointer.name[index]}.`;
    getId('strangenessEffect').textContent = pointer.effectText[index]();
    getId('strangenessCost').textContent = player.strangeness[stageIndex][index] >= pointer.max[index] ?
      'Maxed.' :
      `${format(pointer.cost[index])} Strange quarks.`;
  } else {
    const pointer = global.milestonesInfo[stageIndex];

    getId('milestonesText').textContent = `${pointer.name[index]}. (${format(player.milestones[stageIndex][index])})`;
    if (player.inflation.vacuum) {
      getId('milestonesMultiline').innerHTML = `<p class="orchidText">Requirement: <span class="greenText">${pointer.needText[index]()}</span></p>
            <p class="darkvioletText">Effect: <span class="greenText">${pointer.rewardText[index]()}</span></p>`;
    } else if (pointer.need[index][0] === 0) { getId('milestonesMultiline').innerHTML = `<p class="darkvioletText">Reward: <span class="greenText">${pointer.rewardText[index]()}</span></p>`; } else {
      getId('milestonesMultiline').innerHTML = `<p class="orchidText">Requirement: <span class="greenText">${pointer.needText[index]()}</span></p>
            <p class="darkvioletText">Unlock: <span class="greenText">Main reward unlocked after ${pointer.scalingOld[index].length - player.milestones[stageIndex][index]} more completions.</span></p>`;
    }
  }
}

export function getChallengeDescription(index: number) {
  let text;
  if (index === -1) {
    text = `<h3 class="orchidText">Vacuum state: <span ${player.inflation.vacuum ?
      'class="greenText">true' :
      'class="redText">false'}</span></h3>`;
  } else {
    const info = global.challengesInfo;
    const color = `${info.color[index]}Text`;
    text = `<h3 class="${color} bigWord">${info.name[index]}${player.challenges.active === index ?
      ', <span class="greenText">active</span>' :
      ''}</h3>
        <p class="whiteText">${info.description[index]}</p>
        <div><h4 class="${color} bigWord">Effect:</h4>
        <p>${info.effectText[index]()}</p></div>`;
  }

  if (index === 0) {
    const progress = player.challenges.void;

    getId('voidRewards').style.display = '';
    getId('voidRewardSubmerged').style.display = progress[1] >= 3 ?
      '' :
      'none';
    getId('voidRewardAccretion').style.display = progress[1] >= 2 ?
      '' :
      'none';
    getId('voidRewardInterstellar').style.display = progress[3] >= 5 ?
      '' :
      'none';
  } else { getId('voidRewards').style.display = 'none'; }

  getId('challengeMultiline').innerHTML = text;
}

export function getChallengeReward(index: number) {
  const need = global.challengesInfo.needText[0][index];
  const reward = global.challengesInfo.rewardText[0][index];
  const level = player.challenges.void[index];
  let text = '';
  for (const [i, element] of need.entries()) {
    text += `<div><p><span class="${level > i ?
      'greenText' :
      'redText'}">→</span> ${index === 2 && i === 1 ?
      element.replace('1e4', format(1e4)) :
      element}</p>
        <p><span class="${level > i ?
    'greenText' :
    'redText'}">Reward:</span> ${level > i ?
  reward[i] :
  'Not yet unlocked'}</p></div>`;
  }

  getId('voidRewardsDivText').innerHTML = text;
}

export function visualUpdateUpgrades(index: number, stageIndex: number, type: 'upgrades' | 'elements') {
  if (type === 'upgrades') {
    if (stageIndex !== player.stage.active) { return; }

    let color = '';
    const image = getId(`upgrade${index + 1}`);
    if (player.upgrades[stageIndex][index] === 1) {
      switch (stageIndex) {
      case 1: {
        color = 'green';

        break;
      }
      case 2: {
        color = 'darkgreen';

        break;
      }
      case 3: {
        color = '#0000b1'; // Darker blue

        break;
      }
      case 4: {
        color = '#1f1f8f'; // Brigher midnightblue

        break;
      }
      case 5: {
        color = '#990000'; // Brigher maroon

        break;
      }
                // No default
      }
      image.tabIndex = global.supportSettings[0] ?
        -1 :
        0;
    } else { image.tabIndex = 0; }
    image.style.backgroundColor = color;
  } else {
    const image = getId(`element${index}`);
    if (player.elements[index] >= 1) {
      image.classList.remove('awaiting');
      image.classList.add('created');
      image.tabIndex = global.supportSettings[0] ?
        -1 :
        0;
    } else if (player.elements[index] > 0) {
      image.classList.add('awaiting');
      image.classList.remove('created');
      image.tabIndex = 0;
    } else {
      image.classList.remove('awaiting');
      image.classList.remove('created');
      image.tabIndex = 0;
    }
  }
}

export function visualUpdateResearches(index: number, stageIndex: number, type: 'researches' | 'researchesExtra' | 'researchesAuto' | 'ASR' | 'strangeness') {
  let max: number;
  let level: number;
  let upgradeHTML: HTMLElement;
  let image: HTMLElement;
  switch (type) {
  case 'researches':
  case 'researchesExtra': {
    if (stageIndex !== player.stage.active) { return; }
    max = global[`${type}Info`][stageIndex].max[index];
    level = player[type][stageIndex][index];

    const extra = type === 'researches' ?
      '' :
      'Extra';
    upgradeHTML = getId(`research${extra}${index + 1}Level`);
    getId(`research${extra}${index + 1}Max`).textContent = `${max}`;
    image = getId(`research${extra}${index + 1}Image`);

    break;
  }
  case 'researchesAuto': {
    max = global.researchesAutoInfo.max[index];
    level = player.researchesAuto[index];

    upgradeHTML = getId(`researchAuto${index + 1}Level`);
    getId(`researchAuto${index + 1}Max`).textContent = `${max}`;
    image = getId(`researchAuto${index + 1}Image`);

    break;
  }
  case 'ASR': {
    if (stageIndex !== player.stage.active) { return; }
    max = global.ASRInfo.max[stageIndex];
    level = player.ASR[stageIndex];

    upgradeHTML = getId('ASRLevel');
    getId('ASRMax').textContent = `${max}`;
    image = getId('ASRImage');

    break;
  }
  default: {
    max = global.strangenessInfo[stageIndex].max[index];
    level = player.strangeness[stageIndex][index];

    upgradeHTML = getId(`strange${index + 1}Stage${stageIndex}Level`);
    getId(`strange${index + 1}Stage${stageIndex}Max`).textContent = `${max}`;
    image = getId(`strange${index + 1}Stage${stageIndex}Image`);
  }
  }

  upgradeHTML.textContent = `${level}`;
  if (level >= max) {
    upgradeHTML.style.color = 'var(--green-text)';
    image.tabIndex = global.supportSettings[0] ?
      -1 :
      0;
  } else if (level === 0) {
    upgradeHTML.style.color = ''; // Red
    image.tabIndex = 0;
  } else {
    upgradeHTML.style.color = 'var(--orchid-text)';
    image.tabIndex = 0;
  }
}

function updateRankInfo() {
  const rank = player.accretion.rank;
  if (global.debug.rankUpdated === rank) { return; }
  const name = document.getElementById('rankName');
  if (name === null) { return; }
  const rankInfo = global.accretionInfo;

  const rankMessage = document.getElementById('rankMessage');
  if (rankMessage) {
    rankMessage.textContent = rank === 0 ?
      'Might need more than just water... Increase Rank with Mass.' :
      `Increase it with Mass. (Return back to ${player.inflation.vacuum ?
        'Preons' :
        'Dust'}, but unlock something new)`;
  }
  getId('reset1Button').textContent = rankInfo.rankCost[rank] === 0 ?
    'Max Rank achieved' :
    `Next Rank is ${format(rankInfo.rankCost[rank])} Mass`;
  const rankImage = document.getElementById('rankImage');
  if (rankImage && rankImage instanceof HTMLImageElement) {
    rankImage.src = `Used_art/${rankInfo.rankImage[rank]}`;
  }
  name.textContent = rankInfo.rankName[rank];
  name.style.color = `var(--${rankInfo.rankColor[rank]}-text)`;
  global.debug.rankUpdated = rank;
}

function updateHistory( /* type: 'stage'*/) {
  if (global.debug.historyStage === player.stage.resets) { return; }
  const list = global.historyStorage.stage;

  let text = '';
  if (list.length > 0) {
    for (const stageData of list) {
      const converted = stageData[0] / 1e12 ** stageData[2];
      text += `<li class="whiteText"><span class="greenText">${format(converted)} ${global.strangeInfo.name[stageData[2]]}</span>, <span class="blueText">${format(stageData[1], { type: 'time' })}</span>, <span class="darkorchidText">${format(converted / stageData[1], { type: 'income', padding: true })}</span></li>`;
    }
  } else { text = '<li class="redText">Reference list is empty</li>'; }
  getId('stageResetsList').innerHTML = text;

  const stageBest = player.history.stage.best;
  const converted = stageBest[0] / 1e12 ** stageBest[2];
  getId('stageBest').innerHTML = `Best reset: <span class="whiteText"><span class="greenText">${format(converted)} ${global.strangeInfo.name[stageBest[2]]}</span>, <span class="blueText">${format(stageBest[1], { type: 'time' })}</span>, <span class="darkorchidText">${format(converted / stageBest[1], { type: 'income', padding: true })}</span></span>`;
  global.debug.historyStage = player.stage.resets;
}

type FormatType = 'number' | 'input' | 'time' | 'income';
interface FormatSettings { digits?: number; type?: FormatType; padding?: boolean }

export function format(input: number /* | overlimit*/, settings: FormatSettings = {}): string {
  // if (typeof input !== 'number') { return Limit(input).format(settings as any); }
  const type = settings.type ?? 'number';

  let extra;
  if (type === 'income') {
    const inputAbs = Math.abs(input);
    if (inputAbs >= 1) {
      extra = 'per second';
    } else if (inputAbs >= 1 / 60) {
      input *= 60;
      extra = 'per minute';
    } else if (inputAbs >= 1 / 3600) {
      input *= 3600;
      extra = 'per hour';
    } else if (inputAbs >= 1 / 86_400) {
      input *= 86_400;
      extra = 'per day';
    } else if (inputAbs >= 1 / 31_556_952) {
      input *= 31_556_952;
      extra = 'per year';
    } else if (inputAbs >= 1 / 31_556_952_000) {
      input *= 31_556_952_000;
      extra = 'per millennium';
    } else if (inputAbs >= 1 / 31_556_952_000_000) {
      input *= 31_556_952_000_000;
      extra = 'per megaannum';
    } else {
      input *= 31_556_952_000_000_000;
      extra = 'per eon';
    }

    if (settings.padding === undefined) { settings.padding = true; }
  } else if (type === 'time') {
    const inputAbs = Math.abs(input);
    if (inputAbs < 60) {
      extra = 'seconds';
    } else if (inputAbs < 3600) {
      const minutes = Math.trunc(input / 60);
      const seconds = Math.trunc(input - minutes * 60);
      if (settings.padding === false && seconds === 0) { return `${minutes} minutes`; }
      return `${minutes} minutes ${seconds} seconds`;
    } else if (inputAbs < 86_400) {
      const hours = Math.trunc(input / 3600);
      const minutes = Math.trunc(input / 60 - hours * 60);
      if (settings.padding === false && minutes === 0) { return `${hours} hours`; }
      return `${hours} hours ${minutes} minutes`;
    } else if (inputAbs < 31_556_952) {
      const days = Math.trunc(input / 86_400);
      const hours = Math.trunc(input / 3600 - days * 24);
      if (settings.padding === false && hours === 0) { return `${days} days`; }
      return `${days} days ${hours} hours`;
    } else if (inputAbs < 31_556_952_000) {
      const years = Math.trunc(input / 31_556_952);
      const days = Math.trunc(input / 86_400 - years * 365.2425);
      if (settings.padding === false && days === 0) { return `${years} years`; }
      return `${years} years ${days} days`;
    } else if (inputAbs < 31_556_952_000_000) {
      input /= 31_556_952_000;
      extra = 'millenniums';
    } else if (inputAbs < 31_556_952_000_000_000) {
      input /= 31_556_952_000_000;
      extra = 'megaannums';
    } else {
      input /= 31_556_952_000_000_000;
      extra = 'eons';
    }

    settings.padding = !(settings.padding === false && Math.trunc(input) === input);
    settings.digits = 3;
  }
  if (!Number.isFinite(input)) {
    return extra === undefined ?
      `${input}` :
      `${input} ${extra}`;
  }

  const inputAbs = Math.abs(input);
  if (inputAbs >= 1e6 || (inputAbs < 1e-3 && inputAbs > 0)) {
    const precision = settings.digits ?? 2;
    let digits = Math.floor(Math.log10(inputAbs));
    let result = Math.round(input / 10 ** (digits - precision)) / (10 ** precision);
    if (Math.abs(result) === 10) {
      result = 1;
      digits++;
    }

    let formated = settings.padding === true ?
      result.toFixed(precision) :
      `${result}`;
    if (type === 'input') { return `${formated}e${digits}`; }
    formated = `${formated.replace('.', player.separator[1])}e${digits}`;
    return extra === undefined ?
      formated :
      `${formated} ${extra}`;
  }

  const precision = settings.digits ?? Math.max(4 - Math.floor(Math.log10(Math.max(inputAbs, 1))), 0);
  const result = Math.round(input * 10 ** precision) / 10 ** precision;

  let formated = settings.padding === true ?
    result.toFixed(precision) :
    `${result}`;
  if (type === 'input') { return formated; }
  formated = formated.replace('.', player.separator[1]);
  if (result >= 1e3) { formated = formated.replace(/\B(?=(\d{3})+(?!\d))/, player.separator[0]); }
  return extra === undefined ?
    formated :
    `${formated} ${extra}`;
}

type UpdateExtra = 'normal' | 'soft' | 'reload';
// Soft means that Stage wasn't changed
export function stageUpdate(extra: UpdateExtra = 'normal') {
  const { stageInfo, buildingsInfo } = global;
  const { active, current, true: highest, resets } = player.stage;
  const vacuum = player.inflation.vacuum;
  const challenge = player.challenges.active;

  stageInfo.activeAll = [vacuum ?
    1 :
    current];
  const activeAll = stageInfo.activeAll;
  if (vacuum) {
    if (player.researchesExtra[1][2] >= 2) { activeAll.push(2); }
    if (player.researchesExtra[1][2] >= 1) { activeAll.push(3); }
    if (player.accretion.rank >= 6) {
      activeAll.push(4);
      if (player.strangeness[5][5] >= 1 && (challenge !== 0 /* || current >= 5*/)) { activeAll.push(5); }
    }
  } else {
    if (current === 4) {
      if (player.milestones[5][0] >= 6) { activeAll.push(5); }
    } else if (current === 5) { activeAll.unshift(4); }
    for (let i = player.strangeness[5][0]; i >= 1; i--) {
      if (current !== i) { activeAll.unshift(i); }
    }
  }

  for (let s = 1; s <= 6; s++) {
    for (const element of getClass(`stage${s}Only`)) {
      element.style.display = active === s ?
        '' :
        'none';
    }
    for (const element of getClass(`stage${s}Include`)) {
      element.style.display = activeAll.includes(s) ?
        '' :
        'none';
    }
    for (const element of getClass(`stage${s}Unlock`)) {
      element.style.display = highest >= s ?
        '' :
        'none';
    }
  }

  const stageWord = getId('stageWord');
  const stageStatus = getId('stageStatus');
  if (challenge === -1) {
    stageStatus.textContent = 'Current Stage:';
    stageStatus.style.color = '';
    stageWord.textContent = stageInfo.word[current];
    stageWord.style.color = `var(--${stageInfo.textColor[current]}-text)`;
  } else {
    stageStatus.textContent = 'Currently inside:';
    stageStatus.style.color = 'var(--red-text)';
    stageWord.textContent = global.challengesInfo.name[challenge];
    stageWord.style.color = `var(--${global.challengesInfo.color[challenge]}-text)`;
  }

  getId('stageSelect').style.display = activeAll.length > 1 ?
    '' :
    'none';
  if (player.strange[0].total <= 0) { getId('strangenessTabBtn').style.display = 'none'; }
  if (vacuum) {
    getId('stageReset').textContent = current >= 5 ?
      'Return back to start' :
      'Not ready for reset';
    if (resets < 1 && highest < 7) {
      if (current < 5) {
        getId('resetStage').style.display = 'none';
        getId('stageToggleReset').style.display = 'none';
      }
    } else {
      getId('dischargeToggleReset').style.display = '';
      getId('vaporizationToggleReset').style.display = '';
      getId('rankToggleReset').style.display = '';
      getId('collapseToggleReset').style.display = '';
    }
  } else {
    for (let s = 2; s <= 4; s++) {
      getId(`strangeness${global.mobileDevice ?
        'Page' :
        'Section'}${s}`).style.display = resets >= s + 3 ?
        '' :
        'none';
      getId(`milestone1Stage${s}Div`).style.display = resets >= s + 3 ?
        '' :
        'none';
      getId(`milestone2Stage${s}Div`).style.display = resets >= s + 3 ?
        '' :
        'none';
    }
  }

  if (extra === 'soft') {
    numbersUpdate();
    visualUpdate();
    return;
  } else if (global.screenReader) { // Firefox only recently (24.10.2023) added aria shortcuts (.ariaLabel)
    getId('reset1Main').setAttribute('aria-label', `${['', 'Discharge', 'Vaporization', 'Rank', 'Collapse', ''][active]} reset (hotkey ${['', 'D', 'V', 'R', 'C'][active]})`);
    for (let i = 1; i < buildingsInfo.maxActive[active]; i++) {
      getId(`building${i}`).setAttribute('aria-label', `${buildingsInfo.name[active][i]} (hotkey ${i})`);
    }
    getId('extraResearches').setAttribute('aria-label', `${['', 'Energy', 'Cloud', 'Rank', 'Collapse', ''][active]} Researches`);
    getId('SRStage').textContent = `Current active Stage is '${stageInfo.word[active]}'${extra === 'reload' && challenge !== -1 ?
      `, also inside the '${global.challengesInfo.name[challenge]}'` :
      ''}`;
  }

  for (const text of ['upgrade', 'element']) {
    getId(`${text}Text`).textContent = 'Hover to see.';
    getId(`${text}Effect`).textContent = 'Hover to see.';
    getId(`${text}Cost`).textContent = 'Resource.';
  }
  if (extra === 'reload') {
    for (let s = 1; s <= 5; s++) {
      getId(`${stageInfo.word[s]}Switch`).style.textDecoration = active === s ?
        'underline' :
        '';
      global.lastUpgrade[s][0] = -1;
    }
    global.lastElement = -1;
    global.lastStrangeness = [-1, -1];
    global.lastMilestone = [-1, -1];
    global.lastChallenge = [-1, -1];
    global.debug.historyStage = -1;
    for (const text of ['strangeness', 'milestones']) {
      getId(`${text}Stage`).textContent = '';
      getId(`${text}Text`).textContent = 'Hover to see.';
    }
    getId('strangenessEffect').textContent = 'Hover to see.';
    getId('strangenessCost').textContent = 'Strange quarks.';
    getId('milestonesMultiline').innerHTML = '<p class="orchidText">Requirement: <span class="greenText">Hover to see.</span></p><p class="darkvioletText">Unlock: <span class="greenText">Hover to see.</span></p>';
    if (global.mobileDevice) { MDStrangenessPage(1); }
    getChallengeDescription(-1);

    global.trueActive = active;
    for (let i = 0; i < global.elementsInfo.startCost.length; i++) { visualUpdateUpgrades(i, 4, 'elements'); }
    assignBuildingInformation();

    autoUpgradesSet('all');
    autoResearchesSet('researches', 'all');
    autoResearchesSet('researchesExtra', 'all');
    autoElementsSet();
  }

  for (let i = buildingsInfo.maxActive[active]; i < specialHTML.longestBuilding; i++) {
    getId(`building${i}Stats`).style.display = 'none';
    getId(`building${i}`).style.display = 'none';
  }
  for (let i = global.upgradesInfo[active].maxActive; i < specialHTML.longestUpgrade; i++) {
    getId(`upgrade${i + 1}`).style.display = 'none';
  }
  for (let i = global.researchesInfo[active].maxActive; i < specialHTML.longestResearch; i++) {
    getId(`research${i + 1}`).style.display = 'none';
  }
  for (let i = global.researchesExtraInfo[active].maxActive; i < specialHTML.longestResearchExtra; i++) {
    getId(`researchExtra${i + 1}`).style.display = 'none';
  }
  for (let i = specialHTML.footerStatsHTML[active].length; i < specialHTML.longestFooterStats; i++) {
    getId(`footerStat${i + 1}`).style.display = 'none';
  }

  const showU: number[] = []; // Upgrades
  const showR: number[] = []; // Researches
  const showRE: number[] = []; // ResearchesExtra
  const showF: number[] = []; // Footer stats
  switch (active) {
  case 1: {
    showU.push(3, 4, 5, 6);
    showR.push(1, 2, 3, 4, 5, 6);
    showF.push(1, 2);
    if (vacuum) {
      showU.unshift(1, 2);
      showRE.push(1, 3);
    } else {
      getId('upgrade1').style.display = 'none';
      getId('upgrade2').style.display = 'none';
      getId('extraResearches').style.display = 'none';
    }

    break;
  }
  case 2: {
    showU.push(1);
    showR.push(1, 2);
    showRE.push(1, 2);
    showF.push(2, 3);
    if (vacuum) { getId('stageInfo').style.display = ''; }

    break;
  }
  case 3: {
    showU.push(1, 2);
    showR.push(1, 2);
    showRE.push(1);
    showF.push(1);
    global.debug.rankUpdated = -1;
    getId('reset1Main').style.display = '';
    getId('stageInfo').style.display = vacuum ?
      '' :
      'none';

    break;
  }
  case 4: {
    showU.push(1, 2, 3);
    showR.push(1, 2, 3);
    showRE.push(1);
    showF.push(1, 2);
    getId('stageInfo').style.display = '';
    getId('extraResearches').style.display = '';

    break;
  }
  case 5: {
    showF.push(1, 2, 3);
    getId('reset1Main').style.display = 'none';
    getId('stageInfo').style.display = 'none';
    getId('extraResearches').style.display = 'none';
    if (vacuum) {
      getId('building2').style.display = '';
      showU.push(1, 2);
      showR.push(1, 2);
    }

    break;
  }
        // No default
  }
  getId('buildings').style.display = '';
  getId('building1').style.display = '';
  getId('upgrades').style.display = '';
  getId('researches').style.display = '';
  getId('stageResearches').style.display = '';
  if (active !== 4) { getId('specials').style.display = 'none'; }
  getId('solarMassStats').style.display = active === 4 || active === 5 ?
    '' :
    'none';

  (getId('autoWaitInput') as HTMLInputElement).value = format(player.toggles.shop.wait[active], { type: 'input' });
  getId('reset1Text').innerHTML = specialHTML.resetHTML[active]; // New ID's inside

  const buildingHTML = specialHTML.buildingHTML[active];
  for (let i = 1; i < buildingsInfo.maxActive[active]; i++) {
    (getId(`building${i}Image`) as HTMLImageElement).src = `Used_art/${buildingHTML[i - 1]}`;
    getId(`building${i}StatName`).textContent = buildingsInfo.name[active][i];
    getId(`building${i}Name`).textContent = buildingsInfo.name[active][i];
    getQuery(`#building${i}ProdDiv > span`).textContent = buildingsInfo.type[active][i];
    getId(`building${i}ProdDiv`).title = buildingsInfo.hoverText[active][i - 1];
    toggleSwap(i, 'buildings');
  }
  getId('building0StatName').textContent = buildingsInfo.name[active][0];
  toggleSwap(0, 'buildings');

  const upgradeHTML = specialHTML.upgradeHTML[active];
  for (let i = 0; i < global.upgradesInfo[active].maxActive; i++) {
    const image = getId(`upgrade${i + 1}`) as HTMLInputElement;
    if (showU.includes(i + 1)) { image.style.display = ''; }
    image.src = `Used_art/${upgradeHTML[i][0]}`;
    image.alt = upgradeHTML[i][1];
    visualUpdateUpgrades(i, active, 'upgrades');
  }

  const researchHTML = specialHTML.researchHTML[active];
  for (let i = 0; i < global.researchesInfo[active].maxActive; i++) {
    const main = getId(`research${i + 1}`);
    if (showR.includes(i + 1)) { main.style.display = ''; }
    main.className = researchHTML[i][2];
    const image = getId(`research${i + 1}Image`) as HTMLInputElement;
    image.src = `Used_art/${researchHTML[i][0]}`;
    image.alt = researchHTML[i][1];
    visualUpdateResearches(i, active, 'researches');
  }

  if (active !== 5) {
    const researchExtraHTML = specialHTML.researchExtraHTML[active];
    for (let i = 0; i < global.researchesExtraInfo[active].maxActive; i++) {
      const main = getId(`researchExtra${i + 1}`);
      if (showRE.includes(i + 1)) { main.style.display = ''; }
      main.className = researchExtraHTML[i][2];
      const image = getId(`researchExtra${i + 1}Image`) as HTMLInputElement;
      image.src = `Used_art/${researchExtraHTML[i][0]}`;
      image.alt = researchExtraHTML[i][1];
      visualUpdateResearches(i, active, 'researchesExtra');
    }
    getQuery('#extraResearches > div').className = specialHTML.researchExtraDivHTML[active][1];
    (getQuery('#extraResearches > img') as HTMLImageElement).src = `Used_art/${specialHTML.researchExtraDivHTML[active][0]}`;
  }
  visualUpdateResearches(0, active, 'ASR');

  const footerStatsHTML = specialHTML.footerStatsHTML[active];
  for (const [i, element] of footerStatsHTML.entries()) {
    if (showF.includes(i + 1)) { getId(`footerStat${i + 1}`).style.display = ''; }
    (getQuery(`#footerStat${i + 1} > img`) as HTMLImageElement).src = `Used_art/${element[0]}`;
    getQuery(`#footerStat${i + 1} > p`).className = element[1];
    getId(`footerStat${i + 1}Name`).textContent = element[2];
  }

  const body = document.body.style;
  if (active === 1) {
    body.removeProperty('--stage-text');
    body.removeProperty('--stage-button-border');
    body.removeProperty('--stage-image-borderColor');
    body.removeProperty('--image-border');
  } else {
    body.setProperty('--stage-text', `var(--${stageInfo.textColor[active]}-text)`);
    body.setProperty('--stage-button-border', stageInfo.buttonBorder[active]);
    body.setProperty('--stage-image-borderColor', stageInfo.imageBorderColor[active]);
    body.setProperty('--image-border', `url("Used_art/Stage${active} border.png")`);
  }
  getId('currentSwitch').textContent = stageInfo.word[active];

  if (global.trueActive === active) {
    switchTab(checkTab(global.tab) ?
      global.tab :
      'stage');
  }
  switchTheme();
}
