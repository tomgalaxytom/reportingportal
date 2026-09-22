import React from 'react';
import { Layout, Menu, Button, Space, Typography, Tag } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  FormOutlined,
  TableOutlined,
  HeartOutlined,
  LoginOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import logo from '../assets/logo.png';

const { Header } = Layout;
const { Title, Text } = Typography;

export default function Navbar() {
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Home</Link>,
    },
    {
      key: '/login',
      icon: <LoginOutlined />,
      label: <Link to="/login">Login</Link>,
    },
    {
      key: '/district-entry',
      icon: <FormOutlined />,
      label: <Link to="/district-entry">District Entry</Link>,
    },
    {
      key: '/board-dashboard',
      icon: <TableOutlined />,
      label: <Link to="/board-dashboard">Board Section</Link>,
    },
    {
      key: '/health',
      icon: <HeartOutlined />,
      label: <Link to="/health">System Health</Link>,
    },
  ];

  return (
    <Header
        style={{
          background: '#ffffff',
          padding: '12px 24px',
          height: 'auto',
          lineHeight: 'normal',
          borderBottom: '1px solid #eaeaea',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src={logo}
            alt="TNPCB Logo"
            style={{
              height: 46,
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '17px', color: '#0b4f8a', lineHeight: 1.2 }}>
              Tamil Nadu Pollution Control Board
            </div>
            <div style={{ fontSize: '12px', color: '#595959', marginTop: '2px' }}>
              தமிழ்நாடு மாசு கட்டுப்பாடு வாரியம்
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', flex: 1, padding: '0 20px' }}>
          <div style={{ fontWeight: 800, fontSize: '23px', color: '#08325a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            CM Dashboard-TNEGA Reporting Portal
          </div>
          <div style={{ fontSize: '14px', color: '#4a5568', fontWeight: 500, marginTop: '3px', letterSpacing: '0.2px' }}>
            Monthly Waste Management Monitoring System
          </div>
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{
            borderBottom: 'none',
            background: 'transparent',
            fontWeight: 500,
            justifyContent: 'flex-end',
          }}
        />
      </Header>
  );
}
