import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, Eye, EyeOff, Zap, Shield, TrendingUp, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ROLE_CREDENTIALS = [
  { role: 'BranchOperator', username: 'operator1', password: 'password123', icon: Zap, color: 'text-amber-400', description: 'Register consignments, generate bills' },
  { role: 'TransportManager', username: 'manager1', password: 'password123', icon: TrendingUp, color: 'text-electric-400', description: 'Manage fleet, allocate trucks' },
  { role: 'SystemAdministrator', username: 'admin1', password: 'admin123', icon: Shield, color: 'text-purple-400', description: 'Full system access' },
]

function AnimatedScene() {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #050a14 0%, #0a0f1e 40%, #0d1530 100%)' }}>
      <style>{`
        .truck-anim  { animation: truckDrive 8s linear infinite; }
        .truck-anim-slow { animation: truckDrive 14s linear 5s infinite; }
        .road-line   { animation: roadMove 0.5s linear infinite; }
        .star-1 { animation: starTwinkle 2s ease-in-out 0s infinite; }
        .star-2 { animation: starTwinkle 2s ease-in-out 0.7s infinite; }
        .star-3 { animation: starTwinkle 2s ease-in-out 1.4s infinite; }
        .warehouse-glow { animation: warehousePulse 3s ease-in-out infinite; }
        .belt-move { animation: beltScroll 1s linear infinite; }
        .belt-pkg-1 { animation: beltPkg 4s linear 0s infinite; }
        .belt-pkg-2 { animation: beltPkg 4s linear 1.3s infinite; }
        .belt-pkg-3 { animation: beltPkg 4s linear 2.6s infinite; }
        .signal-blink { animation: signalBlink 1.8s ease-in-out infinite; }
        @keyframes truckDrive  { 0% { transform: translateX(-260px); } 100% { transform: translateX(560px); } }
        @keyframes roadMove    { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -60; } }
        @keyframes starTwinkle { 0%,100% { opacity: 0.2; } 50% { opacity: 1; } }
        @keyframes warehousePulse { 0%,100% { opacity: 0.3; } 50% { opacity: 0.65; } }
        @keyframes beltScroll  { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -20; } }
        @keyframes beltPkg     { 0% { transform: translateX(0); opacity:1; } 80% { opacity:1; } 100% { transform: translateX(130px); opacity:0; } }
        @keyframes signalBlink { 0%,45%,100% { opacity:0.2; } 50%,95% { opacity:1; } }
      `}</style>

      <svg viewBox="0 0 500 400" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">

        {/* Stars */}
        {[[40,30],[120,20],[200,50],[320,15],[420,35],[80,80],[260,40],[460,60],[160,65],[380,55]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="white" className={`star-${(i%3)+1}`} opacity="0.5" />
        ))}

        {/* Warehouse */}
        <g className="warehouse-glow">
          <rect x="20" y="150" width="130" height="135" rx="2" fill="#0d1530" stroke="#1a2a5e" strokeWidth="1"/>
          <rect x="30" y="162" width="26" height="26" rx="1" fill="#0066ff" opacity="0.25"/>
          <rect x="66" y="162" width="26" height="26" rx="1" fill="#0066ff" opacity="0.18"/>
          <rect x="102" y="162" width="26" height="26" rx="1" fill="#0066ff" opacity="0.28"/>
          <rect x="30" y="198" width="26" height="22" rx="1" fill="#0066ff" opacity="0.12"/>
          <rect x="66" y="198" width="26" height="22" rx="1" fill="#0066ff" opacity="0.22"/>
          <rect x="102" y="198" width="26" height="22" rx="1" fill="#0066ff" opacity="0.1"/>
          {/* Loading door */}
          <rect x="60" y="248" width="50" height="37" rx="1" fill="#050a14"/>
          <rect x="18" y="148" width="134" height="7" rx="1" fill="#1a2a5e"/>
          <text x="85" y="145" textAnchor="middle" fill="#2980ff" fontSize="8" opacity="0.65">WAREHOUSE</text>
          {/* Signal light */}
          <circle cx="155" cy="165" r="5" fill="#22c55e" className="signal-blink"/>
        </g>

        {/* Conveyor belt platform */}
        <rect x="155" y="255" width="145" height="12" rx="2" fill="#0d1a3e" stroke="#1a2a5e" strokeWidth="1"/>
        {/* Belt rollers */}
        {[162,177,192,207,222,237,252,267,282,292].map((x,i) => (
          <circle key={i} cx={x} cy="261" r="4" fill="#0a1228" stroke="#2a3a6e" strokeWidth="1"/>
        ))}
        {/* Belt surface moving lines */}
        <line x1="155" y1="258" x2="300" y2="258" stroke="#1a2a5e" strokeWidth="1.5" strokeDasharray="10 10" className="belt-move"/>
        {/* Packages on belt */}
        <g className="belt-pkg-1" style={{transformOrigin:'0px 0px'}}>
          <rect x="158" y="246" width="14" height="11" rx="2" fill="#f59e0b" opacity="0.9"/>
          <line x1="158" y1="251" x2="172" y2="251" stroke="#fbbf24" strokeWidth="0.8" opacity="0.6"/>
          <line x1="165" y1="246" x2="165" y2="257" stroke="#fbbf24" strokeWidth="0.8" opacity="0.6"/>
        </g>
        <g className="belt-pkg-2" style={{transformOrigin:'0px 0px'}}>
          <rect x="158" y="246" width="12" height="10" rx="2" fill="#8b5cf6" opacity="0.85"/>
          <line x1="158" y1="251" x2="170" y2="251" stroke="#a78bfa" strokeWidth="0.8" opacity="0.6"/>
        </g>
        <g className="belt-pkg-3" style={{transformOrigin:'0px 0px'}}>
          <rect x="158" y="247" width="13" height="10" rx="2" fill="#0066ff" opacity="0.85"/>
          <line x1="158" y1="252" x2="171" y2="252" stroke="#5599ff" strokeWidth="0.8" opacity="0.6"/>
          <line x1="164" y1="247" x2="164" y2="257" stroke="#5599ff" strokeWidth="0.8" opacity="0.6"/>
        </g>

        {/* City buildings */}
        <rect x="330" y="175" width="42" height="105" rx="2" fill="#080e1c" stroke="#101a33" strokeWidth="0.5"/>
        <rect x="382" y="195" width="32" height="85" rx="2" fill="#080e1c" stroke="#101a33" strokeWidth="0.5"/>
        <rect x="422" y="158" width="52" height="122" rx="2" fill="#080e1c" stroke="#101a33" strokeWidth="0.5"/>
        <rect x="478" y="188" width="22" height="92" rx="2" fill="#080e1c" stroke="#101a33" strokeWidth="0.5"/>
        {[[338,190],[350,190],[362,190],[338,205],[350,205],[390,203],[402,203],[390,216],[430,168],[442,168],[454,168],[430,183],[454,183]].map(([x,y],i) => (
          <rect key={i} x={x} y={y} width="5" height="5" rx="0.5" fill="#0066ff" opacity={0.1+(i%3)*0.08}/>
        ))}

        {/* Road */}
        <rect x="0" y="290" width="500" height="60" fill="#0a0a14"/>
        <rect x="0" y="290" width="500" height="3" fill="#1a1a2e"/>
        <rect x="0" y="347" width="500" height="3" fill="#1a1a2e"/>
        <line x1="0" y1="320" x2="500" y2="320" stroke="#2a3a5e" strokeWidth="2" strokeDasharray="30 20" className="road-line"/>
        <ellipse cx="250" cy="290" rx="200" ry="15" fill="#0066ff" opacity="0.05"/>

        {/* MOVING TRUCK */}
        <g className="truck-anim">
          <rect x="10" y="258" width="72" height="32" rx="3" fill="#0d1a3e"/>
          <rect x="0"  y="245" width="56" height="45" rx="2" fill="#162247" stroke="#2a3a6e" strokeWidth="1"/>
          <line x1="16" y1="245" x2="16" y2="290" stroke="#1e3a6e" strokeWidth="1" opacity="0.4"/>
          <line x1="32" y1="245" x2="32" y2="290" stroke="#1e3a6e" strokeWidth="1" opacity="0.4"/>
          <line x1="48" y1="245" x2="48" y2="290" stroke="#1e3a6e" strokeWidth="1" opacity="0.4"/>
          <rect x="59" y="260" width="19" height="14" rx="2" fill="#0066ff" opacity="0.5"/>
          <rect x="79" y="272" width="6" height="4" rx="1" fill="#fbbf24"/>
          <ellipse cx="86" cy="274" rx="14" ry="4" fill="#fbbf24" opacity="0.1"/>
          <circle cx="18" cy="292" r="9" fill="#0a0a14" stroke="#2a3a6e" strokeWidth="2"/>
          <circle cx="18" cy="292" r="4" fill="#1a2a4e"/>
          <circle cx="64" cy="292" r="9" fill="#0a0a14" stroke="#2a3a6e" strokeWidth="2"/>
          <circle cx="64" cy="292" r="4" fill="#1a2a4e"/>
          <text x="28" y="272" textAnchor="middle" fill="#2980ff" fontSize="6" opacity="0.8" fontWeight="bold">TCCS</text>
          <circle cx="-6"  cy="268" r="4" fill="#1a2a3e" opacity="0.25"/>
          <circle cx="-14" cy="262" r="5" fill="#1a2a3e" opacity="0.15"/>
          <circle cx="-22" cy="256" r="6" fill="#1a2a3e" opacity="0.08"/>
        </g>

        {/* Second truck */}
        <g className="truck-anim-slow" opacity="0.4">
          <rect x="5"  y="268" width="36" height="16" rx="2" fill="#0d1a3e"/>
          <rect x="0"  y="260" width="28" height="24" rx="1" fill="#162247" stroke="#2a3a6e" strokeWidth="0.5"/>
          <rect x="30" y="270" width="9"  height="8"  rx="1" fill="#0066ff" opacity="0.4"/>
          <circle cx="9"  cy="284" r="5" fill="#0a0a14" stroke="#2a3a6e" strokeWidth="1"/>
          <circle cx="32" cy="284" r="5" fill="#0a0a14" stroke="#2a3a6e" strokeWidth="1"/>
        </g>

        <rect x="0" y="348" width="500" height="5" fill="#050a14" opacity="0.8"/>
        <text x="250" y="100" textAnchor="middle" fill="white" fontSize="36" fontWeight="900" opacity="0.06" letterSpacing="8">TCCS</text>
        <text x="250" y="120" textAnchor="middle" fill="white" fontSize="10" opacity="0.12" letterSpacing="3">TRANSPORT SYSTEM</text>
        <line x1="0" y1="293" x2="500" y2="293" stroke="#0066ff" strokeWidth="0.5" opacity="0.3"/>
        <line x1="0" y1="347" x2="500" y2="347" stroke="#0066ff" strokeWidth="0.5" opacity="0.3"/>
      </svg>

      <div className="absolute bottom-8 left-0 right-0 text-center px-8">
        <div className="text-white text-2xl font-black tracking-widest opacity-80">TCCS</div>
        <div className="text-blue-400 text-xs tracking-widest mt-1 opacity-60 uppercase">Transport Company Computerisation System</div>
      </div>
    </div>
  )
}

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) { setError('Please enter username and password'); return }
    setLoading(true)
    setError('')
    try {
      await login({ username: username.trim(), password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillCredentials = (creds) => {
    setUsername(creds.username)
    setPassword(creds.password)
    setError('')
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#050a14' }}>
      {/* Left panel - animated scene (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] relative" style={{ animation: 'slideInLeft 0.6s ease-out' }}>
        <AnimatedScene />
      </div>

      {/* Right panel - login form */}
      <div
        className="flex-1 lg:w-[45%] flex flex-col items-center justify-center px-6 py-12 relative overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #070d1c 0%, #0a1020 100%)',
          borderLeft: '1px solid rgba(0,102,255,0.1)',
          animation: 'slideInRight 0.6s ease-out',
        }}
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-electric-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-violet-500/4 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0066ff, #2980ff)',
                  boxShadow: '0 0 30px rgba(0,102,255,0.5), 0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                <Truck size={28} className="text-white" />
              </div>
            </div>
            <h1
              className="text-3xl font-black tracking-tight bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #ffffff, #93c5fd)' }}
            >
              TCCS
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">Transport Company Computerisation System</p>
          </div>

          {/* Login form card */}
          <div
            className="rounded-2xl p-7"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(0,102,255,0.25)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(0,102,255,0.08)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <h2 className="text-xl font-bold text-white mb-6">Sign In</h2>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Enter your username"
                  autoFocus
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-electric-500 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-400 cursor-pointer">Remember me</label>
              </div>
              <button
                type="submit"
                className="btn-primary w-full justify-center py-3 text-base mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm text-gray-500 mt-5">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-electric-400 hover:text-electric-300 font-medium transition-colors"
              >
                Request Access
              </Link>
            </p>
          </div>

          {/* Quick fill section */}
          <div className="mt-5">
            <p className="text-center text-xs text-gray-600 mb-3">Quick login for demo</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_CREDENTIALS.map(cred => {
                const Icon = cred.icon
                return (
                  <button
                    key={cred.role}
                    onClick={() => fillCredentials(cred)}
                    className="glass-card p-3 text-left hover:bg-white/8 transition-all group border border-white/10 hover:border-white/20 rounded-lg"
                  >
                    <Icon size={14} className={`${cred.color} mb-1.5`} />
                    <div className="text-xs font-medium text-white truncate">{cred.role.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{cred.username}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
