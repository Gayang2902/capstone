import { useCallback, useEffect, useMemo, useState } from 'react';
import wordList from '../data/wordlist.json';

const ALLOWED_SYMBOLS_LIST = [
  '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@',
  '[', '₩', ']', '^', '_', '`', '{', '|', '}', '~',
];
const ALLOWED_SYMBOLS = ALLOWED_SYMBOLS_LIST.join('');
const DEFAULT_SYMBOLS = ALLOWED_SYMBOLS;
const DIGITS = '0123456789';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const WORD_LIST = Array.isArray(wordList) && wordList.length > 0 ? wordList : ['apple', 'delta', 'ember', 'fusion', 'galaxy', 'harbor', 'iris', 'jungle', 'lunar', 'marble', 'nectar', 'onyx', 'prism', 'quantum', 'raven', 'topaz', 'ultra', 'velvet', 'willow', 'zenith'];

const pickFallbackWord = (maxLength = 8) => {
  const target = Math.max(2, maxLength);
  let candidate = pickWordByMaxLength(target);
  if (!candidate) {
    candidate = WORD_LIST[secureRandomIndex(WORD_LIST.length)] || 'word';
  }
  if (candidate.length > target) {
    candidate = candidate.slice(0, target);
  }
  return candidate;
};

const secureRandomIndex = (max) => {
  if (max <= 0) return 0;
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    let randomNumber;
    do {
      window.crypto.getRandomValues(array);
      randomNumber = array[0] >>> 0;
    } while (randomNumber >= Math.floor(0xffffffff / max) * max);
    return randomNumber % max;
  }
  return Math.floor(Math.random() * max);
};

const shuffleArray = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = secureRandomIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildRandomString = (pool, count) => {
  if (!count || count <= 0 || !pool.length) return '';
  let str = '';
  for (let i = 0; i < count; i += 1) {
    str += pool[secureRandomIndex(pool.length)];
  }
  return str;
};

const pickWordByMaxLength = (maxLength) => {
  if (maxLength <= 0) return null;
  const candidates = WORD_LIST.filter((word) => word.length <= maxLength);
  if (!candidates.length) return null;
  return candidates[secureRandomIndex(candidates.length)];
};

const sanitizeSymbols = (input = '') =>
  Array.from(new Set(Array.from(input))).filter((char) => ALLOWED_SYMBOLS.includes(char)).join('');

const DEFAULT_OPTIONS = {
  includeLower: true,
  includeUpper: true,
  includeNumber: true,
  includeSymbol: false,
  includeWord: false,
  customSymbols: DEFAULT_SYMBOLS,
};

const analyseStrength = (password, options) => {
  if (!password) {
    return {
      percent: 0,
      labelKey: 'generator.status.waiting',
      barClass: 'bg-gray-400',
      suggestions: ['generator.suggestions.increaseVariety'],
    };
  }

  let score = 0;
  const suggestions = [];

  if (password.length >= 18) score += 3;
  else if (password.length >= 14) score += 2;
  else if (password.length >= 10) score += 1;
  else suggestions.push('generator.suggestions.lengthTwelve');

  const variety = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  score += variety;
  if (variety < 3) suggestions.push('generator.suggestions.addVariety');

  // if (options.includeWord) {
  //   suggestions.push('generator.suggestions.wordComplexity');
  // }

  if (/([A-Za-z0-9])\1{2,}/.test(password)) {
    score -= 1;
    suggestions.push('generator.suggestions.avoidRepeats');
  }

  if (/^(?:012|123|234|345|456|567|678|789|890)/.test(password)) {
    score -= 1;
    suggestions.push('generator.suggestions.avoidSequences');
  }

  score = Math.max(0, Math.min(6, score));
  const labels = [
    'generator.strength.veryWeak',
    'generator.strength.weak',
    'generator.strength.normal',
    'generator.strength.good',
    'generator.strength.strong',
    'generator.strength.veryStrong',
  ];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-yellow-500', 'bg-green-500', 'bg-indigo-600'];
  const percents = [10, 20, 40, 60, 80, 100];
  const index = Math.min(score, labels.length - 1);

  return {
    percent: percents[index],
    labelKey: labels[index],
    barClass: colors[index],
    suggestions,
  };
};

