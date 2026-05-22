import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Camera, LogIn, LogOut, CheckCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const STATUS_COLOR = { present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700', half_day: 'bg-amber-100 text-amber-700', on_leave: 'bg-blue-100 text-blue-700' };
const DAY_COLOR = { present: 'bg-green-400', absent: 'bg-red-400', half_day: 'bg-amber-300', on_leave: 'bg-blue-400' };

export default function ExecutiveAttendance() {
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const queryClient = useQueryClient();

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
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in browser settings.'
        : 'Could not open camera. Please try again.';
      toast.error(msg);
      setCameraOpen(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Mirror horizontally (selfie effect)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedFrame(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(async () => {
    setCapturedFrame(null);
    await startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(async () => {
    if (!capturedFrame) return;
    setUploadingPhoto(true);
    try {
      const blob = await (await fetch(capturedFrame)).blob();
      const formData = new FormData();
      formData.append('image', new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSelfieUrl(data.url);
      setSelfiePreview(capturedFrame);
      setCameraOpen(false);
      setCapturedFrame(null);
      toast.success('Selfie captured.');
    } catch {
      toast.error('Photo upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }, [capturedFrame]);

  const closeCameraModal = useCallback(() => {
    stopCamera();
    setCameraOpen(false);
    setCapturedFrame(null);
  }, [stopCamera]);

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

      {/* Today's check-in card */}
      <div className={`rounded-lg p-5 border ${isIn ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Today</p>
            <p className={`text-base font-black mt-0.5 ${isIn ? 'text-orange-700' : isOut ? 'text-slate-700' : 'text-amber-600'}`}>
              {isIn ? 'On Duty' : isOut ? 'Done for Today' : 'Not Checked In'}
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
            {today.check_out_time && (
              <div>
                <p className="text-xs text-slate-500">Check Out</p>
                <p className="font-bold text-slate-800">{formatTime(today.check_out_time)}</p>
              </div>
            )}
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

        {!isOut && !isIn && (
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

        {/* Camera Modal */}
        {cameraOpen && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-white font-bold text-sm">Take Selfie</p>
              <button onClick={closeCameraModal} className="text-white p-1"><X size={20} /></button>
            </div>

            <div className="flex-1 relative overflow-hidden">
              {!capturedFrame ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <img src={capturedFrame} alt="captured" className="w-full h-full object-cover" />
              )}
              {!cameraReady && !capturedFrame && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {/* Selfie oval guide */}
              {!capturedFrame && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-60 rounded-full border-2 border-white/50" />
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="px-6 py-6 flex gap-4 bg-black">
              {!capturedFrame ? (
                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Camera size={16} /> Capture
                </button>
              ) : (
                <>
                  <button
                    onClick={retakePhoto}
                    className="flex-1 py-3 border border-white/30 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={15} /> Retake
                  </button>
                  <button
                    onClick={confirmPhoto}
                    disabled={uploadingPhoto}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploadingPhoto ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading...</>
                    ) : (
                      <><CheckCircle size={15} /> Use Photo</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {!isOut && (
          <button
            onClick={isIn ? handleCheckOut : handleCheckIn}
            disabled={checkingIn}
            className={`w-full py-3 rounded-lg text-sm font-black flex items-center justify-center gap-2 disabled:opacity-60 ${
              isIn ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {isIn ? <><LogOut size={16} /> Check Out</> : <><LogIn size={16} /> Check In with GPS</>}
          </button>
        )}
      </div>

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
