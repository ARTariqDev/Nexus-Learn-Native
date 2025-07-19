import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MailComposer from 'expo-mail-composer';
import { Ionicons } from '@expo/vector-icons';
import Header from 'components/Header';
import Footer from 'components/BottomMenu';

interface AttachedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export default function Contribute() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(false);

  const subjectOptions = [
    { label: 'Select a subject...', value: '' },
    { label: 'Feedback/Bugs', value: 'feedback' },
    { label: 'Contribute Resources', value: 'contribute' },
  ];

  const supportedFileTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/jpg', 
    'image/png',
  ];

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: supportedFileTypes,
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        }));
        setAttachedFiles([...attachedFiles, ...newFiles]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick files. Please try again.');
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(updatedFiles);
  };

  const getFileSizeText = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sendEmail = async () => {
    if (!subject) {
      Alert.alert('Error', 'Please select a subject');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setLoading(true);

    try {
      const emailSubject = subject === 'feedback' ? 'Nexus Learn - Feedback/Bugs' : 'Nexus Learn - Resource Contribution';
      
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Mail composer is not available on this device');
        setLoading(false);
        return;
      }

      const attachments = attachedFiles.map(file => file.uri);

      await MailComposer.composeAsync({
        recipients: ['artariqdev@gmail.com'],
        subject: emailSubject,
        body: message,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Reset form after successful send
      setSubject('');
      setMessage('');
      setAttachedFiles([]);
      
      Alert.alert('Success', 'Email composed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to compose email. Please try again.');
    }

    setLoading(false);
  };

  const renderFileList = () => {
    if (attachedFiles.length === 0) return null;

    return (
      <View style={styles.fileList}>
        <Text style={styles.fileListTitle}>Attached Files:</Text>
        {attachedFiles.map((file, index) => (
          <View key={index} style={styles.fileItem}>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileSize}>
                {getFileSizeText(file.size)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removeFile(index)}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={20} color="#f87171" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Contribute to AdmitAxis</Text>
        <Text style={styles.subtitle}>
          Help us improve by sharing feedback or contributing resources
        </Text>

        {/* A picker for Subject Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Subject *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={subject}
              onValueChange={(value) => setSubject(value)}
              style={styles.picker}
              dropdownIconColor="#ffaa00"
              itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
            >
              {subjectOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  color={Platform.OS === 'android' ? '#fff' : '#000'}
                  style={Platform.OS === 'android' ? { backgroundColor: '#111' } : undefined}
                />
              ))}
            </Picker>
          </View>
        </View>


        {subject && (
          <View style={styles.section}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={styles.textArea}
              value={message}
              onChangeText={setMessage}
              placeholder={
                subject === 'feedback' 
                  ? 'Share your feedback or report bugs...'
                  : 'Describe the resources you\'re contributing...'
              }
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* File Attachments (only for contribute based these on state) */}
        {subject === 'contribute' && (
          <View style={styles.section}>
            <Text style={styles.label}>Attachments</Text>
            <Text style={styles.supportedTypes}>
              Supported: PDF, DOCX, DOC, JPG, JPEG, PNG
            </Text>
            
            <TouchableOpacity style={styles.attachButton} onPress={pickFiles}>
              <Ionicons name="attach" size={20} color="#000" />
              <Text style={styles.attachButtonText}>Attach Files</Text>
            </TouchableOpacity>

            {renderFileList()}
          </View>
        )}


        {subject && (
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={sendEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#000" />
                <Text style={styles.sendButtonText}>Send Email</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    backgroundColor: '#111',
    height: Platform.OS === 'ios' ? 120 : 50,
  },
  pickerItem: {
    color: '#fff',
    backgroundColor: '#111',
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
  },
  supportedTypes: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  attachButton: {
    backgroundColor: '#ffaa00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  attachButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  fileList: {
    marginTop: 16,
  },
  fileListTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  sendButton: {
    backgroundColor: '#ffaa00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});