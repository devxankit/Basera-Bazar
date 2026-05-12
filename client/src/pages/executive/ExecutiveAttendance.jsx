import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapPin, Camera, LogIn, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';

const STATUS_COLOR = { present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700', half_day: 'bg-amber-100 text-amber-700', on_leave: 'bg-blue-100 text-blue-700' };
const DAY_COLOR = { present: 'bg-green-400', absent: 'bg-red-400', half_day: 'bg-amber-300', on_leave: 'bg-blue-400' };

export default function ExecutiveAttendance() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [history, setHistory] = useState([]);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [selfieUrl, setSelfieUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get('/executive/attendance/today').catch(() => ({ data: { data: null } })),
        api.get(`/executive/attendance/history?month=${month}`),
      ]);
      if (todayRes.data.success) setToday(todayRes.data.data);
      if (historyRes.data.success) setHistory(historyRes.data.data);
    } catch { toast.error('Failed to load attendance.'); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSelfieUrl(data.url);
      toast.success('Selfie captured.');
    } catch { toast.error('Photo upload failed.'); }
    finally { setUploadingPhoto(false); }
  };

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
      fetchData();
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
      fetchData();
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
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <Camera size={15} /> {uploadingPhoto ? 'Uploading...' : 'Take Selfie'}
                </button>
                {selfieUrl && <CheckCircle size={18} className="text-green-500" />}
                <input ref={fileInputRef} type="file" accept="image/*" capture="user" onChange={handlePhotoCapture} className="hidden" />
              </div>
              {selfieUrl && <img src={selfieUrl} alt="selfie" className="w-16 h-16 rounded-lg object-cover mt-2" />}
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
