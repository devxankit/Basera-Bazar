import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import ExecutiveBottomNav from '../executive/ExecutiveBottomNav';
import { Toaster } from '../../mockToast';
import { ExecutiveProvider, useExecutive } from '../../context/ExecutiveContext';
import { useAuth } from '../../context/AuthContext';

const hideBottomNavPaths = [
  '/executive/login',
  '/executive/register',
  '/executive/signup',
  '/executive/payout'
];

const ExecutiveLayoutInner = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hideBottomNavOverride, accountDeleted } = useExecutive();
  const { logout } = useAuth();
  const shouldHideBottomNav = hideBottomNavPaths.some(path => location.pathname.startsWith(path)) || hideBottomNavOverride;

  const handleAccountDeletedOk = async () => {
    await logout();
    navigate('/executive/login', { replace: true });
  };

  return (
    <div className="min-h-screen mesh-gradient flex flex-col max-w-md mx-auto relative shadow-sm border-x border-slate-50 overflow-x-hidden font-outfit">
      <Toaster />
      <main className={`grow ${!shouldHideBottomNav ? 'pb-32' : ''}`}>
        {children}
      </main>
      {!shouldHideBottomNav && <ExecutiveBottomNav />}

      {accountDeleted && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertCircle size={28} className="text-rose-500" />
            </div>
            <h3 className="text-[18px] font-bold text-slate-900 mb-2">Account Not Found</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-7">
              Your account no longer exists in the system. Please contact your administrator for assistance.
            </p>
            <button
              onClick={handleAccountDeletedOk}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ExecutiveLayout = ({ children }) => {
  return (
    <ExecutiveProvider>
      <ExecutiveLayoutInner>{children}</ExecutiveLayoutInner>
    </ExecutiveProvider>
  );
};

export default ExecutiveLayout;
