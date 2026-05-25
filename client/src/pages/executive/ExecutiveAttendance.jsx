import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Camera, LogIn, LogOut, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';
import { useExecutive } from '../../context/ExecutiveContext';
import { useScrollLock } from '../../hooks/useScrollLock';

const STATUS_COLOR = { present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700', half_day: 'bg-amber-100 text-amber-700', on_leave: 'bg-blue-100 text-blue-700' };
const DAY_COLOR = { present: 'bg-green-400', absent: 'bg-red-400', half_day: 'bg-amber-300', on_leave: 'bg-blue-400' };

export default function ExecutiveAttendance() {
  const { setHideBottomNavOverride } = useExecutive();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [checkingIn, setCheckingIn] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [selfieUrl, setSelfieUrl] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState(null);

  useScrollLock(cameraOpen);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setHideBottomNavOverride(cameraOpen);
    return () => setHideBottomNavOverride(false);
  }, [cameraOpen, setHideBottomNavOverride]);

  const { data: todayRaw, isLoading: todayLoading } = useQuery({
    queryKey: ['attendanceToday'],
    queryFn: () => api.get('/executive/attendance/today').then(r => r.data).catch(() => ({ data: null })),
    staleTime: 5 * 60 * 1000,
  });

  const { data: historyRaw, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['attendanceHistory', month],
    queryFn: () => api.get(`/executive/attendance/history?month=${month}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (historyError) toast.error('Failed to load attendance.');
  }, [historyError]);

  const today = todayRaw?.success ? todayRaw.data : null;
  const history = historyRaw?.success ? historyRaw.data : [];
  const loading = todayLoading || historyLoading;

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const startCamera = useCallback(async () => {
    // Check if getUserMedia is available (not available in iOS PWA standalone mode < iOS 16.4)
    const hasGetUserMedia = !!(navigator.mediaDevices?.getUserMedia);
    if (!hasGetUserMedia) {
      // Fallback: use native file input with capture="user" which opens camera on iOS PWA
      fallbackInputRef.current?.click();
      return;
    }
    setCameraOpen(true);
    setCameraReady(false);
    setCapturedFrame(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      setCameraOpen(false);
      if (err.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access in settings.');
      } else {
        // getUserMedia failed at runtime — fall back to file input
        fallbackInputRef.current?.click();
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Single-tap: capture frame → upload → close
  const captureAndUpload = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    setCapturedFrame(dataUrl);
    setUploadingPhoto(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append('image', new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
      const { data } = await api.post('/upload', formData);
      setSelfieUrl(data.url);
      setSelfiePreview(dataUrl);
      setCameraOpen(false);
      setCapturedFrame(null);
      toast.success('Selfie saved!');
    } catch {
      toast.error('Upload failed. Please try again.');
      setCapturedFrame(null);
      await startCamera(); // re-open camera so they can retry
    } finally {
      setUploadingPhoto(false);
    }
  }, [stopCamera, startCamera]);

  const closeCameraModal = useCallback(() => {
    stopCamera();
    setCameraOpen(false);
    setCapturedFrame(null);
  }, [stopCamera]);

  // Fallback for iOS PWA: file input with capture="user"
  const handleFallbackCapture = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected if retaken
    e.target.value = '';
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload', formData);
      setSelfieUrl(data.url);
      setSelfiePreview(URL.createObjectURL(file));
      toast.success('Selfie captured.');
    } catch {
      toast.error('Photo upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }, []);

  const handleCheckIn = async () => {
    if (!selfieUrl) {
      toast.error('Please capture a selfie first.');
      return;
    }
    setCheckingIn(true);
    try {
      const location = await getLocation();
      setGpsStatus({ valid: true, coords: location });
      await api.post('/executive/attendance/check-in', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        selfie_url: selfieUrl,
      });
      toast.success('Checked in successfully.');
      setSelfieUrl('');
      setSelfiePreview('');
      queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory', month] });
    } catch (err) {
      if (err.code === 1) toast.error('Location permission denied. Please enable GPS.');
      else toast.error(err.response?.data?.message || 'Check-in failed.');
    } finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      await api.post('/executive/attendance/check-out');
      toast.success('Checked out.');
      queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory', month] });
    } catch (err) { toast.error(err.response?.data?.message || 'Check-out failed.'); }
    finally { setCheckingIn(false); }
  };

  const isIn = today?.check_in_time && !today?.check_out_time;
  const isOut = today?.check_in_time && today?.check_out_time;
  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

  const presentDays = history.filter((r) => r.status === 'present').length;
  const absentDays = history.filter((r) => r.status === 'absent').length;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-black text-slate-900">GPS Attendance</h1>

      {/* Today's card */}
      {isOut ? (
        /* ── Checked-out completion card ── */
        <div className="rounded-lg p-5 border bg-green-50 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-black text-green-600 uppercase tracking-widest">Today</p>
              <p className="text-base font-black text-green-800">Checked Out</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white rounded-lg p-3 text-center border border-green-100">
              <p className="text-[10px] text-slate-500 mb-0.5 font-semibold uppercase tracking-wide">In</p>
              <p className="font-bold text-slate-800 text-sm">{formatTime(today.check_in_time)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-green-100">
              <p className="text-[10px] text-slate-500 mb-0.5 font-semibold uppercase tracking-wide">Out</p>
              <p className="font-bold text-slate-800 text-sm">{formatTime(today.check_out_time)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-green-100">
              <p className="text-[10px] text-slate-500 mb-0.5 font-semibold uppercase tracking-wide">Hours</p>
              <p className="font-bold text-green-700 text-sm">{today.working_hours ? `${today.working_hours.toFixed(1)}h` : '—'}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${today.geo_fence_valid ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
            <MapPin size={12} className="shrink-0" />
            GPS: {today.geo_fence_valid ? 'Location verified' : `Out of range${today.geo_fence_distance_m ? ` (${Math.round(today.geo_fence_distance_m)}m)` : ''}`}
          </div>

          <p className="text-center text-xs text-slate-400 mt-4 font-medium">Your attendance for today is complete. See you tomorrow!</p>
        </div>
      ) : (
        /* ── Active / not-checked-in card ── */
        <div className={`rounded-lg p-5 border ${isIn ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Today</p>
              <p className={`text-base font-black mt-0.5 ${isIn ? 'text-orange-700' : 'text-amber-600'}`}>
                {isIn ? 'On Duty' : 'Not Checked In'}
              </p>
            </div>
            <MapPin size={20} className={isIn ? 'text-orange-500' : 'text-slate-400'} />
          </div>

          {today?.check_in_time && (
            <div className="flex gap-6 text-sm mb-3">
              <div>
                <p className="text-xs text-slate-500">Check In</p>
                <p className="font-bold text-slate-800">{formatTime(today.check_in_time)}</p>
              </div>
              {today.working_hours && (
                <div>
                  <p className="text-xs text-slate-500">Hours</p>
                  <p className="font-bold text-slate-800">{today.working_hours.toFixed(1)}h</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500">GPS</p>
                <p className={`font-bold text-sm ${today.geo_fence_valid ? 'text-green-600' : 'text-red-500'}`}>
                  {today.geo_fence_valid ? '✓ Valid' : `✗ ${today.geo_fence_distance_m ? `${Math.round(today.geo_fence_distance_m)}m` : 'Out'}`}
                </p>
              </div>
            </div>
          )}

          {!isIn && (
            <div className="space-y-3 mb-3">
              <div>
                <p className="text-xs font-bold text-slate-600 mb-1.5">Step 1: Take Selfie</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={startCamera}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <Camera size={15} /> {uploadingPhoto ? 'Uploading...' : selfieUrl ? 'Retake Selfie' : 'Take Selfie'}
                  </button>
                  {selfieUrl && <CheckCircle size={18} className="text-green-500" />}
                </div>
                {selfiePreview && <img src={selfiePreview} alt="selfie preview" className="w-16 h-16 rounded-lg object-cover mt-2 border-2 border-green-200" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 mb-1.5">Step 2: Check In with GPS</p>
                {gpsStatus && (
                  <div className="flex items-center gap-2 text-xs text-green-600 mb-2">
                    <MapPin size={12} /> Location captured
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hidden fallback input for iOS PWA where getUserMedia is unavailable */}
          <input
            ref={fallbackInputRef}
            type="file"
            accept="image/jpeg, image/png, image/webp"
            capture="user"
            className="hidden"
            onChange={handleFallbackCapture}
          />

          {/* Camera Modal — mobile-centric portrait overlay */}
          {cameraOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
              <div className="relative w-full max-w-sm bg-black flex flex-col rounded-2xl overflow-hidden shadow-2xl"
                   style={{ height: 'min(92vh, 680px)' }}>

                <div className="flex items-center justify-between px-4 py-3 bg-black/90 shrink-0">
                  <p className="text-white font-bold text-sm tracking-wide">Take Selfie</p>
                  <button onClick={closeCameraModal} className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="relative flex-1 overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />

                  {!cameraReady && !capturedFrame && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <div className="w-9 h-9 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  {cameraReady && (
                    <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none">
                      <div className="w-40 h-52 rounded-full border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                    </div>
                  )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="px-5 py-5 bg-black shrink-0 flex flex-col items-center gap-2">
                  {uploadingPhoto ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin" />
                      <p className="text-white/60 text-xs">Uploading selfie…</p>
                    </div>
                  ) : (
                    <button
                      onClick={captureAndUpload}
                      disabled={!cameraReady}
                      className="rounded-full bg-white disabled:opacity-30 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                      style={{ width: 72, height: 72 }}
                    >
                      <div className="w-14 h-14 rounded-full border-[3px] border-slate-300" />
                    </button>
                  )}
                  <p className="text-white/40 text-[11px] mt-1">
                    {cameraReady ? 'Tap to capture & upload' : 'Starting camera…'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={isIn ? handleCheckOut : handleCheckIn}
            disabled={checkingIn}
            className={`w-full py-3 rounded-lg text-sm font-black flex items-center justify-center gap-2 disabled:opacity-60 ${
              isIn ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {isIn ? <><LogOut size={16} /> Check Out</> : <><LogIn size={16} /> Check In with GPS</>}
          </button>
        </div>
      )}

      {/* GPS notice */}
      {!isIn && !isOut && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">Check-in requires GPS location and a selfie. Make sure location services are enabled.</p>
        </div>
      )}

      {/* Month summary */}
      <div>
        <div className="flex gap-3 mb-3">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Present', value: presentDays, color: 'text-green-600' },
            { label: 'Absent', value: absentDays, color: 'text-red-500' },
            { label: 'On Leave', value: history.filter((r) => r.status === 'on_leave').length, color: 'text-blue-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-lg p-3 text-center">
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Monthly View</p>
          <div className="flex flex-wrap gap-1.5">
            {history.map((r) => (
              <div key={r._id} title={`${r.date}: ${r.status}`} className={`w-6 h-6 rounded ${DAY_COLOR[r.status] || 'bg-slate-200'} flex items-center justify-center`}>
                <span className="text-[9px] font-bold text-white">{new Date(r.date).getDate()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
