import React from 'react';

export default function TestingModeBanner() {
  if (import.meta.env.VITE_TESTING_MODE !== 'true') return null;
  return (
    <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5">
      <span className="text-amber-500 text-base leading-none">⚠️</span>
      <p className="text-amber-800 text-[13px] font-medium leading-snug">
        Testing Mode — Use OTP: <span className="font-black tracking-widest">123456</span>
      </p>
    </div>
  );
}
