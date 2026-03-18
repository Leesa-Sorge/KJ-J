// ============================================
// 3D Printing Cost Calculator — Logic
// ============================================

// Material presets: [filament $/g, typical wattage]
const PRESETS = {
  pla:    { filamentCost: 0.025, wattage: 200, label: 'PLA' },
  abs:    { filamentCost: 0.030, wattage: 250, label: 'ABS' },
  petg:   { filamentCost: 0.035, wattage: 230, label: 'PETG' },
  tpu:    { filamentCost: 0.050, wattage: 210, label: 'TPU' },
  resin:  { filamentCost: 0.060, wattage: 120, label: 'Resin' },
  custom: { filamentCost: null, wattage: null, label: 'Custom' }
};

let activePreset = 'pla';

function applyPreset(key) {
  activePreset = key;
  const preset = PRESETS[key];

  // Update active button styling
  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  const buttons = document.querySelectorAll('.preset-btn');
  buttons.forEach(btn => {
    if (btn.textContent.trim().toLowerCase() === key || 
        (key === 'custom' && btn.textContent.trim() === 'Custom')) {
      btn.classList.add('active');
    }
  });

  // Apply preset values (skip for custom)
  if (preset.filamentCost !== null) {
    document.getElementById('filamentCost').value = preset.filamentCost;
  }
  if (preset.wattage !== null) {
    document.getElementById('printerWattage').value = preset.wattage;
  }

  calculate();
}

function getVal(id) {
  const v = parseFloat(document.getElementById(id).value);
  return isNaN(v) ? 0 : v;
}

function formatCurrency(n) {
  return '$' + n.toFixed(2);
}

function calculate() {
  // Read inputs
  const filamentCostPerG = getVal('filamentCost');
  const filamentGrams    = getVal('filamentUsed');
  const printHours       = getVal('printTime');
  const elecRate         = getVal('electricityRate');
  const wattage          = getVal('printerWattage');
  const wearRate         = getVal('printerWear');
  const laborRate        = getVal('laborRate');
  const laborHours       = getVal('laborTime');
  const failureRate      = getVal('failureRate') / 100;
  const markupPct        = getVal('markup');

  // Calculate individual costs
  const materialCost    = filamentCostPerG * filamentGrams;
  const electricityCost = (wattage / 1000) * printHours * elecRate;
  const wearCost        = wearRate * printHours;
  const laborCost       = laborRate * laborHours;

  // Subtotal before failure adjustment
  const subtotal = materialCost + electricityCost + wearCost + laborCost;

  // Adjust for failure rate (factor in expected reprints)
  const failureMultiplier = 1 / (1 - Math.min(failureRate, 0.99));
  const totalCost = subtotal * failureMultiplier;

  // Markup / Profit
  const sellPrice = totalCost * (1 + markupPct / 100);
  const profit    = sellPrice - totalCost;

  // Update display
  document.getElementById('totalCost').textContent  = formatCurrency(totalCost);
  document.getElementById('sellPrice').textContent  = formatCurrency(sellPrice);
  document.getElementById('profit').textContent     = formatCurrency(profit);
  document.getElementById('markupDisplay').textContent = markupPct + '%';

  // Animate number changes
  animateValue('totalCost');
  animateValue('sellPrice');
  animateValue('profit');

  // Update breakdown bar
  renderBreakdown(materialCost * failureMultiplier, electricityCost * failureMultiplier, wearCost * failureMultiplier, laborCost * failureMultiplier, totalCost);
}

function animateValue(id) {
  const el = document.getElementById(id);
  el.style.transform = 'scale(1.04)';
  el.style.transition = 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)';
  setTimeout(() => {
    el.style.transform = 'scale(1)';
  }, 150);
}

function renderBreakdown(material, electricity, wear, labor, total) {
  const bar = document.getElementById('breakdownBar');
  const legend = document.getElementById('breakdownLegend');

  if (total <= 0) {
    bar.innerHTML = '';
    legend.innerHTML = '';
    return;
  }

  const segments = [
    { label: 'Filament', value: material, cls: 'seg-filament' },
    { label: 'Electricity', value: electricity, cls: 'seg-electricity' },
    { label: 'Printer Wear', value: wear, cls: 'seg-wear' },
    { label: 'Labor', value: labor, cls: 'seg-labor' }
  ];

  // Bar segments
  bar.innerHTML = segments.map(s => {
    const pct = (s.value / total * 100);
    return `<div class="breakdown-segment ${s.cls}" style="width: ${pct}%"></div>`;
  }).join('');

  // Legend items
  legend.innerHTML = segments.map(s => {
    const pct = (s.value / total * 100).toFixed(0);
    return `
      <div class="legend-item">
        <span class="legend-dot ${s.cls}"></span>
        <span>${s.label}</span>
        <span class="legend-value">${formatCurrency(s.value)} (${pct}%)</span>
      </div>`;
  }).join('');
}

// ── Theme Toggle ──
(function(){
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  r.setAttribute('data-theme', d);
  updateIcon();

  t && t.addEventListener('click', () => {
    d = d === 'dark' ? 'light' : 'dark';
    r.setAttribute('data-theme', d);
    t.setAttribute('aria-label', 'Switch to ' + (d === 'dark' ? 'light' : 'dark') + ' mode');
    updateIcon();
  });

  function updateIcon() {
    if (!t) return;
    t.innerHTML = d === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
})();

// Initial calculation
calculate();
