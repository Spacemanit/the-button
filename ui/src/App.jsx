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

// Theme tokens — single source of truth
const T = {
  dark: {
    bg: "#0a0a0a",
    surface: "#111111",
    border: "rgba(255,255,255,0.08)",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.35)",
    textDim: "rgba(255,255,255,0.18)",
    navBg: "#0a0a0a",
    inputBg: "#1a1a1a",
  },
  light: {
    bg: "#f5f4f0",
    surface: "#ffffff",
    border: "rgba(0,0,0,0.10)",
    text: "#0a0a0a",
    textMuted: "rgba(0,0,0,0.45)",
    textDim: "rgba(0,0,0,0.25)",
    navBg: "#f5f4f0",
    inputBg: "#eceae4",
  },
};

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

  const c = T[theme]; // current theme tokens
  const isDark = theme === "dark";

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
        if (res.data.alreadyPressed) {
          setHasPressed(true);
          setLastTier(res.data.userTier || null);
        } else {
          setHasPressed(false);
        }
      });
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/leaderboard`)
      .then(res => { if (Array.isArray(res.data)) setLeaderboard(res.data); });
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

  // shared card style
  const card = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: "8px",
    padding: "20px",
  };

  const label = {
    display: "block",
    fontSize: "10px",
    letterSpacing: "1.8px",
    textTransform: "uppercase",
    color: c.textDim,
    marginBottom: "16px",
  };

  const divider = { width: "1px", background: c.border, alignSelf: "stretch", flexShrink: 0 };

  // ── LOGIN ──────────────────────────────────────────────────
  if (!submitted) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'SF Mono','Fira Code',ui-monospace,monospace" }}>
          <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "28px" }}>

            {/* accent line */}
            <div style={{ height: "2px", width: "32px", borderRadius: "2px", background: accentColor }} />

            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 300, letterSpacing: "-0.5px", color: c.text, marginBottom: "8px" }}>
                The Button
              </h1>
              <p style={{ fontSize: "13px", color: c.textMuted, lineHeight: 1.6 }}>
                One press. One legacy.<br />No second chances.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmitUsername()}
                maxLength={20}
                autoFocus
                style={{
                  flex: 1, background: c.inputBg,
                  border: `1px solid ${c.border}`,
                  borderRadius: "6px", color: c.text,
                  fontSize: "14px", padding: "10px 12px",
                  outline: "none", fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleSubmitUsername}
                style={{
                  padding: "10px 16px", borderRadius: "6px",
                  border: "none", fontSize: "13px", fontWeight: 500,
                  fontFamily: "inherit", cursor: username.trim() ? "pointer" : "default",
                  background: username.trim() ? accentColor : c.border,
                  color: username.trim() ? "#000" : c.textDim,
                  transition: "opacity 0.15s",
                }}
              >
                enter
              </button>
            </div>

            <p style={{ fontSize: "11px", color: c.textDim, letterSpacing: "0.5px" }}>
              you can only press once — ever.
            </p>

            {/* theme toggle on login too */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              style={{ alignSelf: "flex-start", background: "none", border: `1px solid ${c.border}`, borderRadius: "4px", padding: "4px 10px", fontSize: "11px", color: c.textMuted, cursor: "pointer", fontFamily: "inherit", letterSpacing: "1px" }}
            >
              {isDark ? "light" : "dark"}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── MAIN APP ───────────────────────────────────────────────
  return (
    <>
      <style>{globalStyles}</style>

      {/* flash overlay */}
      {flashTier && (
        <div
          className="flash-overlay"
          style={{ borderColor: TIER_CONFIG[flashTier].color }}
        />
      )}

      <div style={{ minHeight: "100vh", background: c.bg, color: c.text, fontFamily: "'SF Mono','Fira Code',ui-monospace,monospace" }}>

        {/* ── NAV ── */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, height: "50px", background: c.navBg, borderBottom: `1px solid ${c.border}` }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: accentColor, transition: "background 0.5s" }} />
              <span style={{ fontSize: "13px", letterSpacing: "1px", color: c.text }}>the button</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="live-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: c.textMuted, letterSpacing: "0.5px" }}>{activeUsers} watching</span>
              </div>

              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                style={{ background: "none", border: `1px solid ${c.border}`, borderRadius: "4px", padding: "4px 10px", fontSize: "11px", color: c.textMuted, cursor: "pointer", fontFamily: "inherit", letterSpacing: "1px", transition: "border-color 0.15s, color 0.15s" }}
              >
                {isDark ? "light" : "dark"}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: c.textMuted }}>{username}</span>
                {hasPressed && lastTier && (
                  <span style={{ fontSize: "10px", padding: "2px 6px", border: `1px solid ${TIER_CONFIG[lastTier].border}`, borderRadius: "4px", color: TIER_CONFIG[lastTier].color, letterSpacing: "1px" }}>
                    {TIER_CONFIG[lastTier].label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* ── ERROR ── */}
        {error && (
          <div style={{ maxWidth: "1000px", margin: "12px auto", padding: "0 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "10px 14px", fontSize: "12px", color: "#f87171" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "14px", marginLeft: "12px" }}>✕</button>
            </div>
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", alignItems: "start" }}>

          {/* ══ LEFT ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Countdown */}
            <div style={card}>
              <span style={label}>countdown</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "20px" }}>
                <span style={{ fontSize: "72px", fontWeight: 200, lineHeight: 1, letterSpacing: "-4px", color: timerColor, transition: "color 0.3s", fontVariantNumeric: "tabular-nums" }}>
                  {countdown}
                </span>
                <span style={{ fontSize: "28px", fontWeight: 200, color: c.textMuted }}>s</span>
              </div>
              {/* segmented bar */}
              <div style={{ display: "flex", gap: "2px", overflow: "hidden" }}>
                {Array.from({ length: 60 }).map((_, i) => {
                  const active = i < countdown;
                  const segColor = i >= 50 ? TIER_CONFIG.purple.color
                    : i >= 40 ? TIER_CONFIG.blue.color
                      : i >= 30 ? TIER_CONFIG.green.color
                        : i >= 20 ? TIER_CONFIG.yellow.color
                          : i >= 10 ? TIER_CONFIG.orange.color
                            : TIER_CONFIG.red.color;
                  return (
                    <div key={i} style={{ flex: 1, height: "3px", borderRadius: "1px", minWidth: 0, background: active ? segColor : c.border, transition: "background 0.2s" }} />
                  );
                })}
              </div>
            </div>

            {/* The Button */}
            <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "36px 20px" }}>
              <button
                disabled={hasPressed}
                onClick={handleButtonPress}
                className="the-btn"
                style={{
                  width: "144px", height: "144px", borderRadius: "50%",
                  background: "transparent",
                  border: `1px solid ${accentColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: hasPressed ? "default" : "pointer",
                  transition: "transform 0.1s, box-shadow 0.3s",
                  boxShadow: hasPressed ? `0 0 20px ${accentBorder}` : "none",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  {hasPressed ? (
                    <>
                      <span style={{ fontSize: "18px", color: accentColor }}>✓</span>
                      <span style={{ fontSize: "12px", letterSpacing: "4px", color: accentColor }}>pressed</span>
                      {lastTier && (
                        <span style={{ fontSize: "10px", padding: "2px 8px", border: `1px solid ${TIER_CONFIG[lastTier].border}`, borderRadius: "4px", color: TIER_CONFIG[lastTier].color, letterSpacing: "1px" }}>
                          {TIER_CONFIG[lastTier].label}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: "12px", letterSpacing: "4px", color: accentColor }}>press</span>
                  )}
                </div>
              </button>
              <p style={{ fontSize: "11px", letterSpacing: "0.5px", textAlign: "center", color: c.textMuted }}>
                {hasPressed ? `${username} — sealed` : "wait longer · earn rarer"}
              </p>
            </div>

            {/* Stats strip */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: "8px", display: "flex", overflow: "hidden" }}>
              {[
                { val: totalPresses.toLocaleString(), key: "presses", color: c.text },
                { val: activeUsers, key: "watching", color: "#4ade80" },
                { val: `${countdown}s`, key: "timer", color: timerColor },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", flex: 1 }}>
                  {i > 0 && <div style={divider} />}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px", gap: "6px" }}>
                    <span style={{ fontSize: "19px", fontWeight: 400, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: s.color, transition: "color 0.3s" }}>{s.val}</span>
                    <span style={{ fontSize: "10px", letterSpacing: "0.8px", color: c.textDim }}>{s.key}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tier guide */}
            <div style={card}>
              <span style={label}>tier guide</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {Object.entries(TIER_CONFIG).map(([key, val], i, arr) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : "none" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: val.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "12px", color: c.text }}>{val.label}</span>
                    <span style={{ fontSize: "11px", color: c.textMuted }}>{val.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══ RIGHT ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Leaderboard */}
            <div style={card}>
              <span style={label}>leaderboard</span>
              {leaderboard.length === 0 ? (
                <p style={{ fontSize: "12px", color: c.textDim }}>no presses yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {leaderboard.map((entry, i, arr) => {
                    const tier = TIER_CONFIG[entry.colorTier];
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : "none" }}>
                        <span style={{ fontSize: "11px", letterSpacing: "1px", width: "20px", flexShrink: 0, color: c.textDim }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span style={{ flex: 1, fontSize: "12px", color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.username}
                        </span>
                        <span style={{ fontSize: "10px", padding: "2px 6px", border: `1px solid ${tier?.border}`, borderRadius: "4px", color: tier?.color, letterSpacing: "1px", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {entry.colorTier}
                        </span>
                        <span style={{ fontSize: "13px", width: "32px", textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums", color: tier?.color }}>
                          {entry.waitTime}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live feed */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px" }}>
                <span style={{ fontSize: "10px", letterSpacing: "1.8px", textTransform: "uppercase", color: c.textDim }}>live feed</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="live-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                  <span style={{ fontSize: "10px", color: c.textDim }}>real-time</span>
                </div>
              </div>
              {recentActivity.length === 0 ? (
                <p style={{ fontSize: "12px", color: c.textDim, padding: "0 20px 20px" }}>waiting for first press…</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {recentActivity.map((a, i, arr) => {
                    const tier = TIER_CONFIG[a.colorTier];
                    return (
                      <div key={a.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 20px",
                        borderLeft: `2px solid ${tier?.color}`,
                        borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : "none",
                        opacity: Math.max(0.2, 1 - i * 0.06),
                      }}>
                        <span style={{ fontSize: "12px", color: c.text }}>{a.username}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "11px", color: tier?.color, letterSpacing: "0.5px" }}>{a.colorTier}</span>
                          <span style={{ fontSize: "11px", color: c.textMuted, fontVariantNumeric: "tabular-nums" }}>{a.waitSeconds}s</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </main>
        <footer style={{ borderTop: `1px solid ${c.border}`, padding: "24px", marginTop: "20px" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>

            <span style={{ fontSize: "11px", color: c.textDim }}>
              built by Manit Bisht
            </span>

            <div style={{ display: "flex", gap: "16px" }}>
              <a href="https://github.com/Spacemanit" target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: c.textMuted, textDecoration: "none", letterSpacing: "0.5px" }}>
                github
              </a>
              <a href="https://www.linkedin.com/in/manit-bisht-6519b836a/" target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: c.textMuted, textDecoration: "none", letterSpacing: "0.5px" }}>
                linkedin
              </a>
              <a href="mailto:manit.bisht2007@gmail.com" style={{ fontSize: "11px", color: c.textMuted, textDecoration: "none", letterSpacing: "0.5px" }}>
                email
              </a>
            </div>

          </div>
        </footer>
      </div>
    </>
  );
}

const globalStyles = `
  @keyframes live-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
  }
  @keyframes flash-out {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }
  .live-pulse { animation: live-pulse 2s ease-in-out infinite; }
  .flash-overlay {
    position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    border: 2px solid transparent;
    animation: flash-out 0.5s ease-out forwards;
  }
  .the-btn:hover:not(:disabled) { transform: scale(1.03); }
  .the-btn:active:not(:disabled) { transform: scale(0.96); }
`;