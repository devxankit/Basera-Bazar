import React from 'react';
import { useLocation } from 'react-router-dom';
import ExecutiveBottomNav from '../executive/ExecutiveBottomNav';
import { Toaster } from '../../mockToast';

const ExecutiveLayout = ({ children }) => {
  const location = useLocation();
  
  // Define paths where BottomNav should be hidden
  const hideBottomNavPaths = [
    '/executive/login',
    '/executive/register',
    '/executive/signup',
    '/executive/payout'
  ];
  
  const shouldHideBottomNav = hideBottomNavPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen mesh-gradient flex flex-col max-w-md mx-auto relative shadow-sm border-x border-slate-50 overflow-x-hidden font-outfit">
      <Toaster />
      <main className={`flex-grow ${!shouldHideBottomNav ? 'pb-32' : ''}`}>
        {children}
      </main>
      
      {!shouldHideBottomNav && <ExecutiveBottomNav />}
    </div>
  );
};

export default ExecutiveLayout;
