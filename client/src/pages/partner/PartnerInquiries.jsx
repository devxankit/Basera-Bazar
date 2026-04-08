import React from 'react';
import { 
  Inbox, 
  ArrowLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PartnerInquiries() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/partner/home')}
            className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[20px] font-medium text-[#001b4e]">Inquiries</h2>
        </div>
      </div>

      {/* Main Content - Empty State */}
      <main className="flex-grow flex flex-col items-center justify-center p-8 text-center -mt-20">
        <div className="mb-8 p-10 bg-slate-50 rounded-[40px]">
          <Inbox size={100} className="text-slate-200" />
        </div>
        
        <h3 className="text-[22px] font-medium text-slate-600 mb-2">No inquiries yet</h3>
        <p className="text-slate-400 text-[15px] mb-10 max-w-[280px] leading-relaxed">
          Inquiries from customers will appear here
        </p>
      </main>
    </div>
  );
}
