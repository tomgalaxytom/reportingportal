import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Input, Button, message, Spin } from 'antd';
import { EditOutlined, LockOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import streamReportService from '../services/streamReportService';
import { getCurrentReportingMonth, formatDate } from '../utils/formatters';

const { Title } = Typography;

const FIELD_KEYS_T1 = [
  'collected_it_telecom',
  'collected_electrical',
  'collected_toys',
  'collected_medical',
  'collected_others',
];
const FIELD_KEYS_T2 = [
  'recovered_it_telecom',
  'recovered_electrical',
  'recovered_toys',
  'recovered_medical',
  'recovered_others',
];

const CATEGORIES = [
  'IT & Telecom',
  'Electrical & Electronics',
  'Toys, Leisure & Sports Equipment',
  'Medical Devices, Equipment & Lab Instruments',
  'Other types',
];

function buildInitialRows(keys, categories, record) {
  return categories.map((cat, i) => ({
    sno: i + 1,
    category: cat,
    quantity: record?.[keys[i]] ?? '0',
  }));
}

export default function EWasteEntryPage() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const districtName = currentUser?.district_name || 'Ambattur';
  const officerEmail = currentUser?.officer_email || '';
  const [reportingMonth] = useState(getCurrentReportingMonth());

  // DB-driven state
  const [reportId, setReportId] = useState(null);
  const [reportStatus, setReportStatus] = useState('Draft');
  const [submittedAt, setSubmittedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Table data
  const [table1Data, setTable1Data] = useState(buildInitialRows(FIELD_KEYS_T1, CATEGORIES, null));
  const [table2Data, setTable2Data] = useState(buildInitialRows(FIELD_KEYS_T2, CATEGORIES, null));

  const isLocked = reportStatus === 'Submitted';

  // ── Load existing report on mount ────────────────────────────────────────
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await streamReportService.getEWasteReport(districtName, reportingMonth);
      if (data) {
        setReportId(data.id);
        setReportStatus(data.status || 'Draft');
        setSubmittedAt(data.submitted_at || null);
        setTable1Data(buildInitialRows(FIELD_KEYS_T1, CATEGORIES, data));
        setTable2Data(buildInitialRows(FIELD_KEYS_T2, CATEGORIES, data));
      }
    } catch (err) {
      // 404/null means no record yet — stay with defaults
    } finally {
      setLoading(false);
    }
  }, [districtName, reportingMonth]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // ── Build payload from current table state ───────────────────────────────
  const buildPayload = (status) => ({
    district_name: districtName,
    officer_email: officerEmail,
    reporting_month: reportingMonth,
    status,
    collected_it_telecom: table1Data[0].quantity,
    collected_electrical: table1Data[1].quantity,
    collected_toys: table1Data[2].quantity,
    collected_medical: table1Data[3].quantity,
    collected_others: table1Data[4].quantity,
    recovered_it_telecom: table2Data[0].quantity,
    recovered_electrical: table2Data[1].quantity,
    recovered_toys: table2Data[2].quantity,
    recovered_medical: table2Data[3].quantity,
    recovered_others: table2Data[4].quantity,
  });

  const handleTable1Change = (index, val) => {
    setTable1Data((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: val };
      return next;
    });
  };

  const handleTable2Change = (index, val) => {
    setTable2Data((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: val };
      return next;
    });
  };

  // ── Save Draft ───────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const result = await streamReportService.saveEWasteReport(buildPayload('Draft'));
      setReportId(result.id);
      setReportStatus('Draft');
      message.success('E-Waste draft saved to database successfully.');
    } catch (err) {
      message.error(err?.message || 'Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await streamReportService.saveEWasteReport(buildPayload('Submitted'));
      setReportId(result.id);
      setReportStatus('Submitted');
      setSubmittedAt(result.submitted_at);
      message.success('E-Waste report submitted to Board Section successfully!');
    } catch (err) {
      message.error(err?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status badge styles ───────────────────────────────────────────────────
  const statusBadge =
    isLocked
      ? { bg: '#f6ffed', border: '#b7eb8f', color: '#389e0d' }
      : { bg: '#fffbe6', border: '#ffe58f', color: '#d48806' };

  const renderTableRow = (row, idx, onChange, t1) => (
    <div
      key={row.sno}
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 180px 40px',
        alignItems: 'center',
        padding: '12px',
        borderBottom: idx === 4 ? 'none' : '1px solid #f1f5f9',
        fontSize: '13.5px',
        background: isLocked ? '#fafafa' : '#fff',
        transition: 'background 0.2s',
      }}
    >
      <div style={{ color: '#64748b' }}>{row.sno}</div>
      <div style={{ color: '#1e293b', fontWeight: 500 }}>{row.category}</div>
      <div>
        <Input
          value={row.quantity}
          disabled={isLocked}
          onChange={(e) => onChange(idx, e.target.value)}
          style={{
            borderRadius: '6px',
            height: '34px',
            borderColor: isLocked ? '#e2e8f0' : '#cbd5e1',
            fontSize: '13.5px',
            background: isLocked ? '#f1f5f9' : '#f8fafc',
            color: isLocked ? '#64748b' : '#1e293b',
            cursor: isLocked ? 'not-allowed' : 'text',
          }}
        />
      </div>
      <div style={{ textAlign: 'center', color: isLocked ? '#94a3b8' : '#0958d9' }}>
        {isLocked ? <LockOutlined style={{ fontSize: '14px' }} /> : <EditOutlined style={{ fontSize: '14px' }} />}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f5fa' }}>
      {/* Top Banner */}
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
          CM Dashboard-TNEGA Portal — <span style={{ fontWeight: 500, opacity: 0.9 }}>E-Waste Entry</span>
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
            id="back-to-dashboard-btn"
            onClick={() => navigate('/district-dashboard')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#ffffff',
              borderRadius: '16px',
              fontSize: '12px',
              height: '30px',
              padding: '0 14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
        <Spin spinning={loading} tip="Loading report data...">
          {/* Title and Status Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px',
            }}
          >
            <div>
              <Title
                level={3}
                style={{
                  margin: '0 0 4px 0',
                  fontWeight: 700,
                  color: '#0e2b48',
                  fontSize: '22px',
                  letterSpacing: '-0.3px',
                }}
              >
                E-Waste CM Dashboard — {reportingMonth}
              </Title>
              <div style={{ color: '#64748b', fontSize: '13px' }}>
                DEE Office: {districtName} · Status: {reportStatus}
                {reportId && <span style={{ marginLeft: '8px', color: '#94a3b8' }}>#{reportId}</span>}
              </div>
            </div>

            <span
              style={{
                background: statusBadge.bg,
                border: `1px solid ${statusBadge.border}`,
                color: statusBadge.color,
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {isLocked && <CheckCircleFilled />}
              {reportStatus}
            </span>
          </div>

          {/* Lock indicator banner */}
          {isLocked && (
            <div
              style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '8px',
                padding: '10px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#389e0d',
                fontWeight: 500,
              }}
            >
              <LockOutlined />
              Report submitted and locked on{' '}
              <strong>
                {submittedAt ? new Date(submittedAt).toLocaleString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                }) : '—'}
              </strong>
              . Contact the Board Section to unlock for corrections.
            </div>
          )}

          {/* Card 1: Table 1 — E-Waste Collected */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              padding: '24px 28px',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0e2b48', marginBottom: '18px' }}>
              Table 1 — E-Waste Collected (Kg)
            </div>

            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 180px 40px',
                padding: '8px 12px',
                borderBottom: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              <div>S.NO</div>
              <div>CATEGORY</div>
              <div>QUANTITY (KG)</div>
              <div />
            </div>

            {table1Data.map((row, idx) => renderTableRow(row, idx, handleTable1Change, true))}
          </div>

          {/* Card 2: Table 2 — E-Waste Recovered */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              padding: '24px 28px',
              marginBottom: '28px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0e2b48', marginBottom: '18px' }}>
              Table 2 — E-Waste Recovered (Kg)
            </div>

            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 180px 40px',
                padding: '8px 12px',
                borderBottom: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              <div>S.NO</div>
              <div>CATEGORY</div>
              <div>QUANTITY (KG)</div>
              <div />
            </div>

            {table2Data.map((row, idx) => renderTableRow(row, idx, handleTable2Change, false))}
          </div>

          {/* Action Buttons Row */}
          {!isLocked && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                id="save-draft-btn"
                onClick={handleSaveDraft}
                loading={saving}
                style={{
                  height: '38px',
                  padding: '0 20px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  background: '#ffffff',
                }}
              >
                Save Draft
              </Button>
              <Button
                id="submit-ewaste-btn"
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
                style={{
                  height: '38px',
                  padding: '0 22px',
                  borderRadius: '6px',
                  background: '#08284b',
                  borderColor: '#08284b',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  boxShadow: '0 2px 8px rgba(8, 40, 75, 0.25)',
                }}
              >
                Submit ✓
              </Button>
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
}
