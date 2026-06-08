import React, { useState } from 'react';
import {
  ArrowLeft, Search, HelpCircle,
  ChevronRight, MessageSquare, Phone,
  Mail, MessageCircle, LayoutGrid,
  User, CreditCard, MapPin, Briefcase,
  ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const CATEGORIES = [
  { id: 'all', label: 'All Topics', icon: <LayoutGrid size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'account', label: 'Account', icon: <User size={18} />, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'partners', label: 'Partners', icon: <Briefcase size={18} />, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'attendance', label: 'Attendance', icon: <MapPin size={18} />, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'earnings', label: 'Earnings', icon: <CreditCard size={18} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

const FAQ_DATA = [
  {
    category: 'partners',
    question: "How do I onboard a new partner?",
    answer: "Navigate to the Partners section from your dashboard. Tap the 'Add Partner' button, fill in the partner's business details, and submit for verification. You'll receive commission once they are approved."
  },
  {
    category: 'account',
    question: "How do I update my profile details?",
    answer: "Go to your Profile page and tap the edit icon. You can update your name, phone number, email, and bank details for payouts."
  },
  {
    category: 'attendance',
    question: "How does the attendance system work?",
    answer: "Attendance is tracked via GPS check-in from your dashboard. Make sure your location services are enabled. Check in at the start of your work and check out when done."
  },
  {
    category: 'earnings',
    question: "When do I receive my earnings?",
    answer: "Earnings from partner onboarding commissions are credited to your wallet. You can request a payout from the Wallet section. Payouts are processed within 3-5 business days."
  },
  {
    category: 'account',
    question: "What happens during verification?",
    answer: "After signing up, your Aadhaar and other documents are verified by the admin team. You'll be notified once your account is approved. Verification typically takes 24-48 hours."
  },
  {
    category: 'partners',
    question: "Can I see the status of partners I onboarded?",
    answer: "Yes! Go to the Partners section in your dashboard to see all partners you've onboarded, their verification status, and your earned commissions."
  },
];

export default function ExecutiveSupport() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: rawData } = useQuery({
    queryKey: ['helpExecutive'],
    queryFn: () => api.get('/admin/system/page-content?key=CONTENT_HELP_EXECUTIVE').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const content = rawData?.data || {};
  const contactPhone = content.contact_phone || '918969321391';
  const contactEmail = content.contact_email || 'support@baserabazar.com';
  const contactWhatsapp = content.contact_whatsapp || '918969321391';
  const responseTime = content.response_time || 'under 2 hours';
  const faqs = content.faqs || FAQ_DATA;

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-20" style={{ overflowX: 'clip' }}>
      {/* Immersive Hero Section */}
      <div className="relative bg-[#001b4e] overflow-hidden rounded-b-3xl shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <motion.div
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-blue-400 rounded-full blur-[100px]"
          />
        </div>

        <div className="relative z-10 p-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white backdrop-blur-xl border border-white/10 transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-md border border-white/10">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="mt-4 mb-4 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-[22px] font-black leading-tight uppercase tracking-widest"
            >
              Support <span className="text-blue-400 underline decoration-blue-500/30">Center</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 text-[9px] mt-2 font-black uppercase tracking-[0.25em]"
            >
              Support for Field Executives
            </motion.p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative z-20 px-7 pb-6">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search Topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-xl py-3.5 pl-12 pr-6 text-[13px] shadow-2xl shadow-blue-900/10 border-none outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-black text-[#001b4e] placeholder:text-slate-200 uppercase tracking-tight"
            />
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-8">
        {/* Topic Navigator */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-1">Browse Categories</h2>
          <div className="flex gap-2.5 overflow-x-auto pb-3 no-scrollbar -mx-5 px-5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all ${
                  selectedCategory === cat.id
                  ? 'bg-[#001b4e] text-white shadow-lg shadow-blue-900/10 active:scale-95'
                  : 'bg-white text-slate-400 border border-slate-100 active:scale-95'
                }`}
              >
                <div className={`${selectedCategory === cat.id ? 'text-blue-400' : cat.color}`}>
                  {cat.icon}
                </div>
                <span className="text-[11px] font-bold whitespace-nowrap uppercase tracking-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Common Questions</h2>
            <div className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">
              {filteredFaqs.length} Items
            </div>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, idx) => (
                  <motion.div
                    layout
                    key={faq.question}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={`bg-white rounded-xl overflow-hidden border transition-all ${
                      activeFaq === idx ? 'border-blue-100 shadow-xl shadow-blue-900/5' : 'border-slate-50 shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeFaq === idx ? 'bg-blue-500 scale-125' : 'bg-slate-200'}`} />
                        <span className={`text-[13px] font-bold transition-colors ${activeFaq === idx ? 'text-blue-600' : 'text-[#001b4e] uppercase tracking-tight'}`}>
                          {faq.question}
                        </span>
                      </div>
                      <ChevronRight size={16} className={`transition-all ${activeFaq === idx ? 'text-blue-500 rotate-90' : 'text-slate-300'}`} />
                    </button>
                    <AnimatePresence>
                      {activeFaq === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4"
                        >
                          <div className="pt-2 border-t border-slate-50 text-[12px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="py-10 text-center opacity-30">
                  <Search size={32} className="mx-auto mb-2" />
                  <h3 className="text-[14px] font-black uppercase tracking-widest">No Results</h3>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Support Suite */}
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Direct Assistance</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SupportCard
              icon={<MessageCircle size={22} className="text-emerald-500" />}
              label="WhatsApp"
              sub="Chat Now"
              onClick={() => window.open(`https://wa.me/${contactWhatsapp}`, '_blank')}
            />
            <SupportCard
              icon={<Phone size={22} className="text-blue-500" />}
              label="Hotline"
              sub={`+${contactPhone}`}
              onClick={() => window.open(`tel:+${contactPhone}`, '_blank')}
            />
          </div>

          <motion.div
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#001b4e] rounded-xl p-5 relative overflow-hidden group cursor-pointer shadow-xl shadow-blue-900/10"
            onClick={() => window.open(`mailto:${contactEmail}`)}
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md">
                  <Mail size={20} className="text-white" />
                </div>
                <div>
                   <h3 className="text-white text-[14px] font-black uppercase tracking-widest">Email Support</h3>
                   <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-0.5">{contactEmail} ({responseTime})</p>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-white/20" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SupportCard({ icon, label, sub, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 rounded-xl border border-slate-100 flex flex-col gap-3 text-left transition-all bg-white shadow-sm"
    >
      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-[#001b4e] text-[13px] font-black uppercase tracking-tight leading-none">{label}</div>
        <div className="text-slate-300 text-[9px] font-black mt-1.5 uppercase tracking-widest opacity-60">{sub}</div>
      </div>
    </motion.button>
  );
}
