import React from 'react';
import { Tag } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';

export default function StatusTag({ status }) {
  if (!status) return null;

  const s = status.toLowerCase();

  if (s.includes('verified') || s.includes('approved')) {
    return (
      <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: '2px 10px', borderRadius: '12px' }}>
        Verified
      </Tag>
    );
  }

  if (s.includes('revision') || s.includes('rejected')) {
    return (
      <Tag icon={<ExclamationCircleOutlined />} color="error" style={{ padding: '2px 10px', borderRadius: '12px' }}>
        Needs Revision
      </Tag>
    );
  }

  if (s.includes('pending') || s.includes('submitted')) {
    return (
      <Tag icon={<ClockCircleOutlined />} color="gold" style={{ padding: '2px 10px', borderRadius: '12px' }}>
        Pending Verification
      </Tag>
    );
  }

  return (
    <Tag icon={<SyncOutlined />} color="default" style={{ padding: '2px 10px', borderRadius: '12px' }}>
      {status}
    </Tag>
  );
}
