import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || 'No stack trace available',
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <AlertCircle size={64} color="#ef4444" />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>

            <ScrollView style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Error Details:</Text>
              <Text style={styles.detailsText}>
                {this.state.error?.stack || 'No details available'}
              </Text>
              {this.state.errorInfo && (
                <>
                  <Text style={styles.detailsTitle}>Component Stack:</Text>
                  <Text style={styles.detailsText}>{this.state.errorInfo}</Text>
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsContainer: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
