document.getElementById('settings-form').addEventListener('submit', e => {
  e.preventDefault();
  const accent = document.getElementById('accent-picker').value;
  document.documentElement.style.setProperty('--accent', accent + '66');
  document.documentElement.style.setProperty('--accent-solid', accent + '99');
  const dark = document.getElementById('dark-mode').checked;
  document.documentElement.classList.toggle('dark-theme', dark);
});
