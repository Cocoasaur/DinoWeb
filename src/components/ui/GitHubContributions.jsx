import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 3; y--) years.push(y);
    return years;
}

function parseContributions(html) {
    const flat = html.replace(/\s+/g, ' ');
    const totalMatch = flat.match(/(\d+)\s+contributions\s+in\s+(\d{4})/);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;

    const days = new Map();
    const idToDate = new Map();
    const cellRe = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*?id="(contribution-day-component-[^"]+)"[^>]*?data-level="([0-4])"/g;
    let m;
    while ((m = cellRe.exec(html)) !== null) {
        days.set(m[1], parseInt(m[3], 10));
        idToDate.set(m[2], m[1]);
    }

    const tooltips = new Map();
    const tipRe = /<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g;
    while ((m = tipRe.exec(html)) !== null) {
        tooltips.set(m[1], m[2].replace(/\s+/g, ' ').trim());
    }

    const titles = new Map();
    for (const [id, date] of idToDate) {
        const tip = tooltips.get(id);
        if (tip) titles.set(date, tip);
    }

    return { total, days, titles };
}

function buildColumns(year, days) {
    const pad = (n) => String(n).padStart(2, '0');

    const start = new Date(year, 0, 1);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(year, 11, 31);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const columns = [];
    const cur = new Date(start);
    while (cur <= end) {
        const week = [];
        let monthLabel = '';
        for (let i = 0; i < 7; i++) {
            const inYear = cur.getFullYear() === year;
            const dateStr = inYear ? `${year}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}` : null;
            if (inYear && cur.getDate() === 1) monthLabel = MONTHS[cur.getMonth()];
            week.push({ dateStr, level: dateStr ? (days.get(dateStr) ?? 0) : null });
            cur.setDate(cur.getDate() + 1);
        }
        columns.push({ monthLabel, week });
    }
    return columns;
}

const PROXY_ATTEMPTS = 3;
const PROXY_RETRY_DELAY_MS = 500;

async function proxyFetchWithRetries(fn, attempts = PROXY_ATTEMPTS) {
    let lastErr;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if (attempt < attempts - 1) {
                await new Promise((r) => setTimeout(r, PROXY_RETRY_DELAY_MS));
            }
        }
    }
    throw lastErr;
}

// Fetches contributions data through a tiered proxy chain (each tier
// retried), so a single transient proxy failure never drops the calendar.
function ordinal(n) {
    if (n >= 11 && n <= 13) return 'th';
    const r = n % 10;
    return r === 1 ? 'st' : r === 2 ? 'nd' : r === 3 ? 'rd' : 'th';
}

function tooltipText(count, dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const when = `${MONTHS[m - 1]} ${d}${ordinal(d)}`;
    return count === 0
        ? `No contributions on ${when}.`
        : `${count} contribution${count === 1 ? '' : 's'} on ${when}, ${y}.`;
}

