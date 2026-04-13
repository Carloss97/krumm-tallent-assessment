import fs from 'fs/promises';

function hexToRgb(hex) {
  hex = hex.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function parseRgbString(s) {
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(',').map(p => p.trim());
  const r = Number(parts[0]);
  const g = Number(parts[1]);
  const b = Number(parts[2]);
  const a = parts[3] !== undefined ? Number(parts[3]) : 1;
  return [r, g, b, a];
}

function parseColor(val) {
  if (!val) return null;
  val = val.trim();
  if (val.startsWith('#')) return [...hexToRgb(val), 1];
  if (val.startsWith('rgb')) return parseRgbString(val);
  // fallback named colors or css var will be handled outside
  return null;
}

function blendColors(fg, bg) {
  // fg and bg are [r,g,b,a]
  const a = fg[3];
  const out = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    out[i] = Math.round((fg[i] * a) + (bg[i] * (1 - a)));
  }
  return out;
}

function relativeLuminance([r, g, b]) {
  const srgb = [r, g, b].map(v => v / 255).map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(c1, c2) {
  const L1 = relativeLuminance(c1);
  const L2 = relativeLuminance(c2);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

async function loadCssVars() {
  const tokens = await fs.readFile('src/styles/tokens.css', 'utf8');
  const vars = {};
  const re = /--([\w-]+):\s*([^;]+);/g;
  let m;
  while ((m = re.exec(tokens))) {
    vars[`--${m[1]}`] = m[2].trim();
  }
  return vars;
}

function resolveVar(val, vars) {
  if (!val) return val;
  const m = val.match(/var\((--[\w-]+)\)/);
  if (!m) return val;
  return vars[m[1]] || val;
}

(async function main() {
  const vars = await loadCssVars();

  const surfaceCard = resolveVar(vars['--surface-card'], vars);
  const surface0 = resolveVar(vars['--surface-0'], vars);
  const surface1 = resolveVar(vars['--surface-1'], vars);
  const surface2 = resolveVar(vars['--surface-2'], vars);
  const textColor = resolveVar(vars['--text-color'], vars);

  const brand700 = resolveVar(vars['--brand-700'], vars);
  const brand600 = resolveVar(vars['--brand-600'], vars);

  const pairs = [
    { name: 'Body text on surface-1', fg: textColor, bg: surface1, min: 4.5 },
    { name: 'Body text on surface-0', fg: textColor, bg: surface0, min: 4.5 },
    { name: 'Body text on surface-2', fg: textColor, bg: surface2, min: 4.5 },
    { name: 'Button text (white) on brand-700', fg: '#ffffff', bg: brand700, min: 4.5 },
    { name: 'Button text (white) on brand-600', fg: '#ffffff', bg: brand600, min: 4.5 },
    { name: 'Loading text on surface-1', fg: '#374151', bg: surface1, min: 4.5 },
  ];

  const results = [];

  for (const p of pairs) {
    const fgResolved = p.fg.startsWith('var(') ? resolveVar(p.fg, vars) : p.fg;
    const bgResolved = p.bg.startsWith('var(') ? resolveVar(p.bg, vars) : p.bg;

    const fg = parseColor(fgResolved) || parseColor(resolveVar(fgResolved, vars));
    const bg = parseColor(bgResolved) || parseColor(resolveVar(bgResolved, vars));

    if (!fg || !bg) {
      results.push({ name: p.name, ok: false, reason: `Could not parse colors (fg=${p.fg}, bg=${p.bg})` });
      continue;
    }

    // if fg has alpha and bg is solid, blend
    let finalFg = fg;
    let finalBg = bg.slice(0, 3);
    if (fg[3] < 1) {
      finalFg = blendColors(fg, finalBg);
    }

    const ratio = contrastRatio(finalFg, finalBg);
    results.push({ name: p.name, ratio: Number(ratio.toFixed(2)), ok: ratio >= p.min, min: p.min });
  }

  console.log('Contrast audit results:\n');
  let anyFail = false;
  for (const r of results) {
    if (r.ok) {
      console.log(`✔ ${r.name}: ${r.ratio} (passes >= ${r.min})`);
    } else {
      anyFail = true;
      console.log(`✖ ${r.name}: ${r.ratio || 'N/A'} (fails, needs >= ${r.min})`);
    }
  }

  if (anyFail) {
    console.log('\nSome contrast checks failed. See above for details.');
    process.exitCode = 2;
  } else {
    console.log('\nAll contrast checks passed.');
    process.exitCode = 0;
  }
})();
