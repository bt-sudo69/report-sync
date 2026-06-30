import { FileText, Eye, Share2, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const typeColors = {
  financial: 'bg-emerald-100 text-emerald-700',
  sales: 'bg-blue-100 text-blue-700',
  marketing: 'bg-purple-100 text-purple-700',
  operational: 'bg-amber-100 text-amber-700',
  default: 'bg-gray-100 text-gray-700',
}

const statusColors = {
  completed: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  draft: 'bg-gray-100 text-gray-500',
  error: 'bg-red-100 text-red-700',
}

export default function ReportCard({ report }) {
  const typeClass = typeColors[report.report_type] || typeColors.default
  const statusClass = statusColors[report.status] || statusColors.draft
  const dateStr = report.created_at
    ? new Date(report.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group relative">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[#0D0D0D] text-sm truncate">
              {report.document_name || report.name || 'Untitled Report'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${typeClass}`}>
                {report.report_type || 'General'}
              </span>
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${statusClass}`}>
                {report.status || 'draft'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
        <Clock className="h-3.5 w-3.5" />
        {dateStr}
      </div>

      {/* Hover actions */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          to={`/report/${report.id}`}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View Report
        </Link>
        <button
          onClick={() => {
            const url = `${window.location.origin}/shared/${report.share_token || report.id}`
            navigator.clipboard?.writeText(url)
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
      </div>
    </div>
  )
}