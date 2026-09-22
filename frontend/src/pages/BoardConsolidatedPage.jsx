import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Select, Typography, Spin, message, Space } from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import streamReportService from '../services/streamReportService';
import { getCurrentReportingMonth, getRecentReportingMonths } from '../utils/formatters';
import { exportConsolidatedReport } from '../utils/excelExport';

const { Title } = Typography;
const { Option } = Select;

const STREAM_LABEL = {
  'e-waste': 'E-Waste',
  'biomedical': 'Bio-Medical Waste',
  'plastic': 'Plastic Waste',
};

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'Submitted')
    return <span style={{ background: '#e8f0fe', color: '#1d4ed8', borderRadius: '16px', padding: '3px 14px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }}>Submitted</span>;
  if (status === 'Verified')
    return <span style={{ background: '#e6f9ed', color: '#16a34a', borderRadius: '16px', padding: '3px 14px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }}>Verified</span>;
  if (status === 'Returned')
    return <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '16px', padding: '3px 14px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }}>Returned</span>;
  if (status === 'Draft')
    return <span style={{ background: '#fffbe6', color: '#d48806', borderRadius: '16px', padding: '3px 14px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }}>Draft</span>;
  return <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: '16px', padding: '3px 14px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }}>Not Submitted</span>;
}

// ── Column builders ───────────────────────────────────────────────────────────
const val = (v) => (v != null && v !== '' ? v : '—');
const numVal = (v) => (v != null && v !== '' && v !== '—' ? parseFloat(v) : 0);

function buildEWasteColumns(onVerify, onReturn) {
  return [
    {
      title: 'DEE OFFICE',
      align: 'center',
      children: [
        {
          title: '',
          dataIndex: 'district_name',
          key: 'district_name',
          width: 170,
          align: 'left',
          render: (t, r) =>
            r._isTotal
              ? <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>TOTAL</span>
              : <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>{t}</span>,
        },
      ],
    },
    {
      title: 'COLLECTED (KG)',
      align: 'center',
      children: [
        { title: 'IT&T', dataIndex: 'collected_it_telecom', key: 'c_it', width: 85, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'E&E', dataIndex: 'collected_electrical', key: 'c_el', width: 85, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'TOYS', dataIndex: 'collected_toys', key: 'c_to', width: 75, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'MED.', dataIndex: 'collected_medical', key: 'c_med', width: 75, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'OTHERS', dataIndex: 'collected_others', key: 'c_oth', width: 85, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
      ],
    },
    {
      title: 'RECOVERED (KG)',
      align: 'center',
      children: [
        { title: 'IT&T', dataIndex: 'recovered_it_telecom', key: 'r_it', width: 85, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'E&E', dataIndex: 'recovered_electrical', key: 'r_el', width: 85, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'TOYS', dataIndex: 'recovered_toys', key: 'r_to', width: 75, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'MED.', dataIndex: 'recovered_medical', key: 'r_med', width: 75, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'OTHERS', dataIndex: 'recovered_others', key: 'r_oth', width: 85, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
      ],
    },
    {
      title: 'STATUS',
      align: 'center',
      children: [
        {
          title: '',
          dataIndex: 'status',
          key: 'status',
          width: 130,
          align: 'center',
          render: (s, r) => r._isTotal ? null : <StatusBadge status={s} />,
        },
      ],
    },
    {
      title: 'ACTION',
      align: 'center',
      children: [
        {
          title: '',
          key: 'action',
          width: 120,
          align: 'center',
          render: (_, r) => {
            if (r._isTotal) return null;
            if (r.status === 'Submitted') return (
              <Space size={6} style={{ display: 'inline-flex', justifyContent: 'center' }}>
                <button
                  onClick={() => onVerify(r)}
                  title="Verify"
                  style={{
                    background: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    width: '28px',
                    height: '24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={() => onReturn(r)}
                  title="Return"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fca5a5',
                    color: '#dc2626',
                    borderRadius: '6px',
                    width: '28px',
                    height: '24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  ↩
                </button>
              </Space>
            );
            if (r.status === 'Not Submitted' || !r.status) return (
              <button
                onClick={() => message.info(`Window reopened for ${r.district_name}.`)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #f97316',
                  color: '#ea580c',
                  borderRadius: '6px',
                  padding: '2px 14px',
                  fontSize: '12px',
                  fontWeight: 500,
                  height: '26px',
                  cursor: 'pointer',
                }}
              >
                Reopen
              </button>
            );
            return <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>;
          },
        },
      ],
    },
  ];
}

function buildBMWColumns(onVerify, onReturn) {
  return [
    {
      title: 'DEE OFFICE', dataIndex: 'district_name', key: 'district_name', width: 160, align: 'left',
      render: (t, r) => r._isTotal
        ? <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>TOTAL</span>
        : <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>{t}</span>,
    },
    { title: 'GENERATED (KG/DAY)', dataIndex: 'generated_qty', key: 'gen', width: 150, align: 'center', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
    { title: 'INCINERATOR (KG/DAY)', dataIndex: 'incinerator_treated_qty', key: 'inc', width: 150, align: 'center', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
    { title: 'AUTOCLAVE (KG/DAY)', dataIndex: 'autoclave_treated_qty', key: 'aut', width: 140, align: 'center', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
    { title: 'TOTAL TREATED (KG/DAY)', dataIndex: 'total_treated_qty', key: 'tot', width: 150, align: 'center', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
    {
      title: 'DIFFERENCE (KG/DAY)', dataIndex: 'difference_qty', key: 'dif', width: 140, align: 'center',
      render: (v, r) => {
        if (r._isTotal) return <strong style={{ fontWeight: 800, color: parseFloat(v) !== 0 ? '#cf1322' : '#389e0d' }}>{val(v)}</strong>;
        return <span style={{ color: v && parseFloat(v) !== 0 ? '#cf1322' : '#389e0d', fontWeight: 600 }}>{val(v)}</span>;
      },
    },
    { title: 'STATUS', dataIndex: 'status', key: 'status', width: 130, align: 'center', render: (s, r) => r._isTotal ? null : <StatusBadge status={s} /> },
    {
      title: 'ACTION', key: 'action', width: 120, align: 'center',
      render: (_, r) => {
        if (r._isTotal) return null;
        if (r.status === 'Submitted') return (
          <Space size={6} style={{ display: 'inline-flex', justifyContent: 'center' }}>
            <button onClick={() => onVerify(r)} title="Verify" style={{ background: '#15803d', color: '#fff', border: 'none', borderRadius: '6px', width: '28px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>✓</button>
            <button onClick={() => onReturn(r)} title="Return" style={{ background: '#fff', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', width: '28px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>↩</button>
          </Space>
        );
        if (r.status === 'Not Submitted' || !r.status) return (
          <button onClick={() => message.info(`Window reopened for ${r.district_name}.`)} style={{ background: '#fff', border: '1px solid #f97316', color: '#ea580c', borderRadius: '6px', padding: '2px 14px', fontSize: '12px', fontWeight: 500, height: '26px', cursor: 'pointer' }}>Reopen</button>
        );
        return <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>;
      },
    },
  ];
}

function buildPlasticColumns(onVerify, onReturn) {
  return [
    {
      title: 'DEE OFFICE',
      align: 'center',
      children: [
        {
          title: '',
          dataIndex: 'district_name',
          key: 'district_name',
          width: 150,
          align: 'left',
          render: (t, r) =>
            r._isTotal
              ? <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>TOTAL</span>
              : <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>{t}</span>,
        },
      ],
    },
    {
      title: 'COLLECTED (KG)',
      align: 'center',
      children: [
        { title: 'INSPECTIONS', dataIndex: 'inspection_raids_local_bodies', key: 'insp', width: 105, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'SEIZED (T)', dataIndex: 'seized_plastic_tons', key: 'seiz', width: 100, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'FINE (₹L)', dataIndex: 'fine_imposed_lakhs', key: 'fine', width: 100, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'RECYCLERS', dataIndex: 'total_plastic_recyclers', key: 'rec', width: 100, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
      ],
    },
    {
      title: 'RECOVERED (KG)',
      align: 'center',
      children: [
        { title: 'ACTIVITIES', dataIndex: 'awareness_activities_count', key: 'act', width: 100, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'MANJAPPAI', dataIndex: 'manjappai_distributed_count', key: 'man', width: 100, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'MVM', dataIndex: 'mvm_installed_count', key: 'mvm', width: 80, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
        { title: 'BAGS (MVM)', dataIndex: 'cloth_bags_dispensed_mvm', key: 'bags', width: 100, align: 'left', render: (v, r) => r._isTotal ? <strong style={{ fontWeight: 800, color: '#0f172a' }}>{val(v)}</strong> : <span style={{ color: v ? '#1e293b' : '#94a3b8' }}>{val(v)}</span> },
      ],
    },
    {
      title: 'STATUS',
      align: 'center',
      children: [
        {
          title: '',
          dataIndex: 'status',
          key: 'status',
          width: 120,
          align: 'center',
          render: (s, r) => r._isTotal ? null : <StatusBadge status={s} />,
        },
      ],
    },
    {
      title: 'ACTION',
      align: 'center',
      children: [
        {
          title: '',
          key: 'action',
          width: 120,
          align: 'center',
          render: (_, r) => {
            if (r._isTotal) return null;
            if (r.status === 'Submitted') return (
              <Space size={6} style={{ display: 'inline-flex', justifyContent: 'center' }}>
                <button onClick={() => onVerify(r)} title="Verify" style={{ background: '#15803d', color: '#fff', border: 'none', borderRadius: '6px', width: '28px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>✓</button>
                <button onClick={() => onReturn(r)} title="Return" style={{ background: '#fff', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', width: '28px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>↩</button>
              </Space>
            );
            if (r.status === 'Not Submitted' || !r.status) return (
              <button onClick={() => message.info(`Window reopened for ${r.district_name}.`)} style={{ background: '#fff', border: '1px solid #f97316', color: '#ea580c', borderRadius: '6px', padding: '2px 14px', fontSize: '12px', fontWeight: 500, height: '26px', cursor: 'pointer' }}>Reopen</button>
            );
            return <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>;
          },
        },
      ],
    },
  ];
}

// ── Compute TOTAL row ─────────────────────────────────────────────────────────
function computeTotalRow(rows, stream) {
  if (!rows.length) return null;
  const sum = (key) => {
    const total = rows.reduce((acc, r) => acc + numVal(r[key]), 0);
    return total % 1 === 0 ? String(total) : String(Math.round(total * 10) / 10);
  };

  if (stream === 'e-waste') {
    return {
      key: '__total__', _isTotal: true, district_name: 'TOTAL',
      collected_it_telecom: sum('collected_it_telecom'),
      collected_electrical: sum('collected_electrical'),
      collected_toys: sum('collected_toys'),
      collected_medical: sum('collected_medical'),
      collected_others: sum('collected_others'),
      recovered_it_telecom: sum('recovered_it_telecom'),
      recovered_electrical: sum('recovered_electrical'),
      recovered_toys: sum('recovered_toys'),
      recovered_medical: sum('recovered_medical'),
      recovered_others: sum('recovered_others'),
    };
  }
  if (stream === 'biomedical') {
    return {
      key: '__total__', _isTotal: true, district_name: 'TOTAL',
      generated_qty: sum('generated_qty'),
      incinerator_treated_qty: sum('incinerator_treated_qty'),
      autoclave_treated_qty: sum('autoclave_treated_qty'),
      total_treated_qty: sum('total_treated_qty'),
      difference_qty: sum('difference_qty'),
    };
  }
  if (stream === 'plastic') {
    return {
      key: '__total__', _isTotal: true, district_name: 'TOTAL',
      inspection_raids_local_bodies: sum('inspection_raids_local_bodies'),
      seized_plastic_tons: sum('seized_plastic_tons'),
      fine_imposed_lakhs: sum('fine_imposed_lakhs'),
      total_plastic_recyclers: sum('total_plastic_recyclers'),
      awareness_activities_count: sum('awareness_activities_count'),
      manjappai_distributed_count: sum('manjappai_distributed_count'),
      mvm_installed_count: sum('mvm_installed_count'),
      cloth_bags_dispensed_mvm: sum('cloth_bags_dispensed_mvm'),
    };
  }
  return null;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BoardConsolidatedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const streamParam = searchParams.get('stream') || 'e-waste';
  const monthParam = searchParams.get('month') || getCurrentReportingMonth();

  const [stream, setStream] = useState(streamParam);
  const [reportingMonth, setReportingMonth] = useState(monthParam);
  const recentMonths = getRecentReportingMonths(6);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await streamReportService.getBoardConsolidated(stream, reportingMonth);
      setRows((data?.rows || []).map((r, i) => ({ ...r, key: `${r.district_name}-${i}` })));
    } catch (err) {
      message.error('Failed to load consolidated data.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [stream, reportingMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Actions on rows ────────────────────────────────────────────────────────
  const handleVerify = (record) => {
    setRows((prev) => prev.map((r) => r.key === record.key ? { ...r, status: 'Verified' } : r));
    message.success(`${record.district_name} verified.`);
  };
  const handleReturn = (record) => {
    setRows((prev) => prev.map((r) => r.key === record.key ? { ...r, status: 'Returned' } : r));
    message.warning(`${record.district_name} returned for correction.`);
  };

  const handleExportExcel = () => {
    if (!rows || rows.length === 0) {
      message.warning('No data available to export.');
      return;
    }
    try {
      const fileName = exportConsolidatedReport({
        stream,
        reportingMonth,
        rows,
        totalRow,
      });
      message.success(`Successfully exported ${fileName}`);
    } catch (err) {
      message.error(err.message || 'Failed to export Excel report.');
    }
  };

  // ── Build columns & total row ──────────────────────────────────────────────
  const columns = useMemo(() => {
    if (stream === 'e-waste') return buildEWasteColumns(handleVerify, handleReturn);
    if (stream === 'biomedical') return buildBMWColumns(handleVerify, handleReturn);
    return buildPlasticColumns(handleVerify, handleReturn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, rows]);

  const totalRow = useMemo(() => computeTotalRow(rows, stream), [rows, stream]);
  const tableData = useMemo(
    () => (totalRow ? [...rows, totalRow] : rows),
    [rows, totalRow]
  );

  const streamLabel = STREAM_LABEL[stream] || 'E-Waste';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f5fa' }}>
      {/* Top Banner */}
      <div style={{ background: '#08284b', padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>
          CM Dashboard-TNEGA Portal —{' '}
          <span style={{ fontWeight: 500, opacity: 0.85 }}>Consolidated Table</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>
            Waste Management Cell
          </div>
          <Button
            id="back-to-board-btn"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/board-dashboard')}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.4)', color: '#ffffff', borderRadius: '16px', fontSize: '12px', height: '30px', padding: '0 14px' }}
          >
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0e2b48', fontSize: '22px', letterSpacing: '-0.3px' }}>
            {streamLabel} — Consolidated, {reportingMonth}
          </Title>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Stream selector */}
            <Select value={stream} onChange={setStream} style={{ width: 155 }}>
              <Option value="e-waste">E-Waste</Option>
              <Option value="biomedical">Bio-Medical Waste</Option>
              <Option value="plastic">Plastic Waste</Option>
            </Select>

            {/* Month selector */}
            <Select value={reportingMonth} onChange={setReportingMonth} style={{ width: 155 }}>
              {recentMonths.map((m) => <Option key={m} value={m}>{m}</Option>)}
            </Select>

            <Button
              id="refresh-consolidated-btn"
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
              style={{ borderRadius: '8px', fontWeight: 600 }}
            />

            <Button
              id="export-excel-btn"
              icon={<DownloadOutlined />}
              type="primary"
              onClick={handleExportExcel}
              disabled={loading || rows.length === 0}
              style={{ background: '#08284b', borderColor: '#08284b', borderRadius: '8px', fontWeight: 600, fontSize: '13px', height: '34px', padding: '0 16px' }}
            >
              Export to Excel
            </Button>
          </div>
        </div>

        {/* Consolidated Table */}
        <Spin spinning={loading}>
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
            {rows.length === 0 && !loading ? (
              <div style={{ padding: '56px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No data available for <strong>{streamLabel}</strong> — <strong>{reportingMonth}</strong>.<br />
                <span style={{ fontSize: '12px' }}>District offices have not submitted yet for this month.</span>
              </div>
            ) : (
              <Table
                bordered={false}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                rowKey="key"
                size="middle"
                rowClassName={(r) => r._isTotal ? 'consolidated-total-row' : ''}
              />
            )}
          </div>
        </Spin>
      </div>

      <style>{`
        .ant-table {
          background: transparent !important;
        }
        .ant-table-thead > tr > th::before {
          display: none !important;
        }
        .ant-table-thead > tr > th {
          background: #ffffff !important;
          color: #475569 !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          letter-spacing: 0.3px !important;
          text-transform: uppercase !important;
          border-bottom: 1px solid #e2e8f0 !important;
          border-top: none !important;
          border-inline: none !important;
          padding: 12px 14px !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9 !important;
          border-inline: none !important;
          padding: 13px 14px !important;
          font-size: 13px !important;
          color: #1e293b !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
        .consolidated-total-row td {
          background: #ffffff !important;
          border-top: 1px solid #cbd5e1 !important;
          border-bottom: none !important;
          font-weight: 800 !important;
          color: #0f172a !important;
        }
        .ant-table-cell-fix-left, .ant-table-cell-fix-right {
          background: #fff !important;
        }
      `}</style>
    </div>
  );
}
