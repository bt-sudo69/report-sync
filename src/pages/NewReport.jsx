import { useState, useCallback, useRef, useEffect, createElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { uploadDocument } from '../lib/api'
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'

/* ---------- helpers ---------- */

const fileIcon = (name) => {
  const ext = name?.split('.').pop()?.toLowerCase()
  if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet
  if (['pdf'].includes(ext)) return FileText
  if (['docx', 'doc'].includes(ext)) return FileText
  if (['pptx', 'ppt'].includes(ext)) return FileImage
  return File
}

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const acceptedFormats = [
  '.pdf', '.xlsx', '.xls', '.docx', '.doc', '.csv', '.pptx', '.ppt',
]
const maxSize = 50 * 1024 * 1024 // 50 MB

/* ---------- processing states ---------- */

const PROCESS_STEPS = [
  { key: 'uploading', label: 'Uploading your document...', icon: Loader2 },
  { key: 'reading', label: 'Reading your document...', icon: Loader2 },
  { key: 'extracting', label: 'Identifying key data...', icon: Loader2 },
  { key: 'building', label: 'Building your charts...', icon: Loader2 },
  { key: 'writing', label: 'Writing your executive summary...', icon: Loader2 },
]

/* ---------- processing status enum ---------- */
const STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  ERROR: 'error',
  COMPLETE: 'complete',
}

/* ---------- component ---------- */

