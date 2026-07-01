import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="font-inter bg-white text-gray-900 antialiased">
      {/* Section 1: Navigation */}
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-blue-600">ReportSync</span>
            {/* Sync icon placeholder - you can replace with actual icon */}
            <span className="text-blue-600">⟳</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link to="/features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
            <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
            <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors">
              Start Free Trial
            </a>
          </div>
          {/* Mobile menu button (hamburger) - would need JavaScript for full functionality */}
          <div className="md:hidden">
            <button className="text-gray-500 hover:text-gray-700">☰</button>
          </div>
        </div>
      </nav>

      {/* Section 2: Hero */}
      <section className="pt-20 pb-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12">
            {/* Hero Text */}
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl font-bold lg:text-5xl">
                Stop spending your week building reports.
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
                Upload any document — financial data, sales reports, project updates — and get a professional executive report with charts, trends, and AI insights in under 2 minutes.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md flex items-center justify-center transition-colors lg:px-8 lg:py-4">
                  Start Free Trial — No card needed
                </a>
                <Link to="/how-it-works" className="border border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-medium px-5 py-3 rounded-md flex items-center justify-center transition-colors lg:px-8 lg:py-4">
                  See how it works
                </Link>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                7-day free trial · No credit card · Cancel anytime
              </p>
            </div>
            
            {/* Hero Visual */}
            <div className="flex-1 lg:w-1/2">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden relative">
                {/* Placeholder for report mockup */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="space-y-4">
                    <div className="w-full h-8 bg-gray-300 rounded animate-pulse"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <div className="w-full h-20 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Social proof bar */}
      <section className="pt-12 pb-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Trusted by 500+ businesses across the UK
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-400">★★★★★</span>
            <span className="text-sm text-gray-600">4.9 from 200+ reviews</span>
          </div>
        </div>
      </section>

      {/* Section 4: Pain points */}
      <section className="pt-16 pb-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">
            Sound familiar?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pain Card 1 */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
              <div className="text-3xl mb-4">😤</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Your reports take hours — or days
              </h3>
              <p className="text-center text-gray-600">
                You spend hours every week copy-pasting data into slides that nobody reads carefully. 
                That's time you could spend actually running your business.
              </p>
            </div>
            
            {/* Pain Card 2 */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Raw data means nothing to your leadership team
              </h3>
              <p className="text-center text-gray-600">
                A spreadsheet isn't a strategy. Your CEO needs to see what the numbers mean — 
                not 47 columns and a pivot table.
              </p>
            </div>
            
            {/* Pain Card 3 */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
              <div className="text-3xl mb-4">📎</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Your reports die in email attachments
              </h3>
              <p className="text-center text-gray-600">
                You send a PDF, someone downloads it, someone else never opens it. 
                There's no single source of truth and no way to discuss the data together.
              </p>
            </div>
            
            {/* Pain Card 4 */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
              <div className="text-3xl mb-4">💸</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Analysts and consultants cost a fortune
              </h3>
              <p className="text-center text-gray-600">
                Hiring someone to build a monthly performance report costs £500–£2,000 per project. 
                For most businesses, that's not sustainable every month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: How it works */}
      <section className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">
            Three steps. Under two minutes.
          </h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full">
                <span className="text-blue-600 text-xl font-bold">1</span>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                {/* Upload icon placeholder */}
                <span className="text-blue-600">📤</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-center">
                Upload
              </h3>
              <p className="text-center text-gray-600">
                Drop in any document — PDF, Excel, Word, CSV or PowerPoint.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full">
                <span className="text-blue-600 text-xl font-bold">2</span>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                {/* AI icon placeholder */}
                <span className="text-blue-600">🤖</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-center">
                Generate
              </h3>
              <p className="text-center text-gray-600">
                Our AI reads it, extracts the data, and builds your report automatically.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full">
                <span className="text-blue-600 text-xl font-bold">3</span>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                {/* Share icon placeholder */}
                <span className="text-blue-600">🔗</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-center">
                Share
              </h3>
              <p className="text-center text-gray-600">
                Share a live link with your team. Export to PDF or PowerPoint. Ask the AI anything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Features (alternating rows) */}
      <section className="pt-20 pb-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Feature Row 1 */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12 mb-16">
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                AI-generated charts and trends
              </h3>
              <p className="text-gray-600">
                Automatically see where your numbers are heading. Line charts, bar charts, 
                trend indicators — all generated from your data, zero manual work.
              </p>
            </div>
            <div className="flex-1 lg:w-1/2">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden relative">
                {/* Chart placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="space-y-4">
                    <div className="w-full h-8 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Row 2 - reversed */}
          <div className="flex flex-col lg:flex-row-reverse items-start lg:items-center gap-12 mb-16">
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                Share a live link — your team joins instantly
              </h3>
              <p className="text-gray-600">
                Generate a shareable link and send it to anyone. They click it, enter their name and role, 
                and the report is live for them — no login, no download. See who's viewing in real time.
              </p>
            </div>
            <div className="flex-1 lg:w-1/2">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden relative">
                {/* Sharing placeholder for shared report */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="space-y-3">
                    <div className="w-full h-8 bg-gray-300 rounded animate-pulse"></div>
                    <div className="flex space-x-3">
                      <div className="h-6 w-6 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="h-6 w-6 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="h-6 w-6 bg-gray-300 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Row 3 */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12 mb-16">
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                Ask the AI anything about your data
              </h3>
              <p className="text-gray-600">
                Every report has a built-in AI analyst. Ask 'What was our worst month?' or 
                'Summarise the key risks' and get an instant answer grounded in your data.
              </p>
            </div>
            <div className="flex-1 lg:w-1/2">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden relative">
                {/* Chat placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="space-y-3">
                    <div className="w-full h-8 bg-gray-300 rounded animate-pulse"></div>
                    <div className="flex space-x-3">
                      <div className="h-6 w-6 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="h-6 w-6 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="h-6 w-6 bg-gray-300 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Row 4 - reversed */}
          <div className="flex flex-col lg:flex-row-reverse items-start lg:items-center gap-12">
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                Export to PDF or PowerPoint in one click
              </h3>
              <p className="text-gray-600">
                Need to email it? Export to PDF. Need to present it? Export to PowerPoint 
                with editable charts. Professional output, every time.
              </p>
            </div>
            <div className="flex-1 lg:w-1/2">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden relative">
                {/* Export placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="space-y-3">
                    <div className="w-full h-8 bg-gray-300 rounded animate-pulse"></div>
                    <div className="flex space-x-3">
                      <div className="h-6 w-6 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="h-6 w-6 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="h-6 w-6 bg-gray-300 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Testimonials */}
      <section className="pt-20 pb-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">
            What our users say
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="italic text-gray-700 mb-4">
                "This replaced 4 hours of analyst work every single week. I upload our monthly 
                sales data on Monday morning and the report is ready before my first coffee."
              </p>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">SK</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Sarah K.</h4>
                  <p className="text-sm text-gray-500">Operations Director</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="italic text-gray-700 mb-4">
                "I sent a shared link to my board before a meeting. They arrived having already 
                read the report and asked the AI questions. Best meeting we've had in a year."
              </p>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">MT</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Marcus T.</h4>
                  <p className="text-sm text-gray-500">Managing Director</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="italic text-gray-700 mb-4">
                "As a consultant, the white-label feature alone is worth the subscription. 
                My clients think I've spent days on reports I generate in minutes."
              </p>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">JR</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">James R.</h4>
                  <p className="text-sm text-gray-500">Business Consultant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Pricing */}
      <section className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">
            Simple pricing. Cancel any time.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Starter
              </h3>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                £29/mo
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Unlimited reports</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>AI-powered insights</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>PDF & PowerPoint export</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Shareable links</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Email support</span>
                </li>
              </ul>
              <a href="#" className="mt-6 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors">
                Start Free Trial
              </a>
            </div>
            
            {/* Pro Plan - Highlighted */}
            <div className="border border-blue-600 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span>Pro</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Most Popular</span>
              </h3>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                £49/mo
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Everything in Starter</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Custom branding</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Team collaboration</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Advanced analytics</span>
                </li>
              </ul>
              <a href="#" className="mt-6 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors">
                Start Free Trial
              </a>
            </div>
            
            {/* Agency Plan */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Agency
              </h3>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                £99/mo
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Unlimited team members</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>White-label reports</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>API access</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 text-blue-600">✓</span>
                  <span>Dedicated account manager</span>
                </li>
              </ul>
              <a href="#" className="mt-6 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors">
                Start Free Trial
              </a>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">
            All plans include a 7-day free trial. No credit card required to start.
          </p>
        </div>
      </section>

      {/* Section 9: FAQ (accordion) */}
      <section className="pt-20 pb-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <div className="border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50" onClick={() => {}}>
                <h3 className="font-semibold text-gray-900">
                  What types of documents can I upload?
                </h3>
                <span className="text-gray-500">▼</span>
              </div>
              <div className="hidden p-5 text-gray-600">
                PDF, Excel (XLSX/XLS), Word (DOCX), CSV, and PowerPoint (PPTX). Up to 50MB per file.
              </div>
            </div>
            
            {/* FAQ Item 2 */}
            <div className="border border-gray-200 rounded-lg mt-2">
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50" onClick={() => {}}>
                <h3 className="font-semibold text-gray-900">
                  Is my data secure?
                </h3>
                <span className="text-gray-500">▼</span>
              </div>
              <div className="hidden p-5 text-gray-600">
                Yes. Your documents are encrypted at rest and in transit. They are never used to train any AI model. You can delete your data at any time from your account settings.
              </div>
            </div>
            
            {/* FAQ Item 3 */}
            <div className="border border-gray-200 rounded-lg mt-2">
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50" onClick={() => {}}>
                <h3 className="font-semibold text-gray-900">
                  What happens after the free trial?
                </h3>
                <span className="text-gray-500">▼</span>
              </div>
              <div className="hidden p-5 text-gray-600">
                After 7 days you'll be prompted to choose a plan. If you don't upgrade, your account pauses and you can still access your existing reports.
              </div>
            </div>
            
            {/* FAQ Item 4 */}
            <div className="border border-gray-200 rounded-lg mt-2">
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50" onClick={() => {}}>
                <h3 className="font-semibold text-gray-900">
                  Can I share reports with people who don't have an account?
                </h3>
                <span className="text-gray-500">▼</span>
              </div>
              <div className="hidden p-5 text-gray-600">
                Yes. Anyone with your shareable link can view the report — no account needed. You control whether the link is active and when it expires.
              </div>
            </div>
            
            {/* FAQ Item 5 */}
            <div className="border border-gray-200 rounded-lg mt-2">
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50" onClick={() => {}}>
                <h3 className="font-semibold text-gray-900">
                  What AI model powers this?
                </h3>
                <span className="text-gray-500">▼</span>
              </div>
              <div className="hidden p-5 text-gray-600">
                Reports are generated using DeepSeek V4, one of the most advanced AI models available, fine-tuned for business document analysis.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 10: Final CTA */}
      <section className="pt-20 pb-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Your next report is 2 minutes away.
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join 500+ businesses saving hours every week.
          </p>
          <a href="#" className="bg-white hover:bg-gray-100 text-blue-600 font-medium px-6 py-3 rounded-md transition-colors inline-block">
            Start Free Trial — No card needed
          </a>
        </div>
      </section>

      {/* Section 11: Footer */}
      <footer className="pt-12 pb-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-blue-600">ReportSync</span>
            <span className="text-blue-600">⟳</span>
          </div>
          <p className="text-sm text-gray-600">
            Turn any document into an executive report.
          </p>
          <div className="flex space-x-4 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-400">
            © 2024 GetReportSync · getreportsync.com
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;