import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, HelpCircle, 
  ChevronRight, MessageSquare, Phone, 
  Mail, MessageCircle, Info, ExternalLink,
  User, LayoutGrid, Zap, CreditCard,
  ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'All Topics', icon: <LayoutGrid size={20} />, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'account', label: 'Account', icon: <User size={20} />, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'listing', label: 'Listings', icon: <Zap size={20} />, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'inquiry', label: 'Inquiries', icon: <MessageSquare size={20} />, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'payment', label: 'Payments', icon: <CreditCard size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

const FAQ_DATA = [
  {
    category: 'listing',
    question: "How do I add a new service or product?",
    answer: "Navigate to your Home dashboard and click the 'Add Service' floating button. Fill in the details, upload photos, and your listing will be live instantly."
  },
  {
    category: 'account',
    question: "How can I update my business name?",
    answer: "Visit your Profile section and click the pencil icon next to your profile card. You can edit your name, email, phone, and business name there."
  },
  {
    category: 'inquiry',
    question: "Where are my customer inquiries located?",
    answer: "All leads and messages from users are stored in the 'Inquiries' tab on your Home dashboard. You will also receive real-time notifications for new leads."
  },
  {
    category: 'payment',
    question: "Are there any hidden charges?",
    answer: "Currently, Basera Bazar is in a free pre-launch phase. All basic partner features are free to use. Premium plans will be announced as we scale."
  },
  {
    category: 'account',
    question: "How do I verify my partner account?",
    answer: "Go to Profile > Settings > Account Verification. Upload your business license or ID proof. Our team will verify it within 24 working hours."
  },
  {
    category: 'listing',
    question: "Can I hide my listing temporarily?",
    answer: "Yes, you can toggle the status of any listing to 'Inactive' from your Inventory page to stop showing it to users without deleting it."
  }
];

export default function PartnerHelp() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFaqs = FAQ_DATA.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden bg-[#f8fafc] font-sans pb-20">
      {/* Immersive Hero Section */}
      <div className="relative h-[340px] bg-[#001b4e] overflow-hidden rounded-b-[60px] shadow-2xl">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-blue-400 rounded-full blur-[100px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, 30, 0] }}
            transition={{ duration: 18, repeat: Infinity }}
            className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500 rounded-full blur-[120px]" 
          />
        </div>

        <div className="relative z-10 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mt-2">
            <button 
              onClick={() => navigate('/partner/profile')}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white backdrop-blur-xl border border-white/10 transition-all active:scale-95"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/10">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="mt-8 xs:mt-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-[28px] xs:text-[32px] font-black leading-tight"
            >
              How can we <br /> <span className="text-blue-400 underline decoration-blue-500/30">help</span> you?
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-[12px] xs:text-[14px] mt-3 xs:mt-4 font-black uppercase tracking-widest"
            >
              Search for topics or browse below
            </motion.p>
          </div>

          {/* Glassmorphism Search */}
          <div className="mt-auto mb-[-32px] relative z-20 px-2">
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Ex: 'Listings', 'Verify account'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white rounded-[24px] py-5 pl-14 pr-6 text-[16px] shadow-2xl shadow-blue-900/20 border-none outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-[#001b4e] placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-16 space-y-10">
        {/* Topic Navigator */}
        <div className="space-y-4">
          <h2 className="text-[18px] font-bold text-[#001b4e] px-1">Browse Topics</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-6 py-4 rounded-3xl flex items-center gap-3 transition-all ${
                  selectedCategory === cat.id 
                  ? 'bg-[#001b4e] text-white shadow-xl shadow-blue-900/20 active:scale-95' 
                  : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-200 active:scale-95'
                }`}
              >
                <div className={`${selectedCategory === cat.id ? 'text-blue-400' : cat.color}`}>
                  {cat.icon}
                </div>
                <span className="text-[14px] font-bold whitespace-nowrap">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic FAQ Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[18px] font-bold text-[#001b4e]">Frequently Asked</h2>
            <div className="flex items-center gap-1.5 text-blue-500 bg-blue-50 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              <Zap size={12} fill="currentColor" />
              {filteredFaqs.length} Items
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, idx) => (
                  <motion.div 
                    layout
                    key={faq.question}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-white rounded-[28px] overflow-hidden border transition-all ${
                      activeFaq === idx ? 'border-blue-100 shadow-xl shadow-blue-900/5' : 'border-slate-100 shadow-sm'
                    }`}
                  >
                    <button 
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full p-6 flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full transition-all ${activeFaq === idx ? 'bg-blue-500 scale-125' : 'bg-slate-200'}`} />
                        <span className={`text-[15px] font-bold transition-colors ${activeFaq === idx ? 'text-blue-600' : 'text-[#001b4e]'}`}>
                          {faq.question}
                        </span>
                      </div>
                      <div className={`p-1 rounded-full transition-all ${activeFaq === idx ? 'bg-blue-50 text-blue-500 rotate-90' : 'text-slate-300'}`}>
                        <ChevronRight size={20} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {activeFaq === idx && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 pb-6"
                        >
                          <div className="pt-2 border-t border-slate-50 text-[14px] text-slate-500 leading-relaxed">
                            {faq.answer}
                          </div>
                          <button className="mt-4 text-blue-500 text-[13px] font-bold flex items-center gap-1.5 hover:gap-2 transition-all">
                            Learn More <ArrowUpRight size={14} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-slate-200" />
                  </div>
                  <h3 className="text-[#001b4e] text-[17px] font-bold">No results found</h3>
                  <p className="text-slate-400 text-[13px] mt-1">Try searching with different keywords</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Reimagined Support Suite */}
        <div className="space-y-5">
          <div className="px-1">
            <h2 className="text-[18px] font-bold text-[#001b4e]">Get Direct Support</h2>
            <p className="text-slate-400 text-[13px] font-medium mt-1">Our team is available 24/7 for you.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 xs:gap-4">
            <SupportCard 
              icon={<MessageCircle size={24} xs:size={28} className="text-green-500" />} 
              label="WhatsApp" 
              sub="Chat with us"
              primary={true}
              onClick={() => window.open('https://wa.me/918969321391', '_blank')}
            />
            <SupportCard 
              icon={<Phone size={24} xs:size={28} className="text-blue-500" />} 
              label="Hotline" 
              sub="Direct call"
              primary={false}
              onClick={() => window.open('tel:+918969321391', '_blank')}
            />
          </div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="w-full bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[36px] p-8 relative overflow-hidden group cursor-pointer"
            onClick={() => window.open('mailto:support@baserabazar.com')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-all duration-700" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md mb-4 border border-white/20">
                <Mail size={32} className="text-white" />
              </div>
              <h3 className="text-white text-[20px] font-bold uppercase tracking-tight">Email Concierge</h3>
              <p className="text-white/60 text-[13px] mt-1">Typical response within 2 working hours</p>
              <div className="mt-6 flex items-center gap-2 bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-bold text-[15px] shadow-xl group-active:scale-95 transition-all">
                Submit Ticket <ExternalLink size={16} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SupportCard({ icon, label, sub, primary, onClick }) {
  return (
    <motion.button 
      whileHover={{ y: -5 }}
      active={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-6 rounded-[36px] border flex flex-col gap-4 text-left transition-all ${
        primary 
        ? 'bg-white border-slate-100 shadow-sm shadow-slate-200/50' 
        : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50'
      }`}
    >
      <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner`}>
        {icon}
      </div>
      <div>
        <div className="text-[#001b4e] text-[16px] font-bold">{label}</div>
        <div className="text-slate-400 text-[12px] font-medium mt-1">{sub}</div>
      </div>
    </motion.button>
  );
}
