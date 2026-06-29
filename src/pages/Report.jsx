import { useParams } from 'react-router-dom'
import { useReport } from '../hooks/useReport'
import ReportViewer from '../components/ReportViewer'
import AIBot from '../components/AIBot'
import { Loader2 } from 'lucide-react'

export default function Report() {
  const { id } = useParams()
  const { report, loading, error } = useReport(id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Error loading report: {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReportViewer report={report} />
          </div>
          <div>
            <AIBot />
          </div>
        </div>
      </div>
    </div>
  )
}