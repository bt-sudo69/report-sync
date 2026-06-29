import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Upload,
  Settings,
  BarChart3,
} from 'lucide-react'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/upload', label: 'Upload Data', icon: Upload },
  { to: '/dashboard/reports', label: 'Reports', icon: FileText },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <span className="font-semibold text-gray-900">GetReportSync</span>
        </div>
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}