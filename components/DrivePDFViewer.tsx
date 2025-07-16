
import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface DrivePDFViewerProps {
  driveUrl: string;
}

const DrivePDFViewer = ({ driveUrl }: DrivePDFViewerProps) => {
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(driveUrl)}`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: viewerUrl }}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator style={styles.loader} size="large" color="#ffaa00" />
        )}
      />
    </View>
  );
};

export default DrivePDFViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
});
