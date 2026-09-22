import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist in the reporting portal."
        extra={
          <Link to="/">
            <Button type="primary" style={{ background: '#0b4f8a' }}>
              Back to Home
            </Button>
          </Link>
        }
      />
    </div>
  );
}
