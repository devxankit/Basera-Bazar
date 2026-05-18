import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Make React available globally in all test files (needed for JSX in Vitest)
globalThis.React = React;
globalThis.vi = vi;