export default function NewReport() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [status, setStatus] = useState(STATUS.IDLE)
  const [stepIndex, setStepIndex] = useState(0)
  const [reportId, setReportId] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  /* ---- file validation ---- */
  const onDrop = useCallback((accepted, rejected) => {
    setFileError(null)
    setErrorMessage(null)
    if (rejected.length) {
      const err = rejected[0].errors[0]
      if (err.code === 'file-too-large') {
        setFileError('File exceeds the 50 MB limit.')
      } else if (err.code === 'file-invalid-type') {
        setFileError('Unsupported file type. Accepted: PDF, XLSX, DOCX, CSV, PPTX')
      } else {
        setFileError(err.message)
      }
      return
    }
    if (accepted.length) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, f) => ({ ...acc, [f]: [] }), {}),
    maxSize,
    multiple: false,
  })

  /* ---- upload & process ---- */
  const handleGenerate = async () => {
    if (!file || !user) return
    setStatus(STATUS.UPLOADING)
    setStepIndex(0)
    setErrorMessage(null)

    try {
      // State 0: Uploading
      const { reportId: rid, filePath } = await uploadDocument(file, user.id)
      setReportId(rid)
      setStatus(STATUS.PROCESSING)
      setStepIndex(1)

      // Fire AI processing — don't await, let it run in background
      fetch('/api/process-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: rid, filePath }),
      }).catch(() => {})

      // Animate steps through 2-4 while processing
      setStepIndex(2) // extracting
      setTimeout(() => setStepIndex(3), 3000)  // building
      setTimeout(() => setStepIndex(4), 6000) // writing
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
      setStatus(STATUS.IDLE)
      setStepIndex(-1)
    }
  }

  /* ---- realtime polling — auto-redirect on complete ---- */
  useEffect(() => {
    if (!reportId || status !== STATUS.PROCESSING) return

    let stopped = false
    let pollTimer, timeoutTimer

    // 1. Immediate check (in case already complete)
    const checkImmediate = async () => {
      const { data } = await supabase
        .from('reports')
        .select('id, status, extracted_data')
        .eq('id', reportId)
        .single()

      if (stopped) return

      if (data?.status === 'complete') {
        navigate(`/report/${reportId}`, { replace: true })
        return
      }
      if (data?.status === 'error') {
        setErrorMessage(data.extracted_data?.error || 'Processing failed. Please try again.')
        setStatus(STATUS.ERROR)
        return
      }
    }
    checkImmediate()

    // 2. Supabase realtime subscription
    const channel = supabase
      .channel(`report-${reportId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports',
          filter: `id=eq.${reportId}`,
        },
        (payload) => {
          if (stopped) return
          if (payload.new.status === 'complete') {
            navigate(`/report/${reportId}`, { replace: true })
          }
          if (payload.new.status === 'error') {
            setErrorMessage(
              payload.new.extracted_data?.error || 'Processing failed. Please try again.'
            )
            setStatus(STATUS.ERROR)
          }
        }
      )
      .subscribe()

    // 3. Fallback polling every 4s
    const startPoll = () => {
      pollTimer = setInterval(async () => {
        if (stopped) return
        const { data } = await supabase
          .from('reports')
          .select('id, status, extracted_data')
          .eq('id', reportId)
          .single()

        if (data?.status === 'complete') {
          clearInterval(pollTimer)
          navigate(`/report/${reportId}`, { replace: true })
        } else if (data?.status === 'error') {
          clearInterval(pollTimer)
          setErrorMessage(data.extracted_data?.error || 'Processing failed.')
          setStatus(STATUS.ERROR)
        }
      }, 4000)
    }
    startPoll()

    // 4. Safety timeout — 3 minutes max
    timeoutTimer = setTimeout(() => {
      stopped = true
      clearInterval(pollTimer)
      supabase.removeChannel(channel)
      setErrorMessage('This is taking longer than expected. Please check your reports page.')
      setStatus(STATUS.ERROR)
    }, 180000)

    return () => {
      stopped = true
      clearInterval(pollTimer)
      clearTimeout(timeoutTimer)
      supabase.removeChannel(channel)
    }
  }, [reportId, status, navigate])

  const handleRetry = () => {
    setErrorMessage(null)
    setFile(null)
    setReportId(null)
    setStatus(STATUS.IDLE)
    setStepIndex(-1)
  }

  /* ---------- render ---------- */

  const isProcessing = status === STATUS.PROCESSING || status === STATUS.UPLOADING
  const isComplete = status === STATUS.COMPLETE
  const isError = status === STATUS.ERROR

  return (
    <div className="min-h-screen bg-[#F8F7F3]">
      {/* Top bar */}
      <div className="sticky top-0 bg-[#F8F7F3] z-10 border-b border-gray-200">
        <div className="max-w-[560px] mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-[#0D0D0D]">New Report</h1>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[560px] mx-auto px-4 py-12">
        {/* ----- Error banner ----- */}
        {isError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Upload failed</p>
              <p className="text-sm text-red-600 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-800 shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* ----- Processing states ----- */}
        {isProcessing && (
          <div className="space-y-6 py-16">
            {PROCESS_STEPS.map((step, i) => {
              const active = i === stepIndex
              const done = i < stepIndex
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-4 px-6 py-4 rounded-xl border transition-all ${
                    active
                      ? 'border-blue-200 bg-blue-50'
                      : done
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white opacity-40'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                  ) : active ? (
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        active
                          ? 'text-blue-800'
                          : done
                          ? 'text-green-800'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {active && (
                      <p className="text-xs text-blue-500 mt-0.5">
                        Please wait, this may take a moment...
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ----- Before upload: upload zone ----- */}
        {status === STATUS.IDLE && (
          <>
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : fileError
                  ? 'border-red-300 bg-red-50'
                  : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud
                className={`h-12 w-12 mx-auto mb-4 ${
                  isDragActive ? 'text-blue-600' : 'text-blue-400'
                }`}
              />
              <p className="text-lg font-semibold text-[#0D0D0D] mb-1">
                Drop your document here
              </p>
              <p className="text-sm text-gray-400">or click to browse</p>

              {!file && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {['PDF', 'XLSX', 'DOCX', 'CSV', 'PPTX'].map((fmt) => (
                    <span
                      key={fmt}
                      className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {!file && (
              <p className="text-center text-xs text-gray-400 mt-3">
                Accepted formats: PDF, XLSX, DOCX, CSV, PPTX &middot; Up to 50 MB
              </p>
            )}

            {fileError && (
              <p className="text-center text-sm text-red-600 mt-3">{fileError}</p>
            )}

            {/* ----- File preview ----- */}
            {file && (
              <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    {createElement(fileIcon(file.name), {
                      className: 'h-6 w-6 text-blue-600',
                    })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#0D0D0D] text-sm truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Generate Report
                </button>

                <button
                  onClick={() => {
                    setFile(null)
                    setFileError(null)
                  }}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3 transition-colors"
                >
                  Choose different file
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}