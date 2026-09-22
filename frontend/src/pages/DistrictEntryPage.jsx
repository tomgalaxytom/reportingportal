import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Divider,
  Alert,
  Table,
  Tag,
  Space,
} from 'antd';
import {
  SendOutlined,
  ReloadOutlined,
  FileDoneOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { TN_DISTRICTS, WASTE_TYPES } from '../utils/constants';
import { useReports } from '../hooks/useReports';
import StatusTag from '../components/StatusTag';
import { formatMetricTonnes, formatDate } from '../utils/formatters';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function DistrictEntryPage() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { reports, loading, createReport, refetch } = useReports();

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createReport({
        district_name: values.district_name,
        officer_name: values.officer_name,
        officer_email: values.officer_email,
        waste_type: values.waste_type,
        reporting_month: values.reporting_month,
        quantity_generated_mt: parseFloat(values.quantity_generated_mt),
        quantity_processed_mt: parseFloat(values.quantity_processed_mt),
        authorized_facilities_count: parseInt(values.authorized_facilities_count || 1, 10),
        remarks: values.remarks || '',
      });
      form.resetFields();
    } catch (err) {
      // Handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'District',
      dataIndex: 'district_name',
      key: 'district_name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Month',
      dataIndex: 'reporting_month',
      key: 'reporting_month',
    },
    {
      title: 'Waste Stream',
      dataIndex: 'waste_type',
      key: 'waste_type',
      render: (type) => {
        const found = WASTE_TYPES.find((w) => w.value === type);
        return <Tag color={found?.color || 'blue'}>{type}</Tag>;
      },
    },
    {
      title: 'Generated',
      dataIndex: 'quantity_generated_mt',
      key: 'quantity_generated_mt',
      render: (val) => formatMetricTonnes(val),
    },
    {
      title: 'Processed',
      dataIndex: 'quantity_processed_mt',
      key: 'quantity_processed_mt',
      render: (val) => formatMetricTonnes(val),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: 'Submitted On',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date),
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#0b4f8a', marginBottom: '4px' }}>
          District Office Waste Data Entry
        </Title>
        <Paragraph type="secondary">
          Enter monthly generated and processed waste quantities for official compilation and CM Dashboard monitoring.
        </Paragraph>
      </div>

      <Alert
        message="Important Submission Deadline"
        description="All District Environmental Engineers (DEEs) must record and submit the previous month's verified statistics by the 5th of every month."
        type="info"
        showIcon
        style={{ marginBottom: '24px', borderRadius: '8px' }}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <FileDoneOutlined style={{ color: '#0b4f8a' }} />
                <span>Monthly Return Form</span>
              </Space>
            }
            style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                reporting_month: 'September 2026',
                waste_type: 'E-Waste',
                authorized_facilities_count: 1,
              }}
            >
              <Form.Item
                name="district_name"
                label="District Office"
                rules={[{ required: true, message: 'Please select your district' }]}
              >
                <Select placeholder="Select District" showSearch>
                  {TN_DISTRICTS.map((d) => (
                    <Option key={d} value={d}>
                      {d}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="officer_name"
                    label="Reporting Officer"
                    rules={[{ required: true, message: 'Officer name is required' }]}
                  >
                    <Input placeholder="e.g., DEE K. Sundaram" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="officer_email"
                    label="Official Email"
                    rules={[
                      { required: true, message: 'Email is required' },
                      { type: 'email', message: 'Enter valid email' },
                    ]}
                  >
                    <Input placeholder="dee.chn@tnpcb.gov.in" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="waste_type"
                    label="Waste Stream"
                    rules={[{ required: true, message: 'Select waste stream' }]}
                  >
                    <Select>
                      {WASTE_TYPES.map((w) => (
                        <Option key={w.value} value={w.value}>
                          {w.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="reporting_month"
                    label="Reporting Month"
                    rules={[{ required: true, message: 'Reporting month is required' }]}
                  >
                    <Select>
                      <Option value="September 2026">September 2026</Option>
                      <Option value="August 2026">August 2026</Option>
                      <Option value="July 2026">July 2026</Option>
                      <Option value="June 2026">June 2026</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="quantity_generated_mt"
                    label="Generated (MT)"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="quantity_processed_mt"
                    label="Processed / Treated (MT)"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="authorized_facilities_count"
                label="Number of Authorized Processing Facilities"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="remarks" label="Remarks / Verification Notes">
                <TextArea rows={3} placeholder="Provide additional details or compliance actions taken..." />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={submitting}
                block
                style={{ height: '42px', fontWeight: 600, background: '#0b4f8a' }}
              >
                Submit Monthly Return to Board
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <span>District Submissions History</span>
                  <Tag color="blue">{reports.length} Total</Tag>
                </Space>
                <Button
                  icon={<ReloadOutlined spin={loading} />}
                  onClick={refetch}
                  size="small"
                >
                  Refresh
                </Button>
              </div>
            }
            style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
          >
            <Table
              dataSource={reports}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 6 }}
              size="middle"
              scroll={{ x: 650 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
