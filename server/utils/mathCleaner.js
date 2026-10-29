/**
 * mathCleaner.js
 * Utility to clean math expressions extracted from PDFs and question imports.
 * Converts LaTeX expressions and formatting artifacts into human-readable Unicode math.
 */

function toSuperscript(numStr) {
  const map = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  return String(numStr).split('').map(c => map[c] || c).join('');
}

function toSubscript(numStr) {
  const map = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
  };
  return String(numStr).split('').map(c => map[c] || c).join('');
}

function cleanMathExpression(rawText) {
  if (!rawText || typeof rawText !== 'string') return rawText || '';
  let text = rawText.trim();

  // 1. If it contains duplicate prefix separated by =?
  if (text.includes('=?')) {
    const afterFirst = text.substring(text.indexOf('=?') + 2).trim();
    if (afterFirst.length > 0) {
      text = afterFirst;
    }
  }

  // 2. Clean common PDF column artifact overlaps for percentages and fractions:
  text = text.replace(/%(\d+(\.\d+)?\\?%)/g, '$1');
  text = text.replace(/\b5%(12\.5|22\.5|37\.5|62\.5|27\.5)/g, '$1');
  text = text.replace(/\b25%(6\.25)/g, '$1');
  text = text.replace(/\/4(3\/4)/g, '$1');
  text = text.replace(/\/3(2\/3)/g, '$1');
  text = text.replace(/\/5(2\/5|3\/5)/g, '$1');
  text = text.replace(/\b3313%(33\\frac|33\s*\(1\/3\))/g, '$1');
  text = text.replace(/\b15%(15\\?%)/g, '$1');
  text = text.replace(/\b25%(25\\?%)/g, '$1');
  text = text.replace(/\b20%(20\\?%)/g, '$1');
  text = text.replace(/\b40%(40\\?%)/g, '$1');
  text = text.replace(/\b12\.5%(12\.5\\?%)/g, '$1');
  text = text.replace(/\b22\.5%(22\.5\\?%)/g, '$1');
  text = text.replace(/\b35%(35\\?%)/g, '$1');
  text = text.replace(/\b24%(24\\?%)/g, '$1');
  text = text.replace(/\b37\.5%(37\.5\\?%)/g, '$1');
  text = text.replace(/^%([0-9])/, '$1');

  // 3. LaTeX cleanups
  text = text.replace(/\\text\s*\{\s*of\s*\}/g, ' of ');
  text = text.replace(/\\left\s*([(\[{])/g, '$1');
  text = text.replace(/\\right\s*([)\]}])/g, '$1');
  text = text.replace(/\\times/g, ' × ');
  text = text.replace(/\\div/g, ' ÷ ');
  text = text.replace(/\\%/g, '%');
  text = text.replace(/\\sqrt\{([^}]+)\}/g, '√$1');
  text = text.replace(/\\\{/g, '{').replace(/\\\}/g, '}');

  // Greek letters and math symbols
  text = text.replace(/\\pi\b/g, 'π');
  text = text.replace(/\\theta\b/g, 'θ');
  text = text.replace(/\\alpha\b/g, 'α');
  text = text.replace(/\\beta\b/g, 'β');
  text = text.replace(/\\gamma\b/g, 'γ');
  text = text.replace(/\\lambda\b/g, 'λ');
  text = text.replace(/\\mu\b/g, 'μ');
  text = text.replace(/\\sigma\b/g, 'σ');
  text = text.replace(/\\omega\b/g, 'ω');
  text = text.replace(/\\phi\b/g, 'φ');
  text = text.replace(/\\Delta\b/g, 'Δ');
  text = text.replace(/\\Omega\b/g, 'Ω');
  text = text.replace(/\\(?:le|leq)\b/g, '≤');
  text = text.replace(/\\(?:ge|geq)\b/g, '≥');
  text = text.replace(/\\(?:ne|neq)\b/g, '≠');
  text = text.replace(/\\pm\b/g, '±');
  text = text.replace(/\\approx\b/g, '≈');
  text = text.replace(/\\infty\b/g, '∞');
  text = text.replace(/\\degree\b|\^\\circ\b|\^\{\s*\\circ\s*\}/g, '°');
  text = text.replace(/\\cdot\b/g, '·');

  // Handle exponents ^n
  text = text.replace(/\^([0-9]+)/g, (match, p1) => toSuperscript(p1));
  text = text.replace(/\^\{([0-9]+)\}/g, (match, p1) => toSuperscript(p1));

  // Handle subscripts _n or _{n}
  text = text.replace(/_\{([0-9]+)\}/g, (match, p1) => toSubscript(p1));
  text = text.replace(/_([0-9]+)/g, (match, p1) => toSubscript(p1));

  // Handle \frac{a}{b} -> (a / b)
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');

  // Normalize minus signs
  text = text.replace(/−/g, '-');

  // Normalize spaces around operators (preserve hyphens in words like South-East or Brother-in-law)
  text = text.replace(/\s*([+×÷=≤≥≠±≈])\s*/g, ' $1 ');
  text = text.replace(/(\d)\s*-\s*(\d)/g, '$1 - $2');
  text = text.replace(/\s+/g, ' ').trim();

  // Ensure ending = ? only if expression ends with an equals sign
  if (!text.endsWith('?') && text.endsWith('=')) {
    text += ' ?';
  }

  return text;
}

module.exports = {
  cleanMathExpression,
  toSuperscript,
  toSubscript
};
