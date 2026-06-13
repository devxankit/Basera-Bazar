import React, { useState } from 'react';
import { 
  Bell, Send, History, Smartphone, Calendar, Clock, 
  Search, User, Users, CheckCircle, AlertCircle, Trash2, ArrowRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';
import { toast } from '../../mockToast';
import { searchPushRecipients, sendPushBroadcast, getBroadcastHistory } from '../../services/AdminService';

export default function AdminPushNotifications() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('send'); // 'send' | 'history'
  const [historyPage, setHistoryPage] = useState(1);

  // Form States
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState('role'); // 'role' | 'specific'
  const [targetRole, setTargetRole] = useState('Customer');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState('');
  
  // Scheduling States
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Specific User Search States
  const [searchRole, setSearchRole] = useState('Customer');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Preset Redirect Shortcuts
  const deepLinkPresets = [
    { label: 'None', value: '' },
    { label: 'Marketplace', value: '/mandi' },
    { label: 'Partner Leads', value: '/partner/leads' },
    { label: 'User Inbox', value: '/notifications' },
    { label: 'Executive Tasks', value: '/executive/tasks' },
    { label: 'Executive Wallet', value: '/executive/wallet' },
  ];

  // Queries
  const { data: rawHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['adminPushHistory', historyPage],
    queryFn: () => getBroadcastHistory(historyPage, 10),
    enabled: activeTab === 'history',
    staleTime: 30000,
  });

  const historyData = rawHistory?.data || [];
  const pagination = rawHistory?.pagination || { page: 1, pages: 1, total: 0 };

  // Mutations
  const sendMutation = useMutation({
    mutationFn: (payload) => sendPushBroadcast(payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Notification broadcast initiated successfully!');
      // Reset form
      setTitle('');
      setBody('');
      setRedirectUrl('');
      setIsScheduled(false);
      setScheduledDate('');
      setScheduledTime('');
      setSelectedRecipient(null);
      queryClient.invalidateQueries({ queryKey: ['adminPushHistory'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send notification.');
    }
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const data = await searchPushRecipients(searchRole, searchQuery);
      setSearchResults(data);
      if (data.length === 0) {
        toast.error('No matching users found.');
      }
    } catch (err) {
      toast.error('Failed to search recipients.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendNotification = (e) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.error('Please enter a Title and Message Body');
      return;
    }

    if (targetType === 'specific' && !selectedRecipient) {
      toast.error('Please select a specific recipient');
      return;
    }

    let scheduledAt = null;
    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        toast.error('Please specify both scheduled date and time');
        return;
      }
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      if (new Date(scheduledAt) <= new Date()) {
        toast.error('Scheduled time must be in the future');
        return;
      }
    }

    const payload = {
      targetType,
      title: title.trim(),
      body: body.trim(),
      redirectUrl: redirectUrl.trim() || undefined,
      scheduledAt: scheduledAt || undefined,
    };

    if (targetType === 'role') {
      payload.targetRole = targetRole;
    } else {
      payload.specificUserId = selectedRecipient.id;
      payload.specificUserModel = selectedRecipient.role === 'Customer' ? 'User' :
                                  selectedRecipient.role === 'Partner' ? 'Partner' :
                                  selectedRecipient.role === 'Executive' ? 'Executive' :
                                  selectedRecipient.role === 'TeamLeader' ? 'TeamLeader' : 'OfficeStaff';
    }

    sendMutation.mutate(payload);
  };

  const columns = [
    {
      header: 'Title & Body',
      render: (row) => (
        <div className="max-w-xs md:max-w-md">
          <p className="font-bold text-slate-800 tracking-tight text-[13px]">{row.title}</p>
          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{row.body}</p>
          {row.data?.click_action && (
            <span className="inline-block bg-slate-100 text-slate-600 rounded-sm px-1.5 py-0.5 text-[9px] font-mono mt-1">
              Deep link: {row.data.click_action}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Target Audience',
      render: (row) => {
        const typeLabels = {
          all_customers: { label: 'All Customers', bg: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
          all_partners: { label: 'All Partners', bg: 'bg-orange-50 text-orange-600 border-orange-100' },
          all_executives: { label: 'All Executives', bg: 'bg-amber-50 text-amber-600 border-amber-100' },
          all_team_leaders: { label: 'All Leads', bg: 'bg-teal-50 text-teal-600 border-teal-100' },
          all_office_staff: { label: 'All Staff', bg: 'bg-purple-50 text-purple-600 border-purple-100' },
          specific_user: { label: `User: ${row.target_user_name || 'Individual'}`, bg: 'bg-slate-50 text-slate-600 border-slate-200' }
        };
        const config = typeLabels[row.target_type] || { label: row.target_type, bg: 'bg-slate-50 border-slate-200' };

        return (
          <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-xs whitespace-nowrap inline-block ${config.bg}`}>
            {config.label}
          </span>
        );
      }
    },
    {
      header: 'Scheduled / Sent Time',
      render: (row) => (
        <div className="space-y-0.5 text-slate-600 font-bold tracking-tight text-[11px]">
          <p className="uppercase tracking-widest">
            {new Date(row.scheduled_at || row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-[10px] text-slate-400 font-bold">
            {new Date(row.scheduled_at || row.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => {
        const statuses = {
          scheduled: 'bg-sky-500 text-white shadow-sm shadow-sky-100',
          processing: 'bg-amber-500 text-white shadow-sm shadow-amber-100 animate-pulse',
          sent: 'bg-emerald-500 text-white shadow-sm shadow-emerald-100',
          failed: 'bg-rose-500 text-white shadow-sm shadow-rose-100'
        };
        return (
          <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${statuses[row.status] || 'bg-slate-400'}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Delivery Rate',
      render: (row) => {
        if (row.status === 'scheduled') {
          return <span className="text-slate-400 font-bold italic text-[11px]">Pending Send</span>;
        }
        
        const total = row.sent_count || 0;
        const success = row.success_count || 0;
        const fail = row.failure_count || 0;
        const rate = total > 0 ? Math.round((success / total) * 100) : 0;

        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[13px] text-slate-800 italic">{rate}%</span>
              <span className="text-[10px] text-slate-400 font-medium">({success}/{total})</span>
            </div>
            {fail > 0 && (
              <p className="text-[9px] font-bold text-rose-500 italic font-mono">{fail} failures</p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Sent By',
      render: (row) => (
        <span className="text-[11px] font-bold text-slate-500 truncate max-w-[120px] inline-block">
          {row.sender_id?.name || 'Admin'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-4">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Push Notifications</h1>
        <p className="text-slate-500 font-medium mt-1 text-lg">
          Broadcast push notifications to targeted roles or coordinate scheduled messages.
        </p>
      </div>

      {/* Analytics / Metrics Blocks */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
            <Send size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sent Announcements</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1 italic">
              {rawHistory?.pagination?.total || 0}
            </h3>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
            <Smartphone size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Channels</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1 italic">5 / 5</h3>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center text-sky-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Queue</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1 italic">Active</h3>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('send')}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors relative ${
            activeTab === 'send' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Send Announcement
          {activeTab === 'send' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors relative ${
            activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Delivery History & Logs
          {activeTab === 'history' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === 'send' ? (
        <div className="grid grid-cols-12 gap-8">
          {/* Main Composing Form */}
          <form onSubmit={handleSendNotification} className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-tighter">Compose Message</h2>

            <div className="space-y-4">
              {/* Notification Title */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Message Title</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter short attention-grabbing title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-semibold"
                  />
                  <span className="absolute right-4 top-4 text-[10px] font-bold text-slate-400 tabular-nums">
                    {title.length}/80
                  </span>
                </div>
              </div>

              {/* Notification Body */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Message Body (Description)</label>
                <div className="relative">
                  <textarea
                    required
                    rows="3"
                    placeholder="Type details about the promotion, warning, or task request..."
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, 240))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-semibold"
                  />
                  <span className="absolute right-4 bottom-4 text-[10px] font-bold text-slate-400 tabular-nums">
                    {body.length}/240
                  </span>
                </div>
              </div>

              {/* Target Selection Switch */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTargetType('role')}
                  className={`py-4 px-6 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                    targetType === 'role'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-100'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <Users size={18} />
                  Role Broadcast
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('specific')}
                  className={`py-4 px-6 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                    targetType === 'specific'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-100'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <User size={18} />
                  Target Specific User
                </button>
              </div>

              {/* Target Type Specific Form Fields */}
              {targetType === 'role' ? (
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Group Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold text-slate-700"
                  >
                    <option value="Customer">Customers (All registered end-users)</option>
                    <option value="Partner">Partners (Service Providers, Agents, Suppliers, Mandi Sellers)</option>
                    <option value="Executive">Field Executives</option>
                    <option value="TeamLeader">Team Leaders (Leads)</option>
                    <option value="OfficeStaff">Office Staff</option>
                  </select>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Recipient</span>
                  {selectedRecipient ? (
                    <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-[14px]">{selectedRecipient.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-tight">
                            {selectedRecipient.role} • {selectedRecipient.phone}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRecipient(null)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-bold italic">No recipient selected. Search in the right sidebar to select a user.</p>
                  )}
                </div>
              )}

              {/* Redirect Link Input with presets */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Redirect Link / Deep Link (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., /mandi or /partner/leads"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-semibold font-mono"
                />
                
                {/* Preset shortcuts */}
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mr-1">Presets:</span>
                  {deepLinkPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setRedirectUrl(preset.value)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                        redirectUrl === preset.value
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scheduling System */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Schedule Send Queue</h4>
                    <p className="text-xs text-slate-400 font-medium">Hold notification for execution at a future date and time.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScheduled(!isScheduled)}
                    className={`relative w-11 h-6 rounded-full transition-all flex items-center px-1 ${
                      isScheduled ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all transform ${
                      isScheduled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {isScheduled && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl animate-in fade-in duration-300">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Scheduled Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          required={isScheduled}
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-white focus:border-indigo-500 font-bold text-sm text-slate-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Scheduled Time</label>
                      <div className="relative">
                        <input
                          type="time"
                          required={isScheduled}
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-white focus:border-indigo-500 font-bold text-sm text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Action */}
            <div className="border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={sendMutation.isPending}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {sendMutation.isPending ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : isScheduled ? (
                  <>
                    <Calendar size={18} />
                    Schedule Delivery
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Push Now
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Sidebar: Recipient Search Panel (Only visible if specific user targeted) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Search size={16} className="text-slate-400" />
                Find Specific Recipient
              </h3>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Search Context Role</label>
                  <select
                    value={searchRole}
                    onChange={(e) => setSearchRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-600"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Partner">Partner</option>
                    <option value="Executive">Executive</option>
                    <option value="TeamLeader">Team Leader (Lead)</option>
                    <option value="OfficeStaff">Office Staff</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Search by name/phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="grow px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center"
                  >
                    {isSearching ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Find'
                    )}
                  </button>
                </div>
              </form>

              {/* Search Results Display */}
              <div className="mt-6 border-t border-slate-100 pt-4 max-h-[350px] overflow-y-auto custom-scrollbar space-y-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Search Results ({searchResults.length})</span>
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col border border-slate-100 p-3.5 rounded-xl bg-slate-50 hover:bg-white hover:border-slate-200 transition-all gap-2"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-[13px]">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{item.phone}</p>
                      {item.details && (
                        <p className="text-[9px] text-slate-400 font-bold italic mt-0.5">{item.details}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100/60 pt-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        item.hasTokens 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-500 border border-rose-100'
                      }`}>
                        {item.hasTokens ? `${item.tokensCount} Token(s)` : 'No Tokens'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetType('specific');
                          setSelectedRecipient(item);
                          toast.success(`Targeted: ${item.name}`);
                        }}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Target User <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {searchResults.length === 0 && !isSearching && (
                  <p className="text-slate-400 text-xs font-bold text-center py-6 italic">Enter a query above to search for users.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History & Logs Tab */
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <History size={16} />
              Broadcast History Log
            </span>
          </div>

          <AdminTable
            columns={columns}
            data={historyData}
            loading={loadingHistory}
            pagination={false}
            hideFilter={true}
            searchPlaceholder="Search logged campaigns..."
          />

          {/* Simple Pagination Footer */}
          {pagination.pages > 1 && (
            <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Showing Page {pagination.page} of {pagination.pages} ({pagination.total} records)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  Prev
                </button>
                <button
                  disabled={historyPage === pagination.pages}
                  onClick={() => setHistoryPage(p => Math.min(pagination.pages, p + 1))}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
