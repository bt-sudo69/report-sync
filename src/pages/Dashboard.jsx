import { Routes, Route } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import UploadZone from '../components/UploadZone'
import ReportViewer from '../components/ReportViewer'
import AIBot from '../components/AIBot'
import {
  BarChart3,
  Upload,
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Settings,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

function DashboardHome() {
  const stats = [
    { label: 'Total Reports', value: '12', icon: FileText, change: '+2' },
    { label: 'Data Imports', value: '48', icon: Upload, change: '+5' },
    { label: 'Active Users', value: '6', icon: Users, change: '+1' },
    { label: 'Avg Response', value: '1.2s', icon: Activity, change: '-0.3s' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <s.icon className="h-5 w-5 text-gray-400" />
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  s.change.startsWith('+')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {s.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Reports</h2>
          <div className="text-center py-12 text-gray-400">
            <BarChart3 className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">Upload your first data file to generate a report.</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Upload</h2>
          <UploadZone onFile={() => toast.success('File ready for processing')} />
        </div>
      </div>
    </div>
  )
}

function UploadPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Upload Data</h1>
      <UploadZone onFile={() => toast.success('File uploaded')} />
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Recent Imports</h2>
        <p className="text-gray-400 text-sm text-center py-8">
          No imports yet. Drag & drop a file above to get started.
        </p>
      </div>
    </div>
  )
}

function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      <ReportViewer report={null} />
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your Company Ltd"
            aria-label="Company name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Currency
          </label>
          <select
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Default currency"
          >
            <option>GBP (£)</option>
            <option>USD ($)</option>
            <option>EUR (€)</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}