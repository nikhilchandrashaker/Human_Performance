import React, { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

/* ============================== DESIGN TOKENS ============================== */
const C = {
  bg: "#0A0D12",
  panel: "#12161D",
  panelAlt: "#161B24",
  border: "#232936",
  borderSoft: "#1B2029",
  text: "#E9EDF4",
  dim: "#8A93A6",
  faint: "#565F70",
  lime: "#C6F135",
  purple: "#9C8CFF",
  red: "#FF6B6B",
  green: "#3ED598",
  amber: "#F5B942",
  blue: "#5CA8FF",
  orange: "#FF9A52",
  pink: "#FF6FB0",
};

const FONT_HEAD = "'Space Grotesk', 'Inter', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

const ACTIVITY_COLORS = {
  Yoga: C.blue,
  Walking: C.green,
  Cycling: C.purple,
  FunctionalStrengthTraining: "#4F8FFF",
  HighIntensityIntervalTraining: C.orange,
  Hiking: C.amber,
  StairClimbing: C.red,
};

/* ============================== SEEDED RNG ============================== */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ============================== MOCK DATA ============================== */
const TOTAL_DAYS = 92;
const TODAY = new Date(2026, 8, 6); // Sep 6, 2026

function fmtDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

const ACTIVITIES = [
  "Yoga", "Walking", "Cycling", "FunctionalStrengthTraining",
  "HighIntensityIntervalTraining", "Hiking", "StairClimbing",
];
const ACTIVITY_WEIGHTS = [0.07, 0.55, 0.05, 0.11, 0.03, 0.08, 0.11];

// Every "Refresh from XML" click generates a brand-new dataset by re-seeding
// this generator — same shape and rough training pattern, new numbers, so
// every stat, chart, and workout log actually changes.
function generateDataset(seed) {
  const rng = mulberry32(seed);
  const rand = (min, max) => min + rng() * (max - min);

  function weightedActivity() {
    const r = rng();
    let acc = 0;
    for (let i = 0; i < ACTIVITIES.length; i++) {
      acc += ACTIVITY_WEIGHTS[i];
      if (r <= acc) return ACTIVITIES[i];
    }
    return ACTIVITIES[0];
  }

  // Each refresh nudges the athlete's baselines and fatigue phase a little,
  // so the recovery-readiness story shifts (sometimes better, sometimes worse).
  const restingBase = 63 + rand(-4, 6);
  const hrvBase = 58 + rand(-8, 10);
  const wavePhase = rand(0, 6.28);
  const fatigueSeverity = rand(0.6, 1.5);
  const stepsGoalBias = rand(-2500, 4500);
  const vo2Start = 27.5 + rand(-1.5, 2.5);

  const days = [];
  for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - i);
    const fatigueWave = Math.sin((TOTAL_DAYS - i) / 11 + wavePhase) * 4 * fatigueSeverity;
    const recentDrift = i < 14 ? (14 - i) * 0.55 * fatigueSeverity : 0;
    const restingHR = clamp(Math.round(restingBase + fatigueWave + recentDrift + rand(-4, 4)), 58, 92);
    const hrv = clamp(Math.round(hrvBase - fatigueWave * 1.6 - recentDrift * 1.3 + rand(-8, 8)), 20, 95);

    const hasWorkout = rng() < 0.72;
    const activity = hasWorkout ? weightedActivity() : null;
    const duration = hasWorkout ? Math.round(rand(15, 100)) : 0;
    const actBase = { Yoga: 116, Walking: 132, Cycling: 143, FunctionalStrengthTraining: 144, HighIntensityIntervalTraining: 150, Hiking: 158, StairClimbing: 165 };
    const avgWorkoutHR = hasWorkout ? clamp(Math.round((actBase[activity] || 130) + rand(-10, 10)), 95, 175) : null;
    const peakWorkoutHR = hasWorkout ? clamp(avgWorkoutHR + Math.round(rand(15, 45)), avgWorkoutHR, 205) : null;
    const minWorkoutHR = hasWorkout ? clamp(avgWorkoutHR - Math.round(rand(10, 30)), 70, avgWorkoutHR) : null;

    const avgHR = clamp(Math.round(110 + fatigueWave * 0.6 + rand(-6, 6)), 92, 132);
    const minHR = clamp(avgHR - Math.round(rand(15, 35)), 55, avgHR);
    const maxHR = clamp(avgHR + Math.round(rand(20, 90)), avgHR, 205);

    const deep = clamp(rand(0.5, 1.6), 0.3, 2);
    const rem = clamp(rand(1.3, 2.4), 0.8, 2.6);
    const core = clamp(rand(3.2, 5.2), 2.5, 5.8);
    const awake = clamp(rand(0.05, 0.4), 0, 0.6);
    const total = +(deep + rem + core + awake).toFixed(1);

    const steps = Math.round(clamp(11000 + stepsGoalBias + Math.sin(i / 6 + wavePhase) * 5000 + rand(-3500, 5500), 2000, 33000));
    const vo2max = +(vo2Start + (TOTAL_DAYS - i) * 0.018 + rand(-0.3, 0.3)).toFixed(1);
    const calories = Math.round(clamp(380 + Math.sin(i / 5 + wavePhase) * 220 + rand(-120, 220), 90, 850));

    days.push({
      date: d, iso: isoDate(d), label: fmtDate(d),
      restingHR, hrv, avgHR, minHR, maxHR,
      deep: +deep.toFixed(2), rem: +rem.toFixed(2), core: +core.toFixed(2), awake: +awake.toFixed(2), totalSleep: total,
      steps, vo2max, calories,
      workout: hasWorkout ? { activity, duration, avgHR: avgWorkoutHR, peakHR: peakWorkoutHR, minHR: minWorkoutHR } : null,
    });
  }

  const circadianPhase = rand(-1.8, -1.0);
  const circadian = [6, 8, 10, 12, 14, 16, 18, 20, 22, 0, 2, 4].map((h, idx) => {
    const hourLabel = `${String(h).padStart(2, "0")}:00`;
    const base = 95 + Math.sin((idx / 12) * Math.PI * 2 + circadianPhase) * 20;
    return { hour: hourLabel, hr: Math.round(clamp(base + rand(-4, 4), 55, 130)) };
  });

  return { days, circadian };
}