const buildPassword = (length, options) => {
  try {
    if (options.includeWord) {
      if (length < 1) return '';

      const numberCount = options.includeNumber ? secureRandomIndex(4) + 1 : 0;
      const symbolCount = options.includeSymbol ? 1 : 0;

      const reserve = () => numberCount + symbolCount;
      const maxWords = Math.max(1, Math.min(3, Math.floor(length / 4)));
      const requiredWords = Math.max(2, maxWords);

      let chosenWords = [];
      let remainingLength = length;
      let guard = 0;

      while (chosenWords.length < requiredWords && remainingLength > 0 && guard < 100) {
        const reserved = reserve();
        const maxWordLength = Math.max(1, remainingLength - reserved);
        const nextWord = pickWordByMaxLength(maxWordLength);
        if (!nextWord) break;
        chosenWords.push(nextWord);
        remainingLength -= nextWord.length;
        guard += 1;
        if (remainingLength <= reserved) break;
      }

      if (chosenWords.length < requiredWords) {
        while (chosenWords.length < requiredWords && remainingLength > 0) {
          const filler = pickWordByMaxLength(Math.max(1, remainingLength - reserve()));
          if (!filler) break;
          chosenWords.push(filler);
          remainingLength -= filler.length;
        }
      }

      if (!chosenWords.length) {
        const fallback = WORD_LIST[secureRandomIndex(WORD_LIST.length)];
        chosenWords = [fallback.slice(0, length)];
      }

      const applyWordCasing = (word, index) => {
        if (!word) return '';
        let result = word;
        if (!options.includeLower) {
          result = result.toUpperCase();
        } else {
          result = result.toLowerCase();
        }
        if (options.includeUpper && index === 0) {
          result = result.charAt(0).toUpperCase() + result.slice(1);
        }
        return result;
      };

      const processedWords = chosenWords.map((word, index) => applyWordCasing(word, index));

      const numberString = numberCount > 0 ? buildRandomString(DIGITS, numberCount) : '';
      const symbolPool = options.customSymbols?.trim() || DEFAULT_SYMBOLS;
      const cleanedSymbolPool = Array.from(new Set(symbolPool)).filter(Boolean);
      const symbolString =
        symbolCount > 0 && cleanedSymbolPool.length
          ? buildRandomString(cleanedSymbolPool.join(''), symbolCount)
          : '';

      let finalPassword;
      const wordSegments = [...processedWords];
      if (wordSegments.length > 1) {
        const [firstWord, ...restWords] = wordSegments;
        const remainingWordLength = Math.max(
          2,
          length - (firstWord.length + symbolString.length + restWords.reduce((sum, word) => sum + word.length, 0) + numberString.length),
        );
        let secondWord = restWords.shift();
        if (!secondWord || secondWord.length < 2) {
          secondWord = applyWordCasing(pickFallbackWord(remainingWordLength), 1);
        }

        const normalizedRestWords = restWords.map((word, idx) => {
          if (!word || word.length < 2) {
            return applyWordCasing(pickFallbackWord(Math.max(2, remainingWordLength)), idx + 2);
          }
          return word;
        });

        const patterns = [];
        if (symbolString && numberString) {
          patterns.push([firstWord, symbolString, secondWord, ...normalizedRestWords, numberString]);
          patterns.push([firstWord, secondWord, ...normalizedRestWords, numberString, symbolString]);
          patterns.push([firstWord, ...normalizedRestWords, numberString, symbolString]);
        } else if (symbolString) {
          patterns.push([firstWord, symbolString, secondWord, ...normalizedRestWords]);
          patterns.push([firstWord, secondWord, ...normalizedRestWords, symbolString]);
        } else if (numberString) {
          patterns.push([firstWord, secondWord, ...normalizedRestWords, numberString]);
        }
        if (!patterns.length) {
          patterns.push([firstWord, secondWord, ...normalizedRestWords]);
        }

        const selectedPattern = patterns[secureRandomIndex(patterns.length)] || [firstWord, secondWord, ...normalizedRestWords, numberString, symbolString];
        finalPassword = selectedPattern.filter((segment) => segment && segment.length > 0).join('');
      } else {
        finalPassword = [processedWords.join(''), symbolString, numberString].filter(Boolean).join('');
      }

      if (finalPassword.length < length) {
        const remaining = length - finalPassword.length;
        let fillerWord = applyWordCasing(pickFallbackWord(remaining), processedWords.length);
        if (fillerWord.length > remaining) {
          fillerWord = fillerWord.slice(0, remaining);
        }
        finalPassword += fillerWord;
      }

      if (finalPassword.length > length) {
        finalPassword = finalPassword.slice(0, length);
      }

      const ensurePool = (pool, regex) => {
        if (!pool.length) return '';
        if (!regex.test(finalPassword)) {
          const char = pool[secureRandomIndex(pool.length)];
          finalPassword =
            finalPassword.length >= length
              ? finalPassword.slice(0, -1) + char
              : finalPassword + char;
        }
        return finalPassword;
      };

      if (options.includeNumber) {
        finalPassword = ensurePool(DIGITS, /[0-9]/);
      }

      if (options.includeSymbol && cleanedSymbolPool.length) {
        const symbolRegex = new RegExp(`[${escapeRegExp(cleanedSymbolPool.join(''))}]`);
        finalPassword = ensurePool(cleanedSymbolPool, symbolRegex);
      }

      if (options.includeUpper && !/[A-Z]/.test(finalPassword)) {
        finalPassword = finalPassword.charAt(0).toUpperCase() + finalPassword.slice(1);
      }

      if (!options.includeLower && options.includeUpper) {
        finalPassword = finalPassword.toUpperCase();
      } else if (!options.includeLower && !options.includeUpper) {
        finalPassword = finalPassword.toLowerCase();
      }

      return finalPassword.slice(0, length);
    }

    const pools = [];

    if (options.includeLower) {
      pools.push({ key: 'lower', chars: LOWERCASE });
    }
    if (options.includeUpper) {
      pools.push({ key: 'upper', chars: UPPERCASE });
    }
    if (options.includeNumber) {
      pools.push({ key: 'number', chars: DIGITS });
    }
    if (options.includeSymbol) {
      const symbols = options.customSymbols?.trim() || DEFAULT_SYMBOLS;
      pools.push({ key: 'symbol', chars: symbols });
    }

    if (!pools.length) {
      return '';
    }

    const characters = [];

    pools.forEach((pool) => {
      const mandatoryChar = pool.chars[secureRandomIndex(pool.chars.length)];
      characters.push(mandatoryChar);
    });

    const availablePools = pools.length ? pools : [{ key: 'lower', chars: LOWERCASE }];
    while (characters.length < length) {
      const pool = availablePools[secureRandomIndex(availablePools.length)];
      characters.push(pool.chars[secureRandomIndex(pool.chars.length)]);
    }

    const shuffled = shuffleArray(characters).slice(0, length);
    return shuffled.join('');
  } catch (error) {
    console.error('비밀번호 생성 중 오류가 발생했습니다:', error);
    return '';
  }
};

