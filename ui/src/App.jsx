import { useState, useEffect } from 'react';
import axios from 'axios';
import socket from './socket';

function flashUI() {
  const button = document.getElementById("border");
  if (!button) return;

  button.classList.add("flash");
  setTimeout(() => {
    button.classList.remove("flash");
  }, 200);
}

function App() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hasPressed, setHasPressed] = useState(false);
  const [totalPresses, setTotalPresses] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [timeSinceLastPress, setTimeSinceLastPress] = useState(0);
  const [lastTier, setLastTier] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const triggerFlash = () => {
    if (isFlashing) return;
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
    }, 2000);
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_SERVER_URL}/api/leaderboard`)
      .then(res => setLeaderboard(res.data));
  }, []);

  useEffect(() => {
    socket.on("init", (data) => {
      setTotalPresses(data.totalPresses);
      setTimeSinceLastPress(data.timer);
      setActiveUsers(data.activeUsers);
    });

    // someone pressed — update stats
    socket.on("pressed", (data) => {
      triggerFlash();
      setTotalPresses(data.totalPresses);
      setTimeSinceLastPress(60); // reset timer
      setActiveUsers(data.activeUsers);
      setLastTier(data.colorTier);

      // add to recent activity
      setRecentActivity(prev => [{
        id: Date.now(),
        username: data.username,
        waitSeconds: data.waitSeconds,
        colorTier: data.colorTier
      }, ...prev.slice(0, 14)]);
    });

    // leaderboard update
    socket.on("leaderboard", (data) => {
      setLeaderboard(data);
    });

    // active user count
    socket.on("activeUsers", (count) => {
      setActiveUsers(count);
    });

    // press error (already pressed / other)
    socket.on("pressError", (err) => {
      setError(err.message);
    });

    socket.on("timer", (t) => {
      setTimeSinceLastPress(t);
    });

    socket.on("timerExpired", () => {
      // optional — grey out button, show message, etc
    });

    return () => {
      socket.off("init");
      socket.off("pressed");
      socket.off("leaderboard");
      socket.off("activeUsers");
      socket.off("pressError");
      socket.off("timer");
      socket.off("timerExpired");
    };
  }, []);

  const handleButtonPress = () => {
    if (!submitted || hasPressed) return;
    socket.emit("press", username);
    setHasPressed(true);
  };

  const tierColors = {
    purple: "#9333ea",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    orange: "#f97316",
    red: "#ef4444"
  };

  // username entry screen
  if (!submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen relative bg-gradient-to-br from-white via-gray-50 to-zinc-100 gap-6">
        <div id="border" className={`pointer-events-none absolute inset-0 z-50 border-4 transition-colors duration-300 ${
          isFlashing 
            ? 'border-red-500 animate-pulse' 
            : 'border-transparent'
        }`}></div>
        <h1 className="text-5xl font-black font-['Roboto']">THE BUTTON</h1>
        <p className="text-gray-600">Enter your username to participate</p>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border-2 border-gray-300 rounded-lg px-4 py-2 text-lg w-64 focus:outline-none focus:border-red-500"
        />
        <button
          onClick={() => username.trim() && setSubmitted(true)}
          className="bg-red-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-red-600 transition"
        >
          Enter
        </button>
      </div >
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen relative bg-gradient-to-br from-white via-gray-50 to-zinc-100 px-4 py-8 md:px-6 lg:px-8">
      <div id="border" className={`pointer-events-none absolute inset-0 z-50 border-4 transition-colors duration-300 ${isFlashing ? 'border-red-500 animate-pulse' : 'border-transparent'}`}></div>
      {/* Header */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-center font-['Roboto'] mb-8 md:mb-12">
        THE BUTTON
      </h1>

      {/* error banner */}
      {error && (
        <div className="max-w-md mx-auto mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Main Button Section */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-12 mb-12 md:mb-16 w-full max-w-7xl mx-auto">
        <div className="hidden md:flex w-full md:w-48 lg:w-56 text-center text-stone-900 text-lg md:text-2xl lg:text-3xl font-medium font-['Roboto'] leading-snug flex-shrink-0">
          {hasPressed ? `You pressed! Tier: ${lastTier}` : "Press it to secure your legacy"}
        </div>

        {/* Button */}
        <div className="flex items-center justify-center flex-shrink-0">
          <button
            id="button"
            disabled={hasPressed}
            onClick={handleButtonPress}
            style={lastTier ? { backgroundColor: tierColors[lastTier] } : {}}
            className="w-40 h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-full border-2 border-neutral-200 bg-red-500 font-medium text-gray-200 text-lg md:text-xl lg:text-2xl transition-all duration-100 hover:scale-105 [box-shadow:4px_4px_0px_rgb(82_82_82)] md:[box-shadow:6px_6px_0px_rgb(82_82_82)] lg:[box-shadow:8px_8px_0px_rgb(82_82_82)] active:translate-x-1 active:translate-y-1 active:[box-shadow:2px_2px_0px_rgb(82_82_82)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {hasPressed ? "Pressed!" : "Click me"}
          </button>
        </div>

        {/* Stats */}
        <div className="hidden md:flex w-full md:w-48 lg:w-56 flex-col gap-4 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md border-l-4 border-red-500 p-4">
            <p className="text-gray-600 text-xs lg:text-sm font-['Roboto']">Total Presses</p>
            <p className="text-2xl lg:text-3xl font-bold text-red-600 font-['Roboto'] mt-1">
              {totalPresses.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-4">
            <p className="text-gray-600 text-xs lg:text-sm font-['Roboto']">Active Users</p>
            <p className="text-2xl lg:text-3xl font-bold text-blue-600 font-['Roboto'] mt-1">
              {activeUsers}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-4">
            <p className="text-gray-600 text-xs lg:text-sm font-['Roboto']">Countdown</p>
            <p className={`text-2xl lg:text-3xl font-bold font-['Roboto'] mt-1 ${timeSinceLastPress <= 10 ? "text-red-600" : "text-green-600"}`}>
              {timeSinceLastPress}s
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg border-2 border-purple-300 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <h2 className="text-xl md:text-2xl font-bold text-white font-['Roboto']">
              🏆 Leaderboard — Longest Wait
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200">
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-bold text-stone-900">Rank</th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-bold text-stone-900">Username</th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-bold text-stone-900">Tier</th>
                  <th className="px-4 md:px-6 py-3 text-right text-sm font-bold text-stone-900">Wait</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">
                      No presses yet. Be the first!
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry, i) => (
                    <tr key={i} className="border-b border-gray-200 hover:bg-purple-50 transition-colors">
                      <td className="px-4 md:px-6 py-3 font-bold text-stone-900">
                        {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-stone-900">{entry.username}</td>
                      <td className="px-4 md:px-6 py-3">
                        <span style={{ color: tierColors[entry.colorTier] }} className="font-bold capitalize">
                          {entry.colorTier}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-right text-stone-900">
                        {entry.longestWait}s
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
            <h2 className="text-xl font-bold text-white font-['Roboto']">⚡ Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.length === 0 ? (
              <p className="text-center py-8 text-gray-400">No activity yet</p>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="px-4 py-3 flex justify-between items-center">
                  <span className="font-medium text-stone-900 text-sm">{a.username}</span>
                  <span style={{ color: tierColors[a.colorTier] }} className="text-sm font-bold capitalize">
                    {a.colorTier} · {a.waitSeconds}s
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;