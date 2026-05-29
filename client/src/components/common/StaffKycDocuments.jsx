import React, { useState } from 'react';
import { FileText, X, ImageOff, ShieldCheck } from 'lucide-react';

/**
 * Renders a staff member's submitted KYC documents (Aadhaar / PAN / live photo)
 * with a click-to-open full-screen lightbox.
 *
 * Fixes bug-sheet #358 / #359 (images submitted but never shown on the
 * verification screen) and #360 (image could not be opened full screen).
 *
 * @param {object} kyc       - staff.kyc object ({ aadhar_image, aadhar_number, pan_image, pan_number })
 * @param {string} livePhoto - optional live/identity photo URL (staff.profile_image / kyc.live_photo)
 */
export default function StaffKycDocuments({ kyc = {}, livePhoto }) {
  const [zoom, setZoom] = useState(null); // { url, label } | null

  const docs = [
    { label: 'Aadhaar Card', url: kyc?.aadhar_image, number: kyc?.aadhar_number },
    { label: 'PAN Card', url: kyc?.pan_image, number: kyc?.pan_number },
    ...(livePhoto || kyc?.live_photo ? [{ label: 'Live / Identity Photo', url: livePhoto || kyc?.live_photo }] : []),
  ];

  const hasAny = docs.some((d) => d.url);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
        <ShieldCheck size={14} className="text-teal-600" /> KYC Documents
      </h3>

      {!hasAny ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <ImageOff size={28} className="mb-2" />
          <p className="text-sm font-medium">No KYC documents submitted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {docs.map((d) => (
            <div key={d.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">{d.label}</span>
                {d.number && <span className="text-[10px] font-mono text-slate-400">{d.number}</span>}
              </div>
              {d.url ? (
                <button
                  type="button"
                  onClick={() => setZoom({ url: d.url, label: d.label })}
                  className="group relative block w-full h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 hover:border-teal-400 transition-colors"
                  title={`View ${d.label} full screen`}
                >
                  <img src={d.url} alt={d.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] font-bold py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    Tap to enlarge
                  </span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center h-28 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-300">
                  <FileText size={20} />
                  <span className="text-[10px] font-bold mt-1">Not provided</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-screen lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoom(null)}
        >
          <button
            type="button"
            onClick={() => setZoom(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-white text-sm font-bold mb-2 text-center">{zoom.label}</p>
            <img src={zoom.url} alt={zoom.label} className="w-full max-h-[80vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
