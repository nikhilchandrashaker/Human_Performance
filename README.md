# Athlete 1 — Performance Health Dashboard

A recreation of the sport-science dashboard shown in the screenshots: a single-athlete view for tracking heart rate, sleep, fitness, and workout load, plus a coach's daily log. Built as a self-contained React component (`athlete-dashboard.jsx`) with mock data that stands in for a real wearable-data feed (e.g. an exported Apple Health / Garmin XML file).

## What's inside

**Header**
- Athlete identity, a "LIVE" status indicator, and a "Refresh from XML" action with a last-sync timestamp — mirroring the "Refresh from XML" control in the original.

**Range selector**
- 7D / 14D / 30D / 60D / 90D pills that control the window used across every tab. All stat cards recompute their averages and % change (vs. the prior equal-length period) when you switch ranges.

**Heart Rate tab**
- Recovery Readiness score (0–100, LOW/FAIR/GOOD/PEAK) derived from recent HRV and resting HR relative to the athlete's baseline for the selected range.
- Resting HR, HRV, and Avg Heart Rate stat cards.
- HRV trend, resting HR trend, and a daily min/avg/max HR range chart.

**Sleep tab**
- Total / Deep / REM sleep stat cards.
- A circadian heart-rate-by-hour chart (daytime peak / overnight trough).
- A stacked nightly sleep chart (Deep / REM / Core / Awake) and a breakdown panel with hours + share of total sleep per stage.

**Fitness tab**
- VO2 max, daily steps, and active calories stat cards.
- Daily steps bar chart (bars turn green when the 10,000-step goal is hit).
- VO2 max trend against fitness-category reference bands.
- Active calories bar chart.

**Workout HR tab**
- Peak HR recorded, avg workout HR, and lowest workout HR stat cards.
- Avg heart rate by activity type (color-coded, session count in the tooltip).
- A per-workout min/avg/max HR range list for recent sessions.
- A duration-vs-avg-HR scatter plot, colored by activity type.

**Daily Log tab**
- A form for date, session/training, daily notes, coaching observations, and a 1–10 readiness slider — matching the original entry form, plus "Save entry" / "Clear" actions.
- A log history panel that lists saved entries, color-coded by readiness.

## Data

All numbers are synthetically generated with a seeded random function, so the dashboard looks the same on every load but isn't tied to any real athlete. It simulates 92 days of activity ending September 6, 2026, with a gradual dip in HRV / rise in resting HR over the final two weeks (to reproduce the "accumulated fatigue" reading seen in the screenshots) and a realistic mix of workout types (mostly walking, with strength, HIIT, cycling, hiking, yoga, and stair climbing mixed in).

**"Refresh from XML" actually regenerates the data.** Clicking it simulates re-parsing a fresh export: it picks a new random seed, updates the last-sync timestamp, and rebuilds all 92 days from scratch with new baselines (resting HR, HRV, VO2 max start point, step-count bias, sleep, workout mix, and the circadian sleep chart). Every stat card, trend line, and workout log across all five tabs updates immediately — sometimes the athlete looks more recovered, sometimes more fatigued, just like pulling in a new batch of wearable data would.

To wire this up to real data, replace the `dailyData` generator with a fetch/parse step that reads your actual export (e.g. Apple Health XML, Garmin, Whoop, Oura) into the same shape: `{ date, restingHR, hrv, avgHR, minHR, maxHR, deep, rem, core, awake, totalSleep, steps, vo2max, calories, workout }`.

## Design notes

Dark, low-glare "field monitor" palette (near-black background, lime-green accent for status/readiness, purple for HRV, red for resting HR, blue/amber/orange for supporting series) intended to read like a coach's sideline screen rather than a generic SaaS dashboard. Headline numbers use Space Grotesk; body text and labels use Inter.

## Files

- `athlete-dashboard.jsx` — the dashboard component (default export, ready to drop into a React app)
- `README.md` — this file
