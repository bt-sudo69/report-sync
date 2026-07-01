import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Upload,
  Link2,
  Settings,
  Repeat2,
  LogOut,
  Settings2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/new-report', label: 'New Report', icon: Upload },
  { to: '/shared-links', label: 'Shared Links', icon: Link2 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [hoverUser, setHoverUser] = useState(false)

  const plan = profile?.plan || 'trial'
  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarLetter = displayName.charAt(0).toUpperCase()

  const planColors = {
    trial: 'bg-blue-100 text-blue-700',
    starter: 'bg-gray-100 text-gray-700',
    pro: 'bg-purple-100 text-purple-700',
    agency: 'bg-amber-100 text-amber-700',
    expired: 'bg-red-100 text-red-700',
  }

  const planBadgeColor = planColors[plan] || planColors.trial
  const planLabel = plan === 'trial' ? 'Free Trial' : plan.charAt(0).toUpperCase() + plan.slice(1)

  return (
    <aside className="w-60 bg-white border-r border-gray-200 min-h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Repeat2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-[#0D0D0D]">ReportSync</span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50 border-l-3 border-blue-600'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 px-4 py-4 space-y-3">
        {/* User profile — clickable to go to /settings */}
        <button
          onClick={() => navigate('/settings')}
          onMouseEnter={() => setHoverUser(true)}
          onMouseLeave={() => setHoverUser(false)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group relative"
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {avatarLetter}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-medium text-[#0D0D0D] truncate">
              {displayName}
            </p>
            <span
              className={`inline-block text-[11px] font-medium px-1.5 py-0.5 rounded-full ${planBadgeColor}`}
            >
              {planLabel}
            </span>
          </div>
          {/* Settings gear icon on hover */}
          <Settings2
            className={`h-4 w-4 text-gray-300 transition-opacity ${
              hoverUser ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </button>

        {/* Sign out */}
        <button
          onClick={() => {
            signOut()
            navigate('/login')
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
