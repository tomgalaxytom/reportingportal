import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import DistrictDashboardPage from './pages/DistrictDashboardPage';
import EWasteEntryPage from './pages/EWasteEntryPage';
import BioMedicalWasteEntryPage from './pages/BioMedicalWasteEntryPage';
import PlasticWasteEntryPage from './pages/PlasticWasteEntryPage';
import BoardDashboardPage from './pages/BoardDashboardPage';
import BoardConsolidatedPage from './pages/BoardConsolidatedPage';
import HealthPage from './pages/HealthPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

const { Content } = Layout;

function MainAppLayout() {
  const location = useLocation();

  // Hide the public portal Navbar & Footer on Dashboard, Entry, and Login pages
  const isInternalOrAuthPage =
    location.pathname.startsWith('/district') ||
    location.pathname === '/board-dashboard' ||
    location.pathname.startsWith('/board/') ||
    location.pathname === '/login';

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f7fa' }}>
      {!isInternalOrAuthPage && <Navbar />}
      <Content style={{ flex: '1 0 auto' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/district-dashboard" element={<DistrictDashboardPage />} />
          <Route path="/district-entry" element={<DistrictDashboardPage />} />
          <Route path="/district/e-waste" element={<EWasteEntryPage />} />
          <Route path="/district/biomedical-waste" element={<BioMedicalWasteEntryPage />} />
          <Route path="/district/plastic-waste" element={<PlasticWasteEntryPage />} />
          <Route path="/board-dashboard" element={<BoardDashboardPage />} />
          <Route path="/board/consolidated" element={<BoardConsolidatedPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Content>
      {!isInternalOrAuthPage && <Footer />}
    </Layout>
  );
}

export default function App() {
  const baseUrl = import.meta.env.BASE_URL || '/';

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0b4f8a',
          colorLink: '#0b4f8a',
          borderRadius: 6,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      }}
    >
      <BrowserRouter basename={baseUrl}>
        <MainAppLayout />
      </BrowserRouter>
    </ConfigProvider>
  );
}
