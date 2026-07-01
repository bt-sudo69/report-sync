import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { triggerProcessing } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import ShareModal from '../components/ShareModal'
import {
  ArrowLeft,
  Share2,
  FileDown,
  Presentation,
  AlertCircle,
  RotateCcw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

/* ───── chart colour palette ───── */
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

/* ───── helpers ───── */
function formatDate(raw) {
  if (!raw) return ''
  const d = new Date(raw)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/* ───── chart renderer ───── */
function ChartCard({ chart, index }) {
  const chartData = chart.data
  const datasets = chartData?.datasets || []
  const labels = chartData?.labels || []

  // Build data array in the shape Recharts expects: [{ name, ...series }]
  const data = labels.map((label, i) => {
    const point = { name: label }
    datasets.forEach((ds) => {
      point[ds.label] = ds.data[i]
    })
    return point
  })

  const renderChart = () => {
    switch (chart.type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <RechartTooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {datasets.map((ds, j) => (
              <Line
                key={ds.label}
                type="monotone"
                dataKey={ds.label}
                stroke={COLORS[j % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS[j % COLORS.length] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <RechartTooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {datasets.map((ds, j) => (
              <Bar
                key={ds.label}
                dataKey={ds.label}
                fill={COLORS[j % COLORS.length]}
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            ))}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              {datasets.map((ds, j) => (
                <linearGradient
                  key={ds.label}
                  id={`gradient-${index}-${j}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={COLORS[j % COLORS.length]}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={COLORS[j % COLORS.length]}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <RechartTooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {datasets.map((ds, j) => (
              <Area
                key={ds.label}
                type="monotone"
                dataKey={ds.label}
                stroke={COLORS[j % COLORS.length]}
                strokeWidth={2}
                fill={`url(#gradient-${index}-${j})`}
              />
            ))}
          </AreaChart>
        )

      case 'doughnut':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={datasets[0]?.label || 'value'}
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((_, j) => (
                <Cell
                  key={j}
                  fill={COLORS[j % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <RechartTooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              layout="vertical"
              align="right"
              verticalAlign="middle"
            />
          </PieChart>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">
        {chart.title}
      </h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      {chart.insight && (
        <p className="mt-3 text-xs text-gray-400 italic leading-relaxed">
          {chart.insight}
        </p>
      )}
    </div>
  )
}

/* ───── KPI card ───── */
function KpiCard({ kpi }) {
  const TrendIcon =
    kpi.trend === 'up'
      ? TrendingUp
      : kpi.trend === 'down'
        ? TrendingDown
        : Minus
  const trendColor =
    kpi.trend === 'up'
      ? 'text-green-600'
      : kpi.trend === 'down'
        ? 'text-red-500'
        : 'text-gray-400'

  return (
    <div className="shrink-0 w-[200px] bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-3xl font-bold text-[#0D0D0D] truncate">
        {kpi.value}
      </p>
      <p className="text-sm text-gray-400 mt-1 truncate">{kpi.label}</p>
      {kpi.change_pct != null && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>
            {kpi.change_pct > 0 ? '+' : ''}
            {kpi.change_pct}%
          </span>
        </div>
      )}
    </div>
  )
}

/* ───── skeleton loader ───── */
function SkeletonReport() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Top bar skeleton */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            <div>
              <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-6 w-64 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-24 h-9 bg-gray-200 rounded-lg" />
            <div className="w-24 h-9 bg-gray-200 rounded-lg" />
            <div className="w-28 h-9 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="max-w-[1120px] mx-auto px-8 py-8 space-y-8">
        {/* KPI row skeleton */}
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="shrink-0 w-[200px] bg-gray-100 rounded-xl p-5 space-y-3"
            >
              <div className="h-8 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Summary skeleton */}
        <div className="bg-gray-100 rounded-xl p-6 space-y-2">
          <div className="h-3 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 rounded" />
          <div className="h-4 w-4/6 bg-gray-200 rounded" />
        </div>

        {/* Charts grid skeleton */}
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="bg-gray-100 rounded-xl p-5 space-y-4">
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="h-[200px] bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ───── main component ───── */
export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingPptx, setExportingPptx] = useState(false)
  const pollTimer = useRef(null)

  /* ───── fetch report ───── */
  const fetchReport = useCallback(
    async (isPoll = false) => {
      if (!user || !id) return

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (!isPoll) {
          toast.error('Report not found')
          navigate('/dashboard')
        }
        return
      }

      setReport(data)
      setLoading(false)

      // Keep polling if still processing
      if (data.status === 'processing') {
        setPolling(true)
        pollTimer.current = setTimeout(() => fetchReport(true), 3000)
      } else {
        setPolling(false)
      }
    },
    [id, user, navigate]
  )

  useEffect(() => {
    fetchReport()
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current)
    }
  }, [fetchReport])

  /* ───── retry processing ───── */
  const handleRetry = async () => {
    if (!report) return
    toast.loading('Restarting processing...')

    // Get the file path from the report (stored at upload time)
    const filePath = report.file_path
    if (!filePath) {
      toast.dismiss()
      toast.error('Cannot retry — file path not found. Please re-upload the document.')
      return
    }

    try {
      // Update status and re-trigger the actual pipeline
      await supabase
        .from('reports')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', id)

      setReport((prev) => ({ ...prev, status: 'processing', extracted_data: null }))
      setPolling(true)

      // Re-trigger the pipeline (this calls /api/process-report which calls /api/run-pipeline)
      await triggerProcessing(id, filePath)

      toast.dismiss()
      toast.success('Processing restarted!')
      fetchReport(true)
    } catch (err) {
      toast.dismiss()
      toast.error('Failed to restart: ' + (err.message || 'Unknown error'))
    }
  }

  /* ───── share ───── */
  const handleShare = () => {
    setShareModalOpen(true)
  }

  /* ───── export ───── */
  const handleExport = async (format) => {
    const setLoading = format === 'pdf' ? setExportingPdf : setExportingPptx
    setLoading(true)
    try {
      const response = await fetch(`/api/export-${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report?.id, userId: user?.id })
      })
      const data = await response.json()
      if (response.ok && data.signedUrl) {
        window.open(data.signedUrl, '_blank')
        toast.success(`${format.toUpperCase()} exported!`)
      } else {
        toast.error(data.error || `Failed to export ${format.toUpperCase()}`)
      }
    } catch (err) {
      toast.error(`Export failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  /* ───── parse report data ───── */
  const kpis = report?.kpis || []
  const charts = report?.charts || []
  const keyFindings = report?.extracted_data?.key_findings || []
  const executiveSummary = report?.executive_summary || ''
  const status = report?.status || 'processing'

  /* ───── loading state ───── */
  if (loading) return <SkeletonReport />

  /* ───── error state ───── */
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#0D0D0D] mb-2">
            Processing Failed
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            {report?.extracted_data?.error ||
              'Something went wrong while processing your document. Please try again.'}
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Retry Processing
          </button>
        </div>
      </div>
    )
  }

  /* ───── main render ───── */
  return (
    <div className="min-h-screen bg-white">
      {/* ═══ Top bar ═══ */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="max-w-[1120px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: breadcrumb + title */}
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Back to reports"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="min-w-0">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Reports
                </button>
                <h1 className="text-lg font-bold text-[#0D0D0D] truncate">
                  {report?.title || 'Untitled Report'}
                </h1>
              </div>
            </div>

            {/* Right: badges + actions */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Status badge */}
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                  status === 'complete'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    status === 'complete' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
                  }`}
                />
                {status === 'complete' ? 'Complete' : 'Processing'}
              </span>

              {/* Export PDF */}
              <button
                onClick={() => handleExport('pdf')}
                disabled={exportingPdf}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {exportingPdf ? 'Generating...' : 'PDF'}
              </button>

              {/* Export PPTX */}
              <button
                onClick={() => handleExport('pptx')}
                disabled={exportingPptx}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingPptx ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Presentation className="h-4 w-4" />
                )}
                {exportingPptx ? 'Generating...' : 'PPTX'}
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Body ═══ */}
      <div className="max-w-[1120px] mx-auto px-8 py-8 space-y-8">
        {/* ── Date ── */}
        {report?.created_at && (
          <p className="text-xs text-gray-400 -mb-4">
            Generated {formatDate(report.created_at)}
          </p>
        )}

        {/* ══════ Section 1: KPI Hero Row ══════ */}
        {kpis.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
            {kpis.map((kpi, i) => (
              <KpiCard key={i} kpi={kpi} />
            ))}
          </div>
        )}

        {/* ══════ Section 2: Executive Summary ══════ */}
        {executiveSummary && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-blue-500">
            <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-3">
              Executive Summary
            </p>
            <div className="text-base text-[#0D0D0D] leading-relaxed space-y-3 whitespace-pre-line">
              {executiveSummary}
            </div>
          </div>
        )}

        {/* ══════ Section 3: Charts Grid ══════ */}
        {charts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {charts.map((chart, i) => (
              <ChartCard key={i} chart={chart} index={i} />
            ))}
          </div>
        )}

        {/* ══════ Section 4: Key Findings ══════ */}
        {keyFindings.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-[#0D0D0D] mb-4">
              Key Findings
            </h2>
            <ul className="space-y-3">
              {keyFindings.map((finding, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    {finding}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Empty state: no data yet ── */}
        {status === 'processing' && charts.length === 0 && (
          <div className="text-center py-16">
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
              <div className="h-3 w-3 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Processing your document…</span>
            </div>
            <p className="text-xs text-gray-400">
              This page will update automatically when your report is ready.
            </p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        reportId={report?.id}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  )
}