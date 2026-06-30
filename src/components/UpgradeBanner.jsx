import { useState } from 'react';

export default function UpgradeBanner({ isTrialExpired }) {
  const [show, setShow] = useState(isTrialExpired);

  if (!show) {
    return null;
  }

  const handleClose = () => {
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-white px-4 py-3 z-50 flex items-center justify-between">
      <div>
        <p className="font-medium">Your trial has expired. Please upgrade to continue using ReportSync.</p>
      </div>
      <button
        onClick={handleClose}
        className="text-white underline hover:opacity-80"
      >
        Dismiss
      </button>
    </div>
  );
}
