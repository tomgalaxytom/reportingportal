import React from 'react';
import { Card, Tag, Typography, Space, Button, Badge } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
  ApiOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { API_BASE } from '../services/api';

const { Text } = Typography;

export default function HealthStatusCard({ healthData, loading, error, latency, onRefresh }) {
  const isHealthy = !error && healthData?.status === 'ok';
  const isDbConnected = healthData?.database === 'connected';

  return (
    <Card
      title={
        <Space>
          <ApiOutlined style={{ color: '#0b4f8a' }} />
          <span>Backend System Status</span>
          <Badge status={isHealthy ? 'success' : 'error'} />
        </Space>
      }
      extra={
        <Button
          type="text"
          icon={<ReloadOutlined spin={loading} />}
          onClick={onRefresh}
          size="small"
        >
          Refresh
        </Button>
      }
      style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>API Status</Text>
          <Space style={{ marginTop: '4px' }}>
            {isHealthy ? (
              <Tag color="success" icon={<CheckCircleFilled />}>ONLINE (200 OK)</Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleFilled />}>OFFLINE</Tag>
            )}
          </Space>
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Active Environment</Text>
          <Tag color="blue" style={{ marginTop: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            {healthData?.environment || 'unknown'}
          </Tag>
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Database</Text>
          <Space style={{ marginTop: '4px' }}>
            <DatabaseOutlined />
            <Tag color={isDbConnected ? 'cyan' : 'orange'}>
              {healthData?.database || 'checking...'}
            </Tag>
          </Space>
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>API Latency</Text>
          <Space style={{ marginTop: '4px' }}>
            <ThunderboltOutlined style={{ color: '#faad14' }} />
            <Text strong>{latency !== null ? `${latency} ms` : '-'}</Text>
          </Space>
        </div>
      </div>

      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>Configured API Base:</strong>{' '}
          <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', color: '#0b4f8a' }}>
            {API_BASE}
          </code>
        </Text>
        {error && (
          <div style={{ marginTop: '8px', color: '#ff4d4f', fontSize: '12px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </Card>
  );
}