/* ============================== HELPERS ============================== */
function pctChange(curr, prev) {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}
function avg(arr, key) {
  const v = arr.filter((d) => d[key] != null).map((d) => d[key]);
  if (!v.length) return 0;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
function last(arr, key) {
  const filtered = arr.filter((d) => d[key] != null);
  return filtered.length ? filtered[filtered.length - 1][key] : 0;
}
function computeReadiness(slice) {
  const hrvNow = avg(slice.slice(-5), "hrv");
  const hrvBase = avg(slice, "hrv");
  const rhrNow = avg(slice.slice(-5), "restingHR");
  const rhrBase = avg(slice, "restingHR");
  const hrvScore = clamp(50 + (hrvNow - hrvBase) * 2.2, 0, 100);
  const rhrScore = clamp(50 - (rhrNow - rhrBase) * 2.6, 0, 100);
  const score = Math.round(clamp((hrvScore * 0.6 + rhrScore * 0.4), 0, 100));
  let label = "LOW", note = "Signs of accumulated fatigue. Consider recovery session.";
  if (score >= 80) { label = "PEAK"; note = "Fully recovered. Good day to push intensity."; }
  else if (score >= 60) { label = "GOOD"; note = "Recovery trending well. Normal training load is fine."; }
  else if (score >= 40) { label = "FAIR"; note = "Some fatigue present. Moderate the session if possible."; }
  return { score, label, note };
}

/* ============================== SMALL UI PRIMITIVES ============================== */
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 13px",
        borderRadius: 7,
        border: `1px solid ${active ? C.lime : C.border}`,
        background: active ? "rgba(198,241,53,0.12)" : "transparent",
        color: active ? C.lime : C.dim,
        fontFamily: FONT_BODY,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all .15s ease",
        letterSpacing: 0.2,
      }}
    >
      {children}
    </button>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        borderBottom: `2px solid ${active ? C.lime : "transparent"}`,
        color: active ? C.text : C.dim,
        fontFamily: FONT_BODY,
        fontWeight: active ? 700 : 500,
        fontSize: 13.5,
        padding: "10px 4px",
        marginRight: 22,
        cursor: "pointer",
        transition: "all .15s ease",
      }}
    >
      {children}
    </button>
  );
}

