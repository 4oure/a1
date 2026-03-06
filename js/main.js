// ── shared state ────────────────────────────────────────────────
const CSV_PATH = 'data/crimes_aggregated.csv';

let rawData      = [];
let filteredData = [];
let yearlyData   = [];

const TOP_TYPES = [
  'THEFT', 'BATTERY', 'CRIMINAL DAMAGE', 'NARCOTICS',
  'ASSAULT', 'OTHER OFFENSE', 'BURGLARY', 'MOTOR VEHICLE THEFT',
  'DECEPTIVE PRACTICE', 'ROBBERY', 'CRIMINAL TRESPASS', 'WEAPONS VIOLATION'
];

// Rolls raw rows up to one entry per year
function buildYearlyData(data) {
  const byYear = d3.rollup(
    data,
    v => ({ total: d3.sum(v, d => d.total), arrests: d3.sum(v, d => d.arrests) }),
    d => d.Year
  );
  return Array.from(byYear, ([Year, v]) => ({
    Year,
    total:       v.total,
    arrests:     v.arrests,
    arrest_rate: +(v.arrests / v.total * 100).toFixed(1)
  })).sort((a, b) => a.Year - b.Year);
}

// Called by Chart 1 when the brush changes.
// Pass y0 = null to reset (show all years).
function onBrush(y0, y1) {
  if (y0 === null) {
    filteredData = rawData;
    document.getElementById('chart2-label').textContent = '(All Years)';
    document.getElementById('chart3-label').textContent = '(All Years)';
  } else {
    filteredData = rawData.filter(d => d.Year >= y0 && d.Year <= y1);
    const label = y0 === y1 ? `(${y0})` : `(${y0}–${y1})`;
    document.getElementById('chart2-label').textContent = label;
    document.getElementById('chart3-label').textContent = label;
  }
  drawChart2();
  drawChart3();
}

// ── tooltip helpers ──────────────────────────────────────────────
function showTooltip(event, html) {
  const tt = document.getElementById('tooltip');
  tt.innerHTML = html;
  tt.classList.add('visible');
  tt.style.left = (event.clientX + 14) + 'px';
  tt.style.top  = (event.clientY - 10) + 'px';
}
function hideTooltip() {
  document.getElementById('tooltip').classList.remove('visible');
}

// ── aggregate helper (used by Charts 2 & 3) ─────────────────────
function aggregateByType(data) {
  const byType = d3.rollup(
    data,
    v => ({ total: d3.sum(v, d => d.total), arrests: d3.sum(v, d => d.arrests) }),
    d => d['Primary Type']
  );
  return Array.from(byType, ([type, v]) => ({
    type,
    total:       v.total,
    arrests:     v.arrests,
    arrest_rate: +(v.arrests / v.total * 100).toFixed(1)
  })).filter(d => TOP_TYPES.includes(d.type));
}


// ════════════════════════════════════════════════════════════════
//  CHART 1 — PERSON 1
//  Goal: Show total crimes (bars) + arrest rate % (line) 2001-2025.
//        The arrest rate line is the STAR — make it visually dominant.
//        Bars should be muted/gray so the eye goes to the line first.
//
//  Steps:
//  1. Set up SVG + margins (suggested width=860, height=380)
//  2. xScale = d3.scaleBand() on Year, padding 0.2
//     yLeft  = d3.scaleLinear() for total crimes
//     yRight = d3.scaleLinear() for arrest_rate, domain [0, 35]
//  3. Draw gridlines off yLeft
//  4. Draw bars for total crimes — use a muted color like #555
//  5. Draw line + dots for arrest_rate — use a bright color like #e05c5c
//  6. Draw x-axis, left y-axis (crimes), right y-axis (arrest rate %)
//  7. Add TWO vertical annotation lines with labels:
//       - 2016: "Laquan McDonald Effect" — use a visible color like #ffd23f
//       - 2020: "COVID + BLM"
//     These should be hard to miss. Use a tall dashed vertical line + text above.
//  8. Add d3.brushX():
//       on brush end → find selected years → call onBrush(y0, y1)
//       if selection cleared → call onBrush(null)
//  9. Tooltips on bar hover: show Year, total crimes, arrests, arrest rate
// ════════════════════════════════════════════════════════════════

