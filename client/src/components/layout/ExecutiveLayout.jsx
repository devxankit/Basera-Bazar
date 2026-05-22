import React from 'react';
import { useLocation } from 'react-router-dom';
import ExecutiveBottomNav from '../executive/ExecutiveBottomNav';
import { Toaster } from '../../mockToast';
import { ExecutiveProvider, useExecutive } from '../../context/ExecutiveContext';

const hideBottomNavPaths = [
  '/executive/login',
  '/executive/register',
  '/executive/signup',
  '/executive/payout'
];

const ExecutiveLayoutInner = ({ children }) => {
  const location = useLocation();
  const { hideBottomNavOverride } = useExecutive();
  const shouldHideBottomNav = hideBottomNavPaths.some(path => location.pathname.startsWith(path)) || hideBottomNavOverride;

  return (
    <div className="min-h-screen mesh-gradient flex flex-col max-w-md mx-auto relative shadow-sm border-x border-slate-50 overflow-x-hidden font-outfit">
      <Toaster />
      <main className={`grow ${!shouldHideBottomNav ? 'pb-32' : ''}`}>
        {children}
      </main>
      {!shouldHideBottomNav && <ExecutiveBottomNav />}
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
