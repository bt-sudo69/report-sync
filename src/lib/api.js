import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb-access-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sb-access-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * Upload a document to Supabase Storage and create a reports record.
 * @param {File} file - The file to upload
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<{ reportId: string, filePath: string }>}
 */
export async function uploadDocument(file, userId) {
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${userId}/${timestamp}-${safeName}`

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  // Detect document type from extension
  const ext = file.name.split('.').pop()?.toLowerCase()
  const typeMap = {
    xlsx: 'financial',
    csv: 'financial',
    pdf: 'general',
    docx: 'general',
    pptx: 'project',
  }
  const documentType = typeMap[ext] || 'general'

  // Create a reports record
  const { data: report, error: insertError } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      title: file.name.replace(/\.[^/.]+$/, ''),
      document_name: file.name,
      document_type: documentType,
      status: 'processing',
    })
    .select('id')
    .single()

  if (insertError) {
    // Cleanup the uploaded file
    await supabase.storage.from('documents').remove([filePath])
    throw new Error(`Database insert failed: ${insertError.message}`)
  }

  return { reportId: report.id, filePath }
}

/**
 * Trigger the AI processing pipeline for a report.
 * @param {string} reportId
 * @param {string} filePath
 * @returns {Promise<void>}
 */
export async function triggerProcessing(reportId, filePath) {
  const { error } = await api.post('/process-report', { reportId, filePath })
  if (error) throw new Error(`Processing trigger failed: ${error.message}`)
}

/**
 * Poll the reports table until processing is complete or errors.
 * @param {string} reportId
 * @param {(report: object) => void} onComplete - Called with the full report row when done
 * @param {(error: string) => void} onError - Called with error message if failed
 * @returns {() => void} - Call to stop polling
 */
export function pollReportStatus(reportId, onComplete, onError) {
  let stopped = false
  let attempts = 0
  const maxAttempts = 120 // 6 minutes at 3s interval

  const poll = async () => {
    if (stopped || attempts >= maxAttempts) {
      if (attempts >= maxAttempts) {
        onError?.('Processing timed out. Please try again.')
      }
      return
    }
    attempts++

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (error) {
      onError?.(error.message)
      return
    }

    if (data.status === 'complete') {
      onComplete?.(data)
    } else if (data.status === 'error') {
      onError?.(data.extracted_data?.error || 'Processing failed. Please try again.')
    } else {
      setTimeout(poll, 3000)
    }
  }

  poll()
  return () => {
    stopped = true
  }
}

export default api