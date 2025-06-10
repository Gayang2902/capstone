import { bindInteriorAddButtons } from './addPasswordModal.js';
import { initStatisticsEvents } from './statistics.js';
import { initGroupFlipPopup } from './groupPopup.js';
import { bindDbToggle, bindViewPwdToggle } from './setting.js';

function setActiveButton(btn) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('bg-indigo-100', 'text-indigo-800', 'shadow-lg');
  });
  btn.classList.add('bg-indigo-100', 'text-indigo-800', 'shadow-lg');
}

function loadHome() {
  setActiveButton(document.getElementById('navHome'));
  fetch('./home.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('main-content').innerHTML = html;
      bindInteriorAddButtons();
    })
    .catch(err => console.error('Home 로딩 오류:', err));
    console.log('✅ loadHome() 실행됨 → home.html fetch 시작');

}

function loadStatistics() {
  setActiveButton(document.getElementById('navStats'));
  fetch('./statistics.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('main-content').innerHTML = html;
      initStatisticsEvents();
    })
    .catch(err => console.error('Statistics 로딩 오류:', err));
}

function loadGroup() {
  setActiveButton(document.getElementById('navGroup'));
  fetch('./group.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('main-content').innerHTML = html;
      initGroupFlipPopup();
    })
    .catch(err => console.error('Group 로딩 오류:', err));
}

function loadSetting() {
  setActiveButton(document.getElementById('navSetting'));
  fetch('./setting.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('main-content').innerHTML = html;
      bindDbToggle();
      bindViewPwdToggle();
    })
    .catch(err => console.error('Setting 로딩 오류:', err));
}

export function initNavigation() {
  console.log('✅ initNavigation() 시작됨');
  document.getElementById('navHome').addEventListener('click', () => loadHome());
  document.getElementById('navStats').addEventListener('click', () => loadStatistics());
  document.getElementById('navGroup').addEventListener('click', () => loadGroup());
  document.getElementById('navSetting').addEventListener('click', () => loadSetting());
  loadHome();
}
