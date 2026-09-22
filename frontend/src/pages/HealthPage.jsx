import React from 'react';
import { Card, Row, Col, Typography, Tag, Table, Alert, Button, Space, Divider } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { API_BASE } from '../services/api';
import { useHealth } from '../hooks/useHealth';

const { Title, Text, Paragraph } = Typography;

export default function HealthPage() {
  const { healthData, loading, error, latency, refetch } = useHealth();

  const envColumns = [
    { title: 'Environment Target', dataIndex: 'env', key: 'env', render: (t) => <strong>{t}</strong> },
    { title: 'Build Command', dataIndex: 'command', key: 'command', render: (c) => <code>{c}</code> },
    { title: 'Output Directory', dataIndex: 'outDir', key: 'outDir' },
    { title: 'API Base URL', dataIndex: 'apiBase', key: 'apiBase', render: (u) => <code style={{ color: '#0b4f8a' }}>{u}</code> },
  ];

  const envData = [
    {
      key: 'local',
      env: 'Local Development',
      command: 'npm run dev',
      outDir: 'In-memory (Vite dev)',
      apiBase: 'http://192.168.201.40:5000/api',
    },
    {
      key: 'prodlocal',
      env: 'Production Local / Staging',
      command: 'npm run build:prodlocal',
      outDir: 'frontend/prodlocal/',
      apiBase: 'http://192.168.201.40:5000/api',
    },
    {
      key: 'production',
      env: 'Production',
      command: 'npm run build:prod',
      outDir: 'frontend/prod/',
      apiBase: 'https://tnpcb.gov.in/whitecategory/api',
    },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <Title level={2} style={{ color: '#0b4f8a', margin: 0 }}>
            System Diagnostics & Environment Health
          </Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
            Live status of backend API connection, active environment, and build profile matrix.
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined spin={loading} />}
          onClick={refetch}
          style={{ background: '#0b4f8a' }}
        >
          Re-test Health
        </Button>
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <CodeOutlined style={{ color: '#0b4f8a' }} />
                <span>Frontend Client Configuration</span>
              </Space>
            }
            style={{ borderRadius: '12px', height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Vite Active Mode:</Text>
                <div>
                  <Tag color="purple">{import.meta.env.MODE || 'development'}</Tag>
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>VITE_API_BASE (Runtime Value):</Text>
                <div style={{ marginTop: '4px' }}>
                  <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px', color: '#0b4f8a', display: 'inline-block' }}>
                    {API_BASE}
                  </code>
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Base Public Path:</Text>
                <div>
                  <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                    {import.meta.env.BASE_URL || '/'}
                  </code>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <SettingOutlined style={{ color: '#0b4f8a' }} />
                <span>FastAPI Backend Response (/api/health)</span>
              </Space>
            }
            style={{ borderRadius: '12px', height: '100%' }}
          >
            {error ? (
              <Alert
                type="error"
                message="Backend Connection Error"
                description={error}
                showIcon
                icon={<CloseCircleFilled />}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">API Status:</Text>
                  <Tag color="success" icon={<CheckCircleFilled />}>
                    {healthData?.status?.toUpperCase() || 'OK'}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">Reported Environment:</Text>
                  <Tag color="blue" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    {healthData?.environment || 'unknown'}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">Database Status:</Text>
                  <Tag color={healthData?.database === 'connected' ? 'cyan' : 'orange'}>
                    {healthData?.database || 'unknown'}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">Response Latency:</Text>
                  <Text strong>
                    <ThunderboltOutlined style={{ color: '#faad14', marginRight: 4 }} />
                    {latency} ms
                  </Text>
                </div>

                {healthData?.timestamp && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">Server Timestamp:</Text>
                    <Text code style={{ fontSize: '11px' }}>{healthData.timestamp}</Text>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Multi-Environment Matrix */}
      <Card
        title="Multi-Environment Matrix Reference"
        style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
      >
        <Paragraph type="secondary">
          The portal supports three distinct deployment environments with dedicated configuration files:
        </Paragraph>
        <Table
          dataSource={envData}
          columns={envColumns}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
