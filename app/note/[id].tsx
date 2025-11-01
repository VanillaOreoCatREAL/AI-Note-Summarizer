import { useNotes } from '@/contexts/NotesContext';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Calendar, FileText, Send, Share2, Sparkles, Trash2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork/toolkit-sdk';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, deleteNote, updateNote } = useNotes();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const note = notes.find(n => n.id === id);

  useEffect(() => {
    if (note && note.summary === '' && note.fileUri) {
      generateInitialNote();
    }
  }, []);

  const generateInitialNote = async () => {
    if (!note || !note.fileUri) return;
    
    setIsGenerating(true);
    try {
      let content = '';
      
      if (note.fileMimeType?.startsWith('image/')) {
        const base64Response = await fetch(note.fileUri);
        const blob = await base64Response.blob();
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });

        content = await generateText({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract all text from this image. Be thorough and capture everything visible.' },
                { type: 'image', image: base64 },
              ],
            },
          ],
        });
      } else if (note.fileMimeType === 'text/plain') {
        const response = await fetch(note.fileUri);
        content = await response.text();
      } else {
        content = `Content from ${note.sourceFileName}. (Full text extraction for this file type is limited in this demo.)`;
      }

      const formatInstruction = 
        note.format === 'bullet-points' 
          ? 'Create organized bullet points with clear hierarchy and categories.'
          : note.format === 'outline'
          ? 'Create a structured outline with main topics and subtopics using numbers and letters.'
          : 'Write clear, well-organized paragraphs.';

      const summaryPrompt = note.customInstructions 
        ? `${note.customInstructions}\n\n${formatInstruction}\n\nContent:\n${content}`
        : `Summarize the following content comprehensively. ${formatInstruction}\n\nContent:\n${content}`;

      const summary = await generateText(summaryPrompt);

      const title = await generateText(
        `Generate a short, descriptive title (5-8 words max) for these notes:\n\n${summary.substring(0, 500)}`
      );

      updateNote(note.id, {
        title: title.trim(),
        summary,
        content,
      });
    } catch (error) {
      console.error('Error generating note:', error);
      Alert.alert('Error', 'Failed to generate notes. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!note) return '';

      const prompt = `Current note content:\n${note.summary}\n\nUser request: ${message}\n\nPlease modify the note according to the user's request. Return the full updated note content in the same format (${note.format === 'bullet-points' ? 'bullet points' : note.format === 'outline' ? 'outline' : 'paragraphs'}).`;

      const updatedSummary = await generateText(prompt);
      return updatedSummary;
    },
    onSuccess: (updatedSummary) => {
      if (note && updatedSummary) {
        updateNote(note.id, { summary: updatedSummary });
      }
      setChatInput('');
    },
    onError: (error) => {
      console.error('Error updating note:', error);
      Alert.alert('Error', 'Failed to update note. Please try again.');
    },
  });

  if (!note) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Note not found</Text>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          try {
            await navigator.share({
              title: note.title,
              text: `${note.title}\n\n${note.summary}`,
            });
          } catch (shareError: any) {
            if (shareError.name === 'NotAllowedError' || shareError.name === 'AbortError') {
              await navigator.clipboard.writeText(`${note.title}\n\n${note.summary}`);
              Alert.alert('Copied!', 'Note copied to clipboard');
              return;
            }
            throw shareError;
          }
        } else {
          await navigator.clipboard.writeText(`${note.title}\n\n${note.summary}`);
          Alert.alert('Copied!', 'Note copied to clipboard');
        }
      } else {
        await Share.share({
          message: `${note.title}\n\n${note.summary}`,
        });
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      if (error.name === 'AbortError') {
        return;
      }
      Alert.alert('Error', 'Failed to share note. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNote(note.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || chatMutation.isPending) return;
    chatMutation.mutate(chatInput);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderContent = () => {
    if (isGenerating) {
      return (
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.generatingText}>AI is generating your notes...</Text>
          <Text style={styles.generatingSubtext}>This may take a moment</Text>
        </View>
      );
    }

    if (!note.summary) {
      return (
        <View style={styles.generatingContainer}>
          <Text style={styles.generatingText}>Preparing to generate...</Text>
        </View>
      );
    }

    const lines = note.summary.split('\n');
    
    return (
      <>
        {lines.map((line, index) => {
      if (!line.trim()) {
        return <View key={index} style={styles.spacer} />;
      }

      if (line.match(/^#+\s/)) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s/, '');
        return (
          <Text key={index} style={[styles.heading, level === 1 ? styles.heading1 : styles.heading2]}>
            {text}
          </Text>
        );
      }

      if (line.match(/^[-*•]\s/) || line.match(/^\d+\.\s/)) {
        const text = line.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '');
        return (
          <View key={index} style={styles.bulletContainer}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{text}</Text>
          </View>
        );
      }

      if (line.match(/^\s{2,}[-*•]\s/) || line.match(/^\s{2,}\d+\.\s/)) {
        const text = line.trim().replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '');
        return (
          <View key={index} style={[styles.bulletContainer, styles.nestedBullet]}>
            <Text style={styles.bullet}>◦</Text>
            <Text style={styles.bulletText}>{text}</Text>
          </View>
        );
      }

      return (
        <Text key={index} style={styles.paragraph}>
          {line}
        </Text>
      );
    })}
      </>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerShadowVisible: false,
          headerTintColor: '#0F172A',
          headerRight: () => (
            <View style={styles.headerRight}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
                onPress={handleShare}
              >
                <Share2 size={20} color="#0F172A" strokeWidth={2} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
                onPress={handleDelete}
              >
                <Trash2 size={20} color="#DC2626" strokeWidth={2} />
              </Pressable>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{note.title}</Text>
            
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Calendar size={14} color="#64748B" strokeWidth={2} />
                <Text style={styles.metaText}>{formatDate(note.createdAt)}</Text>
              </View>
              
              <View style={styles.metaItem}>
                <FileText size={14} color="#64748B" strokeWidth={2} />
                <Text style={styles.metaText}>{note.sourceFileName}</Text>
              </View>
            </View>

            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {note.format === 'bullet-points' 
                    ? 'Bullet Points' 
                    : note.format === 'outline' 
                    ? 'Outline' 
                    : 'Paragraph'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.contentSection}>
            {renderContent()}
          </View>
        </ScrollView>

        {!isGenerating && note.summary && (
          <View style={[styles.chatContainer, { paddingBottom: insets.bottom + 10 }]}>
            <View style={styles.chatHeader}>
              <Sparkles size={16} color="#2563EB" strokeWidth={2} />
              <Text style={styles.chatHeaderText}>Ask AI to modify your notes</Text>
            </View>
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="e.g., Add more details, Reorganize by topic, Simplify..."
                placeholderTextColor="#94A3B8"
                value={chatInput}
                onChangeText={setChatInput}
                multiline
                maxLength={500}
                editable={!chatMutation.isPending}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.sendButton,
                  (!chatInput.trim() || chatMutation.isPending) && styles.sendButtonDisabled,
                  pressed && chatInput.trim() && !chatMutation.isPending && styles.sendButtonPressed,
                ]}
                onPress={handleSendMessage}
                disabled={!chatInput.trim() || chatMutation.isPending}
              >
                {chatMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={18} color="#FFFFFF" strokeWidth={2} />
                )}
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerButtonPressed: {
    backgroundColor: '#E2E8F0',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#0F172A',
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  metaContainer: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#64748B',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  generatingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  generatingText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#0F172A',
    marginTop: 16,
  },
  generatingSubtext: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#64748B',
    marginTop: 8,
  },
  heading: {
    fontWeight: '700' as const,
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  heading1: {
    fontSize: 26,
    lineHeight: 34,
  },
  heading2: {
    fontSize: 22,
    lineHeight: 30,
  },
  paragraph: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: '#1E293B',
    lineHeight: 26,
    marginBottom: 16,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  nestedBullet: {
    marginLeft: 24,
  },
  bullet: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#2563EB',
    marginRight: 12,
    minWidth: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400' as const,
    color: '#1E293B',
    lineHeight: 24,
  },
  spacer: {
    height: 12,
  },
  chatContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  chatHeaderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendButtonPressed: {
    backgroundColor: '#1E40AF',
  },
});
