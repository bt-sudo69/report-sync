import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import ReportCard from '../components/ReportCard'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setReports(data)
      }
      setLoading(false)
    }
    fetchReports()
  }, [user])

  return (
    <div className="flex min-h-screen bg-[#F8F7F3]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#F8F7F3] z-10 px-8 pt-8 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0D0D0D]">Your Reports</h1>
            <button
              onClick={() => navigate('/dashboard/new')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              New Report
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            /* Loading skeleton */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
                  <div className="flex gap-2">
                    <div className="h-7 bg-gray-100 rounded w-20" />
                    <div className="h-7 bg-gray-100 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Upload className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-[#0D0D0D] mb-2">
                Upload your first document
              </h2>
              <p className="text-gray-500 text-sm mb-8 max-w-sm">
                Get an executive report in under 2 minutes. Upload a CSV, Excel, or PDF file and let ReportSync do the rest.
              </p>
              <button
                onClick={() => navigate('/dashboard/new')}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Upload className="h-5 w-5" />
                Upload Document
              </button>
            </div>
          ) : (
            /* Report grid */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}