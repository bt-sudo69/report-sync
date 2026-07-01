import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ───── FAQ Accordion Item ───── */
function FaqItem({ question, answer, open, onToggle }) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left text-gray-900 font-medium hover:text-blue-600 transition-colors"
      >
        <span>{question}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

/* ───── Star Rating ───── */
function Stars({ count = 5 }) {
  return (
    <span className="text-yellow-400" aria-label={`${count} stars`}>
      {'★'.repeat(count)}
    </span>
  )
}

/* ───── Main Landing ───── */
export default function Landing() {
  const [faqOpen, setFaqOpen] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const faqs = [
    {
      q: 'What file formats do you support?',
      a: 'We support PDF, Excel (.xlsx, .xls), CSV, Word (.docx), and PowerPoint (.pptx). Just upload your raw file and our AI handles the rest — no formatting needed.',
    },
    {
      q: 'How long does it take to generate a report?',
      a: 'Most reports are ready in 30–90 seconds. Larger documents with complex datasets may take up to 2 minutes. You\'ll see the report appear in real time as it\'s being built.',
    },
    {
      q: 'Can I export reports for presentations?',
      a: 'Yes. Every report can be exported to PDF (for email) or PowerPoint (with editable slides and charts). Exports are professionally formatted and ready to present.',
    },
    {
      q: 'Is my data secure?',
      a: 'Absolutely. All documents and generated reports are stored in encrypted cloud storage. We never share or sell your data. You can delete any report at any time.',
    },
    {
      q: 'Can my team view reports without logging in?',
      a: 'Yes. Shared reports are accessible via a unique link — anyone you send it to can view the report, see live charts, and even ask the AI questions without creating an account.',
    },
    {
      q: 'What happens after the free trial?',
      a: 'Your 7-day trial gives you full access to all features. When it ends, you can choose a plan that fits your needs, or your reports stay accessible in read-only mode.',
    },
  ]

  /* smooth scroll helper */
  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="font-sans bg-white text-gray-900 antialiased">

      {/* ═══════════════════════════════ 1. NAV ═══════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-[#0A0F1E]/95 backdrop-blur-md shadow-lg'
            : 'bg-[#0A0F1E]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center space-x-2"
          >
            <span className="text-2xl font-bold text-white tracking-tight">
              ReportSync
            </span>
            <span className="text-blue-400 text-xl">⟳</span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollTo('features')}
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollTo('faq')}
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              FAQ
            </button>
            <Link
              to="/login"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors"
            >
              Start free trial
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button className="text-gray-300 hover:text-white p-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════ 2. HERO ═══════════════════════════════ */}
      <section className="bg-[#0A0F1E] min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Hero text */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                Stop spending your week<br />
                <span className="text-blue-400">building reports.</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Upload any document — financial data, sales reports, project updates — and get a professional executive report with charts, trends, and AI insights in under 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  to="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-all hover:shadow-xl hover:shadow-blue-600/25 w-full sm:w-auto text-center"
                >
                  Start free for 7 days
                </Link>
                <button
                  onClick={() => scrollTo('how-it-works')}
                  className="border border-gray-500 hover:border-blue-400 text-gray-200 hover:text-white font-medium px-8 py-4 rounded-lg text-lg transition-colors w-full sm:w-auto text-center"
                >
                  See how it works
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                ✓ No credit card required · Cancel anytime
              </p>
            </div>

            {/* Hero visual — animated demo window */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="bg-[#0D1425] border border-gray-700/50 rounded-xl overflow-hidden shadow-2xl shadow-blue-900/20">
                {/* Window chrome */}
                <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-700/50">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-gray-500 font-mono">Q3 Executive Report</span>
                </div>
                {/* Window content */}
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Title */}
                  <div className="h-3 bg-blue-400/20 rounded w-3/4 animate-pulse" />
                  <div className="h-2 bg-gray-600/30 rounded w-1/2 animate-pulse" />
                  {/* KPI cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {['Revenue', 'Profit', 'Customers', 'Growth'].map((label) => (
                      <div key={label} className="bg-[#111A2E] rounded-lg p-3 border border-gray-700/30">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</div>
                        <div className="text-sm font-bold text-white mt-1">£{['1.2M', '384K', '2,847', '+23%'][['Revenue', 'Profit', 'Customers', 'Growth'].indexOf(label)]}</div>
                        <div className={`text-[10px] mt-0.5 ${['Revenue', 'Profit', 'Customers', 'Growth'].indexOf(label) === 2 ? 'text-red-400' : 'text-green-400'}`}>
                          {['+12.5%', '+8.2%', '-3.1%', '+23%'][['Revenue', 'Profit', 'Customers', 'Growth'].indexOf(label)]} vs last period
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mini chart bar */}
                  <div className="flex items-end space-x-1 h-12">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  {/* Status line */}
                  <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span>AI analysis complete · Ready to share</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ 3. SOCIAL PROOF BAR ═══════════════════════════════ */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div>
              <div className="text-lg">
                <Stars count={5} />
              </div>
              <div className="text-xs text-gray-500 mt-1">4.9 from 200+ reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">500+</div>
              <div className="text-xs text-gray-500 mt-1">Businesses trust us</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">12K+</div>
              <div className="text-xs text-gray-500 mt-1">Hours saved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">&lt;2min</div>
              <div className="text-xs text-gray-500 mt-1">Avg. generation time</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-bold text-gray-900">8,200+</div>
              <div className="text-xs text-gray-500 mt-1">Reports this month</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ 4. PAIN SECTION ═══════════════════════════════ */}
      <section className="bg-[#0A0F1E] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white text-center mb-4">
            Sound familiar?
          </h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-12 text-lg">
            You're not alone — every week, business leaders waste hours wrestling with data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-3">😤</div>
              <h3 className="text-lg font-bold text-white mb-2">
                "Your reports take hours — or days"
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                You spend hours every week copy-pasting data into slides that nobody reads carefully.
                That's time you could spend actually running your business.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-bold text-white mb-2">
                "Raw data means nothing to leadership"
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                A spreadsheet isn't a strategy. Your CEO needs to see what the numbers mean —
                not 47 columns and a pivot table.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-3">📎</div>
              <h3 className="text-lg font-bold text-white mb-2">
                "Reports die in email attachments"
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                You send a PDF, someone downloads it, someone else never opens it.
                There's no single source of truth and no way to discuss the data together.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-3">💸</div>
              <h3 className="text-lg font-bold text-white mb-2">
                "Analysts cost a fortune"
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Hiring someone to build a monthly performance report costs £500–£2,000 per project.
                For most businesses, that's not sustainable every month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ 5. HOW IT WORKS ═══════════════════════════════ */}
      <section id="how-it-works" className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 text-center mb-4">
            Three steps. Under two minutes.
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-14 text-lg">
            From raw document to executive report — no spreadsheets required.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            {[
              {
                num: '01',
                emoji: '📤',
                title: 'Upload',
                desc: 'Drop in any document — PDF, Excel, Word, CSV or PowerPoint. We support all major formats.',
              },
              {
                num: '02',
                emoji: '🤖',
                title: 'Generate',
                desc: 'Our AI reads your data, extracts the key metrics, and builds a professional executive report automatically.',
              },
              {
                num: '03',
                emoji: '🔗',
                title: 'Share',
                desc: 'Share a live link with your team. Export to PDF or PowerPoint. Ask the AI anything about your data.',
              },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-full mb-4">
                  <span className="text-blue-600 text-2xl font-bold">{step.num}</span>
                </div>
                <div className="text-4xl mb-3">{step.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ 6. FEATURE ROWS ═══════════════════════════════ */}
      <section id="features" className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 text-center mb-4">
            Everything you need to report with confidence
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-14 text-lg">
            Built for the way modern teams work — live, collaborative, and instant.
          </p>

          {/* Feature Row 1 — Live Sharing */}
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mb-20">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                Live collaboration
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                Share a live link — your team joins instantly
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Generate a shareable link and send it to anyone. They click it, enter their name and role,
                and the report is live for them — no login, no download. See who's viewing in real time.
              </p>
            </div>
            <div className="flex-1 w-full max-w-md lg:max-w-none">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-sm font-semibold text-gray-700">getreportsync.com/shared/abc123</span>
                  </div>
                  <button className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors">
                    Copy link
                  </button>
                </div>
                {/* Viewer avatars */}
                <div className="flex -space-x-2 mb-3">
                  {['#3B82F6', '#10B981', '#F59E0B'].map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {['S', 'M', 'J'][i]}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                    +2
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span>● Sarah — viewing KPIs</span>
                  <span>● Marcus — asking AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Row 2 — AI Bot (reversed) */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-10 lg:gap-16 mb-20">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                AI analyst
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                Ask the AI anything about your data
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Every report has a built-in AI analyst. Ask 'What was our worst month?' or
                'Summarise the key risks' and get an instant answer grounded in your data alone.
              </p>
            </div>
            <div className="flex-1 w-full max-w-md lg:max-w-none">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">AI</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">Insight Bot</div>
                    <div className="text-xs text-green-500">● Online</div>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 max-w-[80%]">
                    What was our best performing product line this quarter?
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700 max-w-[85%] ml-auto">
                    Based on your sales data, Product Line A is your top performer with £487K in revenue — a 23% increase over last quarter. The Growth segment saw the highest margin at 42%.
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    placeholder="Ask a question about your report…"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400"
                  />
                  <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">Send</button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Row 3 — Export */}
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                Export
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                Export to PDF or PowerPoint in one click
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Need to email it? Export to PDF with professional formatting. Need to present it?
                Export to PowerPoint with editable slides and charts. Perfect output, every time.
              </p>
            </div>
            <div className="flex-1 w-full max-w-md lg:max-w-none">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
                <div className="text-sm font-semibold text-gray-700 mb-4">Export as…</div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center justify-center border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                    <span className="text-2xl mb-1">📄</span>
                    <span className="text-xs font-medium text-gray-700">PDF Report</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">A4, print-ready</span>
                  </button>
                  <button className="flex flex-col items-center justify-center border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                    <span className="text-2xl mb-1">📊</span>
                    <span className="text-xs font-medium text-gray-700">PowerPoint</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Editable slides</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ 7. TESTIMONIALS ═══════════════════════════════ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 text-center mb-4">
            What our users say
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-14 text-lg">
            Trusted by finance, ops, and executive teams across the UK.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "This replaced 4 hours of analyst work every single week. I upload our monthly sales data on Monday morning and the report is ready before my first coffee.",
                initials: 'SK',
                name: 'Sarah K.',
                role: 'Operations Director',
              },
              {
                quote: "I sent a shared link to my board before a meeting. They arrived having already read the report and asked the AI questions. Best meeting we've had in a year.",
                initials: 'MT',
                name: 'Marcus T.',
                role: 'Managing Director',
              },
              {
                quote: "As a consultant, being able to share a live report instead of emailing PDFs has been transformative. My clients think I've spent days on what takes minutes.",
                initials: 'JR',
                name: 'James R.',
                role: 'Business Consultant',
              },
            ].map((t) => (
              <div key={t.name} className="bg-gray-50 border border-gray-100 rounded-xl p-6">
                <div className="mb-3">
                  <Stars count={5} />
                </div>
                <p className="text-gray-700 leading-relaxed mb-5 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ 8. PRICING ═══════════════════════════════ */}
      <section id="pricing" className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 text-center mb-4">
            Simple pricing. Cancel any time.
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-14 text-lg">
            Start your 7-day free trial — no credit card needed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Starter</h3>
              <p className="text-sm text-gray-500 mb-5">For individuals getting started</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-gray-900">£29</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 flex-1 mb-8">
                {['Unlimited reports', 'AI-powered insights', 'PDF & PowerPoint export', 'Shareable links', 'Email support'].map(
                  (f) => (
                    <li key={f} className="flex items-start space-x-2">
                      <span className="text-blue-600 flex-shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  )
                )}
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center border border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-semibold px-5 py-3 rounded-lg transition-colors"
              >
                Start free trial
              </Link>
            </div>

            {/* Pro — highlighted */}
            <div className="bg-white border-2 border-blue-600 rounded-xl p-6 flex flex-col relative shadow-lg shadow-blue-100">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
              <p className="text-sm text-gray-500 mb-5">For teams who need more</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-gray-900">£49</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 flex-1 mb-8">
                {['Everything in Starter', 'Custom branding', 'Team collaboration', 'Priority support', 'Advanced analytics'].map(
                  (f) => (
                    <li key={f} className="flex items-start space-x-2">
                      <span className="text-blue-600 flex-shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  )
                )}
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors shadow-md"
              >
                Start free trial
              </Link>
            </div>

            {/* Agency */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Agency</h3>
              <p className="text-sm text-gray-500 mb-5">For agencies & power users</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-gray-900">£99</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 flex-1 mb-8">
                {['Everything in Pro', 'Unlimited team members', 'White-label reports', 'API access', 'Dedicated account manager'].map(
                  (f) => (
                    <li key={f} className="flex items-start space-x-2">
                      <span className="text-blue-600 flex-shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  )
                )}
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center border border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-semibold px-5 py-3 rounded-lg transition-colors"
              >
                Start free trial
              </Link>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            All plans include a 7-day free trial. No credit card required to start.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════ 9. FAQ ═══════════════════════════════ */}
      <section id="faq" className="bg-white py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 text-center mb-4">
            Frequently asked questions
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-12 text-lg">
            Everything you need to know about ReportSync.
          </p>
          <div className="border-t border-gray-200">
            {faqs.map((faq, i) => (
              <FaqItem
                key={i}
                question={faq.q}
                answer={faq.a}
                open={faqOpen === i}
                onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ 10. FINAL CTA ═══════════════════════════════ */}
      <section className="bg-[#0A0F1E] py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
            Stop building reports by hand.<br />
            <span className="text-blue-400">Let ReportSync handle it.</span>
          </h2>
          <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
            Upload your first document today and see your executive report in under 2 minutes.
            Free for 7 days — no credit card required.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-lg text-lg transition-all hover:shadow-xl hover:shadow-blue-600/25"
          >
            Start free for 7 days
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            ✓ No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════ 11. FOOTER ═══════════════════════════════ */}
      <footer className="bg-[#0A0F1E] border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-2"
            >
              <span className="text-xl font-bold text-white">ReportSync</span>
              <span className="text-blue-400">⟳</span>
            </button>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} ReportSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