function Panel({ children, style }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.borderSoft}`,
        borderRadius: 10,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, unit, delta, deltaGood = "up", note }) {
  const hasDelta = delta !== null && delta !== undefined && !Number.isNaN(delta);
  const positive = delta > 0;
  const isGood = deltaGood === "up" ? positive : !positive;
  return (
    <Panel style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, color: C.faint, fontWeight: 700, letterSpacing: 0.4 }}>{label}</div>
        {hasDelta && (
          <div style={{
            fontSize: 11, fontWeight: 700, color: isGood ? C.green : C.red,
            fontFamily: FONT_BODY,
          }}>
            {positive ? "+" : ""}{delta.toFixed(1)}%
          </div>
        )}
      </div>
      <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontFamily: FONT_HEAD, fontSize: 30, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: C.dim }}>{unit}</span>}
      </div>
      {note && <div style={{ fontSize: 11, color: C.faint, marginTop: 3 }}>{note}</div>}
    </Panel>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, color: C.faint, fontWeight: 700, letterSpacing: 0.5, marginBottom: 12 }}>
      {children}
    </div>
  );
}

const tooltipStyle = {
  background: "#191F2A",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 12,
  color: C.text,
  fontFamily: FONT_BODY,
};

/* ============================== TABS ============================== */

function HeartRateTab({ slice, prevSlice }) {
  const readiness = computeReadiness(slice);
  const readinessColor = readiness.score >= 80 ? C.green : readiness.score >= 60 ? C.blue : readiness.score >= 40 ? C.amber : C.red;

  const restingAvg = avg(slice, "restingHR");
  const hrvAvg = avg(slice, "hrv");
  const avgHRAvg = avg(slice, "avgHR");
  const restingPrev = avg(prevSlice, "restingHR");
  const hrvPrev = avg(prevSlice, "hrv");
  const avgHRPrev = avg(prevSlice, "avgHR");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Panel style={{ background: `linear-gradient(90deg, ${readinessColor}14, transparent)`, borderColor: `${readinessColor}33` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 42, fontWeight: 700, color: readinessColor, lineHeight: 1 }}>
              {readiness.score}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: readinessColor, letterSpacing: 0.5, marginTop: 2 }}>
              {readiness.label}
            </div>
          </div>
          <div style={{ height: 40, width: 1, background: C.border }} />
          <div>
            <div style={{ fontSize: 12, color: C.dim, fontWeight: 600 }}>Recovery readiness</div>
            <div style={{ fontSize: 13, color: C.text, marginTop: 2, maxWidth: 480 }}>{readiness.note}</div>
          </div>
        </div>
      </Panel>

      <div style={{ display: "flex", gap: 12 }}>
        <StatCard label="RESTING HR" value={Math.round(restingAvg)} unit="bpm" delta={pctChange(restingAvg, restingPrev)} deltaGood="down" note={`${slice.length}D avg · Lower = better`} />
        <StatCard label="HRV" value={hrvAvg.toFixed(1)} unit="ms" delta={pctChange(hrvAvg, hrvPrev)} deltaGood="up" note={`${slice.length}D avg · Higher = better recovery`} />
        <StatCard label="AVG HEART RATE" value={Math.round(avgHRAvg)} unit="bpm" delta={pctChange(avgHRAvg, avgHRPrev)} deltaGood="down" note={`${slice.length}D avg`} />
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        <Panel style={{ flex: 1 }}>
          <SectionTitle>HRV · HEART RATE VARIABILITY</SectionTitle>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={slice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.faint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} minTickGap={30} />
              <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.dim }} />
              <Line type="monotone" dataKey="hrv" stroke={C.purple} strokeWidth={2} dot={{ r: 2, fill: C.purple }} name="HRV (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel style={{ flex: 1 }}>
          <SectionTitle>RESTING HEART RATE</SectionTitle>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={slice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.faint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} minTickGap={30} />
              <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={30} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.dim }} />
              <Line type="monotone" dataKey="restingHR" stroke={C.red} strokeWidth={2} dot={false} name="Resting HR" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel>
        <SectionTitle>DAILY HR RANGE · MIN / AVG / MAX</SectionTitle>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={slice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={C.borderSoft} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: C.faint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} minTickGap={30} />
            <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.dim }} />
            <Line type="monotone" dataKey="maxHR" stroke={C.orange} strokeWidth={1} dot={false} name="Max HR" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="avgHR" stroke={C.red} strokeWidth={2} dot={{ r: 1.5 }} name="Avg HR" />
            <Line type="monotone" dataKey="minHR" stroke={C.blue} strokeWidth={1} dot={false} name="Min HR" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function SleepTab({ slice, prevSlice, circadian }) {
  const totalAvg = avg(slice, "totalSleep");
  const deepAvg = avg(slice, "deep");
  const remAvg = avg(slice, "rem");
  const coreAvg = avg(slice, "core");
  const totalPrev = avg(prevSlice, "totalSleep");
  const deepPrev = avg(prevSlice, "deep");
  const remPrev = avg(prevSlice, "rem");

  const stackData = slice.slice(-30);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <StatCard label="TOTAL SLEEP" value={totalAvg.toFixed(1)} unit="hrs" delta={pctChange(totalAvg, totalPrev)} deltaGood="up" note="Target: 7–9 hrs" />
        <StatCard label="DEEP SLEEP" value={deepAvg.toFixed(1)} unit="hrs" delta={pctChange(deepAvg, deepPrev)} deltaGood="up" note="Target: 1.0–1.5 hrs" />
        <StatCard label="REM SLEEP" value={remAvg.toFixed(1)} unit="hrs" delta={pctChange(remAvg, remPrev)} deltaGood="up" note="Target: 1.5–2.0 hrs" />
      </div>

      <Panel>
        <SectionTitle>CIRCADIAN RHYTHM · HEART RATE PATTERN</SectionTitle>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={circadian} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={C.borderSoft} vertical={false} />
            <XAxis dataKey="hour" tick={{ fill: C.faint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} />
            <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.dim }} />
            <Area type="monotone" dataKey="hr" stroke={C.blue} fill={`${C.blue}22`} strokeWidth={2} dot={{ r: 2 }} name="Heart rate" />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display: "flex", gap: 14 }}>
        <Panel style={{ flex: 2 }}>
          <SectionTitle>NIGHTLY SLEEP · HOURS BY STAGE</SectionTitle>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={stackData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }} barCategoryGap={2}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.faint, fontSize: 9 }} axisLine={{ stroke: C.border }} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={26} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.dim }} />
              <Bar dataKey="deep" stackId="s" fill={C.green} name="Deep" radius={[0, 0, 0, 0]} />
              <Bar dataKey="rem" stackId="s" fill={C.purple} name="REM" />
              <Bar dataKey="core" stackId="s" fill={C.blue} name="Core" />
              <Bar dataKey="awake" stackId="s" fill={C.red} name="Awake" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
          {[
            { label: "DEEP SLEEP", val: deepAvg, color: C.green, pct: (deepAvg / totalAvg) * 100 },
            { label: "REM SLEEP", val: remAvg, color: C.purple, pct: (remAvg / totalAvg) * 100 },
            { label: "CORE SLEEP", val: coreAvg, color: C.blue, pct: (coreAvg / totalAvg) * 100 },
          ].map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.faint, fontWeight: 700 }}>
                <span>{r.label}</span>
                <span>{r.pct.toFixed(0)}%</span>
              </div>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 20, fontWeight: 700, color: C.text, margin: "3px 0 6px" }}>{r.val.toFixed(1)} hrs</div>
              <div style={{ height: 5, borderRadius: 3, background: C.borderSoft, overflow: "hidden" }}>
                <div style={{ width: `${r.pct}%`, height: "100%", background: r.color }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function FitnessTab({ slice, prevSlice }) {
  const vo2 = last(slice, "vo2max");
  const vo2Prev = last(prevSlice, "vo2max") || vo2;
  const stepsAvg = avg(slice, "steps");
  const stepsPrev = avg(prevSlice, "steps");
  const calAvg = avg(slice, "calories");
  const calPrev = avg(prevSlice, "calories");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <StatCard label="VO2 MAX" value={vo2} unit="mL/kg/min" delta={pctChange(vo2, vo2Prev)} deltaGood="up" note={`${slice.length}D avg · Category: Fair`} />
        <StatCard label="DAILY STEPS" value={Math.round(stepsAvg).toLocaleString()} delta={pctChange(stepsAvg, stepsPrev)} deltaGood="up" note={`${slice.length}D avg · Goal: 10,000`} />
        <StatCard label="ACTIVE CALORIES" value={Math.round(calAvg)} unit="kcal" delta={pctChange(calAvg, calPrev)} deltaGood="up" note={`${slice.length}D avg`} />
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        <Panel style={{ flex: 1 }}>
          <SectionTitle>DAILY STEPS · GREEN = GOAL HIT (10K)</SectionTitle>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={slice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.faint, fontSize: 9 }} axisLine={{ stroke: C.border }} tickLine={false} minTickGap={30} />
              <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.dim }} />
              <ReferenceLine y={10000} stroke={C.faint} strokeDasharray="4 4" />
              <Bar dataKey="steps" radius={[2, 2, 0, 0]}>
                {slice.map((d, i) => (
                  <Cell key={i} fill={d.steps >= 10000 ? C.green : C.blue} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel style={{ flex: 1 }}>
          <SectionTitle>VO2 MAX · FITNESS CATEGORY ZONES</SectionTitle>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={slice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.faint, fontSize: 9 }} axisLine={{ stroke: C.border }} tickLine={false} minTickGap={30} />
              <YAxis domain={[20, 60]} tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={26} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.dim }} />
              <ReferenceLine y={35} stroke={C.borderSoft} />
              <ReferenceLine y={45} stroke={C.borderSoft} />
              <Line type="monotone" dataKey="vo2max" stroke={C.orange} strokeWidth={2} dot={false} name="VO2 max" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel>
        <SectionTitle>ACTIVE CALORIES</SectionTitle>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={slice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={C.borderSoft} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: C.faint, fontSize: 9 }} axisLine={{ stroke: C.border }} tickLine={false} minTickGap={30} />
            <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.dim }} />
            <Bar dataKey="calories" fill={C.amber} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function WorkoutHRTab({ slice }) {
  const workouts = slice.filter((d) => d.workout).map((d) => ({ ...d.workout, date: d.label, iso: d.iso }));
  const peak = workouts.length ? Math.max(...workouts.map((w) => w.peakHR)) : 0;
  const avgAll = workouts.length ? Math.round(workouts.reduce((a, w) => a + w.avgHR, 0) / workouts.length) : 0;
  const lowest = workouts.length ? Math.min(...workouts.map((w) => w.minHR)) : 0;

  const byType = {};
  workouts.forEach((w) => {
    if (!byType[w.activity]) byType[w.activity] = { activity: w.activity, sum: 0, sumPeak: 0, count: 0 };
    byType[w.activity].sum += w.avgHR;
    byType[w.activity].sumPeak += w.peakHR;
    byType[w.activity].count += 1;
  });
  const typeData = Object.values(byType).map((t) => ({
    activity: t.activity.replace(/([a-z])([A-Z])/g, "$1 $2"),
    avgHR: Math.round(t.sum / t.count),
    peakHR: Math.round(t.sumPeak / t.count),
    count: t.count,
    color: ACTIVITY_COLORS[t.activity] || C.blue,
  }));

  const scatterData = workouts.map((w) => ({ x: w.duration, y: w.avgHR, color: ACTIVITY_COLORS[w.activity] || C.blue }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <StatCard label="PEAK HR RECORDED" value={peak || "—"} unit={peak ? "bpm" : ""} note="Max (Z5)" />
        <StatCard label="AVG WORKOUT HR" value={avgAll || "—"} unit={avgAll ? "bpm" : ""} note="Light (Z2)" />
        <StatCard label="LOWEST WORKOUT HR" value={lowest || "—"} unit={lowest ? "bpm" : ""} note="Easy (Z1)" />
      </div>

      <Panel>
        <SectionTitle>AVG HEART RATE BY ACTIVITY TYPE · HIGHER BARS = MORE CARDIOVASCULAR DEMAND</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={typeData} margin={{ top: 20, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={C.borderSoft} vertical={false} />
            <XAxis dataKey="activity" tick={{ fill: C.faint, fontSize: 9 }} axisLine={{ stroke: C.border }} tickLine={false} interval={0} angle={-12} textAnchor="end" height={50} />
            <YAxis tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.dim }}
              formatter={(v, n, p) => [`${v} bpm`, `Avg HR (${p.payload.count} sessions)`]} />
            <Bar dataKey="avgHR" radius={[3, 3, 0, 0]}>
              {typeData.map((t, i) => <Cell key={i} fill={t.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display: "flex", gap: 14 }}>
        <Panel style={{ flex: 1 }}>
          <SectionTitle>HR RANGE PER WORKOUT · MIN / AVG / MAX</SectionTitle>
          <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
            {workouts.slice(-14).reverse().map((w, i) => {
              const scale = (v) => `${((v - 50) / (210 - 50)) * 100}%`;
              return (
                <div key={i} style={{ fontSize: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: C.dim, marginBottom: 3 }}>
                    <span>{w.date} · {w.activity.replace(/([a-z])([A-Z])/g, "$1 $2")}</span>
                    <span style={{ color: C.faint }}>{w.minHR}–{w.peakHR} bpm</span>
                  </div>
                  <div style={{ position: "relative", height: 6, background: C.borderSoft, borderRadius: 3 }}>
                    <div style={{
                      position: "absolute", left: scale(w.minHR), width: `calc(${scale(w.peakHR)} - ${scale(w.minHR)})`,
                      height: "100%", background: `${ACTIVITY_COLORS[w.activity] || C.blue}88`, borderRadius: 3,
                    }} />
                    <div style={{
                      position: "absolute", left: scale(w.avgHR), top: -2, width: 2, height: 10,
                      background: ACTIVITY_COLORS[w.activity] || C.blue, borderRadius: 1,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel style={{ flex: 1 }}>
          <SectionTitle>WORKOUT DURATION VS AVG HR</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={C.borderSoft} />
              <XAxis type="number" dataKey="x" name="Duration" unit=" min" tick={{ fill: C.faint, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis type="number" dataKey="y" name="Avg HR" unit=" bpm" tick={{ fill: C.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={scatterData} fill={C.blue}>
                {scatterData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function DailyLogTab() {
  const [date, setDate] = useState(isoDate(TODAY));
  const [session, setSession] = useState("");
  const [notes, setNotes] = useState("");
  const [coaching, setCoaching] = useState("");
  const [readiness, setReadiness] = useState(5);
  const [entries, setEntries] = useState([
    { date: "2026-09-04", session: "Speed work", notes: "Felt sharp, good pop off the line. Reported slight tightness in left hamstring.", coaching: "Keep hamstring on watch — light band work pre-session tomorrow.", readiness: 6 },
    { date: "2026-09-01", session: "Recovery", notes: "Low energy after travel. Slept poorly (5.5 hrs).", coaching: "Pull volume back 20% this week, prioritize sleep hygiene.", readiness: 3 },
  ]);

  const inputStyle = {
    width: "100%",
    background: C.panelAlt,
    border: `1px solid ${C.border}`,
    borderRadius: 7,
    padding: "9px 11px",
    color: C.text,
    fontFamily: FONT_BODY,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 11, color: C.faint, fontWeight: 700, letterSpacing: 0.4, marginBottom: 6, display: "block" };

  function saveEntry() {
    if (!session && !notes) return;
    setEntries([{ date, session, notes, coaching, readiness }, ...entries]);
    setSession(""); setNotes(""); setCoaching(""); setReadiness(5);
  }
  function clearForm() {
    setSession(""); setNotes(""); setCoaching(""); setReadiness(5);
  }

  const readinessColor = readiness <= 3 ? C.red : readiness <= 6 ? C.amber : C.green;

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <Panel style={{ flex: 1.1 }}>
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>DATE</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>SESSION / TRAINING</span>
          <input placeholder="e.g. Speed work, Upper body lift, Recovery..." value={session} onChange={(e) => setSession(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>DAILY NOTES</span>
          <textarea placeholder="What happened today? How did the athlete feel? Any soreness, energy levels, mood, readiness?"
            value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>COACHING OBSERVATIONS</span>
          <textarea placeholder="Technical notes, performance cues, what to adjust tomorrow..."
            value={coaching} onChange={(e) => setCoaching(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={labelStyle}>READINESS (1 = Poor · 10 = Peak)</span>
            <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, color: readinessColor, fontSize: 14 }}>{readiness}</span>
          </div>
          <input type="range" min={1} max={10} value={readiness} onChange={(e) => setReadiness(+e.target.value)}
            style={{ width: "100%", accentColor: readinessColor }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={saveEntry} style={{
            background: C.lime, color: "#0A0D12", border: "none", borderRadius: 7,
            padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT_BODY,
          }}>Save entry</button>
          <button onClick={clearForm} style={{
            background: "transparent", color: C.dim, border: `1px solid ${C.border}`, borderRadius: 7,
            padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT_BODY,
          }}>Clear</button>
        </div>
      </Panel>

      <Panel style={{ flex: 1, maxHeight: 480, overflowY: "auto" }}>
        <SectionTitle>LOG HISTORY</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {entries.map((e, i) => {
            const rc = e.readiness <= 3 ? C.red : e.readiness <= 6 ? C.amber : C.green;
            return (
              <div key={i} style={{ borderLeft: `2px solid ${rc}`, paddingLeft: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{e.session || "Untitled session"}</span>
                  <span style={{ fontSize: 11, color: C.faint }}>{e.date}</span>
                </div>
                {e.notes && <div style={{ fontSize: 12, color: C.dim, marginTop: 3 }}>{e.notes}</div>}
                {e.coaching && <div style={{ fontSize: 11.5, color: C.purple, marginTop: 4 }}>Coach: {e.coaching}</div>}
                <div style={{ fontSize: 10.5, color: rc, marginTop: 4, fontWeight: 700 }}>Readiness {e.readiness}/10</div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/* ============================== ROOT APP ============================== */
export default function AthleteDashboard() {
  const [rangeDays, setRangeDays] = useState(14);
  const [tab, setTab] = useState("heart");
  const [seed, setSeed] = useState(20260906);
  const [lastSync, setLastSync] = useState(new Date(2026, 8, 6, 11, 42));

  const dataset = useMemo(() => generateDataset(seed), [seed]);
  const dailyData = dataset.days;
  const circadian = dataset.circadian;

  const slice = useMemo(() => dailyData.slice(-rangeDays), [dailyData, rangeDays]);
  const prevSlice = useMemo(() => {
    const start = TOTAL_DAYS - rangeDays * 2;
    return dailyData.slice(Math.max(0, start), TOTAL_DAYS - rangeDays);
  }, [dailyData, rangeDays]);

  function refreshFromXml() {
    // Simulates pulling a fresh export and re-parsing it: new seed -> new
    // resting HR / HRV / sleep / steps / workouts across the whole history.
    setSeed(Math.floor(Math.random() * 1e9));
    setLastSync(new Date());
  }

  const syncLabel = lastSync.toLocaleString("en-US", {
    month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit",
  });

  const ranges = [7, 14, 30, 60, 90];
  const tabs = [
    { id: "heart", label: "Heart rate" },
    { id: "sleep", label: "Sleep" },
    { id: "fitness", label: "Fitness" },
    { id: "workout", label: "Workout HR" },
    { id: "log", label: "Daily log" },
  ];

  return (
    <div style={{
      background: C.bg, color: C.text, fontFamily: FONT_BODY,
      padding: 20, borderRadius: 14, minHeight: 600,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap');
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #2A3140; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13,
          }}>A1</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16 }}>Athlete 1</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.lime, fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.lime, display: "inline-block" }} /> LIVE
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.faint, letterSpacing: 0.3 }}>PERFORMANCE HEALTH DASHBOARD</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <button onClick={refreshFromXml} style={{
            background: C.panelAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: 7,
            padding: "6px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY,
          }}>Refresh from XML</button>
          <div style={{ fontSize: 10, color: C.faint, marginTop: 5 }}>
            Last sync · {syncLabel}
          </div>
        </div>
      </div>

      {/* Range + tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        {ranges.map((r) => (
          <Pill key={r} active={rangeDays === r} onClick={() => setRangeDays(r)}>{r}D</Pill>
        ))}
      </div>
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginTop: 14, marginBottom: 18 }}>
        {tabs.map((t) => (
          <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</TabButton>
        ))}
      </div>

      {tab === "heart" && <HeartRateTab slice={slice} prevSlice={prevSlice} />}
      {tab === "sleep" && <SleepTab slice={slice} prevSlice={prevSlice} circadian={circadian} />}
      {tab === "fitness" && <FitnessTab slice={slice} prevSlice={prevSlice} />}
      {tab === "workout" && <WorkoutHRTab slice={slice} />}
      {tab === "log" && <DailyLogTab />}
    </div>
  );
}
