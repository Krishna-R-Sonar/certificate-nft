// frontend/src/components/ErrorBoundary.js
import React from 'react';
import { Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Something went wrong!
          </Typography>
          <Typography>{this.state.error?.message || 'An unexpected error occurred.'}</Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            style={{ marginTop: 16 }}
          >
            Reload Page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;