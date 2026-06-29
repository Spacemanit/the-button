import { useState, useEffect } from 'react';
import axios from 'axios';
import socket from './socket';

const TIER_CONFIG = {
  purple: { color: "#a78bfa", border: "#a78bfa40", label: "Purple", range: "50–60s" },
  blue: { color: "#60a5fa", border: "#60a5fa40", label: "Blue", range: "40–49s" },
  green: { color: "#4ade80", border: "#4ade8040", label: "Green", range: "30–39s" },
  yellow: { color: "#facc15", border: "#facc1540", label: "Yellow", range: "20–29s" },
  orange: { color: "#fb923c", border: "#fb923c40", label: "Orange", range: "10–19s" },
  red: { color: "#f87171", border: "#f8717140", label: "Red", range: "0–9s" },
};

const DEFAULT_COLOR = "#f87171";
const DEFAULT_BORDER = "#f8717140";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hasPressed, setHasPressed] = useState(false);
  const [totalPresses, setTotalPresses] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [countdown, setCountdown] = useState(60);
  const [lastTier, setLastTier] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);
  const [flashTier, setFlashTier] = useState(null);

  const isDark = theme === "dark";

  // apply dark class to <html> so Tailwind dark: variants work
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const triggerFlash = (tier) => {
    setFlashTier(tier);
    setTimeout(() => setFlashTier(null), 500);
  };

  const handleSubmitUsername = () => {
    const nextUsername = username.trim();
    if (!nextUsername) return;

    localStorage.setItem("username", nextUsername);
    setUsername(nextUsername);
    setSubmitted(true);
    axios.get(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/press/state?username=${encodeURIComponent(nextUsername)}`)
      .then(res => {
        console.log('App.jsx res.status:', res.status)
        if (res.status === 100) {
          console.log('App.jsx 100')
          setHasPressed(true);
        } else if (res.status === 201) {
          console.log('App.jsx 201')
          setHasPressed(false);
        }
      });
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/leaderboard`)
      .then(res => { 
        if (Array.isArray(res.data))
          setLeaderboard(res.data);
        });
  }, []);

  useEffect(() => {
    socket.on("init", d => {
      setTotalPresses(d.totalPresses);
      setCountdown(d.timer);
      setActiveUsers(d.activeUsers);
    });
    socket.on("pressed", d => {
      triggerFlash(d.colorTier);
      setTotalPresses(d.totalPresses);
      setCountdown(60);
      setActiveUsers(d.activeUsers);
      setLastTier(d.colorTier);
      setRecentActivity(prev => [{
        id: Date.now(),
        username: d.username,
        waitSeconds: d.waitSeconds,
        colorTier: d.colorTier,
      }, ...prev.slice(0, 14)]);
    });
    socket.on("leaderboard", d => { if (Array.isArray(d)) setLeaderboard(d); });
    socket.on("activeUsers", c => setActiveUsers(c));
    socket.on("pressError", e => setError(e.message));
    socket.on("timer", t => setCountdown(t));
    return () => {
      ["init", "pressed", "leaderboard", "activeUsers", "pressError", "timer"].forEach(e => socket.off(e));
    };
  }, []);

  const handleButtonPress = () => {
    if (!submitted || hasPressed) return;
    socket.emit("press", username);
    setHasPressed(true);
  };

  const accentColor = lastTier ? TIER_CONFIG[lastTier].color : DEFAULT_COLOR;
  const accentBorder = lastTier ? TIER_CONFIG[lastTier].border : DEFAULT_BORDER;
  const timerColor = countdown <= 10 ? "#f87171" : countdown <= 25 ? "#fb923c" : "#4ade80";

  // ── LOGIN ──────────────────────────────────────────────────
  if (!submitted) {
    return (
      <div className="min-h-screen bg-black dark:bg-black bg-stone-100 flex items-center justify-center px-6 font-mono">
        <style>{globalStyles}</style>
        <div className="w-full max-w-sm flex flex-col gap-7">

          {/* accent mark */}
          <div className="h-0.5 w-8 rounded-full" style={{ background: accentColor }} />

          {/* copy */}
          <div>
            <h1 className="text-2xl font-light tracking-tight text-black dark:text-white mb-2">
              The Button
            </h1>
            <p className="text-sm text-black/45 dark:text-white/45 leading-relaxed">
              One press. One legacy.<br />No second chances.
            </p>
          </div>

          {/* form */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmitUsername()}
              maxLength={20}
              autoFocus
              className="flex-1 bg-stone-200 dark:bg-neutral-900 border border-black/8 dark:border-white/8
                         rounded text-black dark:text-white text-sm px-3 py-2.5 outline-none
                         focus:border-black/20 dark:focus:border-white/20 placeholder-black/25
                         dark:placeholder-white/25 transition-colors font-mono"
            />
            <button
              onClick={handleSubmitUsername}
              className="px-4 py-2.5 rounded text-sm font-medium tracking-wide transition-opacity
                         hover:opacity-85 font-mono"
              style={{
                background: username.trim() ? accentColor : "rgba(0,0,0,0.08)",
                color: username.trim() ? "#000" : "rgba(0,0,0,0.28)",
                cursor: username.trim() ? "pointer" : "default",
              }}
            >
              enter
            </button>
          </div>

          <p className="text-[11px] text-black/25 dark:text-white/25 tracking-wide">
            you can only press once — ever.
          </p>
        </div>
      </div>
    );
  }

  // ── MAIN APP ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-black font-mono text-black dark:text-white">
      <style>{globalStyles}</style>

      {/* flash top border */}
      {flashTier && (
        <div
          className="fixed inset-0 pointer-events-none z-[9999] animate-flash-out"
          style={{ borderTop: `2px solid ${TIER_CONFIG[flashTier].color}` }}
        />
      )}

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 h-[50px] bg-stone-100 dark:bg-black border-b border-black/8 dark:border-white/8">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">

          {/* brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-500"
              style={{ background: accentColor }}
            />
            <span className="text-[13px] tracking-wide text-black dark:text-white">the button</span>
          </div>

          {/* right side */}
          <div className="flex items-center gap-5">
            {/* live count */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-live-pulse flex-shrink-0" />
              <span className="text-[11px] text-black/45 dark:text-white/45 tabular-nums tracking-wide">
                {activeUsers} watching
              </span>
            </div>

            {/* theme toggle */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="text-[11px] text-black/45 dark:text-white/45 border border-black/8
                         dark:border-white/8 hover:border-black/20 dark:hover:border-white/20
                         hover:text-black dark:hover:text-white px-2.5 py-1 rounded-sm
                         transition-colors tracking-widest cursor-pointer bg-transparent"
            >
              {isDark ? "light" : "dark"}
            </button>

            {/* user */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-black/45 dark:text-white/45">{username}</span>
              {hasPressed && lastTier && (
                <span
                  className="text-[10px] px-1.5 py-0.5 border rounded-sm tracking-widest lowercase"
                  style={{ color: TIER_CONFIG[lastTier].color, borderColor: TIER_CONFIG[lastTier].border }}
                >
                  {TIER_CONFIG[lastTier].label}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── ERROR ── */}
      {error && (
        <div className="max-w-5xl mx-auto px-6 mt-3">
          <div className="flex items-center justify-between bg-red-950/40 dark:bg-red-950/40
                          border border-red-400/20 rounded px-3.5 py-2.5 text-xs text-red-400">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="bg-transparent border-none text-red-400 cursor-pointer text-sm ml-3"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <main className="max-w-5xl mx-auto px-6 py-7 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

        {/* ══ LEFT COLUMN ══ */}
        <div className="flex flex-col gap-4">

          {/* Countdown block */}
          <div className="bg-white dark:bg-neutral-950 border border-black/8 dark:border-white/8 rounded-md p-5">
            <span className="block text-[10px] tracking-[1.8px] uppercase text-black/22 dark:text-white/22 mb-4">
              countdown
            </span>
            <div className="flex items-baseline gap-1 mb-5">
              <span
                className="text-[72px] font-extralight leading-none tabular-nums transition-colors duration-300"
                style={{ letterSpacing: "-4px", color: timerColor }}
              >
                {countdown}
              </span>
              <span className="text-3xl font-extralight text-black/45 dark:text-white/45">s</span>
            </div>
            {/* segmented bar */}
            <div className="flex gap-0.5 overflow-hidden">
              {Array.from({ length: 60 }).map((_, i) => {
                const active = i < countdown;
                const segColor = i >= 50 ? TIER_CONFIG.purple.color
                  : i >= 40 ? TIER_CONFIG.blue.color
                    : i >= 30 ? TIER_CONFIG.green.color
                      : i >= 20 ? TIER_CONFIG.yellow.color
                        : i >= 10 ? TIER_CONFIG.orange.color
                          : TIER_CONFIG.red.color;
                return (
                  <div
                    key={i}
                    className="flex-1 h-[3px] rounded-[1px] min-w-0 transition-colors duration-200"
                    style={{ background: active ? segColor : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)") }}
                  />
                );
              })}
            </div>
          </div>

          {/* The Button block */}
          <div className="bg-white dark:bg-neutral-950 border border-black/8 dark:border-white/8
                          rounded-md p-9 flex flex-col items-center gap-5">
            <button
              disabled={hasPressed}
              onClick={handleButtonPress}
              className="w-36 h-36 rounded-full bg-transparent border flex items-center
                         justify-center transition-transform duration-100
                         disabled:cursor-default"
              style={{ borderColor: accentColor }}
              onMouseEnter={e => { if (!hasPressed) e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={e => { if (!hasPressed) e.currentTarget.style.transform = "scale(0.96)"; }}
              onMouseUp={e => { if (!hasPressed) e.currentTarget.style.transform = "scale(1.03)"; }}
            >
              <div className="flex flex-col items-center gap-1.5">
                {hasPressed ? (
                  <>
                    <span className="text-lg" style={{ color: accentColor }}>✓</span>
                    <span className="text-[13px] tracking-[4px]" style={{ color: accentColor }}>pressed</span>
                    {lastTier && (
                      <span
                        className="text-[10px] px-2 py-0.5 border rounded-sm tracking-widest"
                        style={{ color: TIER_CONFIG[lastTier].color, borderColor: TIER_CONFIG[lastTier].border }}
                      >
                        {TIER_CONFIG[lastTier].label}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[13px] tracking-[4px]" style={{ color: accentColor }}>press</span>
                )}
              </div>
            </button>
            <p className="text-[11px] tracking-wide text-center text-black/45 dark:text-white/45">
              {hasPressed ? `${username} — sealed` : "wait longer · earn rarer"}
            </p>
          </div>

          {/* Stats strip */}
          <div className="bg-white dark:bg-neutral-950 border border-black/8 dark:border-white/8
                          rounded-md flex overflow-hidden">
            {[
              { val: totalPresses.toLocaleString(), key: "presses", color: isDark ? "#fff" : "#0a0a0a" },
              { val: activeUsers, key: "watching", color: "#4ade80" },
              { val: `${countdown}s`, key: "timer", color: timerColor },
            ].map((s, i) => (
              <div key={i} className="flex flex-1">
                {i > 0 && (
                  <div className="w-px flex-shrink-0 bg-black/8 dark:bg-white/8 self-stretch" />
                )}
                <div className="flex-1 flex flex-col items-center py-4 gap-1.5">
                  <span
                    className="text-[19px] font-normal leading-none tabular-nums transition-colors duration-300"
                    style={{ color: s.color }}
                  >
                    {s.val}
                  </span>
                  <span className="text-[10px] tracking-[0.8px] text-black/22 dark:text-white/22">
                    {s.key}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tier guide */}
          <div className="bg-white dark:bg-neutral-950 border border-black/8 dark:border-white/8 rounded-md p-5">
            <span className="block text-[10px] tracking-[1.8px] uppercase text-black/22 dark:text-white/22 mb-4">
              tier guide
            </span>
            <div className="flex flex-col">
              {Object.entries(TIER_CONFIG).map(([key, val], i, arr) => (
                <div
                  key={key}
                  className="flex items-center gap-2.5 py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)") : "none" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: val.color }} />
                  <span className="flex-1 text-xs text-black dark:text-white">{val.label}</span>
                  <span className="text-[11px] text-black/28 dark:text-white/28">{val.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="flex flex-col gap-4">

          {/* Leaderboard */}
          <div className="bg-white dark:bg-neutral-950 border border-black/8 dark:border-white/8 rounded-md p-5">
            <span className="block text-[10px] tracking-[1.8px] uppercase text-black/22 dark:text-white/22 mb-4">
              leaderboard
            </span>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-black/28 dark:text-white/28">no presses yet.</p>
            ) : (
              <div className="flex flex-col">
                {leaderboard.map((entry, i, arr) => {
                  const tier = TIER_CONFIG[entry.colorTier];
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 py-2.5"
                      style={{ borderBottom: i < arr.length - 1 ? (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)") : "none" }}
                    >
                      <span className="text-[11px] tracking-widest w-5 flex-shrink-0 text-black/28 dark:text-white/28">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-xs text-black dark:text-white truncate">{entry.username}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 border rounded-sm tracking-wide whitespace-nowrap flex-shrink-0"
                        style={{ color: tier?.color, borderColor: tier?.border }}
                      >
                        {entry.colorTier}
                      </span>
                      <span
                        className="text-[13px] w-8 text-right flex-shrink-0 tabular-nums"
                        style={{ color: tier?.color }}
                      >
                        {entry.waitTime}s
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live feed */}
          <div className="bg-white dark:bg-neutral-950 border border-black/8 dark:border-white/8 rounded-md overflow-hidden">
            {/* feed header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <span className="text-[10px] tracking-[1.8px] uppercase text-black/22 dark:text-white/22">
                live feed
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-live-pulse flex-shrink-0" />
                <span className="text-[10px] tracking-wide text-black/22 dark:text-white/22">real-time</span>
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-xs text-black/28 dark:text-white/28 px-5 pb-5">
                waiting for first press…
              </p>
            ) : (
              <div className="flex flex-col">
                {recentActivity.map((a, i, arr) => {
                  const tier = TIER_CONFIG[a.colorTier];
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-5 py-2.5 border-l-2 transition-opacity duration-300"
                      style={{
                        borderLeftColor: tier?.color,
                        borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                        borderBottomWidth: i < arr.length - 1 ? "1px" : "0",
                        borderBottomStyle: "solid",
                        opacity: Math.max(0.18, 1 - i * 0.06),
                      }}
                    >
                      <span className="text-xs text-black dark:text-white">{a.username}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] tracking-wide" style={{ color: tier?.color }}>
                          {a.colorTier}
                        </span>
                        <span className="text-[11px] text-black/28 dark:text-white/28 tabular-nums">
                          {60 - a.waitSeconds}s
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

// minimal global styles only for things Tailwind can't do
const globalStyles = `
  @keyframes live-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
  }
  @keyframes flash-out {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }
  .animate-live-pulse { animation: live-pulse 2s ease-in-out infinite; }
  .animate-flash-out  { animation: flash-out 0.5s ease-out forwards; }

  body { font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace; }
  input::placeholder { color: inherit; }
`;