import { useEffect } from 'react';

// Module-level counter so multiple modals can stack correctly.
// When count > 0 the body is locked; when it reaches 0 it is unlocked.
let lockCount = 0;
let savedScrollY = 0;

function lockBody() {
  savedScrollY = window.scrollY;
  const body = document.body;
  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.overflow = 'hidden';
}

function unlockBody() {
  const body = document.body;
  body.style.position = '';
  body.style.top = '';
  body.style.left = '';
  body.style.right = '';
  body.style.overflow = '';
  window.scrollTo(0, savedScrollY);
}

export function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    lockCount += 1;
    if (lockCount === 1) lockBody();

    return () => {
      lockCount -= 1;
      if (lockCount === 0) unlockBody();
    };
  }, [isLocked]);
}
