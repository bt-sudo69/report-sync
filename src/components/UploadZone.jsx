import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet } from 'lucide-react'

export default function UploadZone({ onFile }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length > 0) {
        onFile?.(accepted[0])
      }
    },
    [onFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} aria-label="Upload data file" />
      {isDragActive ? (
        <>
          <Upload className="h-10 w-10 text-blue-500 mx-auto mb-3" />
          <p className="text-blue-600 font-medium">Drop your file here…</p>
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            Drag & drop a CSV or Excel file here
          </p>
          <p className="text-gray-400 text-sm mt-1">
            or click to browse files
          </p>
        </>
      )}
    </div>
  )
}