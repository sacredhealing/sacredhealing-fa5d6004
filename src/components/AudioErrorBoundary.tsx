import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useT } from '@/i18n/useT';

export interface AudioErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface InnerProps extends AudioErrorBoundaryProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
}

interface AudioErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AudioErrorBoundaryInner extends Component<InnerProps, AudioErrorBoundaryState> {
  constructor(props: InnerProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): AudioErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SQI Audio Error]', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '24px',
            padding: '24px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }} aria-hidden>
            🎵
          </div>
          <p style={{ color: '#D4AF37', fontWeight: 700, marginBottom: '8px' }}>
            {t('audioErrorBoundary.title')}
          </p>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>{t('audioErrorBoundary.body')}</p>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
              border: 'none',
              borderRadius: '50px',
              padding: '10px 24px',
              color: '#050505',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {t('audioErrorBoundary.reconnect')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AudioErrorBoundary(props: AudioErrorBoundaryProps) {
  const { t } = useT();
  return <AudioErrorBoundaryInner {...props} t={t} />;
}
