import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { authAPI } from '../services/api'

function AnimatedScene() {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #050a14 0%, #0a0f1e 40%, #0d1530 100%)' }}>
      <style>{`
        .truck-anim-r  { animation: truckDriveR 8s linear infinite; }
        .truck-anim-slow-r { animation: truckDriveR 14s linear 5s infinite; }
        .road-line-r   { animation: roadMoveR 0.5s linear infinite; }
        .star-r1 { animation: starTwinkleR 2s ease-in-out 0s infinite; }
        .star-r2 { animation: starTwinkleR 2s ease-in-out 0.7s infinite; }
        .star-r3 { animation: starTwinkleR 2s ease-in-out 1.4s infinite; }
        .warehouse-glow-r { animation: warehousePulseR 3s ease-in-out infinite; }
        .belt-move-r { animation: beltScrollR 1s linear infinite; }
        .belt-pkg-r1 { animation: beltPkgR 4s linear 0s infinite; }
        .belt-pkg-r2 { animation: beltPkgR 4s linear 1.3s infinite; }
        .belt-pkg-r3 { animation: beltPkgR 4s linear 2.6s infinite; }
        .signal-blink-r { animation: signalBlinkR 1.8s ease-in-out infinite; }
        @keyframes truckDriveR  { 0% { transform: translateX(-260px); } 100% { transform: translateX(560px); } }
        @keyframes roadMoveR    { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -60; } }
        @keyframes starTwinkleR { 0%,100% { opacity: 0.2; } 50% { opacity: 1; } }
        @keyframes warehousePulseR { 0%,100% { opacity: 0.3; } 50% { opacity: 0.65; } }
        @keyframes beltScrollR  { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -20; } }
        @keyframes beltPkgR     { 0% { transform: translateX(0); opacity:1; } 80% { opacity:1; } 100% { transform: translateX(130px); opacity:0; } }
        @keyframes signalBlinkR { 0%,45%,100% { opacity:0.2; } 50%,95% { opacity:1; } }
      `}</style>

      <svg viewBox="0 0 500 400" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {[[40,30],[120,20],[200,50],[320,15],[420,35],[80,80],[260,40],[460,60],[160,65],[380,55]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="white" className={`star-r${(i%3)+1}`} opacity="0.5" />
        ))}

        <g className="warehouse-glow-r">
          <rect x="20" y="150" width="130" height="135" rx="2" fill="#0d1530" stroke="#1a2a5e" strokeWidth="1"/>
          <rect x="30" y="162" width="26" height="26" rx="1" fill="#0066ff" opacity="0.25"/>
          <rect x="66" y="162" width="26" height="26" rx="1" fill="#0066ff" opacity="0.18"/>
          <rect x="102" y="162" width="26" height="26" rx="1" fill="#0066ff" opacity="0.28"/>
          <rect x="30" y="198" width="26" height="22" rx="1" fill="#0066ff" opacity="0.12"/>
          <rect x="66" y="198" width="26" height="22" rx="1" fill="#0066ff" opacity="0.22"/>
          <rect x="102" y="198" width="26" height="22" rx="1" fill="#0066ff" opacity="0.1"/>
          <rect x="60" y="248" width="50" height="37" rx="1" fill="#050a14"/>
          <rect x="18" y="148" width="134" height="7" rx="1" fill="#1a2a5e"/>
          <text x="85" y="145" textAnchor="middle" fill="#2980ff" fontSize="8" opacity="0.65">WAREHOUSE</text>
          <circle cx="155" cy="165" r="5" fill="#22c55e" className="signal-blink-r"/>
        </g>

        <rect x="155" y="255" width="145" height="12" rx="2" fill="#0d1a3e" stroke="#1a2a5e" strokeWidth="1"/>
        {[162,177,192,207,222,237,252,267,282,292].map((x,i) => (
          <circle key={i} cx={x} cy="261" r="4" fill="#0a1228" stroke="#2a3a6e" strokeWidth="1"/>
        ))}
        <line x1="155" y1="258" x2="300" y2="258" stroke="#1a2a5e" strokeWidth="1.5" strokeDasharray="10 10" className="belt-move-r"/>
        <g className="belt-pkg-r1"><rect x="158" y="246" width="14" height="11" rx="2" fill="#f59e0b" opacity="0.9"/><line x1="158" y1="251" x2="172" y2="251" stroke="#fbbf24" strokeWidth="0.8" opacity="0.6"/><line x1="165" y1="246" x2="165" y2="257" stroke="#fbbf24" strokeWidth="0.8" opacity="0.6"/></g>
        <g className="belt-pkg-r2"><rect x="158" y="246" width="12" height="10" rx="2" fill="#8b5cf6" opacity="0.85"/><line x1="158" y1="251" x2="170" y2="251" stroke="#a78bfa" strokeWidth="0.8" opacity="0.6"/></g>
        <g className="belt-pkg-r3"><rect x="158" y="247" width="13" height="10" rx="2" fill="#0066ff" opacity="0.85"/><line x1="158" y1="252" x2="171" y2="252" stroke="#5599ff" strokeWidth="0.8" opacity="0.6"/><line x1="164" y1="247" x2="164" y2="257" stroke="#5599ff" strokeWidth="0.8" opacity="0.6"/></g>

        <rect x="330" y="175" width="42" height="105" rx="2" fill="#080e1c" stroke="#101a33" strokeWidth="0.5"/>
        <rect x="382" y="195" width="32" height="85"  rx="2" fill="#080e1c" stroke="#101a33" strokeWidth="0.5"/>
        <rect x="422" y="158" width="52" height="122" rx="2" fill="#080e1c" stroke="#101a33" strokeWidth="0.5"/>
        {[[338,190],[350,190],[362,190],[338,205],[350,205],[390,203],[402,203],[430,168],[442,168],[454,168],[430,183],[454,183]].map(([x,y],i) => (
          <rect key={i} x={x} y={y} width="5" height="5" rx="0.5" fill="#0066ff" opacity={0.1+(i%3)*0.08}/>
        ))}

        <rect x="0" y="290" width="500" height="60" fill="#0a0a14"/>
        <rect x="0" y="290" width="500" height="3" fill="#1a1a2e"/>
        <rect x="0" y="347" width="500" height="3" fill="#1a1a2e"/>
        <line x1="0" y1="320" x2="500" y2="320" stroke="#2a3a5e" strokeWidth="2" strokeDasharray="30 20" className="road-line-r"/>
        <ellipse cx="250" cy="290" rx="200" ry="15" fill="#0066ff" opacity="0.05"/>

        <g className="truck-anim-r">
          <rect x="10" y="258" width="72" height="32" rx="3" fill="#0d1a3e"/>
          <rect x="0"  y="245" width="56" height="45" rx="2" fill="#162247" stroke="#2a3a6e" strokeWidth="1"/>
          <line x1="16" y1="245" x2="16" y2="290" stroke="#1e3a6e" strokeWidth="1" opacity="0.4"/>
          <line x1="32" y1="245" x2="32" y2="290" stroke="#1e3a6e" strokeWidth="1" opacity="0.4"/>
          <line x1="48" y1="245" x2="48" y2="290" stroke="#1e3a6e" strokeWidth="1" opacity="0.4"/>
          <rect x="59" y="260" width="19" height="14" rx="2" fill="#0066ff" opacity="0.5"/>
          <rect x="79" y="272" width="6" height="4" rx="1" fill="#fbbf24"/>
          <circle cx="18" cy="292" r="9" fill="#0a0a14" stroke="#2a3a6e" strokeWidth="2"/>
          <circle cx="18" cy="292" r="4" fill="#1a2a4e"/>
          <circle cx="64" cy="292" r="9" fill="#0a0a14" stroke="#2a3a6e" strokeWidth="2"/>
          <circle cx="64" cy="292" r="4" fill="#1a2a4e"/>
          <text x="28" y="272" textAnchor="middle" fill="#2980ff" fontSize="6" opacity="0.8" fontWeight="bold">TCCS</text>
        </g>

        <g className="truck-anim-slow-r" opacity="0.4">
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

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    branchLocation: '',
    rolePreference: 'BranchOperator',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required'
    if (!form.username.trim()) return 'Username is required'
    if (form.username.trim().length < 3) return 'Username must be at least 3 characters'
    if (!form.password) return 'Password is required'
    if (form.password.length < 8) return 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')
    try {
      await authAPI.register({
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
        branchLocation: form.branchLocation.trim() || undefined,
        rolePreference: form.rolePreference,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex overflow-hidden" style={{ background: '#050a14' }}>
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-[55%] relative">
          <AnimatedScene />
        </div>
        {/* Right panel - success state */}
        <div
          className="flex-1 lg:w-[45%] flex flex-col items-center justify-center px-6 py-12 relative"
          style={{
            background: 'linear-gradient(180deg, #070d1c 0%, #0a1020 100%)',
            borderLeft: '1px solid rgba(0,102,255,0.1)',
          }}
        >
          <div className="relative z-10 w-full max-w-sm text-center">
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(34,197,94,0.1)',
                  border: '2px solid rgba(34,197,94,0.4)',
                  boxShadow: '0 0 30px rgba(34,197,94,0.2)',
                }}
              >
                <CheckCircle size={40} className="text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Registration Submitted!</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              Your registration request has been received.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              An administrator will review your request and activate your account within <span className="text-amber-400 font-medium">24 hours</span>.
            </p>
            <div
              className="rounded-xl p-4 mb-8 text-left"
              style={{
                background: 'rgba(0,102,255,0.05)',
                border: '1px solid rgba(0,102,255,0.2)',
              }}
            >
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Submitted Details</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name</span>
                  <span className="text-white font-medium">{form.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Username</span>
                  <span className="text-electric-400 font-mono">{form.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Role</span>
                  <span className="text-white">{form.rolePreference.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
                {form.branchLocation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Branch</span>
                    <span className="text-white">{form.branchLocation}</span>
                  </div>
                )}
              </div>
            </div>
            <Link
              to="/login"
              className="btn-primary w-full justify-center py-3"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#050a14' }}>
      {/* Left panel - animated scene (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] relative" style={{ animation: 'slideInLeft 0.6s ease-out' }}>
        <AnimatedScene />
      </div>

      {/* Right panel - registration form */}
      <div
        className="flex-1 lg:w-[45%] flex flex-col items-center justify-center px-6 py-8 relative overflow-y-auto"
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

        <div className="relative z-10 w-full max-w-sm py-4">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0066ff, #2980ff)',
                  boxShadow: '0 0 25px rgba(0,102,255,0.5), 0 4px 12px rgba(0,0,0,0.4)',
                }}
              >
                <Truck size={24} className="text-white" />
              </div>
            </div>
            <h1
              className="text-2xl font-black tracking-tight bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #ffffff, #93c5fd)' }}
            >
              Request Access
            </h1>
            <p className="text-gray-500 text-xs mt-1">TCCS — Transport Company Computerisation System</p>
          </div>

          {/* Registration form card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(0,102,255,0.25)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(0,102,255,0.08)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <h2 className="text-lg font-bold text-white mb-5">Create Account</h2>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John Smith"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {/* Username */}
              <div>
                <label className="label">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="johnsmith"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field pr-10"
                    placeholder="Min 8 characters"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="input-field pr-10"
                    placeholder="Re-enter password"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length > 0 && (
                  <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle size={11} /> Passwords match
                  </p>
                )}
              </div>

              {/* Role Preference */}
              <div>
                <label className="label">Role Preference *</label>
                <select
                  name="rolePreference"
                  value={form.rolePreference}
                  onChange={handleChange}
                  className="select-field"
                  disabled={loading}
                >
                  <option value="BranchOperator">Branch Operator</option>
                  <option value="TransportManager">Transport Manager</option>
                </select>
              </div>

              {/* Branch Location */}
              <div>
                <label className="label">Branch Location <span className="text-gray-600 font-normal">(optional)</span></label>
                <input
                  type="text"
                  name="branchLocation"
                  value={form.branchLocation}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Mumbai, Delhi, Chennai"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center py-3 text-sm mt-1"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : 'Submit Registration Request'}
              </button>
            </form>

            {/* Back to Login */}
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-electric-400 hover:text-electric-300 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Note about approval */}
          <p className="text-center text-xs text-gray-600 mt-4 leading-relaxed">
            All accounts require administrator approval before access is granted.
          </p>
        </div>
      </div>
    </div>
  )
}
