import React, { useState } from 'react';
import {
  ArrowLeft, Phone, Mail, MessageCircle, ChevronRight,
  HelpCircle, Clock, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_DATA = [
  {
    question: "How do I enquire about a property or service?",
    answer: "Open the listing you're interested in and tap the 'Enquire Now' or 'Contact' button. Fill in your details and your enquiry goes directly to the provider."
  },
  {
    question: "How do I track my enquiries?",
    answer: "Go to Profile → My Enquiries to see all the enquiries you have sent, along with their status."
  },
  {
    question: "Can I place an order for mandi products?",
    answer: "Yes! Add items to your cart from the Mandi Bazar section and checkout. You can track your orders from Profile → My Orders."
  },
  {
    question: "How do I update my profile details?",
    answer: "Tap the edit icon on your Profile page to update your name, phone number, email, and location."
  },
  {
    question: "Is Basera Bazar available across India?",
    answer: "We are currently focused on Bihar and expanding rapidly to other states. Stay tuned for updates."
  },
  {
    question: "How do I report a problem or fraudulent listing?",
    answer: "Contact our support team via WhatsApp or email with the listing details and we'll investigate promptly."
  },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-4 sticky top-0 z-50 border-b border-slate-100 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest">Help & Support</h2>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Contact options */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Contact Us</h3>
          <a
            href="tel:+919876543210"
            className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Phone size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-[#001b4e]">Call Support</p>
              <p className="text-[12px] text-slate-400 font-medium">Mon–Sat, 9 AM – 6 PM</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </a>

          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-[#001b4e]">WhatsApp Support</p>
              <p className="text-[12px] text-slate-400 font-medium">Quick response guaranteed</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </a>

          <a
            href="mailto:support@baserabazar.com"
            className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Mail size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-[#001b4e]">Email Us</p>
              <p className="text-[12px] text-slate-400 font-medium">support@baserabazar.com</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </a>
        </div>

        {/* Response time banner */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Clock size={18} className="text-orange-500 shrink-0" />
          <p className="text-[12px] text-orange-700 font-medium leading-snug">
            Average response time is <strong>under 2 hours</strong> on business days.
          </p>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Frequently Asked</h3>
          {FAQ_DATA.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-4 text-left"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <HelpCircle size={16} className="text-orange-400 shrink-0" />
                  <span className="text-[13px] font-bold text-[#001b4e] leading-snug">{faq.question}</span>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-slate-300 shrink-0 transition-transform ${openIdx === idx ? 'rotate-90' : ''}`}
                />
              </button>
              <AnimatePresence>
                {openIdx === idx && (
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
          ))}
        </div>
      </div>
    </div>
  );
}
