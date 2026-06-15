import React, { useState, useEffect } from 'react';
import {
  BadgePercent,
  Gift,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Save,
  Users2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const DEFAULT_OFFERS = {
  OFFER_1_PLUS_1: { is_active: false, expiry: null, min_amount: 1 },
  FREE_TRIAL_CONFIG: { duration_days: 30, listings_limit: 1, featured_listings_limit: 0 },
  ROLE_UPGRADE_FEE: 200
};

export default function AdminOffers() {
  const queryClient = useQueryClient();
  const [offers, setOffers] = useState(DEFAULT_OFFERS);

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['adminOffers'],
    queryFn: () => api.get('/admin/system/offers').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (rawData?.data) {
      setOffers(rawData.data);
    }
  }, [rawData]);

  const toggleMutation = useMutation({
    mutationFn: ({ key, value }) => api.put('/admin/system/offers', { key, value }),
    onSuccess: (_, { key, value }) => {
      toast.success(`${key === 'OFFER_1_PLUS_1' ? '1+1 Offer' : key} ${value.is_active ? 'Activated' : 'Deactivated'}`);
      queryClient.invalidateQueries({ queryKey: ['adminOffers'] });
    },
    onError: (_, { key }) => {
      // revert optimistic
      setOffers(prev => ({ ...prev, [key]: rawData?.data?.[key] || prev[key] }));
      toast.error('Failed to update offer');
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ key, value }) => api.put('/admin/system/offers', { key, value }),
    onSuccess: () => {
      toast.success('Configuration saved successfully');
      queryClient.invalidateQueries({ queryKey: ['adminOffers'] });
    },
    onError: () => toast.error('Failed to save configuration'),
  });

  const saving = saveMutation.isPending;

  const handleToggleOffer = (key) => {
    const newValue = { ...offers[key], is_active: !offers[key].is_active };
    setOffers(prev => ({ ...prev, [key]: newValue }));
    toggleMutation.mutate({ key, value: newValue });
  };

  const handleUpdateValue = (key, field, value) => {
    setOffers(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const saveConfig = (key) => {
    saveMutation.mutate({ key, value: offers[key] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BadgePercent size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Promotional Offers</h1>
          </div>
          <p className="text-slate-500 font-bold ml-1">Manage platform-wide promotions and subscription settings.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 1+1 Offer Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden"
        >
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center">
                <Gift size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Buy 1 Get 1 Role Offer</h3>
                <p className="text-xs font-black text-rose-500 uppercase tracking-widest mt-0.5">Special Promotion</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleOffer('OFFER_1_PLUS_1')}
              className={`transition-all duration-500 ${offers.OFFER_1_PLUS_1.is_active ? 'text-indigo-600' : 'text-slate-300'}`}
            >
              {offers.OFFER_1_PLUS_1.is_active ? <ToggleRight size={56} /> : <ToggleLeft size={56} />}
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <div className="flex gap-4">
                <AlertCircle className="text-slate-400 shrink-0" size={20} />
                <p className="text-sm font-bold text-slate-600 leading-relaxed">
                  When active, any partner who purchases a premium subscription plan (Price {'>='} ₹1) will receive 1 free Role Credit. They can use this credit to activate an additional role on their profile for free.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Minimum Subscription Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={offers.OFFER_1_PLUS_1.min_amount ?? 100}
                  onChange={(e) => handleUpdateValue('OFFER_1_PLUS_1', 'min_amount', parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plans priced at or above this grant the free role credit</p>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Offer Expiry (Optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="date"
                    value={offers.OFFER_1_PLUS_1.expiry ? offers.OFFER_1_PLUS_1.expiry.split('T')[0] : ''}
                    onChange={(e) => handleUpdateValue('OFFER_1_PLUS_1', 'expiry', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 pl-12 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave empty for no expiry</p>
              </div>
            </div>

            <button
              onClick={() => saveConfig('OFFER_1_PLUS_1')}
              disabled={saving}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </motion.div>

        {/* Free Trial Config Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden"
        >
          <div className="p-8 border-b border-slate-50 flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center">
              <Users2 size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Standard Free Trial</h3>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mt-0.5">Platform Default</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Duration (Days)</label>
                <input
                  type="number"
                  value={offers.FREE_TRIAL_CONFIG.duration_days}
                  onChange={(e) => handleUpdateValue('FREE_TRIAL_CONFIG', 'duration_days', parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Active Listings Limit</label>
                <input
                  type="number"
                  value={offers.FREE_TRIAL_CONFIG.listings_limit}
                  onChange={(e) => handleUpdateValue('FREE_TRIAL_CONFIG', 'listings_limit', parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Featured Listings Limit</label>
              <input
                type="number"
                value={offers.FREE_TRIAL_CONFIG.featured_listings_limit}
                onChange={(e) => handleUpdateValue('FREE_TRIAL_CONFIG', 'featured_listings_limit', parseInt(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50">
              <p className="text-xs font-bold text-indigo-700 leading-relaxed">
                Note: This Free Trial configuration applies to all roles during the registration process. If a partner chooses the Free Trial, the 1+1 role offer is NOT applicable.
              </p>
            </div>

            <button
              onClick={() => saveConfig('FREE_TRIAL_CONFIG')}
              disabled={saving}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Update Trial Logic'}
            </button>
          </div>
        </motion.div>

        {/* Role Upgrade Fee Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden"
        >
          <div className="p-8 border-b border-slate-50 flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center">
              <BadgePercent size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Role Upgrade Fee</h3>
              <p className="text-xs font-black text-amber-500 uppercase tracking-widest mt-0.5">One-Time Charge</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <div className="flex gap-4">
                <AlertCircle className="text-slate-400 shrink-0" size={20} />
                <p className="text-sm font-bold text-slate-600 leading-relaxed">
                  The one-time fee a partner pays to unlock an additional role (after their free 1+1 credit is used). Paid once per role; if a request is rejected, the partner can resubmit without paying again.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Fee Amount (₹)</label>
              <input
                type="number"
                min={0}
                value={offers.ROLE_UPGRADE_FEE ?? 200}
                onChange={(e) => setOffers(prev => ({ ...prev, ROLE_UPGRADE_FEE: parseInt(e.target.value) || 0 }))}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <button
              onClick={() => saveConfig('ROLE_UPGRADE_FEE')}
              disabled={saving}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Upgrade Fee'}
            </button>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
