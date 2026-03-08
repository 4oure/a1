// ── shared state ────────────────────────────────────────────────
const CSV_PATH = 'data/crimes_aggregated.csv';

let rawData = [];
let filteredData = [];
let yearlyData = [];

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
    total: v.total,
    arrests: v.arrests,
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
  tt.style.top = (event.clientY - 10) + 'px';
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
    total: v.total,
    arrests: v.arrests,
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

  const margin = { top: 50, right: 80, bottom: 70, left: 80 };
  const width = 860 - margin.left - margin.right;
  const height = 380 - margin.top - margin.bottom;

  const svg = d3.select('#chart1')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Scales
  const xScale = d3.scaleBand()
    .domain(yearlyData.map(d => d.Year))
    .range([0, width])
    .padding(0.2);

  const yLeft = d3.scaleLinear()
    .domain([0, d3.max(yearlyData, d => d.total)])
    .nice()
    .range([height, 0]);

  const yRight = d3.scaleLinear()
    .domain([0, 35])
    .range([height, 0]);

  // Gridlines
  g.append('g')
    .attr('class', 'grid')
    .call(
      d3.axisLeft(yLeft)
        .tickSize(-width)
        .tickFormat('')
    );

  // Bars: total crimes
  g.selectAll('.bar')
    .data(yearlyData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.Year))
    .attr('y', d => yLeft(d.total))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yLeft(d.total))
    .attr('fill', '#555')
    .on('mousemove', function (event, d) {
      showTooltip(
        event,
        `<strong>${d.Year}</strong><br/>
         Total crimes: ${d.total.toLocaleString()}<br/>
         Arrests: ${d.arrests.toLocaleString()}<br/>
         Arrest rate: ${d.arrest_rate}%`
      );
    })
    .on('mouseleave', hideTooltip);

  // Line generator for arrest rate
  const line = d3.line()
    .x(d => xScale(d.Year) + xScale.bandwidth() / 2)
    .y(d => yRight(d.arrest_rate));

  // Arrest rate line
  g.append('path')
    .datum(yearlyData)
    .attr('fill', 'none')
    .attr('stroke', '#e05c5c')
    .attr('stroke-width', 3)
    .attr('d', line);

  // Dots
  g.selectAll('.dot')
    .data(yearlyData)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.Year) + xScale.bandwidth() / 2)
    .attr('cy', d => yRight(d.arrest_rate))
    .attr('r', 4)
    .attr('fill', '#e05c5c')
    .on('mousemove', function (event, d) {
      showTooltip(
        event,
        `<strong>${d.Year}</strong><br/>
         Total crimes: ${d.total.toLocaleString()}<br/>
         Arrests: ${d.arrests.toLocaleString()}<br/>
         Arrest rate: ${d.arrest_rate}%`
      );
    })
    .on('mouseleave', hideTooltip);

  // Axes
  const xAxis = d3.axisBottom(xScale)
    .tickValues(yearlyData
      .filter((d, i) => i % 2 === 0)
      .map(d => d.Year));

  g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .attr('transform', 'rotate(-40)')
    .style('text-anchor', 'end');

  g.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(yLeft).ticks(6).tickFormat(d3.format('.2s')));

  g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${width},0)`)
    .call(d3.axisRight(yRight).ticks(7).tickFormat(d => `${d}%`));

  // Axis labels
  g.append('text')
    .attr('x', width / 2)
    .attr('y', height + 60)
    .attr('fill', '#aaa')
    .attr('text-anchor', 'middle')
    .text('Year');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -55)
    .attr('fill', '#aaa')
    .attr('text-anchor', 'middle')
    .text('Total Crimes');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', width + 55)
    .attr('fill', '#aaa')
    .attr('text-anchor', 'middle')
    .text('Arrest Rate %');

  // Annotation helper
  function addAnnotation(year, label, color) {
    const x = xScale(year) + xScale.bandwidth() / 2;

    g.append('line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,4');

    g.append('text')
      .attr('x', x)
      .attr('y', -12)
      .attr('fill', color)
      .attr('font-size', 12)
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text(label);
  }

  addAnnotation(2016, 'Laquan McDonald Effect', '#ffd23f');
  addAnnotation(2020, 'COVID + BLM', '#58a6ff');

  // Brush
  const brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on('end', brushed);

  g.append('g')
    .attr('class', 'brush')
    .call(brush);

  function brushed(event) {
    if (!event.selection) {
      onBrush(null);
      return;
    }

    const [x0, x1] = event.selection;

    const selectedYears = yearlyData
      .filter(d => {
        const center = xScale(d.Year) + xScale.bandwidth() / 2;
        return center >= x0 && center <= x1;
      })
      .map(d => d.Year);

    if (selectedYears.length === 0) {
      onBrush(null);
      return;
    }

    const y0 = d3.min(selectedYears);
    const y1 = d3.max(selectedYears);
    onBrush(y0, y1);
  }
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

  const typeData = aggregateByType(filteredData).sort((a, b) => b.total - a.total);
  const margin = { top: 20, right: 20, bottom: 40, left: 160 };
  const width = 860 - margin.left - margin.right;
  const height = 360 - margin.top - margin.bottom;

  const svg = d3.select('#chart2')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);


  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  // scales
  const yScale = d3.scaleBand()
    .domain(typeData.map(d => d.type))
    .range([0, height])
    .padding(0.3);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(typeData, d => d.total)])
    .nice()
    .range([0, width]);

  // total Bars
  g.selectAll('.bar-total')
    .data(typeData)
    .enter()
    .append('rect')
    .attr('class', 'bar-total')
    .attr('y', d => yScale(d.type))
    .attr('x', 0)
    .attr('height', yScale.bandwidth())
    .attr('width', d => xScale(d.total))
    .attr('fill', '#555')
    .on('mousemove', (event, d) => {
      showTooltip(event,
        `<strong>${d.type}</strong><br/>
       Total crimes: ${d.total.toLocaleString()}<br/>
       Arrests: ${d.arrests.toLocaleString()}<br/>
       Arrest rate: ${d.arrest_rate}%`
      );
    })
    .on('mouseleave', hideTooltip);

  g.selectAll('.bar-arrests')
    .data(typeData)
    .enter()
    .append('rect')
    .attr('class', 'bar-arrests')
    .attr('y', d => yScale(d.type))
    .attr('x', 0)
    .attr('height', yScale.bandwidth())
    .attr('width', d => xScale(d.arrests))
    .attr('fill', '#4a90d9')
    .on('mousemove', (event, d) => {
      showTooltip(event,
        `<strong>${d.type}</strong><br/>
         Total crimes: ${d.total.toLocaleString()}<br/>
         Arrests: ${d.arrests.toLocaleString()}<br/>
         Arrest rate: ${d.arrest_rate}%`
      );
    })
    .on('mouseleave', hideTooltip);

  g.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(yScale).tickSize(0))
    .select('.domain').remove();

  g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('.2s')));

  const legend = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${height + margin.top + 30})`);

  [['#555', 'Total Crimes'], ['#4a90d9', 'Arrests Made']].forEach(([color, label], i) => {
    legend.append('rect')
      .attr('x', i * 140).attr('y', 0)
      .attr('width', 12).attr('height', 12)
      .attr('fill', color);
    legend.append('text')
      .attr('x', i * 140 + 16).attr('y', 11)
      .attr('fill', '#aaa').attr('font-size', 12)
      .text(label);
  });
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

  let data = aggregateByType(filteredData)
    .sort((a, b) => b.arrest_rate - a.arrest_rate);

  const margin = { top: 45, right: 40, bottom: 60, left: 190 };
  const width = 860 - margin.left - margin.right;
  const height = 420 - margin.top - margin.bottom;

  const svg = d3.select('#chart3')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width]);

  const yScale = d3.scaleBand()
    .domain(data.map(d => d.type))
    .range([0, height])
    .padding(0.3);

  // Gridlines
  g.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${height})`)
    .call(
      d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat('')
    );

  // Average arrest rate across currently filtered crime types
  const avg = d3.mean(data, d => d.arrest_rate);

  // Bars
  g.selectAll('.rate-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'rate-bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.type))
    .attr('width', d => xScale(d.arrest_rate))
    .attr('height', yScale.bandwidth())
    .attr('fill', d => d3.interpolateRdYlBu(d.arrest_rate / 100))
    .on('mousemove', function(event, d) {
      showTooltip(
        event,
        `<strong>${d.type}</strong><br/>
         Arrest rate: ${d.arrest_rate}%<br/>
         Total crimes: ${d.total.toLocaleString()}<br/>
         Arrests: ${d.arrests.toLocaleString()}`
      );
    })
    .on('mouseleave', hideTooltip);

  // Value labels at end of bars
  g.selectAll('.rate-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'rate-label')
    .attr('x', d => xScale(d.arrest_rate) + 6)
    .attr('y', d => yScale(d.type) + yScale.bandwidth() / 2 + 4)
    .attr('fill', '#bbb')
    .attr('font-size', 11)
    .text(d => `${d.arrest_rate}%`);

  // City average reference line
  g.append('line')
    .attr('x1', xScale(avg))
    .attr('x2', xScale(avg))
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#aaa')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '6,4');

  g.append('text')
    .attr('x', xScale(avg))
    .attr('y', -12)
    .attr('text-anchor', 'middle')
    .attr('fill', '#aaa')
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .text('City Average');

  // Axes
  g.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(yScale));

  g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => `${d}%`));

  // X-axis label
  g.append('text')
    .attr('x', width / 2)
    .attr('y', height + 45)
    .attr('text-anchor', 'middle')
    .attr('fill', '#aaa')
    .text('Arrest Rate %');
}


// ── load data ────────────────────────────────────────────────────
window.addEventListener('load', () => {
  d3.csv(CSV_PATH, d => ({
    Year: +d.Year,
    'Primary Type': d['Primary Type'],
    total: +d.total,
    arrests: +d.arrests,
    arrest_rate: +d.arrest_rate
  })).then(data => {
    rawData = data;
    filteredData = data;
    yearlyData = buildYearlyData(data);
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