function drawChart1() {
  document.getElementById('chart1').innerHTML = '';
  // TODO PERSON 1: implement here using yearlyData
  document.getElementById('chart1').innerHTML =
    '<p style="color:#555;font-style:italic;padding:8px">Chart 1 not yet implemented.</p>';
}


// ════════════════════════════════════════════════════════════════
//  CHART 2 — PERSON 2
//  Goal: For each top crime type, show total crimes vs arrests
//        as two side-by-side (or overlapping) bars.
//        Updates when Chart 1 is brushed.
//
//  Steps:
//  1. Call aggregateByType(filteredData) to get per-type totals
//     Sort by total descending
//  2. Set up SVG + margins (suggested width=860, height=360)
//  3. yScale = d3.scaleBand() on type, padding 0.3  (horizontal layout)
//     xScale = d3.scaleLinear() domain [0, max total]
//  4. Draw "total" bars in a muted color (e.g. #555)
//     Draw "arrests" bars in a brighter color (e.g. #4a90d9) on top
//  5. Draw axes and a legend for the two bar colors
//  6. Tooltips on hover: show type, total, arrests, arrest rate %
// ════════════════════════════════════════════════════════════════

function drawChart2() {
  document.getElementById('chart2').innerHTML = '';
  // TODO PERSON 2: implement here using filteredData
  document.getElementById('chart2').innerHTML =
    '<p style="color:#555;font-style:italic;padding:8px">Chart 2 not yet implemented.</p>';
}


// ════════════════════════════════════════════════════════════════
//  CHART 3 — PERSON 3
//  Goal: Horizontal bar chart of arrest rate % per crime type.
//        The KEY story: high-volume crimes (Theft, Burglary etc.)
//        have shockingly LOW arrest rates. Make this obvious.
//
//  Steps:
//  1. Call aggregateByType(filteredData), sort descending by arrest_rate
//  2. Set up SVG + margins (suggested width=860, height=420)
//  3. yScale = d3.scaleBand() on type, padding 0.3
//     xScale = d3.scaleLinear() domain [0, 100]
//  4. Color each bar based on arrest_rate:
//       Use d3.interpolateRdYlBu(arrest_rate / 100)
//       This makes low-rate bars red and high-rate bars blue — very readable
//  5. Add a vertical reference line at the citywide average arrest rate
//     Label it "City Average"
//  6. Draw axes (x-axis label: "Arrest Rate %")
//  7. Tooltips on hover: show type, arrest rate %, total crimes, total arrests
// ════════════════════════════════════════════════════════════════

function drawChart3() {
  document.getElementById('chart3').innerHTML = '';
  // TODO PERSON 3: implement here using filteredData
  document.getElementById('chart3').innerHTML =
    '<p style="color:#555;font-style:italic;padding:8px">Chart 3 not yet implemented.</p>';
}


// ── load data ────────────────────────────────────────────────────
window.addEventListener('load', () => {
  d3.csv(CSV_PATH, d => ({
    Year:           +d.Year,
    'Primary Type':  d['Primary Type'],
    total:          +d.total,
    arrests:        +d.arrests,
    arrest_rate:    +d.arrest_rate
  })).then(data => {
    rawData      = data;
    filteredData = data;
    yearlyData   = buildYearlyData(data);
    drawChart1();
    drawChart2();
    drawChart3();
  }).catch(err => {
    console.error('Failed to load CSV:', err);
    document.body.innerHTML += `
      <p style="color:#e05c5c;font-family:monospace;padding:16px;border:1px solid #e05c5c;margin-top:24px">
        Could not load ${CSV_PATH} — run: python3 -m http.server 8080
      </p>`;
  });
});