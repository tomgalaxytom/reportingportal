import React, { useState, useEffect, useCallback } from 'react';
import {
  Select,
  Typography,
  Row,
  Col,
  Button,
  message,
  Skeleton,
} from 'antd';
import {
  SyncOutlined,
  MedicineBoxOutlined,
  RestOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import streamReportService from '../services/streamReportService';
import {
  getCurrentReportingMonth,
  getRecentReportingMonths,
  getSubmissionDeadline,
} from '../utils/formatters';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'Submitted') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          color: '#389e0d',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <CheckCircleFilled />
        Submitted
      </span>
    );
  }
  if (status === 'Returned') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: '#fff1f0',
          border: '1px solid #ffa39e',
          color: '#cf1322',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <ExclamationCircleFilled />
        Returned
      </span>
    );
  }
  if (status === 'Draft') {
    return (
      <span
        style={{
          display: 'inline-block',
          background: '#fff7e6',
          border: '1px solid #ffd591',
          color: '#d46b08',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        Draft — Saved
      </span>
    );
  }
  // Default: not submitted
  return (
    <span
      style={{
        display: 'inline-block',
        background: '#fffbe6',
        border: '1px solid #ffe58f',
        color: '#d48806',
        padding: '4px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      Draft — Not Submitted
    </span>
  );
}

export default function DistrictDashboardPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [reportingMonth, setReportingMonth] = useState(getCurrentReportingMonth());
  const recentMonths = getRecentReportingMonths(6);

  // Real-time stream statuses from backend
  const [streamStatuses, setStreamStatuses] = useState({
    ewaste_status: null,
    biomedical_status: null,
    plastic_status: null,
  });
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) setCurrentUser(user);
  }, []);

  const districtName = currentUser?.district_name || 'Ambattur';

  // ── Fetch district summary whenever month or district changes ──────────────
  const fetchSummary = useCallback(async () => {
    if (!districtName) return;
    setStatusLoading(true);
    try {
      const data = await streamReportService.getDistrictSummary(districtName, reportingMonth);
      setStreamStatuses({
        ewaste_status: data.ewaste_status,
        biomedical_status: data.biomedical_status,
        plastic_status: data.plastic_status,
      });
    } catch {
      // API unreachable — keep null (renders as Draft — Not Submitted)
      setStreamStatuses({ ewaste_status: null, biomedical_status: null, plastic_status: null });
    } finally {
      setStatusLoading(false);
    }
  }, [districtName, reportingMonth]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleLogout = () => {
    authService.logout();
    message.info('Logged out successfully.');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f5fa' }}>
      {/* Top Banner Bar styled after district.png */}
      <div
        style={{
          background: '#08284b',
          padding: '12px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.2px', color: '#ffffff' }}>
          CM Dashboard-TNEGA Portal — <span style={{ fontWeight: 500, opacity: 0.9 }}>District Office Dashboard</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.14)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              borderRadius: '20px',
              padding: '4px 14px',
              fontSize: '12px',
              color: '#ffffff',
              fontWeight: 500,
            }}
          >
            {districtName} DEE Office
          </div>
          <Button
            id="district-logout-btn"
            onClick={handleLogout}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#ffffff',
              borderRadius: '16px',
              fontSize: '12px',
              height: '30px',
              padding: '0 14px',
              cursor: 'pointer',
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Title and Month Selector Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 700,
              color: '#0e2b48',
              fontSize: '22px',
              letterSpacing: '-0.3px',
            }}
          >
            Your Waste Stream Reports
          </Title>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13.5px', color: '#475569', fontWeight: 500 }}>
              Reporting Month:
            </span>
            <Select
              id="dee-reporting-month-select"
              value={reportingMonth}
              onChange={setReportingMonth}
              style={{ width: 155 }}
            >
              {recentMonths.map((m) => (
                <Option key={m} value={m}>
                  {m}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Notice Alert Banner */}
        <div
          style={{
            background: '#fffbe6',
            border: '1px solid #ffd591',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            color: '#595959',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <ClockCircleOutlined style={{ color: '#d48806', fontSize: '15px' }} />
          <span>
            Data for <strong style={{ color: '#1f2937' }}>{reportingMonth}</strong> must be submitted by{' '}
            <strong style={{ color: '#1f2937' }}>{getSubmissionDeadline(reportingMonth)}</strong>. Submissions lock automatically after the
            deadline unless the Board reopens them.
          </span>
        </div>

        {/* 3 Waste Stream CM Dashboard Cards Grid matching district.png */}
        <Row gutter={[24, 24]}>
          {/* Card 1: E-Waste */}
          <Col xs={24} md={8}>
            <div
              id="dee-ewaste-card-btn"
              onClick={() => navigate('/district/e-waste')}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                padding: '28px 24px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(14, 58, 108, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
              }}
            >
              <div>
                {/* Icon Container */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#e6f4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0958d9',
                    fontSize: '20px',
                    marginBottom: '16px',
                  }}
                >
                  <SyncOutlined />
                </div>

                <Title
                  level={4}
                  style={{
                    color: '#0e2b48',
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '0 0 6px 0',
                  }}
                >
                  E-Waste CM Dashboard
                </Title>
                <div style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5, marginBottom: '22px' }}>
                  Collected & Recovered quantities by category
                </div>
              </div>

              <div>
                {statusLoading
                  ? <Skeleton.Button active size="small" style={{ width: 140, borderRadius: '20px' }} />
                  : <StatusBadge status={streamStatuses.ewaste_status} />}
              </div>
            </div>
          </Col>

          {/* Card 2: Bio-Medical Waste */}
          <Col xs={24} md={8}>
            <div
              id="dee-bmw-card-btn"
              onClick={() => navigate('/district/biomedical-waste')}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                padding: '28px 24px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(14, 58, 108, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
              }}
            >
              <div>
                {/* Icon Container */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#fff0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#cf1322',
                    fontSize: '20px',
                    marginBottom: '16px',
                  }}
                >
                  <MedicineBoxOutlined />
                </div>

                <Title
                  level={4}
                  style={{
                    color: '#0e2b48',
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '0 0 6px 0',
                  }}
                >
                  Bio-Medical Waste CM Dashboard
                </Title>
                <div style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5, marginBottom: '22px' }}>
                  Generated / Treated quantities (Kg/day)
                </div>
              </div>

              <div>
                {statusLoading
                  ? <Skeleton.Button active size="small" style={{ width: 140, borderRadius: '20px' }} />
                  : <StatusBadge status={streamStatuses.biomedical_status} />}
              </div>
            </div>
          </Col>

          {/* Card 3: Plastic Waste */}
          <Col xs={24} md={8}>
            <div
              id="dee-plastic-card-btn"
              onClick={() => navigate('/district/plastic-waste')}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                padding: '28px 24px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(14, 58, 108, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
              }}
            >
              <div>
                {/* Icon Container */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#e6fffa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#08979c',
                    fontSize: '20px',
                    marginBottom: '16px',
                  }}
                >
                  <RestOutlined />
                </div>

                <Title
                  level={4}
                  style={{
                    color: '#0e2b48',
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '0 0 6px 0',
                  }}
                >
                  Plastic Waste CM Dashboard
                </Title>
                <div style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5, marginBottom: '22px' }}>
                  PWM Inspection + Meendum Manjappai
                </div>
              </div>

              <div>
                {statusLoading
                  ? <Skeleton.Button active size="small" style={{ width: 140, borderRadius: '20px' }} />
                  : <StatusBadge status={streamStatuses.plastic_status} />}
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
