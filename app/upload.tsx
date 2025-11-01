import { useNotes, type NoteFormat } from '@/contexts/NotesContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { Check, FileText, Image as ImageIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UploadScreen() {
  const { addNote } = useNotes();
  const insets = useSafeAreaInsets();
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    mimeType: string;
  } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<NoteFormat>('paragraph');
  const [customInstructions, setCustomInstructions] = useState('');

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile({
        uri: file.uri,
        name: file.name,
        type: 'document',
        mimeType: file.mimeType || 'application/octet-stream',
      });
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'] as any,
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled) {
        return;
      }

      const photo = result.assets[0];
      setSelectedFile({
        uri: photo.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'photo',
        mimeType: 'image/jpeg',
      });
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled) {
        return;
      }

      const image = result.assets[0];
      setSelectedFile({
        uri: image.uri,
        name: `image_${Date.now()}.jpg`,
        type: 'image',
        mimeType: 'image/jpeg',
      });
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file first');
      return;
    }

    const noteId = Date.now().toString();
    const note = {
      id: noteId,
      title: 'Generating...',
      content: '',
      summary: '',
      format: selectedFormat,
      sourceFileName: selectedFile.name,
      sourceType: selectedFile.type,
      createdAt: new Date().toISOString(),
      fileUri: selectedFile.uri,
      fileMimeType: selectedFile.mimeType,
      customInstructions,
    };

    addNote(note as any);
    router.push(`/note/${noteId}` as any);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Note',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerShadowVisible: false,
          headerTintColor: '#0F172A',
        }}
      />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Source</Text>
            <Text style={styles.sectionDescription}>
              Choose a document, photo, or take a picture
            </Text>

            <View style={styles.uploadGrid}>
              <Pressable
                style={({ pressed }) => [
                  styles.uploadButton,
                  pressed && styles.uploadButtonPressed,
                ]}
                onPress={handlePickDocument}
              >
                <View style={styles.uploadIconContainer}>
                  <FileText size={28} color="#2563EB" strokeWidth={2} />
                </View>
                <Text style={styles.uploadButtonText}>Document</Text>
                <Text style={styles.uploadButtonSubtext}>PDF, TXT, DOC</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.uploadButton,
                  pressed && styles.uploadButtonPressed,
                ]}
                onPress={handlePickImage}
              >
                <View style={styles.uploadIconContainer}>
                  <ImageIcon size={28} color="#10B981" strokeWidth={2} />
                </View>
                <Text style={styles.uploadButtonText}>Photo</Text>
                <Text style={styles.uploadButtonSubtext}>From Gallery</Text>
              </Pressable>
            </View>

            {selectedFile && (
              <View style={styles.selectedFileContainer}>
                <View style={styles.selectedFileIcon}>
                  {selectedFile.type === 'document' ? (
                    <FileText size={20} color="#2563EB" strokeWidth={2} />
                  ) : (
                    <ImageIcon size={20} color="#10B981" strokeWidth={2} />
                  )}
                </View>
                <View style={styles.selectedFileInfo}>
                  <Text style={styles.selectedFileName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={styles.selectedFileType}>{selectedFile.type}</Text>
                </View>
                <Pressable onPress={() => setSelectedFile(null)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note Format</Text>
            <Text style={styles.sectionDescription}>Choose how to organize your notes</Text>

            <View style={styles.formatGrid}>
              <Pressable
                style={({ pressed }) => [
                  styles.formatOption,
                  selectedFormat === 'paragraph' && styles.formatOptionSelected,
                  pressed && styles.formatOptionPressed,
                ]}
                onPress={() => setSelectedFormat('paragraph')}
              >
                <Text
                  style={[
                    styles.formatOptionText,
                    selectedFormat === 'paragraph' && styles.formatOptionTextSelected,
                  ]}
                >
                  Paragraph
                </Text>
                {selectedFormat === 'paragraph' && (
                  <Check size={18} color="#2563EB" strokeWidth={2.5} />
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.formatOption,
                  selectedFormat === 'bullet-points' && styles.formatOptionSelected,
                  pressed && styles.formatOptionPressed,
                ]}
                onPress={() => setSelectedFormat('bullet-points')}
              >
                <Text
                  style={[
                    styles.formatOptionText,
                    selectedFormat === 'bullet-points' && styles.formatOptionTextSelected,
                  ]}
                >
                  Bullet Points
                </Text>
                {selectedFormat === 'bullet-points' && (
                  <Check size={18} color="#2563EB" strokeWidth={2.5} />
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Instructions (Optional)</Text>
            <Text style={styles.sectionDescription}>
              Tell AI how you want your notes processed
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="e.g., Focus on key concepts, include examples, highlight important dates..."
              placeholderTextColor="#94A3B8"
              value={customInstructions}
              onChangeText={setCustomInstructions}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.processButton,
              !selectedFile && styles.processButtonDisabled,
              pressed && selectedFile && styles.processButtonPressed,
            ]}
            onPress={handleProcess}
            disabled={!selectedFile}
          >
            <Text style={styles.processButtonText}>Generate Notes</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0F172A',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#64748B',
    marginBottom: 20,
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  uploadButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: 100,
  },
  uploadButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  uploadButtonSubtext: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#64748B',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectedFileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0F172A',
    marginBottom: 2,
  },
  selectedFileType: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#64748B',
  },
  removeButton: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: 100,
  },
  formatOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  formatOptionPressed: {
    opacity: 0.7,
  },
  formatOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  formatOptionTextSelected: {
    color: '#2563EB',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 120,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      web: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      default: {
        elevation: 4,
      },
    }),
  },
  processButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  processButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
