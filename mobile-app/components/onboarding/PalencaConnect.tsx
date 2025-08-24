import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface PalencaConnectProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  widgetId?: string;
}

const PalencaConnect: React.FC<PalencaConnectProps> = ({ 
  onSuccess, 
  onError, 
  widgetId = 'x' 
}) => {
  const [loading, setLoading] = useState(true);

  const handleEvent = (event: any) => {
    console.log('Palenca event received:', event.nativeEvent.data);
    
    try {
      const eventData = JSON.parse(event.nativeEvent.data);
      
      // Handle different event signals according to Palenca docs
      switch (eventData.signal) {
        case 'ready':
          console.log('Palenca widget is ready');
          break;
        case 'user_created':
          console.log('Palenca user created successfully - waiting for connection');
          // Don't call onSuccess() here - user still needs to complete authentication
          break;
        case 'connection_success':
          console.log('Palenca connection successful:', eventData.response);
          onSuccess();
          break;
        case 'connection_error':
          console.log('Palenca connection error:', eventData.response?.error);
          onError(eventData.response?.error?.message || 'Connection failed');
          break;
        default:
          console.log('Unknown Palenca signal:', eventData.signal);
      }
    } catch (error) {
      console.log('Failed to parse Palenca event:', error);
      Alert.alert('Palenca Response', event.nativeEvent.data);
    }
  };

  const baseUrl: string = 'https://connect.palenca.com';
  const uri: string = `${baseUrl}?widget_id=${widgetId}&primary_color=ea4c89`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connect Your Account</Text>
        <Text style={styles.subtitle}>
          Link your Gig Worker account securely to continue
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ea4c89" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      <WebView 
        onMessage={handleEvent}
        source={{ uri }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ea4c89" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    //borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
});

export default PalencaConnect;