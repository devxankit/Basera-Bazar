import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, ChevronRight, CheckCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_DATA = [
  {
    category: 'General',
    items: [
      {
        question: "What is Basera Bazar?",
        answer: "Basera Bazar is a local marketplace connecting home buyers, renters, and builders in Bihar with verified property agents, service providers, suppliers, and mandi sellers."
      },
      {
        question: "Is Basera Bazar free to use?",
        answer: "Yes, browsing listings and sending enquiries is completely free for users. Some premium features may require a subscription in the future."
      },
      {
        question: "Which cities does Basera Bazar cover?",
        answer: "We are currently focused on Bihar — Muzaffarpur, Patna, Darbhanga, Bhagalpur, and more districts. We are expanding rapidly."
      },
    ]
  },
  {
    category: 'Properties',
    items: [
      {
        question: "How do I search for a property?",
        answer: "Go to the Properties section on the home screen. Use filters to narrow by city, price range, BHK, and property type."
      },
      {
        question: "How do I contact a property owner or agent?",
        answer: "Open any property listing and tap 'Enquire Now'. You can also call or WhatsApp the agent directly from the listing page."
      },
      {
        question: "Are all listings verified?",
        answer: "All partner accounts go through our verification process. Listings marked 'Verified' have been reviewed by our team."
      },
    ]
  },
  {
    category: 'Orders & Mandi',
    items: [
      {
        question: "How do I order building materials?",
        answer: "Open the Mandi Bazar section, browse materials by category, add items to your cart, and checkout. Your order goes directly to the supplier."
      },
      {
        question: "Can I track my mandi order?",
        answer: "Yes. Go to Profile → My Orders to see real-time status updates for all your orders."
      },
      {
        question: "What is the return or cancellation policy?",
        answer: "Cancellations can be made within 2 hours of placing an order. Contact the supplier or our support team for returns."
      },
    ]
  },
  {
    category: 'Account',
    items: [
      {
        question: "How do I update my profile?",
        answer: "Tap the edit icon on your Profile page to update your name, phone, email, and location."
      },
      {
        question: "How do I delete my account?",
        answer: "Contact us at support@baserabazar.com or via WhatsApp and our team will process your deletion request within 7 business days."
      },
    ]
  },
];

export default function FAQs() {
  const navigate = useNavigate();
  const [openKey, setOpenKey] = useState(null);
  const [query, setQuery] = useState('');

  const q = query.toLowerCase();
  const filtered = FAQ_DATA.map(section => ({
    ...section,
    items: section.items.filter(i =>
      !q || i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q)
    )
  })).filter(s => s.items.length > 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-4 sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest">FAQs</h2>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium outline-none focus:border-blue-200 placeholder:text-slate-300"
          />
        </div>
      </div>

      <div className="px-5 pt-5 space-y-6">
        {filtered.length === 0 ? (
          <div className="py-20 text-center space-y-3 opacity-40">
            <HelpCircle size={48} className="mx-auto text-slate-300" />
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">No results found</p>
          </div>
        ) : filtered.map(section => (
          <div key={section.category} className="space-y-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{section.category}</h3>
            {section.items.map((faq, idx) => {
              const key = `${section.category}-${idx}`;
              return (
                <div key={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenKey(openKey === key ? null : key)}
                    className="w-full flex items-center justify-between px-4 py-4 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <HelpCircle size={15} className="text-orange-400 shrink-0" />
                      <span className="text-[13px] font-bold text-[#001b4e] leading-snug">{faq.question}</span>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-slate-300 shrink-0 transition-transform ${openKey === key ? 'rotate-90' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openKey === key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 flex gap-3">
                          <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-[13px] text-slate-500 leading-relaxed">{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