export const usePasswordGenerator = ({
  initialLength = 12,
  initialOptions = DEFAULT_OPTIONS,
} = {}) => {
  const [length, setLength] = useState(initialLength);
  const [options, setOptions] = useState(() => {
    const merged = {
      ...DEFAULT_OPTIONS,
      ...initialOptions,
    };
    merged.customSymbols = sanitizeSymbols(merged.customSymbols) || DEFAULT_SYMBOLS;
    return merged;
  });
  const [password, setPassword] = useState('');

  const regenerate = useCallback(() => {
    const generated = buildPassword(length, options);
    setPassword(generated);
  }, [length, options]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const toggleOption = useCallback((key) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const updateOption = useCallback((key, value) => {
    setOptions((prev) => {
      if (key === 'customSymbols') {
        const sanitized = sanitizeSymbols(value);
        return {
          ...prev,
          customSymbols: sanitized || DEFAULT_SYMBOLS,
        };
      }
      return {
        ...prev,
        [key]: value,
      };
    });
  }, []);

  const strength = useMemo(() => analyseStrength(password, options), [password, options]);

  return {
    length,
    setLength,
    options,
    toggleOption,
    updateOption,
    password,
    regenerate,
    strength,
    DEFAULT_SYMBOLS,
  };
};

export default usePasswordGenerator;
