export function initPasswordGenerator() {
  const openGeneratorBtn = document.getElementById('openGeneratorBtn');
  const generatorModal = document.getElementById('generatorModal');
  const generatorClose = document.getElementById('generatorClose');
  const generatedInput = document.getElementById('generatedPassword');
  const copyPasswordBtn = document.getElementById('copyPasswordBtn');
  const refreshPasswordBtn = document.getElementById('refreshPasswordBtn');
  const generateBtn = document.getElementById('generateBtn');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  const pwdLengthSlider = document.getElementById('pwdLength');
  const optionWord = document.getElementById('optionWord');
  const optionNumber = document.getElementById('optionNumber');
  const optionUpper = document.getElementById('optionUpper');
  const optionSymbol = document.getElementById('optionSymbol');
  const optionRandomWord = document.getElementById('optionRandomWord');
  const optionCustom = document.getElementById('optionCustom');

  if (!openGeneratorBtn || !generatorModal) return; // If not on Home page

  openGeneratorBtn.addEventListener('click', () => {
    generatorModal.classList.remove('hidden');
    generateAndRender();
  });

  generatorClose.addEventListener('click', () => {
    generatorModal.classList.add('hidden');
  });

  copyPasswordBtn.addEventListener('click', () => {
    const pwd = generatedInput.value;
    if (pwd) navigator.clipboard.writeText(pwd);
  });

  refreshPasswordBtn.addEventListener('click', generateAndRender);
  generateBtn.addEventListener('click', generateAndRender);

  function simpleGeneratePassword(length, options) {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
    let pool = '';

    if (options.number) pool += numbers;
    if (options.upper) pool += upper;
    if (options.symbol) pool += symbols;
    if (options.randomWord) pool += 'secret';

    if (!pool) pool = lower + numbers + symbols + upper;

    let pwd = '';
    for (let i = 0; i < length; i++) {
      pwd += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    return pwd;
  }

  function updateStrength(password) {
    let score = 0;
    if (password.length > 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const percentages = [20, 40, 60, 80, 100];
    const texts = ['매우 약함', '약함', '보통', '양호', '매우 양호'];
    return { percent: percentages[score], text: texts[score] };
  }

  function generateAndRender() {
    const length = parseInt(pwdLengthSlider.value, 10);
    const options = {
      word: optionWord?.checked,
      number: optionNumber?.checked,
      upper: optionUpper?.checked,
      symbol: optionSymbol?.checked,
      randomWord: optionRandomWord?.checked,
      custom: optionCustom?.value.trim()
    };

    const pwd = simpleGeneratePassword(length, options);
    generatedInput.value = pwd;

    const { percent, text } = updateStrength(pwd);
    strengthBar.style.width = percent + '%';
    strengthText.textContent = text;
  }
}
