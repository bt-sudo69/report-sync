import { FileText, Download, Share2 } from 'lucide-react'
import { BarChartCard, PieChartCard, LineChartCard } from './Charts'

export default function ReportViewer({ report }) {
  if (!report) {
    return (
      <div className="text-center py-16 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Select a report to view it here.</p>
      </div>
    )
  }

  const { title, summary, charts = [], data } = report

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {summary && (
            <p className="text-gray-500 text-sm mt-1">{summary}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
            aria-label="Download report"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
            aria-label="Share report"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Data summary */}
      {data && data.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Data Preview
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {Object.keys(data[0]).map((key) => (
                    <th
                      key={key}
                      className="text-left px-3 py-2 text-gray-600 font-medium"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2 text-gray-800">
                        {String(val ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      {charts.map((chart, i) => {
        if (chart.type === 'bar') {
          return (
            <BarChartCard
              key={i}
              data={chart.data}
              xKey={chart.xKey}
              yKey={chart.yKey}
              title={chart.title}
            />
          )
        }
        if (chart.type === 'pie') {
          return (
            <PieChartCard
              key={i}
              data={chart.data}
              nameKey={chart.nameKey}
              valueKey={chart.valueKey}
              title={chart.title}
            />
          )
        }
        if (chart.type === 'line') {
          return (
            <LineChartCard
              key={i}
              data={chart.data}
              xKey={chart.xKey}
              lines={chart.lines}
              title={chart.title}
            />
          )
        }
        return null
      })}
    </div>
  )
}