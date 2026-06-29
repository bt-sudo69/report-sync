import { Link } from 'react-router-dom'
import {
  BarChart3,
  Upload,
  Bot,
  Share2,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

const features = [
  {
    icon: Upload,
    title: 'Upload Any Data',
    desc: 'CSV or Excel files — drag, drop, and we handle the rest.',
  },
  {
    icon: BarChart3,
    title: 'Auto-Generated Charts',
    desc: 'Beautiful visualisations from your raw data in seconds.',
  },
  {
    icon: Bot,
    title: 'AI-Powered Insights',
    desc: 'Ask questions about your data and get instant answers.',
  },
  {
    icon: Share2,
    title: 'Shareable Reports',
    desc: 'Generate a public link and share your report with anyone.',
  },
]

const steps = [
  'Upload your CSV or Excel file',
  'AI reads and structures your data',
  'Charts and summaries are auto-generated',
  'Share the report or export as PDF',
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Turn Your Spreadsheets Into
            <span className="text-blue-200"> Beautiful Reports</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Upload sales data, track KPIs, and generate shareable AI-powered
            reports in minutes. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 inline-flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="border border-blue-300 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-500/20 inline-flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-gray-700 mt-2">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Start Generating Reports Today
          </h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">
            From raw data to a polished report in under a minute. Free to start,
            paid plans for power users.
          </p>
          <Link
            to="/signup"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 inline-flex items-center gap-2"
          >
            Create Your First Report
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} GetReportSync. All rights reserved.
      </footer>
    </div>
  )
}