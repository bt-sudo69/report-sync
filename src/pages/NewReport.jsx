import { useState, useCallback, useRef, useEffect, createElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../context/AuthContext'
import { uploadDocument, triggerProcessing, pollReportStatus } from '../lib/api'
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
  '.pdf',
  '.xlsx',
  '.xls',
  '.docx',
  '.doc',
  '.csv',
  '.pptx',
  '.ppt',
]
const maxSize = 50 * 1024 * 1024 // 50 MB

/* ---------- processing states ---------- */

const PROCESS_STEPS = [
  { key: 'uploading', label: 'Uploading your document...', icon: Loader2 },
  { key: 'reading', label: 'Reading your document...', icon: Loader2 },
  { key: 'extracting', label: 'Identifying key data...', icon: Loader2 },
  { key: 'building', label: 'Building your charts...', icon: Loader2 },
  { key: 'writing', label: 'Writing your executive summary...', icon: Loader2 },
  { key: 'complete', label: 'Your report is ready!', icon: CheckCircle2 },
]

/* ---------- component ---------- */

export default function NewReport() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [stepIndex, setStepIndex] = useState(-1) // -1 = before upload
  const [reportId, setReportId] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const stopPoll = useRef(null)

  // Cleanup polling on unmount
  useEffect(() => () => stopPoll.current?.(), [])

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
    setStepIndex(0) // uploading
    setErrorMessage(null)

    try {
      // State 1: Uploading
      const { reportId: rid, filePath } = await uploadDocument(file, user.id)
      setReportId(rid)

      setStepIndex(1) // reading

      // Trigger AI processing
      await triggerProcessing(rid, filePath)

      setStepIndex(2) // extracting

      // Animate through remaining steps, then start polling
      setTimeout(() => setStepIndex(3), 800)  // building
      setTimeout(() => setStepIndex(4), 1600) // writing

      // Start polling — on complete jump to step 5
      stopPoll.current = pollReportStatus(
        rid,
        (report) => {
          setStepIndex(5) // complete
        },
        (err) => {
          setErrorMessage(err || 'Processing failed. Please try again.')
          setStepIndex(-1)
        }
      )
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
      setStepIndex(-1)
    }
  }

  const handleRetry = () => {
    setErrorMessage(null)
    setStepIndex(0)
    if (reportId) {
      handleGenerate()
    }
  }

  /* ---------- render ---------- */

  const isProcessing = stepIndex >= 0 && stepIndex < 5
  const isComplete = stepIndex === 5

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
        {errorMessage && (
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

        {/* ----- Step 6: Complete ----- */}
        {isComplete && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#0D0D0D] mb-2">
              Your report is ready!
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Open it now or go back to your dashboard.
            </p>
            <button
              onClick={() => navigate(`/report/${reportId}`)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FileText className="h-5 w-5" />
              View Report
            </button>
          </div>
        )}

        {/* ----- Processing states (1-5) ----- */}
        {isProcessing && (
          <div className="space-y-6 py-16">
            {PROCESS_STEPS.slice(0, 5).map((step, i) => {
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
        {stepIndex === -1 && !isComplete && (
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

              {/* Accepted formats */}
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

            {/* File size note */}
            {!file && (
              <p className="text-center text-xs text-gray-400 mt-3">
                Accepted formats: PDF, XLSX, DOCX, CSV, PPTX &middot; Up to 50 MB
              </p>
            )}

            {/* File error */}
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
                  {isProcessing ? 'Processing...' : 'Generate Report'}
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