function makePassword(opts) {
  let chars = '';
  if (opts.upper)   chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (opts.lower)   chars += 'abcdefghijklmnopqrstuvwxyz';
  if (opts.numbers) chars += '0123456789';
  if (opts.symbols) chars += '!@#$%^&*()';
  let pw = '';
  for (let i = 0; i < opts.length; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

document.getElementById('generate').addEventListener('click', () => {
  const opts = {
    length: +document.getElementById('length').value,
    upper: document.getElementById('upper').checked,
    lower: document.getElementById('lower').checked,
    numbers: document.getElementById('numbers').checked,
    symbols: document.getElementById('symbols').checked
  };
  const pwd = makePassword(opts);
  document.getElementById('result').textContent = pwd;

  // strength bar
  const strength = Math.min(pwd.length / 32, 1) * 100;
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.style.width = strength + '%';
  const str = document.getElementById('strength');
  str.innerHTML = '';
  str.appendChild(bar);
});

document.getElementById('copy').addEventListener('click', () => {
  navigator.clipboard.writeText(
    document.getElementById('result').textContent
  );
});
