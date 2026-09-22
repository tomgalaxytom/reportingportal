import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Modal, message } from 'antd';
import {
  LoginOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Role: 'district' | 'board'
  const currentRoleParam = searchParams.get('role');
  const initialRole =
    currentRoleParam === 'board' || currentRoleParam === 'board_section' || currentRoleParam === 'jcee'
      ? 'board'
      : 'district';

  const [activeRole, setActiveRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Sync state and form credentials when URL query param changes
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'board' || roleParam === 'board_section' || roleParam === 'jcee') {
      setActiveRole('board');
      form.setFieldsValue({
        username: 'tomgalaxytom@gmail.com',
        password: 'GtLA$1!6',
      });
    } else {
      setActiveRole('district');
      form.setFieldsValue({
        username: 'stalingalaxy@gmail.com',
        password: 'a?H#t7e2',
      });
    }
  }, [searchParams, form]);

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setSearchParams({ role });
    if (role === 'district') {
      form.setFieldsValue({
        username: 'stalingalaxy@gmail.com',
        password: 'a?H#t7e2',
      });
    } else {
      form.setFieldsValue({
        username: 'tomgalaxytom@gmail.com',
        password: 'GtLA$1!6',
      });
    }
  };

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const user = await authService.login(values.username, values.password);

      // Check role
      if (user.role === 'dee') {
        message.success(`Welcome ${user.district_name || 'Ambattur'} DEE Officer! Logged in successfully.`);
        navigate('/district-dashboard');
      } else if (user.role === 'jcee' || user.role === 'jc') {
        message.success(`Welcome JCEE Board Officer! Logged in successfully.`);
        navigate('/board-dashboard');
      } else {
        // Fallback based on activeRole
        if (activeRole === 'district') {
          navigate('/district-dashboard');
        } else {
          navigate('/board-dashboard');
        }
      }
    } catch (err) {
      message.error(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 130px)',
        backgroundColor: '#edf3f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(14, 58, 108, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
          padding: '38px 34px 32px 34px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        {/* Title and Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <Title
            level={3}
            style={{
              margin: '0 0 6px 0',
              fontWeight: 700,
              color: '#0e2b48',
              fontSize: '22px',
              letterSpacing: '-0.2px',
            }}
          >
            Member Login
          </Title>
          <Text
            style={{
              color: '#64748b',
              fontSize: '13.5px',
              fontWeight: 400,
            }}
          >
            Select your role and sign in
          </Text>
        </div>

        {/* Dual Role Segmented Control (District Office / Board Section) */}
        <div
          style={{
            display: 'flex',
            background: '#ffffff',
            border: '1px solid #d0dbe7',
            borderRadius: '8px',
            padding: '4px',
            marginBottom: '24px',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <button
            type="button"
            id="district-office-tab-btn"
            onClick={() => handleRoleChange('district')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: activeRole === 'district' ? 600 : 500,
              color: activeRole === 'district' ? '#ffffff' : '#475569',
              background: activeRole === 'district' ? '#0e3a6c' : 'transparent',
              transition: 'all 0.2s ease',
              boxShadow:
                activeRole === 'district' ? '0 2px 6px rgba(14, 58, 108, 0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            District Office
          </button>
          <button
            type="button"
            id="board-section-tab-btn"
            onClick={() => handleRoleChange('board')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: activeRole === 'board' ? 600 : 500,
              color: activeRole === 'board' ? '#ffffff' : '#475569',
              background: activeRole === 'board' ? '#0e3a6c' : 'transparent',
              transition: 'all 0.2s ease',
              boxShadow:
                activeRole === 'board' ? '0 2px 6px rgba(14, 58, 108, 0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            Board Section
          </button>
        </div>

        {/* Login Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            username:
              initialRole === 'district'
                ? 'stalingalaxy@gmail.com'
                : 'tomgalaxytom@gmail.com',
            password: initialRole === 'district' ? 'a?H#t7e2' : 'GtLA$1!6',
          }}
          requiredMark={false}
        >
          <Form.Item
            label={
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#334155',
                }}
              >
                User Name
              </span>
            }
            name="username"
            rules={[{ required: true, message: 'Please enter your username / official email' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input
              id="login-username-input"
              placeholder={
                activeRole === 'district'
                  ? 'stalingalaxy@gmail.com'
                  : 'tomgalaxytom@gmail.com'
              }
              style={{
                height: '40px',
                borderRadius: '6px',
                borderColor: '#cbd5e1',
                fontSize: '13.5px',
              }}
            />
          </Form.Item>

          <Form.Item
            label={
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#334155',
                }}
              >
                Password
              </span>
            }
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
            style={{ marginBottom: '22px' }}
          >
            <Input.Password
              id="login-password-input"
              placeholder="••••••••••"
              style={{
                height: '40px',
                borderRadius: '6px',
                borderColor: '#cbd5e1',
                fontSize: '13.5px',
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '18px' }}>
            <Button
              id="login-submit-btn"
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<LoginOutlined style={{ fontSize: '14px' }} />}
              style={{
                height: '42px',
                borderRadius: '6px',
                background: '#0e3a6c',
                borderColor: '#0e3a6c',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(14, 58, 108, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              Log In
            </Button>
          </Form.Item>
        </Form>

        {/* Footer Links */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          <div style={{ marginBottom: '6px' }}>
            Don't have an account?{' '}
            <a
              id="register-link"
              onClick={(e) => {
                e.preventDefault();
                setRegisterModalOpen(true);
              }}
              style={{
                color: '#0e3a6c',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Register
            </a>
          </div>
          <div>
            Forgot password?{' '}
            <a
              id="forgot-password-link"
              onClick={(e) => {
                e.preventDefault();
                setForgotModalOpen(true);
              }}
              style={{
                color: '#0e3a6c',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Reset here
            </a>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0e3a6c' }}>
            <UserOutlined />
            <span>TNPCB Official Registration</span>
          </div>
        }
        open={registerModalOpen}
        onOk={() => setRegisterModalOpen(false)}
        onCancel={() => setRegisterModalOpen(false)}
        okText="Got It"
        cancelButtonProps={{ style: { display: 'none' } }}
        okButtonProps={{ style: { background: '#0e3a6c' } }}
      >
        <Paragraph style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, marginTop: '12px' }}>
          District Environmental Engineers (DEE) and Board Officers are provisioned through the TNPCB State Administrative Directorate.
        </Paragraph>
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
          }}
        >
          <div style={{ fontWeight: 600, color: '#0e3a6c', marginBottom: '4px' }}>
            New District Office Account Setup:
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Submit an official delegation request to <strong style={{ color: '#0e3a6c' }}>board.admin@tnpcb.gov.in</strong> quoting your DEE jurisdiction office code.
          </div>
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0e3a6c' }}>
            <LockOutlined />
            <span>Reset Password Request</span>
          </div>
        }
        open={forgotModalOpen}
        onOk={() => {
          message.success('Password reset instructions have been forwarded to your registered official email.');
          setForgotModalOpen(false);
        }}
        onCancel={() => setForgotModalOpen(false)}
        okText="Send Reset Link"
        okButtonProps={{ style: { background: '#0e3a6c' } }}
      >
        <Paragraph style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, marginTop: '12px' }}>
          Enter your registered government email address (<Text code>@tnpcb.gov.in</Text> or designated district portal address) to receive password recovery instructions.
        </Paragraph>
        <Input
          prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
          placeholder="your.name@tnpcb.gov.in"
          defaultValue={form.getFieldValue('username') || ''}
          style={{ height: '40px', borderRadius: '6px' }}
        />
      </Modal>
    </div>
  );
}
