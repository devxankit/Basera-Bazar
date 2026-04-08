import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PartnerBottomNav from '../../components/partner/PartnerBottomNav';

export default function PartnerLayout({ children }) {
  const [role, setRole] = useState('agent'); // Default
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const data = sessionStorage.getItem('activePartner');
    if (data) {
      const parsed = JSON.parse(data);
      setRole(parsed.role);
    } else {
      // If not logged in and trying to access partner pages (other than auth), redirect or use default
      // For this simulation, we'll just use 'agent' as default if not set
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden">
      <main className="flex-grow">
        {children}
      </main>
      
      {!location.pathname.includes('/partner/subscription') && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] max-w-md mx-auto w-full border-t border-slate-100/50">
          <PartnerBottomNav role={role} />
        </div>
      )}
    </div>
  );
}
