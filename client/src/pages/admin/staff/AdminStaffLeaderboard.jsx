import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { toast } from '../../../mockToast';
import FilterBar, { FilterField } from '../../../components/admin/FilterBar';
import EmptyState from '../../../components/common/EmptyState';

const STAFF_TYPES = [
  { value: '', label: 'All Staff' },
  { value: 'team_leader', label: 'Team Leaders' },
  { value: 'field_executive', label: 'Field Executives' },
  { value: 'office_staff', label: 'Office Staff' },
];

const ROLE_BADGE = {
  team_leader: 'bg-indigo-100 text-indigo-700',
  field_executive: 'bg-orange-100 text-orange-700',
  office_staff: 'bg-teal-100 text-teal-700',
};

const PODIUM_COLORS = ['bg-amber-400', 'bg-slate-300', 'bg-orange-400'];
const PODIUM_HEIGHTS = ['h-24', 'h-16', 'h-12'];

export default function AdminStaffLeaderboard() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [staffType, setStaffType] = useState('');

  const { data: rawData, isLoading: loading, error: leaderboardError } = useQuery({
    queryKey: ['admin-staff-leaderboard', month, staffType],
    queryFn: () => {
      const params = new URLSearchParams({ month });
      if (staffType) params.set('staff_type', staffType);
      return api.get(`/admin/staff/leaderboard?${params}`).then((r) => r.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (leaderboardError) toast.error('Failed to load leaderboard.');
  }, [leaderboardError]);

  const leaderboard = rawData?.data || [];

  const handleWhatsAppShare = (record) => {
    const text = encodeURIComponent(
      `🏆 BaseraBazar Staff Leaderboard — ${month}\n\n` +
      `🥇 #${record.rank} ${record.name}\n` +
      `Achievement: ${Math.round((record.achievement_rate ?? 0) * 100)}%\n` +
      `Incentive Earned: ₹${(record.incentive_earned ?? 0).toLocaleString('en-IN')}\n\n` +
      `Keep it up! 💪`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const top3 = leaderboard.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  const activeFilterCount = staffType ? 1 : 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-black text-slate-900">Staff Leaderboard</h1>
        <p className="text-sm text-slate-500">Monthly performance rankings</p>
      </div>

      <FilterBar
        open
        activeCount={activeFilterCount}
        onReset={() => setStaffType('')}
      >
        <FilterField label="Month">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
        </FilterField>
        <FilterField label="Staff Type">
          <select
            value={staffType}
            onChange={(e) => setStaffType(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white"
          >
            {STAFF_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}

      {!loading && leaderboard.length === 0 && (
        <EmptyState
          icon={Trophy}
          title="No leaderboard data"
          message={`No leaderboard data for ${month}.`}
        />
      )}

      {!loading && top3.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-5">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 text-center">Top Performers</h3>
          <div className="flex items-end justify-center gap-4">
            {podiumOrder.map((record, idx) => {
              if (!record) return null;
              const isFirst = record.rank === 1;
              const podiumIdx = isFirst ? 0 : record.rank === 2 ? 1 : 2;
              return (
                <div key={record._id || idx} className="flex flex-col items-center gap-2 w-28">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-black text-slate-500">
                      {record.name?.[0]?.toUpperCase()}
                    </div>
                    {isFirst && <Trophy size={14} className="absolute -top-2 -right-1 text-amber-500" />}
                  </div>
                  <p className="text-xs font-black text-slate-800 text-center leading-tight">{record.name}</p>
                  <p className="text-xs text-slate-500">{Math.round((record.achievement_rate ?? 0) * 100)}%</p>
                  <div className={`w-full ${PODIUM_HEIGHTS[podiumIdx]} ${PODIUM_COLORS[podiumIdx]} rounded-t-lg flex items-center justify-center`}>
                    <span className="text-white font-black text-lg">#{record.rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && leaderboard.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Rank', 'Name', 'Role', 'Achievement', 'Incentive', 'Share'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r, i) => (
                <tr key={r._id || i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {r.rank <= 3 ? (
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${r.rank === 1 ? 'bg-amber-400' : r.rank === 2 ? 'bg-slate-400' : 'bg-orange-400'}`}>
                        {r.rank}
                      </span>
                    ) : <span className="text-sm font-bold text-slate-500 pl-2">{r.rank}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                        {r.name?.[0]?.toUpperCase()}
                      </div>
                      <p className="font-semibold text-sm text-slate-800">{r.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${ROLE_BADGE[r.staff_type] || 'bg-slate-100 text-slate-600'}`}>
                      {r.staff_type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min(Math.round((r.achievement_rate ?? 0) * 100), 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{Math.round((r.achievement_rate ?? 0) * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-green-700">₹{(r.incentive_earned ?? 0).toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleWhatsAppShare(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Share Achievement
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