async function fetchContributionsData(username, year) {
    const target = `https://github.com/users/${username}/contributions?from=${year}-01-01&to=${year}-12-31`;

    // Fastest tier first: the dedicated contributions API returns a small
    // JSON payload directly (no proxy hop, no HTML scraping).
    const tier1 = async () => {
        const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=${year}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json.contributions)) throw new Error('unexpected API shape');
        const days = new Map();
        const titles = new Map();
        let total = 0;
        for (const c of json.contributions) {
            if (typeof c.date !== 'string' || !c.date.startsWith(`${year}-`)) continue;
            const level = Number.isFinite(c.level) ? Math.min(Math.max(c.level, 0), 4) : 0;
            days.set(c.date, level);
            const count = Number.isFinite(c.count) ? c.count : 0;
            titles.set(c.date, tooltipText(count, c.date));
            total += count;
        }
        return { total, days, titles };
    };

    const tier2 = async () => {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(target)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const httpCode = json.status && json.status.http_code;
        if (httpCode !== 200 || typeof json.contents !== 'string') throw new Error(`origin HTTP ${httpCode}`);
        if (!json.contents.includes('js-calendar-graph')) throw new Error('calendar graph missing');
        return parseContributions(json.contents);
    };

    const tier3 = async () => {
        const res = await fetch(`https://cors.eu.org/${encodeURIComponent(target)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        if (!html.includes('js-calendar-graph')) throw new Error('calendar graph missing');
        return parseContributions(html);
    };

    const tiers = [tier1, tier2, tier3];
    let lastErr;
    for (const tier of tiers) {
        try {
            return await proxyFetchWithRetries(tier);
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr;
}

// ── Per-year localStorage cache (Maps serialized as arrays) ──
// The cache is an instant-paint buffer, not a data gate. The current year
// is silently re-validated in the background when it is older than
// REFRESH_TTL_MS; past years are immutable and only fetched when uncached.
const cacheKey = (username) => `dinoweb.ghcontrib.v1.${username}`;
const REFRESH_TTL_MS = 5 * 60 * 1000;

function loadCachedYear(username, year) {
    try {
        const raw = localStorage.getItem(cacheKey(username));
        if (!raw) return null;
        const entry = JSON.parse(raw)[year];
        if (!entry || !Array.isArray(entry.days) || !Array.isArray(entry.titles)) return null;
        return {
            total: Number.isFinite(entry.total) ? entry.total : 0,
            days: new Map(entry.days),
            titles: new Map(entry.titles),
            fetchedAt: Number.isFinite(entry.fetchedAt) ? entry.fetchedAt : 0,
        };
    } catch (err) {
        return null;
    }
}

function saveYearToCache(username, year, data) {
    try {
        const key = cacheKey(username);
        let all = {};
        try {
            all = JSON.parse(localStorage.getItem(key)) || {};
        } catch (err) {
            all = {};
        }
        all[year] = {
            total: data.total,
            days: [...data.days.entries()],
            titles: [...data.titles.entries()],
            fetchedAt: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(all));
    } catch (err) {
        // Storage unavailable/full — the cache is best-effort only
    }
}

export default function GitHubContributions({ username = 'Cocoasaur' }) {
    const years = buildYearOptions();
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
    const [dataByYear, setDataByYear] = useState({});
    const [loadingYear, setLoadingYear] = useState(null);
    const [globalFailed, setGlobalFailed] = useState(false);
    const [retryNonce, setRetryNonce] = useState(0);
    const dataRef = useRef({});

    useEffect(() => {
        let cancelled = false;

        const cached = !dataRef.current[selectedYear] && loadCachedYear(username, selectedYear);
        if (cached) {
            dataRef.current = { ...dataRef.current, [selectedYear]: cached };
            setDataByYear(dataRef.current);
        }

        const applyData = (year, data) => {
            dataRef.current = { ...dataRef.current, [year]: data };
            saveYearToCache(username, year, data);
            setDataByYear(dataRef.current);
        };

        const fetchLive = async () => {
            try {
                const d = await fetchContributionsData(username, selectedYear);
                if (!cancelled) {
                    applyData(selectedYear, d);
                    setGlobalFailed(false);
                }
            } catch (err) {
                if (!cancelled && !dataRef.current[selectedYear]) setGlobalFailed(true);
            } finally {
                if (!cancelled) setLoadingYear(null);
            }
        };

        if (cached) {
            // Instant paint from cache — rendering never waits on the network.
            const isCurrentYear = selectedYear === new Date().getFullYear();
            const isFresh = isCurrentYear && (Date.now() - cached.fetchedAt) < REFRESH_TTL_MS;
            if (!isCurrentYear || isFresh) {
                return () => {
                    cancelled = true;
                };
            }
            // Stale current-year data — refresh in the background, off the
            // critical path. Failures silently keep the cached snapshot.
            const scheduleIdle = (fn) => {
                if (typeof window.requestIdleCallback === 'function') {
                    const id = window.requestIdleCallback(fn);
                    return () => window.cancelIdleCallback(id);
                }
                const id = setTimeout(fn, 100);
                return () => clearTimeout(id);
            };
            const cancelIdle = scheduleIdle(fetchLive);
            return () => {
                cancelled = true;
                cancelIdle();
            };
        }

        setLoadingYear(selectedYear);
        fetchLive();

        return () => {
            cancelled = true;
        };
    }, [selectedYear, username, retryNonce]);

    const retryFetch = () => {
        setGlobalFailed(false);
        setRetryNonce((n) => n + 1);
    };

    // ── Custom year dropdown ──
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownFocusIndex, setDropdownFocusIndex] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!dropdownOpen) return;
        const onMouseDown = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setDropdownOpen(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [dropdownOpen]);

    const selectYear = (y) => {
        setSelectedYear(y);
        setDropdownOpen(false);
    };

    const handleSelectKeyDown = (e) => {
        const current = dropdownFocusIndex ?? years.indexOf(selectedYear);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!dropdownOpen) setDropdownOpen(true);
            const dir = e.key === 'ArrowDown' ? 1 : -1;
            setDropdownFocusIndex(Math.min(Math.max(current + dir, 0), years.length - 1));
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (dropdownOpen) {
                setSelectedYear(years[current]);
                setDropdownOpen(false);
            } else {
                setDropdownFocusIndex(current);
                setDropdownOpen(true);
            }
        } else if (e.key === 'Escape') {
            setDropdownOpen(false);
        } else if (e.key === 'Tab') {
            setDropdownOpen(false);
        }
    };

    // ── Day tooltip ──
    const [tooltip, setTooltip] = useState(null);

    useEffect(() => {
        if (!tooltip) return;
        const hide = () => setTooltip(null);
        const onPress = (e) => {
            if (!e.target.closest?.('.about-contributions-day')) setTooltip(null);
        };
        window.addEventListener('scroll', hide, true);
        window.addEventListener('resize', hide);
        document.addEventListener('mousedown', onPress);
        document.addEventListener('touchstart', onPress);
        return () => {
            window.removeEventListener('scroll', hide, true);
            window.removeEventListener('resize', hide);
            document.removeEventListener('mousedown', onPress);
            document.removeEventListener('touchstart', onPress);
        };
    }, [tooltip]);

    const showDayTooltip = (e, text) => {
        if (!text) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const left = Math.min(Math.max(centerX, 96), window.innerWidth - 96);
        setTooltip({ text, left, top: rect.top - 8 });
    };

    const hideDayTooltip = () => setTooltip(null);

    // Hard failure fallback — keep the previous ghchart image behaviour
    if (globalFailed) {
        return (
            <div
                className="about-contributions-cell border p-4"
                style={{ borderColor: 'var(--void-border)', backgroundColor: 'var(--void-surface-80)' }}
            >
                <img
                    src="https://ghchart.rshah.org/Cocoasaur"
                    alt={`GitHub contributions graph for ${username}`}
                    className="about-contributions-fallback"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                />
                <div className="about-contributions-status">
                    Couldn't load the contributions graph.
                    <button
                        type="button"
                        className="about-contributions-retry"
                        onClick={retryFetch}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const data = dataByYear[selectedYear];
    const isLoading = loadingYear === selectedYear && !data;
    const total = data ? data.total : 0;

    let body;
    if (isLoading) {
        body = <div className="about-contributions-status">Loading contributions…</div>;
    } else if (!data || data.days.size === 0) {
        body = <div className="about-contributions-status">No contributions in {selectedYear}.</div>;
    } else {
        const columns = buildColumns(selectedYear, data.days);

        // Group consecutive week columns under their month label.
        // `start` is the cumulative grid column (col 1 = weekday labels),
        // so every label sits exactly above its own week columns.
        const groups = [];
        let nextCol = 2;
        for (const col of columns) {
            if (col.monthLabel) {
                groups.push({ label: col.monthLabel, span: 1, start: nextCol });
                nextCol += 1;
            } else if (groups.length) {
                groups[groups.length - 1].span += 1;
                nextCol += 1;
            } else {
                groups.push({ label: '', span: 1, start: nextCol });
                nextCol += 1;
            }
        }

        body = (
            <div className="about-contributions-calendar">
                <div
                    className="about-contributions-grid"
                    style={{ '--weeks': columns.length }}
                >
                    {/* Month labels — each spans its month's week columns */}
                    {groups.map((g, i) => (
                        <span
                            key={`m-${i}`}
                            className={`about-contributions-month-label${g.label ? '' : ' about-contributions-month-label--empty'}`}
                            style={{ gridColumn: `${g.start} / span ${g.span}`, gridRow: 1 }}
                        >
                            {g.label || '\u00A0'}
                        </span>
                    ))}

                    {/* Weekday labels */}
                    {WEEKDAYS.map((dayName, row) => (
                        <span
                            key={`w-${dayName}`}
                            className="about-contributions-weekday"
                            style={{ gridColumn: 1, gridRow: row + 2 }}
                        >
                            {dayName}
                        </span>
                    ))}

                    {/* Day cells — one 11px column per week */}
                    {columns.map((col, c) =>
                        col.week.map((cell, row) => {
                            const text = cell.dateStr ? (data.titles.get(cell.dateStr) || cell.dateStr) : null;
                            if (cell.dateStr === null) {
                                return (
                                    <span
                                        key={`d-${c}-${row}`}
                                        className="about-contributions-day about-contributions-day--pad"
                                        style={{ gridColumn: c + 2, gridRow: row + 2 }}
                                    />
                                );
                            }
                            return (
                                <span
                                    key={`d-${c}-${row}`}
                                    className={`about-contributions-day about-contributions-day--l${cell.level}`}
                                    style={{ gridColumn: c + 2, gridRow: row + 2 }}
                                    onPointerEnter={(e) => {
                                        if (e.pointerType === 'mouse') showDayTooltip(e, text);
                                    }}
                                    onPointerLeave={(e) => {
                                        if (e.pointerType === 'mouse') hideDayTooltip();
                                    }}
                                    onTouchStart={(e) => showDayTooltip(e, text)}
                                    onBlur={hideDayTooltip}
                                />
                            );
                        })
                    )}
                </div>
                <div className="about-contributions-legend">
                    <span>Less</span>
                    <span className="about-contributions-day about-contributions-day--l0" />
                    <span className="about-contributions-day about-contributions-day--l1" />
                    <span className="about-contributions-day about-contributions-day--l2" />
                    <span className="about-contributions-day about-contributions-day--l3" />
                    <span className="about-contributions-day about-contributions-day--l4" />
                    <span>More</span>
                </div>
            </div>
        );
    }

    return (
        <>
        <div
            className="about-contributions-cell border p-4 md:p-5"
            style={{ borderColor: 'var(--void-border)', backgroundColor: 'var(--void-surface-80)' }}
        >
            <div className="about-contributions-header">
                <span className="about-contributions-total">
                    {isLoading
                        ? 'Loading…'
                        : `${total} ${total === 1 ? 'contribution' : 'contributions'} in ${selectedYear}`}
                </span>
                <div className="about-contributions-select-wrap" ref={dropdownRef}>
                    <button
                        type="button"
                        className="about-contributions-select"
                        aria-haspopup="listbox"
                        aria-expanded={dropdownOpen}
                        aria-label="Select contribution year"
                        onClick={() => {
                            setDropdownOpen(!dropdownOpen);
                            setDropdownFocusIndex(years.indexOf(selectedYear));
                        }}
                        onKeyDown={handleSelectKeyDown}
                    >
                        <span>{selectedYear}</span>
                        <svg
                            className={`about-contributions-select-chevron${dropdownOpen ? ' about-contributions-select-chevron--open' : ''}`}
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>

                    {dropdownOpen && (
                        <ul
                            className="about-contributions-select-panel"
                            role="listbox"
                            aria-label="Contribution years"
                            aria-activedescendant={
                                dropdownFocusIndex != null
                                    ? `about-contrib-select-option-${dropdownFocusIndex}`
                                    : undefined
                            }
                        >
                            {years.map((y, i) => (
                                <li
                                    key={y}
                                    id={`about-contrib-select-option-${i}`}
                                    role="option"
                                    aria-selected={y === selectedYear}
                                    className={`about-contributions-select-option${y === selectedYear ? ' about-contributions-select-option--selected' : ''}${dropdownFocusIndex === i ? ' about-contributions-select-option--highlighted' : ''}`}
                                    onClick={() => selectYear(y)}
                                    onMouseEnter={() => setDropdownFocusIndex(i)}
                                >
                                    {y}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            {body}
            </div>

            {/* Day tooltip — portaled to <body> so the scrollable calendar
                container can't clip it */}
            {tooltip && createPortal(
                <div
                    className="contrib-tooltip"
                    role="tooltip"
                    style={{ left: tooltip.left, top: tooltip.top }}
                >
                    {tooltip.text}
                </div>,
                document.body
            )}
        </>
    );
}
