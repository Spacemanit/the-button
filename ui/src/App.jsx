import { useState, useEffect } from 'react';
import axios from 'axios';
import socket from './socket';

const TIER_CONFIG = {
  purple: { color: "#a78bfa", dim: "#a78bfa22", border: "#a78bfa40", label: "Purple", range: "50–60s" },
  blue:   { color: "#60a5fa", dim: "#60a5fa22", border: "#60a5fa40", label: "Blue",   range: "40–49s" },
  green:  { color: "#4ade80", dim: "#4ade8022", border: "#4ade8040", label: "Green",  range: "30–39s" },
  yellow: { color: "#facc15", dim: "#facc1522", border: "#facc1540", label: "Yellow", range: "20–29s" },
  orange: { color: "#fb923c", dim: "#fb923c22", border: "#fb923c40", label: "Orange", range: "10–19s" },
  red:    { color: "#f87171", dim: "#f8717122", border: "#f8717140", label: "Red",    range: "0–9s"   },
};

const DEFAULT_COLOR = "#f87171";

export default function App() {
  const [theme, setTheme]                   = useState("dark");
  const [username, setUsername]             = useState("");
  const [submitted, setSubmitted]           = useState(false);
  const [hasPressed, setHasPressed]         = useState(false);
  const [totalPresses, setTotalPresses]     = useState(0);
  const [activeUsers, setActiveUsers]       = useState(0);
  const [countdown, setCountdown]           = useState(60);
  const [lastTier, setLastTier]             = useState(null);
  const [leaderboard, setLeaderboard]       = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError]                   = useState(null);
  const [flashTier, setFlashTier]           = useState(null);

  const isDark = theme === "dark";

  const triggerFlash = (tier) => {
    setFlashTier(tier);
    setTimeout(() => setFlashTier(null), 500);
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_SERVER_URL}/api/leaderboard`)
      .then(res => { if (Array.isArray(res.data)) setLeaderboard(res.data); });
  }, []);

  useEffect(() => {
    socket.on("init", d => { setTotalPresses(d.totalPresses); setCountdown(d.timer); setActiveUsers(d.activeUsers); });
    socket.on("pressed", d => {
      triggerFlash(d.colorTier);
      setTotalPresses(d.totalPresses);
      setCountdown(60);
      setActiveUsers(d.activeUsers);
      setLastTier(d.colorTier);
      setRecentActivity(prev => [{ id: Date.now(), username: d.username, waitSeconds: d.waitSeconds, colorTier: d.colorTier }, ...prev.slice(0, 14)]);
    });
    socket.on("leaderboard", d => { if (Array.isArray(d)) setLeaderboard(d); });
    socket.on("activeUsers", c => setActiveUsers(c));
    socket.on("pressError",  e => setError(e.message));
    socket.on("timer",       t => setCountdown(t));
    return () => ["init","pressed","leaderboard","activeUsers","pressError","timer"].forEach(e => socket.off(e));
  }, []);

  const handleButtonPress = () => {
    if (!submitted || hasPressed) return;
    socket.emit("press", username);
    setHasPressed(true);
  };

  const timerPct    = (countdown / 60) * 100;
  const accentColor = lastTier ? TIER_CONFIG[lastTier].color : DEFAULT_COLOR;
  const timerColor  = countdown <= 10 ? "#f87171" : countdown <= 25 ? "#fb923c" : "#4ade80";

  const tk = isDark ? {
    bg:          "#000000",
    surface:     "#0a0a0a",
    border:      "rgba(255,255,255,0.08)",
    borderMid:   "rgba(255,255,255,0.14)",
    text:        "#ffffff",
    textSub:     "rgba(255,255,255,0.45)",
    textMuted:   "rgba(255,255,255,0.22)",
    inputBg:     "#0f0f0f",
  } : {
    bg:          "#f5f5f4",
    surface:     "#ffffff",
    border:      "rgba(0,0,0,0.08)",
    borderMid:   "rgba(0,0,0,0.16)",
    text:        "#0a0a0a",
    textSub:     "rgba(0,0,0,0.45)",
    textMuted:   "rgba(0,0,0,0.28)",
    inputBg:     "#efefed",
  };

  // ── LOGIN ──────────────────────────────────────────────────
  if (!submitted) {
    return (
      <>
        <style>{css(tk, isDark)}</style>
        <div className="login-wrap">
          <div className="login-box">
            <div className="login-mark" style={{ background: accentColor }} />
            <div>
              <h1 className="login-h">The Button</h1>
              <p className="login-p">One press. One legacy.<br />No second chances.</p>
            </div>
            <div className="login-form">
              <input
                className="login-input"
                type="text"
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && username.trim() && setSubmitted(true)}
                maxLength={20}
                autoFocus
              />
              <button
                className="login-cta"
                style={{
                  background: username.trim() ? accentColor : tk.border,
                  color: username.trim() ? "#000" : tk.textMuted,
                  cursor: username.trim() ? "pointer" : "default",
                }}
                onClick={() => username.trim() && setSubmitted(true)}
              >
                enter
              </button>
            </div>
            <p className="login-fine">you can only press once — ever.</p>
          </div>
        </div>
      </>
    );
  }

  // ── MAIN ──────────────────────────────────────────────────
  return (
    <>
      <style>{css(tk, isDark)}</style>

      {flashTier && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none",
          borderTop: `2px solid ${TIER_CONFIG[flashTier].color}`,
          animation: "flashOut 0.5s ease-out forwards",
        }} />
      )}

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-dot" style={{ background: accentColor }} />
            <span className="nav-title">the button</span>
          </div>
          <div className="nav-right">
            <div className="nav-live">
              <span className="live-pulse" />
              <span className="nav-live-txt">{activeUsers} watching</span>
            </div>
            <button
              className="nav-theme"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="toggle theme"
            >
              {isDark ? "light" : "dark"}
            </button>
            <div className="nav-user">
              <span className="nav-username">{username}</span>
              {hasPressed && lastTier && (
                <span className="nav-flair" style={{ color: TIER_CONFIG[lastTier].color, borderColor: TIER_CONFIG[lastTier].border }}>
                  {TIER_CONFIG[lastTier].label}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {error && (
        <div className="err-bar">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <main className="layout">

        {/* ── LEFT COL ── */}
        <section className="left-col">

          {/* Countdown */}
          <div className="block">
            <span className="block-label">countdown</span>
            <div className="countdown-display">
              <span className="countdown-num" style={{ color: timerColor }}>{countdown}</span>
              <span className="countdown-unit" style={{ color: tk.textSub }}>s</span>
            </div>
            <div className="seg-track">
              {Array.from({ length: 60 }).map((_, i) => {
                const active = i < countdown;
                const segColor = i >= 50 ? TIER_CONFIG.purple.color
                  : i >= 40 ? TIER_CONFIG.blue.color
                  : i >= 30 ? TIER_CONFIG.green.color
                  : i >= 20 ? TIER_CONFIG.yellow.color
                  : i >= 10 ? TIER_CONFIG.orange.color
                  : TIER_CONFIG.red.color;
                return (
                  <div key={i} className="seg" style={{ background: active ? segColor : tk.border }} />
                );
              })}
            </div>
          </div>

          {/* The Button */}
          <div className="block btn-block">
            <button
              className={`the-btn ${hasPressed ? "the-btn--done" : "the-btn--ready"}`}
              disabled={hasPressed}
              onClick={handleButtonPress}
              style={{ borderColor: accentColor, color: accentColor }}
            >
              {hasPressed ? (
                <div className="btn-inner">
                  <span className="btn-check">✓</span>
                  <span className="btn-word">pressed</span>
                  {lastTier && (
                    <span className="btn-tag" style={{ color: TIER_CONFIG[lastTier].color, borderColor: TIER_CONFIG[lastTier].border }}>
                      {TIER_CONFIG[lastTier].label}
                    </span>
                  )}
                </div>
              ) : (
                <div className="btn-inner">
                  <span className="btn-word">press</span>
                </div>
              )}
            </button>
            <p className="btn-sub" style={{ color: tk.textSub }}>
              {hasPressed ? `${username} — sealed` : "wait longer · earn rarer"}
            </p>
          </div>

          {/* Stats */}
          <div className="stats-row">
            {[
              { val: totalPresses.toLocaleString(), key: "presses", color: tk.text },
              { val: activeUsers, key: "watching", color: "#4ade80" },
              { val: `${countdown}s`, key: "timer", color: timerColor },
            ].map((s, i) => (
              <div key={i} className="stat-item">
                {i > 0 && <div className="stat-div" style={{ background: tk.border }} />}
                <div className="stat-content">
                  <span className="stat-val" style={{ color: s.color }}>{s.val}</span>
                  <span className="stat-key" style={{ color: tk.textMuted }}>{s.key}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tier Guide */}
          <div className="block">
            <span className="block-label">tier guide</span>
            <div className="tier-list">
              {Object.entries(TIER_CONFIG).map(([key, val]) => (
                <div key={key} className="tier-row" style={{ borderBottomColor: tk.border }}>
                  <span className="tier-dot" style={{ background: val.color }} />
                  <span className="tier-name" style={{ color: tk.text }}>{val.label}</span>
                  <span className="tier-range" style={{ color: tk.textMuted }}>{val.range}</span>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* ── RIGHT COL ── */}
        <section className="right-col">

          {/* Leaderboard */}
          <div className="block">
            <span className="block-label">leaderboard</span>
            {leaderboard.length === 0 ? (
              <p className="empty-txt" style={{ color: tk.textMuted }}>no presses yet.</p>
            ) : (
              <div className="lb-list">
                {leaderboard.map((entry, i) => {
                  const tier = TIER_CONFIG[entry.colorTier];
                  return (
                    <div key={i} className="lb-row" style={{ borderBottomColor: tk.border }}>
                      <span className="lb-rank" style={{ color: tk.textMuted }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="lb-name" style={{ color: tk.text }}>{entry.username}</span>
                      <span className="lb-badge" style={{ color: tier?.color, borderColor: tier?.border }}>
                        {entry.colorTier}
                      </span>
                      <span className="lb-time" style={{ color: tier?.color }}>{entry.longestWait}s</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Feed */}
          <div className="block feed-block">
            <div className="feed-head">
              <span className="block-label" style={{ marginBottom: 0 }}>live feed</span>
              <div className="feed-live-ind">
                <span className="live-pulse" />
                <span style={{ color: tk.textMuted, fontSize: 10, letterSpacing: "0.5px" }}>real-time</span>
              </div>
            </div>
            {recentActivity.length === 0 ? (
              <p className="empty-txt" style={{ color: tk.textMuted, paddingTop: 16 }}>waiting for first press…</p>
            ) : (
              <div className="feed-list">
                {recentActivity.map((a, i) => {
                  const tier = TIER_CONFIG[a.colorTier];
                  return (
                    <div
                      key={a.id}
                      className="feed-row"
                      style={{
                        borderLeftColor: tier?.color,
                        opacity: Math.max(0.18, 1 - i * 0.06),
                        borderBottomColor: tk.border,
                      }}
                    >
                      <span className="feed-user" style={{ color: tk.text }}>{a.username}</span>
                      <div className="feed-right">
                        <span className="feed-tier" style={{ color: tier?.color }}>{a.colorTier}</span>
                        <span className="feed-time" style={{ color: tk.textMuted }}>{60 - a.waitSeconds}s</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>
      </main>
    </>
  );
}

// ── STYLES ────────────────────────────────────────────────────────
function css(tk, isDark) {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: ${tk.bg};
      color: ${tk.text};
      font-family: 'SF Mono', 'Fira Code', ui-monospace, 'Cascadia Code', monospace;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      font-size: 13px;
    }

    @keyframes flashOut { 0% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes livePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }

    /* ── LOGIN ── */
    .login-wrap {
      min-height: 100vh;
      background: ${tk.bg};
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .login-box {
      width: 100%; max-width: 340px;
      display: flex; flex-direction: column; gap: 28px;
    }
    .login-mark { width: 32px; height: 2px; border-radius: 1px; }
    .login-h {
      font-size: 26px; font-weight: 300; letter-spacing: -0.5px;
      color: ${tk.text}; font-family: inherit; margin-bottom: 8px;
    }
    .login-p { font-size: 13px; color: ${tk.textSub}; line-height: 1.7; }
    .login-form { display: flex; gap: 8px; }
    .login-input {
      flex: 1;
      background: ${tk.inputBg};
      border: 1px solid ${tk.border};
      border-radius: 4px;
      color: ${tk.text};
      font-family: inherit;
      font-size: 13px;
      padding: 10px 12px;
      outline: none;
      transition: border-color 0.15s;
    }
    .login-input:focus { border-color: ${tk.borderMid}; }
    .login-input::placeholder { color: ${tk.textMuted}; }
    .login-cta {
      padding: 10px 16px;
      border: none; border-radius: 4px;
      font-family: inherit; font-size: 13px; font-weight: 500;
      letter-spacing: 0.5px;
      transition: opacity 0.15s;
    }
    .login-cta:hover { opacity: 0.85; }
    .login-fine { font-size: 11px; color: ${tk.textMuted}; letter-spacing: 0.3px; }

    /* ── NAV ── */
    .nav {
      position: sticky; top: 0; z-index: 100;
      background: ${tk.bg};
      border-bottom: 1px solid ${tk.border};
      height: 50px;
    }
    .nav-inner {
      max-width: 1100px; margin: 0 auto; padding: 0 24px;
      height: 100%; display: flex; align-items: center; justify-content: space-between;
    }
    .nav-brand { display: flex; align-items: center; gap: 10px; }
    .nav-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; transition: background 0.5s; }
    .nav-title { font-size: 13px; letter-spacing: 0.5px; color: ${tk.text}; }
    .nav-right { display: flex; align-items: center; gap: 20px; }
    .nav-live { display: flex; align-items: center; gap: 7px; }
    .live-pulse {
      width: 5px; height: 5px; border-radius: 50%; background: #4ade80;
      animation: livePulse 2s ease-in-out infinite; flex-shrink: 0;
    }
    .nav-live-txt { font-size: 11px; color: ${tk.textSub}; letter-spacing: 0.3px; font-variant-numeric: tabular-nums; }
    .nav-theme {
      background: none; border: 1px solid ${tk.border};
      color: ${tk.textSub}; font-family: inherit; font-size: 11px;
      padding: 4px 10px; border-radius: 3px; cursor: pointer;
      transition: border-color 0.15s, color 0.15s; letter-spacing: 0.8px;
    }
    .nav-theme:hover { border-color: ${tk.borderMid}; color: ${tk.text}; }
    .nav-user { display: flex; align-items: center; gap: 8px; }
    .nav-username { font-size: 12px; color: ${tk.textSub}; }
    .nav-flair {
      font-size: 10px; padding: 2px 7px;
      border: 1px solid; border-radius: 2px;
      letter-spacing: 0.8px; text-transform: lowercase;
    }

    /* ── ERROR ── */
    .err-bar {
      max-width: 1100px; margin: 12px auto;
      display: flex; align-items: center; justify-content: space-between;
      background: ${isDark ? "#110808" : "#fff5f5"};
      border: 1px solid #f8717130;
      border-radius: 4px; padding: 10px 14px;
      font-size: 12px; color: #f87171;
    }
    .err-bar button { background: none; border: none; color: #f87171; cursor: pointer; font-size: 13px; }

    /* ── LAYOUT ── */
    .layout {
      max-width: 1100px; margin: 0 auto;
      padding: 28px 24px 64px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 700px) {
      .layout { grid-template-columns: 1fr; }
      .nav-live { display: none; }
    }

    .left-col, .right-col { display: flex; flex-direction: column; gap: 16px; }

    /* ── BLOCK ── */
    .block {
      background: ${tk.surface};
      border: 1px solid ${tk.border};
      border-radius: 6px;
      padding: 20px;
    }
    .block-label {
      display: block;
      font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase;
      color: ${tk.textMuted};
      margin-bottom: 16px;
    }

    /* ── COUNTDOWN ── */
    .countdown-display { display: flex; align-items: baseline; gap: 3px; margin-bottom: 18px; }
    .countdown-num {
      font-size: 72px; font-weight: 200; line-height: 1;
      font-variant-numeric: tabular-nums; letter-spacing: -4px;
      transition: color 0.4s;
    }
    .countdown-unit { font-size: 28px; font-weight: 200; }
    .seg-track { display: flex; gap: 2px; }
    .seg { flex: 1; height: 3px; border-radius: 1px; min-width: 0; transition: background 0.25s; }

    /* ── BUTTON ── */
    .btn-block { align-items: center; padding: 36px 20px; gap: 18px; }
    .the-btn {
      width: 148px; height: 148px; border-radius: 50%;
      background: transparent; border: 1px solid;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.1s, background 0.2s;
    }
    .the-btn--ready:hover { transform: scale(1.03); background: ${isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"}; }
    .the-btn--ready:active { transform: scale(0.96); }
    .the-btn--done { cursor: default; }
    .btn-inner { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .btn-check { font-size: 18px; }
    .btn-word { font-size: 13px; letter-spacing: 4px; }
    .btn-tag {
      font-size: 10px; padding: 2px 8px;
      border: 1px solid; border-radius: 2px; letter-spacing: 1px;
    }
    .btn-sub { font-size: 11px; letter-spacing: 0.3px; text-align: center; }

    /* ── STATS ── */
    .stats-row {
      display: flex;
      background: ${tk.surface};
      border: 1px solid ${tk.border};
      border-radius: 6px;
      overflow: hidden;
    }
    .stat-item { display: flex; flex: 1; }
    .stat-div { width: 1px; flex-shrink: 0; }
    .stat-content {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      padding: 16px 8px; gap: 5px;
    }
    .stat-val { font-size: 19px; font-weight: 400; line-height: 1; font-variant-numeric: tabular-nums; }
    .stat-key { font-size: 10px; letter-spacing: 0.8px; }

    /* ── TIERS ── */
    .tier-list { display: flex; flex-direction: column; }
    .tier-row {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 0;
      border-bottom: 1px solid;
    }
    .tier-row:last-child { border-bottom: none !important; }
    .tier-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .tier-name { flex: 1; font-size: 12px; }
    .tier-range { font-size: 11px; }

    /* ── LEADERBOARD ── */
    .lb-list { display: flex; flex-direction: column; }
    .lb-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 0; border-bottom: 1px solid;
    }
    .lb-row:last-child { border-bottom: none !important; }
    .lb-rank { font-size: 11px; letter-spacing: 1px; width: 22px; flex-shrink: 0; }
    .lb-name { flex: 1; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .lb-badge {
      font-size: 10px; padding: 2px 7px;
      border: 1px solid; border-radius: 2px; letter-spacing: 0.5px;
      white-space: nowrap; flex-shrink: 0;
    }
    .lb-time { font-size: 13px; width: 34px; text-align: right; flex-shrink: 0; font-variant-numeric: tabular-nums; }
    .empty-txt { font-size: 12px; }

    /* ── FEED ── */
    .feed-block { padding: 20px 0; }
    .feed-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; margin-bottom: 14px;
    }
    .feed-live-ind { display: flex; align-items: center; gap: 6px; }
    .feed-list { display: flex; flex-direction: column; }
    .feed-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 20px;
      border-left: 2px solid;
      border-bottom: 1px solid;
      transition: opacity 0.3s;
    }
    .feed-row:last-child { border-bottom: none !important; }
    .feed-user { font-size: 12px; }
    .feed-right { display: flex; align-items: center; gap: 12px; }
    .feed-tier { font-size: 11px; letter-spacing: 0.5px; }
    .feed-time { font-size: 11px; font-variant-numeric: tabular-nums; }

    @media (max-width: 480px) {
      .countdown-num { font-size: 52px; letter-spacing: -2px; }
      .the-btn { width: 120px; height: 120px; }
      .nav-inner { padding: 0 16px; }
      .layout { padding: 20px 16px 48px; }
    }
  `;
}