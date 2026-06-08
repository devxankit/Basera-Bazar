import React, { useState, useEffect } from 'react';
import {
  Settings, HelpCircle, Shield, Save, Plus, Trash2,
  ArrowUp, ArrowDown, Phone, Mail, MessageCircle, Clock,
  FileText, BookOpen, User, Briefcase, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const TABS = [
  { key: 'CONTENT_HELP_CUSTOMER', label: 'Customer Help', type: 'help', icon: HelpCircle },
  { key: 'CONTENT_HELP_PARTNER', label: 'Partner Help', type: 'help', icon: Briefcase },
  { key: 'CONTENT_HELP_EXECUTIVE', label: 'Executive Help', type: 'help', icon: MapPin },
  { key: 'CONTENT_PRIVACY_CUSTOMER', label: 'Customer Privacy', type: 'privacy', icon: Shield },
  { key: 'CONTENT_PRIVACY_PARTNER', label: 'Partner Privacy', type: 'privacy', icon: Shield },
  { key: 'CONTENT_PRIVACY_EXECUTIVE', label: 'Executive Privacy', type: 'privacy', icon: Shield },
];

const CATEGORIES_PARTNER = ['account', 'listing', 'inquiry', 'payment'];
const CATEGORIES_EXECUTIVE = ['account', 'partners', 'attendance', 'earnings'];

export default function AdminPageContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('CONTENT_HELP_CUSTOMER');
  const currentTabInfo = TABS.find(t => t.key === activeTab);

  // Local state for editing to avoid laggy inputs
  const [helpData, setHelpData] = useState({
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
    response_time: '',
    faqs: []
  });

  const [privacyData, setPrivacyData] = useState({
    last_updated: '',
    intro: '',
    sections: []
  });

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['pageContent', activeTab],
    queryFn: () => api.get(`/admin/system/page-content?key=${activeTab}`).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (rawData?.data) {
      if (currentTabInfo.type === 'help') {
        setHelpData({
          contact_phone: rawData.data.contact_phone || '',
          contact_email: rawData.data.contact_email || '',
          contact_whatsapp: rawData.data.contact_whatsapp || '',
          response_time: rawData.data.response_time || '',
          faqs: rawData.data.faqs || []
        });
      } else {
        setPrivacyData({
          last_updated: rawData.data.last_updated || '',
          intro: rawData.data.intro || '',
          sections: rawData.data.sections || []
        });
      }
    }
  }, [rawData, activeTab, currentTabInfo.type]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/admin/system/page-content', payload),
    onSuccess: () => {
      toast.success('Content saved successfully');
      queryClient.invalidateQueries({ queryKey: ['pageContent', activeTab] });
    },
    onError: () => toast.error('Failed to save content'),
  });

  const handleSave = () => {
    const value = currentTabInfo.type === 'help' ? helpData : privacyData;
    saveMutation.mutate({ key: activeTab, value });
  };

  // Helper List Operations
  const handleAddFaq = () => {
    const newFaq = {
      question: '',
      answer: '',
      ...(activeTab === 'CONTENT_HELP_PARTNER' && { category: 'account' }),
      ...(activeTab === 'CONTENT_HELP_EXECUTIVE' && { category: 'account' })
    };
    setHelpData(prev => ({ ...prev, faqs: [...prev.faqs, newFaq] }));
  };

  const handleRemoveFaq = (index) => {
    setHelpData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, idx) => idx !== index)
    }));
  };

  const handleFaqChange = (index, field, val) => {
    setHelpData(prev => {
      const updated = [...prev.faqs];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, faqs: updated };
    });
  };

  const handleMoveFaq = (index, direction) => {
    const faqs = [...helpData.faqs];
    if (direction === 'up' && index > 0) {
      [faqs[index - 1], faqs[index]] = [faqs[index], faqs[index - 1]];
    } else if (direction === 'down' && index < faqs.length - 1) {
      [faqs[index + 1], faqs[index]] = [faqs[index], faqs[index + 1]];
    }
    setHelpData(prev => ({ ...prev, faqs }));
  };

  // Privacy Policy List Operations
  const handleAddSection = () => {
    const newSec = { title: '', content: '' };
    setPrivacyData(prev => ({ ...prev, sections: [...prev.sections, newSec] }));
  };

  const handleRemoveSection = (index) => {
    setPrivacyData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index)
    }));
  };

  const handleSectionChange = (index, field, val) => {
    setPrivacyData(prev => {
      const updated = [...prev.sections];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, sections: updated };
    });
  };

  const handleMoveSection = (index, direction) => {
    const sections = [...privacyData.sections];
    if (direction === 'up' && index > 0) {
      [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
    } else if (direction === 'down' && index < sections.length - 1) {
      [sections[index + 1], sections[index]] = [sections[index], sections[index + 1]];
    }
    setPrivacyData(prev => ({ ...prev, sections }));
  };

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Settings size={26} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">App Content Editor</h1>
          </div>
          <p className="text-slate-500 font-bold ml-1">Configure Help & Support and Privacy Policies across Basera Bazar apps.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center justify-center gap-2 bg-[#181d5f] hover:bg-[#252b75] text-white font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-indigo-900/10 disabled:opacity-50 active:scale-95 text-sm uppercase tracking-wider shrink-0"
        >
          <Save size={18} />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Main Container */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-4 shadow-xl shadow-slate-200/20 space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Configurations</p>
            {TABS.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-left group ${
                    activeTab === tab.key
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <TabIcon size={18} className={activeTab === tab.key ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'} />
                  <span className={`text-[13px] uppercase tracking-wider ${activeTab === tab.key ? 'font-black' : 'font-bold'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px] bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/10">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div
              layout
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 p-8 space-y-8"
            >
              {/* Form UI based on Type */}
              {currentTabInfo.type === 'help' ? (
                // --- HELP & SUPPORT EDITOR ---
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
                    <BookOpen size={20} className="text-indigo-600" />
                    Configure Help Contacts & FAQs
                  </h3>

                  {/* Contact Fields Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-400" />
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={helpData.contact_phone}
                        onChange={(e) => setHelpData(prev => ({ ...prev, contact_phone: e.target.value }))}
                        placeholder="e.g. 918969321391"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageCircle size={14} className="text-slate-400" />
                        WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={helpData.contact_whatsapp}
                        onChange={(e) => setHelpData(prev => ({ ...prev, contact_whatsapp: e.target.value }))}
                        placeholder="e.g. 918969321391"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Mail size={14} className="text-slate-400" />
                        Support Email
                      </label>
                      <input
                        type="email"
                        value={helpData.contact_email}
                        onChange={(e) => setHelpData(prev => ({ ...prev, contact_email: e.target.value }))}
                        placeholder="e.g. support@baserabazar.com"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        Response Time Text
                      </label>
                      <input
                        type="text"
                        value={helpData.response_time}
                        onChange={(e) => setHelpData(prev => ({ ...prev, response_time: e.target.value }))}
                        placeholder="e.g. under 2 hours"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* FAQs List */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-wider">Frequently Asked Questions ({helpData.faqs.length})</h4>
                      <button
                        onClick={handleAddFaq}
                        className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-black px-4 py-2 rounded-xl transition-all active:scale-95 text-[11px] uppercase tracking-wide border border-emerald-100"
                      >
                        <Plus size={14} /> Add FAQ
                      </button>
                    </div>

                    <div className="space-y-4">
                      {helpData.faqs.map((faq, index) => (
                        <div key={index} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 relative space-y-3">
                          {/* FAQ Controls */}
                          <div className="absolute right-4 top-4 flex items-center gap-1">
                            <button
                              onClick={() => handleMoveFaq(index, 'up')}
                              disabled={index === 0}
                              className="p-1 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-40"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => handleMoveFaq(index, 'down')}
                              disabled={index === helpData.faqs.length - 1}
                              className="p-1 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-40"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              onClick={() => handleRemoveFaq(index)}
                              className="p-1 bg-rose-50 border border-rose-100 text-rose-500 rounded-lg hover:bg-rose-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* FAQ Category Tag (For Partner/Executive only) */}
                          {(activeTab === 'CONTENT_HELP_PARTNER' || activeTab === 'CONTENT_HELP_EXECUTIVE') && (
                            <div className="space-y-1 max-w-[200px]">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                              <select
                                value={faq.category || ''}
                                onChange={(e) => handleFaqChange(index, 'category', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                              >
                                {(activeTab === 'CONTENT_HELP_PARTNER' ? CATEGORIES_PARTNER : CATEGORIES_EXECUTIVE).map(cat => (
                                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question</label>
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                              placeholder="e.g. How do I change my password?"
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Answer</label>
                            <textarea
                              rows={2}
                              value={faq.answer}
                              onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                              placeholder="Type answer details here..."
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none resize-none"
                            />
                          </div>
                        </div>
                      ))}

                      {helpData.faqs.length === 0 && (
                        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                          <HelpCircle size={32} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No FAQ items defined. Click Add FAQ to begin.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // --- PRIVACY POLICY EDITOR ---
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
                    <FileText size={20} className="text-indigo-600" />
                    Configure Privacy Policy Sections
                  </h3>

                  {/* Intro Fields */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Last Updated</label>
                      <input
                        type="text"
                        value={privacyData.last_updated}
                        onChange={(e) => setPrivacyData(prev => ({ ...prev, last_updated: e.target.value }))}
                        placeholder="e.g. January 2025"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Introduction text</label>
                      <textarea
                        rows={1}
                        value={privacyData.intro}
                        onChange={(e) => setPrivacyData(prev => ({ ...prev, intro: e.target.value }))}
                        placeholder="Introduction summary..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Sections List */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-wider">Policy Sections ({privacyData.sections.length})</h4>
                      <button
                        onClick={handleAddSection}
                        className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-black px-4 py-2 rounded-xl transition-all active:scale-95 text-[11px] uppercase tracking-wide border border-emerald-100"
                      >
                        <Plus size={14} /> Add Section
                      </button>
                    </div>

                    <div className="space-y-4">
                      {privacyData.sections.map((sec, index) => (
                        <div key={index} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 relative space-y-3">
                          {/* Controls */}
                          <div className="absolute right-4 top-4 flex items-center gap-1">
                            <button
                              onClick={() => handleMoveSection(index, 'up')}
                              disabled={index === 0}
                              className="p-1 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-40"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => handleMoveSection(index, 'down')}
                              disabled={index === privacyData.sections.length - 1}
                              className="p-1 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-40"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              onClick={() => handleRemoveSection(index)}
                              className="p-1 bg-rose-50 border border-rose-100 text-rose-500 rounded-lg hover:bg-rose-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section Title</label>
                            <input
                              type="text"
                              value={sec.title}
                              onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                              placeholder="e.g. 1. Data Collection"
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section Content</label>
                            <textarea
                              rows={3}
                              value={sec.content}
                              onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                              placeholder="Explain this policy section in detail..."
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none resize-none"
                            />
                          </div>
                        </div>
                      ))}

                      {privacyData.sections.length === 0 && (
                        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                          <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No policy sections defined. Click Add Section to begin.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
