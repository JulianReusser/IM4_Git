async function loadStats() {
    try {
        const response = await fetch('/api/unload.php');
        const result = await response.json();

        if (!result.success) {
            console.error('Fehler:', result.error);
            return;
        }

        const container = document.getElementById('stats-container');
        container.innerHTML = '';

        result.data.forEach(item => {
            container.innerHTML += `
                <div class="stat-card">
                    <h3>${item.name}</h3>
                    <p>Email: ${item.email}</p>
                    <p>Gerät-ID: ${item.geraet_id}</p>
                </div>
            `;
        });

    } catch (err) {
        console.error('Netzwerkfehler:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadStats);

// Fetch weekly average and update the big stat
async function loadWeekAverage() {
    // If app is inactive, show inactive message and skip fetching
    if (window.SOOZY_ACTIVE === false) {
        setInactiveState();
        return;
    }
    try {
        const res = await fetch('/api/week_stats.php', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error('Network response not ok');
        const data = await res.json();
        if (data && data.success) {
            const el = document.querySelector('.average-card .big-stat');
            if (el) el.textContent = (data.avg_week !== null) ? Math.round(data.avg_week) + ' dB' : '—';
        }
    } catch (err) {
        console.error('Failed to load week average:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // respect persisted activity state
    const persisted = localStorage.getItem('soozy_active');
    const isActive = persisted === 'false' ? false : true;
    if (!isActive) {
        // show inactive UI and don't start polling
        setInactiveState();
    } else {
        loadWeekAverage();
        // optional: refresh every 30s
        setInterval(loadWeekAverage, 30000);
    }
});

// Load per-weekday averages (Mon-Fri) and populate the performance list
async function loadWeekDays() {
    if (window.SOOZY_ACTIVE === false) {
        setInactiveState();
        return;
    }
    try {
    const res = await fetch('/api/week_days.php', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error('Network response not ok');
        const data = await res.json();
        if (!data || !data.success) return;

        // Expect data.days as an array [Mon, Tue, Wed, Thu, Fri] with objects {avg,min,max} or null
        const days = data.days || [];
        const items = document.querySelectorAll('.performance-item');
        items.forEach((item, idx) => {
            const dayData = days[idx];
            const top = item.querySelector('.performance-top');
            const fill = item.querySelector('.progress-fill');
            // preserve the day label in <strong>
            const dayLabelEl = top ? top.querySelector('strong') : null;
            const dayLabel = dayLabelEl ? dayLabelEl.textContent : '';

            if (dayData && dayData.avg !== null) {
                const avg = Math.round(dayData.avg);
                const min = dayData.min !== null ? Math.round(dayData.min) : null;
                top.innerHTML = `<strong>${dayLabel}</strong><span>Ø ${avg} dB</span><span class="green-text">Min ${min !== null ? min + ' dB' : '—'}</span>`;
                if (fill) fill.style.width = Math.max(2, Math.min(100, Math.round((avg / 120) * 100))) + '%';
            } else {
                top.innerHTML = `<strong>${dayLabel}</strong><span>Ø —</span><span class="green-text">Min —</span>`;
                if (fill) fill.style.width = '2%';
            }
        });
        // Additionally fetch today's stats and show them in today's slot (if Mon-Fri)
        try {
            const todayRes = await fetch('/api/day_stats.php', { cache: 'no-store', credentials: 'include' });
            if (todayRes.ok) {
                const todayData = await todayRes.json();
                if (todayData && todayData.success) {
                    const today = new Date();
                    const weekday = today.getDay(); // 0=Sun,1=Mon..6=Sat
                    if (weekday >= 1 && weekday <= 5) {
                        const idx = weekday - 1; // map Mon->0
                        const item = items[idx];
                        if (item) {
                            const top = item.querySelector('.performance-top');
                            const fill = item.querySelector('.progress-fill');
                            const dayLabelEl = top ? top.querySelector('strong') : null;
                            const dayLabel = dayLabelEl ? dayLabelEl.textContent : '';
                            const avg = todayData.avg !== null ? Math.round(todayData.avg) : null;
                            const min = todayData.min !== null ? Math.round(todayData.min) : null;
                            if (avg !== null) {
                                top.innerHTML = `<strong>${dayLabel}</strong><span>Ø ${avg} dB</span><span class="green-text">Min ${min !== null ? min + ' dB' : '—'}</span>`;
                                if (fill) fill.style.width = Math.max(2, Math.min(100, Math.round((avg / 120) * 100))) + '%';
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch today stats for week display:', err);
        }
    } catch (err) {
        console.error('Failed to load week days:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const persisted2 = localStorage.getItem('soozy_active');
    const isActive2 = persisted2 === 'false' ? false : true;
    if (!isActive2) {
        setInactiveState();
    } else {
        loadWeekDays();
        setInterval(loadWeekDays, 30000);
    }
});

// --- Chart.js rendering (day/hour and week bar) ---
let dayChart = null;
let weekChart = null;

function ensureCharts() {
    if (typeof Chart === 'undefined') return;
    const dayCtx = document.getElementById('dayHourChart');
    const weekCtx = document.getElementById('weekBarChart');
    if (dayCtx && !dayChart) {
        dayChart = new Chart(dayCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array.from({length:24}, (_,i) => i + ':00'),
                datasets: [{ label: 'Ø dB', data: Array(24).fill(null), borderColor: '#ff4fa3', backgroundColor: 'rgba(255,79,163,0.12)', tension: 0.25, fill: true }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 120 } } }
        });
    }
    if (weekCtx && !weekChart) {
        weekChart = new Chart(weekCtx.getContext('2d'), {
            type: 'bar',
            data: { labels: ['Mo','Di','Mi','Do','Fr'], datasets: [{ label: 'Ø dB', data: [null,null,null,null,null], backgroundColor: '#60a5fa' }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 120 } } }
        });
    }
}

// Update charts with data
async function updateCharts() {
    ensureCharts();
    if (!dayChart || !weekChart) return;

    const fetchOpts = { cache: 'no-store', credentials: 'include' };
    try {
        const [hourRes, daysRes] = await Promise.all([
            fetch('/api/hour_stats.php', fetchOpts),
            fetch('/api/week_days.php', fetchOpts)
        ]);
        if (hourRes.ok) {
            const hourData = await hourRes.json();
            if (hourData && hourData.series) {
                const series = hourData.series.map(v => v === null ? null : Number(v));
                dayChart.data.datasets[0].data = series;
                dayChart.update();
            }
        }
        if (daysRes.ok) {
            const weekData = await daysRes.json();
            if (weekData && Array.isArray(weekData.days)) {
                const vals = weekData.days.map(d => d && d.avg !== null ? Number(d.avg) : null);
                weekChart.data.datasets[0].data = vals;
                weekChart.update();
            }
        }
    } catch (err) {
        console.error('Failed to update charts:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // load Chart.js dynamically from CDN, then render
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => { updateCharts(); setInterval(updateCharts, 30000); };
    document.head.appendChild(script);
});

// Load loudest and quietest hour of today and update loud & quiet cards
async function loadHourStats() {
    if (window.SOOZY_ACTIVE === false) {
        setInactiveState();
        return;
    }
    try {
    const res = await fetch('/api/hour_stats.php', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error('Network response not ok');
        const data = await res.json();
        if (!data || !data.success) return;

        const hTextL = document.getElementById('loudHourText');
        const descL = document.getElementById('loudDesc');
        const hTextQ = document.getElementById('quietHourText');
        const descQ = document.getElementById('quietDesc');

        function mapAndFill(obj, hEl, dEl) {
            if (!obj || obj.hour === null) {
                if (hEl) hEl.textContent = '—';
                if (dEl) dEl.textContent = 'Keine Daten für heute';
                return;
            }
            const hour = obj.hour;
            const avg = obj.avg;
            const start = hour;
            const end = (hour === 23) ? 0 : hour + 1;
            const pad = n => (n < 10 ? '0' + n : '' + n);
            const rangeText = `${pad(start)}:00 - ${pad(end)}:00`;
            let period = '';
            if (hour >= 6 && hour < 10) period = 'morgen';
            else if (hour >= 10 && hour < 12) period = 'vormittag';
            else if (hour >= 12 && hour < 13) period = 'mittag';
            else if (hour >= 13) period = 'nachmittags';
            else period = 'nachts/early';

            if (hEl) hEl.textContent = rangeText;
            if (dEl) dEl.textContent = `${avg !== null ? 'Ø ' + avg + ' dB - ' : ''}${period}`;
        }

        mapAndFill(data.loud, hTextL, descL);
        mapAndFill(data.quiet, hTextQ, descQ);

    } catch (err) {
        console.error('Failed to load hour stats:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const persisted3 = localStorage.getItem('soozy_active');
    const isActive3 = persisted3 === 'false' ? false : true;
    if (!isActive3) {
        setInactiveState();
    } else {
        loadHourStats();
        setInterval(loadHourStats, 30000);
    }
});

// Load the summary card: today's avg, quietest hour today, loudest hour today, quietest weekday
async function loadSummary() {
    if (window.SOOZY_ACTIVE === false) {
        setInactiveState();
        return;
    }
    try {
        const fetchOpts = { cache: 'no-store', credentials: 'include' };
        const [dayRes, hourRes, weekRes] = await Promise.all([
            fetch('/api/day_stats.php', fetchOpts),
            fetch('/api/hour_stats.php', fetchOpts),
            fetch('/api/week_days.php', fetchOpts)
        ]);

        // Today's average
        const summaryAvgEl = document.getElementById('summaryAvgToday');
        if (dayRes.ok) {
            const dayData = await dayRes.json();
            if (dayData && dayData.success && dayData.avg !== null) {
                summaryAvgEl.textContent = 'Ø ' + Math.round(dayData.avg) + ' dB';
            } else {
                summaryAvgEl.textContent = '—';
            }
        } else if (summaryAvgEl) {
            summaryAvgEl.textContent = '—';
        }

        // Loudest and quietest hour
        const summaryLoudEl = document.getElementById('summaryLoudHour');
        const summaryQuietEl = document.getElementById('summaryQuietHour');
        if (hourRes.ok) {
            const hourData = await hourRes.json();
            function formatHourObj(obj) {
                if (!obj || obj.hour === null) return '—';
                const h = obj.hour;
                const pad = n => (n < 10 ? '0' + n : '' + n);
                const start = pad(h) + ':00';
                const end = pad((h === 23) ? 0 : h + 1) + ':00';
                const avgText = (obj.avg !== null) ? ' (Ø ' + Math.round(obj.avg) + ' dB)' : '';
                return start + ' - ' + end + avgText;
            }
            if (summaryLoudEl) summaryLoudEl.textContent = formatHourObj(hourData.loud);
            if (summaryQuietEl) summaryQuietEl.textContent = formatHourObj(hourData.quiet);
        } else {
            if (summaryLoudEl) summaryLoudEl.textContent = '—';
            if (summaryQuietEl) summaryQuietEl.textContent = '—';
        }

        // Quietest weekday (Mon-Fri) from week_days
        const summaryQuietWeekEl = document.getElementById('summaryQuietWeekday');
        if (weekRes.ok) {
            const weekData = await weekRes.json();
            if (weekData && weekData.success && Array.isArray(weekData.days)) {
                const names = ['Mo','Di','Mi','Do','Fr'];
                let best = null; // {idx, avg}
                weekData.days.forEach((d, i) => {
                    if (d && d.avg !== null) {
                        const a = Number(d.avg);
                        if (best === null || a < best.avg) best = { idx: i, avg: a };
                    }
                });
                if (best) {
                    summaryQuietWeekEl.textContent = names[best.idx] + ' (Ø ' + Math.round(best.avg) + ' dB)';
                } else {
                    summaryQuietWeekEl.textContent = '—';
                }
            } else if (summaryQuietWeekEl) {
                summaryQuietWeekEl.textContent = '—';
            }
        } else if (summaryQuietWeekEl) {
            summaryQuietWeekEl.textContent = '—';
        }

    } catch (err) {
        console.error('Failed to load summary:', err);
        const ids = ['summaryAvgToday','summaryLoudHour','summaryQuietHour','summaryQuietWeekday'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '—';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSummary();
    setInterval(loadSummary, 30000);
});

// Set UI to indicate inactive state across the stats page
function setInactiveState() {
    const msg = 'Inaktiv — es werden momentan keine Daten geladen';
    // big week stat
    const big = document.querySelector('.average-card .big-stat');
    if (big) big.textContent = msg;
    // performance items
    const items = document.querySelectorAll('.performance-item');
    items.forEach(item => {
        const top = item.querySelector('.performance-top');
        if (top) {
            const strong = top.querySelector('strong');
            const label = strong ? strong.textContent : '';
            top.innerHTML = `<strong>${label}</strong><span>${msg}</span>`;
        }
        const fill = item.querySelector('.progress-fill');
        if (fill) { fill.style.width = '2%'; fill.style.background = '#e5e7eb'; }
    });
    // loud/quiet cards
    const hTextL = document.getElementById('loudHourText');
    const descL = document.getElementById('loudDesc');
    const hTextQ = document.getElementById('quietHourText');
    const descQ = document.getElementById('quietDesc');
    if (hTextL) hTextL.textContent = msg; if (descL) descL.textContent = '';
    if (hTextQ) hTextQ.textContent = msg; if (descQ) descQ.textContent = '';
    // summary fields
    const sAvg = document.getElementById('summaryAvgToday'); if (sAvg) sAvg.textContent = msg;
    const sLoud = document.getElementById('summaryLoudHour'); if (sLoud) sLoud.textContent = msg;
    const sQuiet = document.getElementById('summaryQuietHour'); if (sQuiet) sQuiet.textContent = msg;
    const sQuietWeek = document.getElementById('summaryQuietWeekday'); if (sQuietWeek) sQuietWeek.textContent = msg;
    // also stop charts visually by clearing their data
    if (typeof dayChart !== 'undefined' && dayChart && dayChart.data) {
        dayChart.data.datasets[0].data = Array(24).fill(null);
        dayChart.update();
    }
    if (typeof weekChart !== 'undefined' && weekChart && weekChart.data) {
        weekChart.data.datasets[0].data = [null,null,null,null,null];
        weekChart.update();
    }
}