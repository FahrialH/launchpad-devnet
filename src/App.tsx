import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SolanaProvider } from './providers/SolanaProvider';
import { TokenPage } from './pages/TokenPage';
import { DirectoryPage } from './pages/DirectoryPage';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <SolanaProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DirectoryPage />} />
          <Route path="/:tokenSlug" element={<TokenPage />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SolanaProvider>
  );
};

export default App;
