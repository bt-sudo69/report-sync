import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useReport(reportId) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!reportId) {
      setLoading(false)
      return
    }

    async function fetchReport() {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single()

        if (error) throw error
        setReport(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [reportId])

  return { report, loading, error }
}