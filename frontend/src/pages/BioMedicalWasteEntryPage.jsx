import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Input, Button, message, Spin } from 'antd';
import { EditOutlined, LockOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import streamReportService from '../services/streamReportService';
import { getCurrentReportingMonth } from '../utils/formatters';

const { Title } = Typography;

export default function BioMedicalWasteEntryPage() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const districtName = currentUser?.district_name || 'Ambattur';
  const officerEmail = currentUser?.officer_email || '';
  const [reportingMonth] = useState(getCurrentReportingMonth());

  // DB-driven state
  const [reportId, setReportId] = useState(null);
  const [reportStatus, setReportStatus] = useState('Draft');
  const [submittedAt, setSubmittedAt] = useState(null);
  const [boardRemarks, setBoardRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data — user-editable fields
  const [formData, setFormData] = useState({
    generated: '0',
    incinerator: '0',
    autoclave: '0',
  });

  // Derived calculations (frontend live)
  const generatedNum = parseFloat(formData.generated) || 0;
  const incineratorNum = parseFloat(formData.incinerator) || 0;
  const autoclaveNum = parseFloat(formData.autoclave) || 0;
  const totalTreated = incineratorNum + autoclaveNum;
  const difference = generatedNum - totalTreated;

  const isLocked = reportStatus === 'Submitted';
  const isReturned = reportStatus === 'Returned';

  // ── Load existing BMW report on mount ─────────────────────────────────────
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await streamReportService.getBMWReport(districtName, reportingMonth);
      if (data) {
        setReportId(data.id);
        setReportStatus(data.status || 'Draft');
        setSubmittedAt(data.submitted_at || null);
        setBoardRemarks(data.board_remarks || '');
        setFormData({
          generated: data.generated_qty ?? '0',
          incinerator: data.incinerator_treated_qty ?? '0',
          autoclave: data.autoclave_treated_qty ?? '0',
        });
      }
    } catch {
      // No record yet — keep defaults
    } finally {
      setLoading(false);
    }
  }, [districtName, reportingMonth]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // ── Build API payload ────────────────────────────────────────────────────
  const buildPayload = (status) => ({
    district_name: districtName,
    officer_email: officerEmail,
    reporting_month: reportingMonth,
    status,
    generated_qty: formData.generated,
    incinerator_treated_qty: formData.incinerator,
    autoclave_treated_qty: formData.autoclave,
    // total_treated_qty & difference_qty are calculated on the backend
  });

  // ── Save Draft ───────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const result = await streamReportService.saveBMWReport(buildPayload('Draft'));
      setReportId(result.id);
      setReportStatus('Draft');
      message.success('Bio-Medical Waste draft saved to database successfully.');
    } catch (err) {
      message.error(err?.message || 'Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Submit / Resubmit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await streamReportService.saveBMWReport(buildPayload('Submitted'));
      setReportId(result.id);
      setReportStatus('Submitted');
      setSubmittedAt(result.submitted_at);
      message.success('Bio-Medical Waste report submitted to Board Section successfully!');
    } catch (err) {
      message.error(err?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status badge config ───────────────────────────────────────────────────
  const statusBadge = isLocked
    ? { bg: '#f6ffed', border: '#b7eb8f', color: '#389e0d' }
    : isReturned
    ? { bg: '#fff1f0', border: '#ffa39e', color: '#cf1322' }
    : { bg: '#fffbe6', border: '#ffe58f', color: '#d48806' };

  const submitLabel = isReturned ? 'Resubmit ✓' : 'Submit ✓';
  const submitBtnId = isReturned ? 'resubmit-bmw-btn' : 'submit-bmw-btn';

  const inputStyle = {
    borderRadius: '6px',
    height: '34px',
    borderColor: isLocked ? '#e2e8f0' : '#cbd5e1',
    fontSize: '13.5px',
    background: isLocked ? '#f1f5f9' : '#f8fafc',
    color: isLocked ? '#64748b' : '#1e293b',
  };

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
          CM Dashboard-TNEGA Portal — <span style={{ fontWeight: 500, opacity: 0.9 }}>Bio-Medical Waste Entry</span>
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
              marginBottom: '16px',
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
                Bio-Medical Waste CM Dashboard — {reportingMonth}
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

          {/* Board Remarks — only show when status is Returned and remarks exist */}
          {isReturned && boardRemarks && (
            <div
              style={{
                background: '#fff1f0',
                border: '1px solid #ffa39e',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#cf1322', fontSize: '13.5px', marginBottom: '4px' }}>
                Board remarks:
              </div>
              <div style={{ color: '#781a20', fontSize: '13px', lineHeight: 1.5 }}>{boardRemarks}</div>
            </div>
          )}

          {/* Lock banner */}
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
                {submittedAt
                  ? new Date(submittedAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </strong>
              . Contact the Board Section to unlock for corrections.
            </div>
          )}

          {/* Card: Monthly Figures (Kg/day) */}
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
              Monthly Figures (Kg/day)
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
              <div>FIELD</div>
              <div>VALUE</div>
              <div />
            </div>

            {/* Row 1: Generated */}
            {[
              { label: 'Total Quantity of Biomedical Waste Generated', key: 'generated', editable: true },
              { label: 'Total Quantity Treated by Incinerator', key: 'incinerator', editable: true },
              { label: 'Total Quantity Treated by Autoclave', key: 'autoclave', editable: true },
            ].map((row, idx) => (
              <div
                key={row.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 180px 40px',
                  alignItems: 'center',
                  padding: '12px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '13.5px',
                  background: isLocked ? '#fafafa' : '#fff',
                }}
              >
                <div style={{ color: '#64748b' }}>{idx + 1}</div>
                <div style={{ color: '#1e293b', fontWeight: 500 }}>{row.label}</div>
                <div>
                  <Input
                    value={formData[row.key]}
                    disabled={isLocked}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [row.key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ textAlign: 'center', color: isLocked ? '#94a3b8' : '#0958d9' }}>
                  {isLocked ? <LockOutlined style={{ fontSize: '14px' }} /> : <EditOutlined style={{ fontSize: '14px' }} />}
                </div>
              </div>
            ))}

            {/* Row 4: Total Treated (calculated) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 180px 40px',
                alignItems: 'center',
                padding: '12px',
                borderBottom: '1px solid #f1f5f9',
                fontSize: '13.5px',
                background: '#fafafa',
              }}
            >
              <div style={{ color: '#64748b' }}>4</div>
              <div style={{ color: '#0e2b48', fontWeight: 600 }}>Total Quantity Treated</div>
              <div>
                <Input
                  disabled
                  value={totalTreated}
                  style={{
                    borderRadius: '6px',
                    height: '34px',
                    fontSize: '13.5px',
                    background: '#f1f5f9',
                    color: '#1e293b',
                    fontWeight: 600,
                  }}
                />
              </div>
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>—</div>
            </div>

            {/* Row 5: Difference (calculated) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 180px 40px',
                alignItems: 'center',
                padding: '12px',
                fontSize: '13.5px',
                background: '#fafafa',
              }}
            >
              <div style={{ color: '#64748b' }}>5</div>
              <div style={{ color: '#0e2b48', fontWeight: 600 }}>Difference</div>
              <div>
                <Input
                  disabled
                  value={difference}
                  style={{
                    borderRadius: '6px',
                    height: '34px',
                    fontSize: '13.5px',
                    background: '#f1f5f9',
                    color: difference !== 0 ? '#cf1322' : '#389e0d',
                    fontWeight: 600,
                  }}
                />
              </div>
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>—</div>
            </div>
          </div>

          {/* Action Buttons — hidden when locked */}
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
                id={submitBtnId}
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
                {submitLabel}
              </Button>
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
}
