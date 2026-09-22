import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Input, Button, message, Spin } from 'antd';
import { EditOutlined, LockOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import streamReportService from '../services/streamReportService';
import { getCurrentReportingMonth } from '../utils/formatters';

const { Title } = Typography;

// Annexure I field definitions (maps to DB columns)
const ANNEXURE1_FIELDS = [
  { key: 'banned_manufacturing_units_closed', label: 'Banned plastic manufacturing units closed' },
  { key: 'inspection_raids_local_bodies', label: 'Inspection raids by local bodies' },
  { key: 'seized_plastic_tons', label: 'Quantity of single-use plastic seized (Tons)' },
  { key: 'fine_imposed_lakhs', label: 'Fine imposed by local bodies (₹ lakhs)' },
  { key: 'total_plastic_recyclers', label: 'Total number of plastic waste recyclers' },
  { key: 'recyclers_registered_pwm', label: 'Recyclers registered under PWM Rules' },
  { key: 'compostable_manufacturing_units', label: 'Total compostable plastic manufacturing units' },
  { key: 'compostable_units_registered_pwm', label: 'Compostable units registered under PWM Rules' },
];

// Annexure II field definitions (maps to DB columns)
const ANNEXURE2_FIELDS = [
  { key: 'eco_alternative_manufacturers', label: 'Number of eco-alternative manufacturers' },
  { key: 'awareness_activities_count', label: 'Number of awareness activities conducted' },
  { key: 'manjappai_distributed_count', label: 'No. of Manjappai distributed through awareness' },
  { key: 'mvm_installed_count', label: 'Number of MVM installed' },
  { key: 'cloth_bags_dispensed_mvm', label: 'Number of cloth bags dispensed through MVM' },
];

const defaultValues = (fields) =>
  Object.fromEntries(fields.map((f) => [f.key, '0']));

export default function PlasticWasteEntryPage() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const districtName = currentUser?.district_name || 'Coimbatore';
  const officerEmail = currentUser?.officer_email || '';
  const [reportingMonth] = useState(getCurrentReportingMonth());

  // DB-driven state
  const [reportId, setReportId] = useState(null);
  const [annexure1Status, setAnnexure1Status] = useState('Draft');
  const [annexure2Status, setAnnexure2Status] = useState('Draft');
  const [submittedAt, setSubmittedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  // Per-section button states
  const [savingA1, setSavingA1] = useState(false);
  const [submittingA1, setSubmittingA1] = useState(false);
  const [savingA2, setSavingA2] = useState(false);
  const [submittingA2, setSubmittingA2] = useState(false);

  // Form values keyed by DB field names
  const [ann1Values, setAnn1Values] = useState(defaultValues(ANNEXURE1_FIELDS));
  const [ann2Values, setAnn2Values] = useState(defaultValues(ANNEXURE2_FIELDS));

  const isAnn1Locked = annexure1Status === 'Submitted';
  const isAnn2Locked = annexure2Status === 'Submitted';

  // ── Load existing report on mount ─────────────────────────────────────────
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await streamReportService.getPlasticReport(districtName, reportingMonth);
      if (data) {
        setReportId(data.id);
        setAnnexure1Status(data.annexure1_status || 'Draft');
        setAnnexure2Status(data.annexure2_status || 'Draft');
        setSubmittedAt(data.submitted_at || null);

        const a1 = {};
        ANNEXURE1_FIELDS.forEach((f) => { a1[f.key] = data[f.key] ?? '0'; });
        setAnn1Values(a1);

        const a2 = {};
        ANNEXURE2_FIELDS.forEach((f) => { a2[f.key] = data[f.key] ?? '0'; });
        setAnn2Values(a2);
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

  // ── Build full payload ────────────────────────────────────────────────────
  const buildPayload = (ann1St, ann2St) => ({
    district_name: districtName,
    officer_email: officerEmail,
    reporting_month: reportingMonth,
    annexure1_status: ann1St,
    annexure2_status: ann2St,
    // Overall: Submitted only if BOTH are Submitted
    status: ann1St === 'Submitted' && ann2St === 'Submitted' ? 'Submitted' : 'Draft',
    ...ann1Values,
    ...ann2Values,
  });

  // ── Annexure I handlers ──────────────────────────────────────────────────
  const handleSaveDraftA1 = async () => {
    setSavingA1(true);
    try {
      const result = await streamReportService.savePlasticReport(buildPayload('Draft', annexure2Status));
      setReportId(result.id);
      setAnnexure1Status('Draft');
      message.success('Annexure I draft saved successfully.');
    } catch (err) {
      message.error(err?.message || 'Failed to save Annexure I draft.');
    } finally {
      setSavingA1(false);
    }
  };

  const handleSubmitA1 = async () => {
    setSubmittingA1(true);
    try {
      const result = await streamReportService.savePlasticReport(buildPayload('Submitted', annexure2Status));
      setReportId(result.id);
      setAnnexure1Status('Submitted');
      if (result.submitted_at) setSubmittedAt(result.submitted_at);
      message.success('Annexure I submitted successfully!');
    } catch (err) {
      message.error(err?.message || 'Submission failed.');
    } finally {
      setSubmittingA1(false);
    }
  };

  // ── Annexure II handlers ─────────────────────────────────────────────────
  const handleSaveDraftA2 = async () => {
    setSavingA2(true);
    try {
      const result = await streamReportService.savePlasticReport(buildPayload(annexure1Status, 'Draft'));
      setReportId(result.id);
      setAnnexure2Status('Draft');
      message.success('Annexure II draft saved successfully.');
    } catch (err) {
      message.error(err?.message || 'Failed to save Annexure II draft.');
    } finally {
      setSavingA2(false);
    }
  };

  const handleSubmitA2 = async () => {
    setSubmittingA2(true);
    try {
      const result = await streamReportService.savePlasticReport(buildPayload(annexure1Status, 'Submitted'));
      setReportId(result.id);
      setAnnexure2Status('Submitted');
      if (result.submitted_at) setSubmittedAt(result.submitted_at);
      message.success('Annexure II — Meendum Manjappai report submitted successfully!');
    } catch (err) {
      message.error(err?.message || 'Submission failed.');
    } finally {
      setSubmittingA2(false);
    }
  };

  // ── Badge helper ─────────────────────────────────────────────────────────
  const getStatusBadge = (st) => {
    if (st === 'Submitted') return { bg: '#e6f4ff', border: '#91caff', color: '#0958d9' };
    return { bg: '#fffbe6', border: '#ffe58f', color: '#d48806' };
  };

  // ── Shared row renderer ───────────────────────────────────────────────────
  const renderRow = (field, idx, value, onChange, isLocked, totalFields) => (
    <div
      key={field.key}
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 180px 40px',
        alignItems: 'center',
        padding: '11px 12px',
        borderBottom: idx === totalFields - 1 ? 'none' : '1px solid #f1f5f9',
        fontSize: '13.5px',
        background: isLocked ? '#fafafa' : '#fff',
        transition: 'background 0.2s',
      }}
    >
      <div style={{ color: '#64748b' }}>{idx + 1}</div>
      <div style={{ color: '#1e293b', fontWeight: 500 }}>{field.label}</div>
      <div>
        <Input
          value={value}
          disabled={isLocked}
          onChange={(e) => onChange(field.key, e.target.value)}
          style={{
            borderRadius: '6px',
            height: '34px',
            borderColor: isLocked ? '#e2e8f0' : '#cbd5e1',
            fontSize: '13.5px',
            background: isLocked ? '#f1f5f9' : '#f8fafc',
            color: isLocked ? '#64748b' : '#1e293b',
          }}
        />
      </div>
      <div style={{ textAlign: 'center', color: isLocked ? '#94a3b8' : '#0958d9' }}>
        {isLocked
          ? <LockOutlined style={{ fontSize: '14px' }} />
          : <EditOutlined style={{ fontSize: '14px' }} />}
      </div>
    </div>
  );

  // ── Shared action buttons ─────────────────────────────────────────────────
  const renderActions = (isLocked, onDraft, onSubmit, saving, submitting, submitLabel, draftId, submitId) => {
    if (isLocked) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
        <Button
          id={draftId}
          onClick={onDraft}
          loading={saving}
          style={{
            height: '36px',
            padding: '0 18px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontWeight: 600,
            fontSize: '13px',
            background: '#ffffff',
          }}
        >
          Save Draft
        </Button>
        <Button
          id={submitId}
          type="primary"
          onClick={onSubmit}
          loading={submitting}
          style={{
            height: '36px',
            padding: '0 20px',
            borderRadius: '6px',
            background: '#08284b',
            borderColor: '#08284b',
            fontWeight: 600,
            fontSize: '13px',
            boxShadow: '0 2px 8px rgba(8, 40, 75, 0.25)',
          }}
        >
          {submitLabel}
        </Button>
      </div>
    );
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
          CM Dashboard-TNEGA Portal —{' '}
          <span style={{ fontWeight: 500, opacity: 0.9 }}>Plastic Waste Entry</span>
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
            {districtName} District
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
          {/* Title */}
          <div style={{ marginBottom: '18px' }}>
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
              Plastic Waste CM Dashboard — {reportingMonth}
            </Title>
            <div style={{ color: '#64748b', fontSize: '13px' }}>
              Revenue District: {districtName}
              {reportId && (
                <span style={{ marginLeft: '8px', color: '#94a3b8' }}>#{reportId}</span>
              )}
            </div>
          </div>

          {/* Notice Banner */}
          <div
            style={{
              background: '#e6f4ff',
              border: '1px solid #91caff',
              borderRadius: '8px',
              padding: '10px 16px',
              marginBottom: '24px',
              color: '#0958d9',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Annexure I and Annexure II are{' '}
            <strong style={{ color: '#003eb3' }}>independent submissions</strong> — each has its own
            Save Draft and Submit.
          </div>

          {/* ── Card 1: Annexure I ── */}
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
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#0e2b48' }}>
                Annexure I — Single Use Plastic Inspection &amp; PWM
              </div>
              {(() => {
                const b = getStatusBadge(annexure1Status);
                return (
                  <span
                    style={{
                      background: b.bg,
                      border: `1px solid ${b.border}`,
                      color: b.color,
                      padding: '3px 12px',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isAnn1Locked && <CheckCircleFilled />}
                    {annexure1Status}
                  </span>
                );
              })()}
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

            {ANNEXURE1_FIELDS.map((field, idx) =>
              renderRow(
                field,
                idx,
                ann1Values[field.key],
                (key, val) => setAnn1Values((prev) => ({ ...prev, [key]: val })),
                isAnn1Locked,
                ANNEXURE1_FIELDS.length
              )
            )}

            {/* Lock footer */}
            {isAnn1Locked && submittedAt && (
              <div
                style={{
                  marginTop: '14px',
                  fontSize: '12px',
                  color: '#64748b',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <LockOutlined />
                Locked — submitted{' '}
                {new Date(submittedAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                . Awaiting Board verification.
              </div>
            )}

            {/* Annexure I action buttons */}
            {renderActions(
              isAnn1Locked,
              handleSaveDraftA1,
              handleSubmitA1,
              savingA1,
              submittingA1,
              'Submit Annexure I ✓',
              'save-draft-annexure1-btn',
              'submit-annexure1-btn'
            )}
          </div>

          {/* ── Card 2: Annexure II ── */}
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
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#0e2b48' }}>
                Annexure II — Meendum Manjappai Awareness Campaign
              </div>
              {(() => {
                const b = getStatusBadge(annexure2Status);
                return (
                  <span
                    style={{
                      background: b.bg,
                      border: `1px solid ${b.border}`,
                      color: b.color,
                      padding: '3px 12px',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isAnn2Locked && <CheckCircleFilled />}
                    {annexure2Status}
                  </span>
                );
              })()}
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

            {ANNEXURE2_FIELDS.map((field, idx) =>
              renderRow(
                field,
                idx,
                ann2Values[field.key],
                (key, val) => setAnn2Values((prev) => ({ ...prev, [key]: val })),
                isAnn2Locked,
                ANNEXURE2_FIELDS.length
              )
            )}

            {/* Lock footer */}
            {isAnn2Locked && submittedAt && (
              <div
                style={{
                  marginTop: '14px',
                  fontSize: '12px',
                  color: '#64748b',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <LockOutlined />
                Locked — submitted{' '}
                {new Date(submittedAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                . Awaiting Board verification.
              </div>
            )}

            {/* Annexure II action buttons */}
            {renderActions(
              isAnn2Locked,
              handleSaveDraftA2,
              handleSubmitA2,
              savingA2,
              submittingA2,
              'Submit Annexure II ✓',
              'save-draft-btn',
              'submit-plastic-btn'
            )}
          </div>
        </Spin>
      </div>
    </div>
  );
}
