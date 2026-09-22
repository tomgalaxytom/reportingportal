import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Select,
  Typography,
  Row,
  Col,
  Modal,
  Input,
  message,
  Space,
  Skeleton,
  Spin,
} from 'antd';
import {
  MailOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import streamReportService from '../services/streamReportService';
import {
  getCurrentReportingMonth,
  getRecentReportingMonths,
} from '../utils/formatters';
import { exportDashboardReport } from '../utils/excelExport';

const { Title } = Typography;
const { Option } = Select;

// Tab → API stream key mapping
const STREAM_KEY = {
  'E-Waste': 'e-waste',
  'Bio-Medical Waste': 'biomedical',
  'Plastic Waste': 'plastic',
};

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'Submitted') {
    return (
      <span style={{ background: '#e6f4ff', color: '#0958d9', borderRadius: '12px', padding: '3px 12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <CheckCircleFilled style={{ fontSize: '11px' }} /> Submitted
      </span>
    );
  }
  if (status === 'Draft') {
    return (
      <span style={{ background: '#fffbe6', color: '#d48806', borderRadius: '12px', padding: '3px 12px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }}>
        Draft
      </span>
    );
  }
  if (status === 'Returned') {
    return (
      <span style={{ background: '#fff1f0', color: '#cf1322', borderRadius: '12px', padding: '3px 12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <ExclamationCircleFilled style={{ fontSize: '11px' }} /> Returned
      </span>
    );
  }
  return (
    <span style={{ background: '#f5f5f5', color: '#8c8c8c', borderRadius: '12px', padding: '3px 12px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }}>
      Not Submitted
    </span>
  );
}

// ── Column definitions per stream ─────────────────────────────────────────────
function buildColumns(activeTab, onVerify, onReturn) {
  const actionCol = {
    title: 'ACTION',
    key: 'action',
    render: (_, record) => {
      if (record.status === 'Submitted') {
        return (
          <Space size={4}>
            <Button
              id={`verify-btn-${record.district_name}`}
              size="small"
              onClick={() => onVerify(record)}
              style={{ background: '#389e0d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, height: '24px', padding: '0 10px' }}
            >
              Verify
            </Button>
            <Button
              id={`return-btn-${record.district_name}`}
              size="small"
              onClick={() => onReturn(record)}
              style={{ background: '#fff', borderColor: '#ff4d4f', color: '#cf1322', borderRadius: '6px', fontSize: '11px', fontWeight: 600, height: '24px', padding: '0 10px' }}
            >
              Return
            </Button>
          </Space>
        );
      }
      return <span style={{ color: '#94a3b8' }}>—</span>;
    },
  };

  const distCol = {
    title: 'DISTRICT',
    dataIndex: 'district_name',
    key: 'district_name',
    render: (t) => <strong style={{ color: '#1e293b', fontSize: '12.5px' }}>{t}</strong>,
  };

  const statusCol = {
    title: 'STATUS',
    dataIndex: 'status',
    key: 'status',
    render: (s) => <StatusBadge status={s} />,
  };

  if (activeTab === 'E-Waste') {
    return [
      distCol,
      { title: 'IT&TELECOM', dataIndex: 'collected_it_telecom', key: 'c_it', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
      { title: 'ELEC.&ELEC.', dataIndex: 'collected_electrical', key: 'c_el', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
      { title: 'TOYS', dataIndex: 'collected_toys', key: 'c_to', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
      { title: 'MEDICAL', dataIndex: 'collected_medical', key: 'c_med', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
      { title: 'OTHERS', dataIndex: 'collected_others', key: 'c_oth', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
      statusCol,
      actionCol,
    ];
  }

  if (activeTab === 'Bio-Medical Waste') {
    return [
      distCol,
      { title: 'GENERATED', dataIndex: 'generated_qty', key: 'gen', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
      { title: 'INCINERATOR', dataIndex: 'incinerator_treated_qty', key: 'inc', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
      { title: 'AUTOCLAVE', dataIndex: 'autoclave_treated_qty', key: 'aut', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
      { title: 'TOTAL TREATED', dataIndex: 'total_treated_qty', key: 'tot', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
      { title: 'DIFF', dataIndex: 'difference_qty', key: 'dif', render: (v) => <span style={{ color: v && parseFloat(v) !== 0 ? '#cf1322' : '#389e0d', fontWeight: 600, fontSize: '12.5px' }}>{v ?? '—'}</span> },
      statusCol,
      actionCol,
    ];
  }

  // Plastic Waste
  return [
    distCol,
    { title: 'INSPECTIONS', dataIndex: 'inspection_raids_local_bodies', key: 'insp', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
    { title: 'SEIZED (T)', dataIndex: 'seized_plastic_tons', key: 'seiz', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
    { title: 'FINE (₹L)', dataIndex: 'fine_imposed_lakhs', key: 'fine', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
    { title: 'RECYCLERS', dataIndex: 'total_plastic_recyclers', key: 'rec', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
    { title: 'MVM', dataIndex: 'mvm_installed_count', key: 'mvm', render: (v) => <span style={{ fontSize: '12.5px' }}>{v ?? '—'}</span> },
    { title: 'ANN-I', dataIndex: 'annexure1_status', key: 'a1', render: (v) => <StatusBadge status={v} /> },
    { title: 'ANN-II', dataIndex: 'annexure2_status', key: 'a2', render: (v) => <StatusBadge status={v} /> },
    statusCol,
    actionCol,
  ];
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BoardDashboardPage() {
  const navigate = useNavigate();
  const [currentUser] = useState(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('E-Waste');
  const [reportingMonth, setReportingMonth] = useState(getCurrentReportingMonth());
  const recentMonths = getRecentReportingMonths(6);

  // DB data state
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total_submitted: 0, total_draft: 0, total_not_submitted: 0 });
  const [loading, setLoading] = useState(true);

  // Modal state
  const [consolidatedModalOpen, setConsolidatedModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // ── Fetch from DB ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const streamKey = STREAM_KEY[activeTab];
      const data = await streamReportService.getBoardConsolidated(streamKey, reportingMonth);
      setRows((data?.rows || []).map((r, i) => ({ ...r, key: `${r.district_name}-${i}` })));
      setSummary({
        total_submitted: data?.total_submitted ?? 0,
        total_draft: data?.total_draft ?? 0,
        total_not_submitted: data?.total_not_submitted ?? 0,
      });
    } catch (err) {
      message.error('Failed to load board data: ' + (err?.message || 'Network Error'));
      setRows([]);
      setSummary({ total_submitted: 0, total_draft: 0, total_not_submitted: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, reportingMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    authService.logout();
    message.info('Logged out successfully.');
    navigate('/login');
  };

  const handleVerify = (record) => {
    setRows((prev) =>
      prev.map((r) => r.key === record.key ? { ...r, status: 'Verified' } : r)
    );
    setSummary((prev) => ({ ...prev, total_submitted: Math.max(0, prev.total_submitted - 1) }));
    message.success(`${record.district_name} report verified successfully.`);
  };

  const handleReturn = (record) => {
    setRows((prev) =>
      prev.map((r) => r.key === record.key ? { ...r, status: 'Returned' } : r)
    );
    message.warning(`${record.district_name} report returned for correction.`);
  };

  const handleSendReminder = () => {
    message.success(`Reminder sent to ${summary.total_not_submitted + summary.total_draft} pending offices.`);
    setReminderModalOpen(false);
  };

  const handleExportExcel = () => {
    if (!rows || rows.length === 0) {
      message.warning('No submissions available to export.');
      return;
    }
    try {
      const fileName = exportDashboardReport({
        activeTab,
        reportingMonth,
        rows,
      });
      message.success(`Successfully exported ${fileName}`);
    } catch (err) {
      message.error(err.message || 'Failed to export Excel report.');
    }
  };

  const columns = buildColumns(activeTab, handleVerify, handleReturn);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f5fa' }}>
      {/* Top Banner */}
      <div style={{ background: '#08284b', padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.2px', color: '#ffffff' }}>
          CM Dashboard-TNEGA Portal — <span style={{ fontWeight: 500, opacity: 0.9 }}>Board Section</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>
            {currentUser?.district_name || 'Waste Management Cell'} — JCEE
          </div>
          <Button
            id="board-logout-btn"
            onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.4)', color: '#ffffff', borderRadius: '16px', fontSize: '12px', height: '30px', padding: '0 14px', cursor: 'pointer' }}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ background: '#ffffff', padding: '0 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '28px' }}>
        {['E-Waste', 'Bio-Medical Waste', 'Plastic Waste'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              id={`tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{ background: 'none', border: 'none', padding: '14px 4px', fontSize: '13.5px', fontWeight: isActive ? 700 : 500, color: isActive ? '#08284b' : '#64748b', borderBottom: isActive ? '3px solid #08284b' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px' }}>
        {/* Title, Month Selector, Refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0e2b48', fontSize: '22px', letterSpacing: '-0.3px' }}>
            {activeTab} — {reportingMonth}
          </Title>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Select id="board-month-select" value={reportingMonth} onChange={setReportingMonth} style={{ width: 155 }}>
              {recentMonths.map((m) => <Option key={m} value={m}>{m}</Option>)}
            </Select>
            <Button
              id="refresh-board-btn"
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
              style={{ borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <Row gutter={[20, 20]} style={{ marginBottom: '24px' }}>
          {/* Submitted */}
          <Col xs={24} sm={12} md={6}>
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              {loading
                ? <Skeleton.Input active style={{ width: '60px', height: '40px' }} />
                : <div style={{ fontSize: '34px', fontWeight: 800, color: '#0e2b48', lineHeight: 1.1, marginBottom: '6px' }}>{summary.total_submitted}</div>}
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Submitted</div>
            </div>
          </Col>

          {/* Not Submitted + Reminder */}
          <Col xs={24} sm={12} md={6}>
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                {loading
                  ? <Skeleton.Input active style={{ width: '60px', height: '40px' }} />
                  : <div style={{ fontSize: '34px', fontWeight: 800, color: '#cf1322', lineHeight: 1.1, marginBottom: '6px' }}>{summary.total_draft}</div>}
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Draft (Pending)</div>
              </div>
              <Button
                id="send-reminder-btn"
                size="small"
                icon={<MailOutlined />}
                onClick={() => setReminderModalOpen(true)}
                style={{ background: '#cf1322', borderColor: '#cf1322', color: '#ffffff', borderRadius: '16px', fontSize: '12px', fontWeight: 600, height: '28px', display: 'inline-flex', alignItems: 'center' }}
              >
                Send Reminder
              </Button>
            </div>
          </Col>

          {/* Draft count as "Pending" */}
          <Col xs={24} sm={12} md={6}>
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              {loading
                ? <Skeleton.Input active style={{ width: '60px', height: '40px' }} />
                : <div style={{ fontSize: '34px', fontWeight: 800, color: '#0e2b48', lineHeight: 1.1, marginBottom: '6px' }}>{rows.length}</div>}
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Total Entries in DB</div>
            </div>
          </Col>

          {/* Returned */}
          <Col xs={24} sm={12} md={6}>
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              {loading
                ? <Skeleton.Input active style={{ width: '60px', height: '40px' }} />
                : <div style={{ fontSize: '34px', fontWeight: 800, color: '#d46b08', lineHeight: 1.1, marginBottom: '6px' }}>
                    {rows.filter((r) => r.status === 'Returned').length}
                  </div>}
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Returned — pending correction</div>
            </div>
          </Col>
        </Row>

        {/* Action Button Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '14px' }}>
          <Button
            id="board-export-excel-btn"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            disabled={loading || rows.length === 0}
            style={{ borderRadius: '8px', fontWeight: 600, fontSize: '13px', height: '36px', padding: '0 16px', borderColor: '#cbd5e1' }}
          >
            Export to Excel
          </Button>
          <Button
            id="open-consolidated-table-btn"
            type="primary"
            onClick={() => navigate(`/board/consolidated?stream=${STREAM_KEY[activeTab]}&month=${encodeURIComponent(reportingMonth)}`)}
            style={{ background: '#08284b', borderColor: '#08284b', fontWeight: 600, fontSize: '13.5px', borderRadius: '8px', height: '36px', padding: '0 18px', boxShadow: '0 2px 8px rgba(8,40,75,0.2)' }}
          >
            Open Consolidated Table →
          </Button>
        </div>

        {/* Data Table */}
        <Spin spinning={loading}>
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', overflowX: 'auto', width: '100%' }}>
            {rows.length === 0 && !loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No submissions found for <strong>{activeTab}</strong> — <strong>{reportingMonth}</strong>.<br />
                <span style={{ fontSize: '12px' }}>District offices have not submitted yet for this month.</span>
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={rows}
                pagination={{ pageSize: 15, showSizeChanger: false }}
                rowKey="key"
                size="small"
                tableLayout="fixed"
                style={{ borderRadius: '14px', fontSize: '12.5px' }}
              />
            )}
          </div>
        </Spin>
      </div>

      {/* Reminder Modal */}
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cf1322' }}><MailOutlined /><span>Send Deadline Reminder Broadcast</span></div>}
        open={reminderModalOpen}
        onOk={handleSendReminder}
        onCancel={() => setReminderModalOpen(false)}
        okText={`Send Reminder to ${summary.total_draft} Offices`}
        okButtonProps={{ style: { background: '#cf1322', borderColor: '#cf1322' } }}
      >
        <p style={{ color: '#475569', fontSize: '14px', marginTop: '12px' }}>
          This will dispatch an urgent automated reminder to the{' '}
          <strong>{summary.total_draft} pending DEE Offices</strong> for{' '}
          <strong>{activeTab}</strong> ({reportingMonth}).
        </p>
        <Input.TextArea
          rows={3}
          defaultValue={`URGENT: Monthly waste data submission for ${activeTab} (${reportingMonth}) is pending from your DEE office. Please submit before the deadline to avoid portal lockout.`}
        />
      </Modal>
    </div>
  );
}
