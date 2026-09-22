import React from 'react';
import { Typography, Button, Card, Space, Row, Col, Tag, Statistic } from 'antd';
import { Link } from 'react-router-dom';
import {
  UserOutlined,
  BankOutlined,
  FormOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  RightOutlined,
} from '@ant-design/icons';
const { Title, Text, Paragraph } = Typography;

export default function LandingPage() {

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Hero Section styled after TNPCB CM Dashboard */}
      <div
        style={{
          background:
            'repeating-linear-gradient(-45deg, #0e5699 0px, #0e5699 12px, #0b4a85 12px, #0b4a85 24px)',
          color: '#ffffff',
          padding: '60px 20px 65px 20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 -12px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ maxWidth: '880px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              color: '#d4e8fa',
              fontSize: '11px',
              letterSpacing: '1.5px',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            MONTHLY WASTE MANAGEMENT REPORTING — CM DASHBOARD-TNEGA
          </div>

          <Title
            level={1}
            style={{
              color: '#ffffff',
              fontSize: '34px',
              fontWeight: 800,
              margin: '0 0 14px 0',
              letterSpacing: '-0.3px',
            }}
          >
            Submit district waste reports online
          </Title>

          <Paragraph
            style={{
              color: '#e2effa',
              fontSize: '13.5px',
              lineHeight: 1.6,
              maxWidth: '680px',
              margin: '0 auto 28px auto',
              fontWeight: 400,
            }}
          >
            District Offices submit monthly E-Waste, Bio-Medical Waste and Plastic Waste data directly to the Board Section — replacing manual/email-based submission.
          </Paragraph>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '26px',
            }}
          >
            <Link to="/login?role=district">
              <Button
                id="landing-district-office-btn"
                size="large"
                icon={<UserOutlined style={{ fontSize: '15px', color: '#0b4f8a' }} />}
                style={{
                  height: '46px',
                  padding: '0 24px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#0b4f8a',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '14.5px', color: '#0b4f8a' }}>
                  District Office
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#666666',
                    marginLeft: '8px',
                    fontWeight: 400,
                  }}
                >
                  Login / Register
                </span>
              </Button>
            </Link>

            <Link to="/login?role=board">
              <Button
                id="landing-board-section-btn"
                size="large"
                icon={<BankOutlined style={{ fontSize: '15px', color: '#ffffff' }} />}
                style={{
                  height: '46px',
                  padding: '0 24px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1.5px solid rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(4px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '14.5px', color: '#ffffff' }}>
                  Board Section
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.85)',
                    marginLeft: '8px',
                    fontWeight: 400,
                  }}
                >
                  Login
                </span>
              </Button>
            </Link>
          </div>

          <div>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(8, 40, 75, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#dbeafe',
                padding: '6px 22px',
                borderRadius: '24px',
                fontSize: '12px',
                backdropFilter: 'blur(3px)',
              }}
            >
              Waste streams: <strong style={{ color: '#ffffff' }}>E-Waste</strong> · <strong style={{ color: '#ffffff' }}>Bio-Medical Waste</strong> · <strong style={{ color: '#ffffff' }}>Plastic Waste Management</strong>
            </span>
          </div>
        </div>
      </div>

      {/* "How it works" section */}
      <div style={{ maxWidth: '1100px', margin: '36px auto 50px auto', padding: '16px 24px 30px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#0b4f8a', marginBottom: '10px' }}>
            How it works
          </Title>
          <div style={{ marginTop: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f0f5ff',
                border: '1px solid #adc6ff',
                padding: '8px 20px',
                borderRadius: '20px',
                color: '#1d39c4',
                fontSize: '14.5px',
                fontWeight: 500,
              }}
            >
              <CalendarOutlined style={{ color: '#2f54eb', fontSize: '16px' }} />
              Monthly data must be submitted on or before the 5th of the following month.
            </span>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{
                borderRadius: '14px',
                height: '100%',
                border: '1px solid #e8e8e8',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#e6f4ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1677ff',
                  fontSize: '22px',
                  marginBottom: '16px',
                }}
              >
                <FormOutlined />
              </div>
              <Title level={4} style={{ color: '#0b4f8a', marginBottom: '10px' }}>
                1. Enter monthly data
              </Title>
              <Paragraph type="secondary" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                Each District / DEE office logs in and fills the applicable waste-stream form for the reporting month.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{
                borderRadius: '14px',
                height: '100%',
                border: '1px solid #e8e8e8',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#f6ffed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#52c41a',
                  fontSize: '22px',
                  marginBottom: '16px',
                }}
              >
                <CheckCircleOutlined />
              </div>
              <Title level={4} style={{ color: '#0b4f8a', marginBottom: '10px' }}>
                2. Board verifies
              </Title>
              <Paragraph type="secondary" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                Board Section reviews each submission — verifies it, or returns it with remarks for correction.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{
                borderRadius: '14px',
                height: '100%',
                border: '1px solid #e8e8e8',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#f9f0ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#722ed1',
                  fontSize: '22px',
                  marginBottom: '16px',
                }}
              >
                <BarChartOutlined />
              </div>
              <Title level={4} style={{ color: '#0b4f8a', marginBottom: '10px' }}>
                3. Auto-compiled reports
              </Title>
              <Paragraph type="secondary" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                Verified data auto-populates the monthly consolidated table and the quarterly CM Dashboard report.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
