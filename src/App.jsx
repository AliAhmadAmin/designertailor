import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppContent } from './AppLogic';

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
