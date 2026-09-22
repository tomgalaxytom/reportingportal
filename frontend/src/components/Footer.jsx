import React from 'react';
import { Layout, Typography, Space } from 'antd';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

export default function Footer() {
  return (
    <AntFooter
      style={{
        textAlign: 'center',
        background: '#082540',
        color: '#c0d6eb',
        padding: '24px 20px',
        marginTop: 'auto',
        fontSize: '13px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ margin: '0 0 6px 0', color: '#e8f2fc' }}>
          © 2026 Tamil Nadu Pollution Control Board · Waste Management Cell. All Rights Reserved.
        </p>
        <Space split={<span style={{ color: '#446b94' }}>|</span>} style={{ fontSize: '12px', color: '#8eb3d9' }}>
          <span>TNEGA CM Dashboard Integration</span>
          <span>E-Waste · Bio-Medical Waste · Plastic Waste</span>
          <span>Government of Tamil Nadu</span>
        </Space>
      </div>
    </AntFooter>
  );
}
