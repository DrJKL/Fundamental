import { global, player } from './Player';
import { checkTab } from './Check';
import { switchTab } from './Update';
import { buyBuilding, collapseAsyncReset, dischargeAsyncReset, rankAsyncReset, stageAsyncReset, switchStage, toggleSwap, vaporizationAsyncReset } from './Stage';
import { timeWarp } from './Main';

export const detectHotkey = (check: KeyboardEvent) => {
  if (check.code === 'Tab') {
    document.body.classList.add('outlineOnFocus');
    return;
  } else {
    const {activeElement} = document;
    if (activeElement instanceof HTMLInputElement) {
      const activeType = activeElement.type;
      if (activeType === 'text' || activeType === 'number') { return; }
    }
    document.body.classList.remove('outlineOnFocus');
  }
  if (global.paused || check.ctrlKey || check.altKey) { return; }
  const { key, code } = check;

  const numberKey = Number(code.slice(-1));
  if (!Number.isNaN(numberKey)) {
    let isShift = check.shiftKey;
    if (Number.isNaN(Number(key))) {
      if (code === '' || code.startsWith('F')) { return; }
      if (!isShift) { // Numpad
        isShift = true;
        check.preventDefault();
      }
    }

    if (isShift) {
      if (check.repeat) { return; }
      toggleSwap(numberKey, 'buildings', true);
    } else { buyBuilding(numberKey); }
  } else if (key.length === 1) {
    const stringKey = (player.toggles.normal[0] ?
      key :
      code.replace('Key', '')).toLowerCase();
    if (check.shiftKey) {
      if (stringKey === 'a') {
        toggleSwap(0, 'buildings', true);
      }
    } else {
      switch (stringKey) {
      case 'w': {
        check.preventDefault();
        void timeWarp();
      
        break;
      }
      case 's': {
        void stageAsyncReset();
      
        break;
      }
      case 'd': {
        if (global.stageInfo.activeAll.includes(1)) { void dischargeAsyncReset(); }
      
        break;
      }
      case 'v': {
        if (global.stageInfo.activeAll.includes(2)) { void vaporizationAsyncReset(); }
      
        break;
      }
      case 'r': {
        if (global.stageInfo.activeAll.includes(3)) { void rankAsyncReset(); }
      
        break;
      }
      case 'c': {
        if (global.stageInfo.activeAll.includes(4)) { void collapseAsyncReset(); }
      
        break;
      }
      // No default
      }
    }
  } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
    if (check.repeat) { return; }
    if (check.shiftKey) {
      const activeAll = global.stageInfo.activeAll;
      if (activeAll.length === 1) { return; }
      let index = activeAll.indexOf(player.stage.active);

      if (key === 'ArrowLeft') {
        if (index <= 0) {
          index = activeAll.length - 1;
        } else { index--; }
        switchStage(activeAll[index]);
      } else {
        if (index >= activeAll.length - 1) {
          index = 0;
        } else { index++; }
        switchStage(activeAll[index]);
      }
    } else {
      const tabs = global.tabList.tabs;
      let index = tabs.indexOf(global.tab);

      if (key === 'ArrowLeft') {
        do {
          if (index <= 0) {
            index = tabs.length - 1;
          } else { index--; }
        } while (!checkTab(tabs[index]));
        switchTab(tabs[index]);
      } else {
        do {
          if (index >= tabs.length - 1) {
            index = 0;
          } else { index++; }
        } while (!checkTab(tabs[index]));
        switchTab(tabs[index]);
      }
    }
  } else if (key === 'ArrowDown' || key === 'ArrowUp') {
    const {tab} = global;
    const subtab = global.subtab[`${tab}Current`];
    if (check.shiftKey || check.repeat) { return; }
    const subtabs: readonly string[]|undefined = global.tabList[`${tab}Subtabs`];
    let index = subtabs.indexOf(subtab);

    if (key === 'ArrowDown') {
      do {
        if (index <= 0) {
          index = subtabs.length - 1;
        } else { index--; }
      } while (!checkTab(global.tab, subtabs[index]));
      switchTab(global.tab, subtabs[index]);
    } else {
      do {
        if (index >= subtabs.length - 1) {
          index = 0;
        } else { index++; }
      } while (!checkTab(global.tab, subtabs[index]));
      switchTab(global.tab, subtabs[index]);
    }
  }
};
