import { useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import ReportViewer from '../components/ReportViewer'

export default function SharedReport() {
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared report banner */}
      <div className="bg-blue-600 text-white text-center py-3 text-sm">
        Shared report by GetReportSync —{' '}
        <a
          href="/"
          className="underline hover:no-underline"
        >
          Create your own
        </a>
      </div>
      <div className="max-w-4xl mx-auto p-6">
        <ReportViewer
          report={{
            title: `Shared Report #${id}`,
            summary: 'This report was shared with you via a public link.',
            charts: [],
            data: [],
          }}
        />
      </div>
    </div>
  )
}