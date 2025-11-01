import { useNotes } from '@/contexts/NotesContext';
import { router } from 'expo-router';
import { FileText, Plus, Sparkles } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { notes, isLoading } = useNotes();
  const insets = useSafeAreaInsets();

  const handleNewNote = () => {
    router.push('/upload' as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/t9443cfp1i0nxfm04yt41' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>Notably</Text>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.badgeContainer}>
              <Sparkles size={16} color="#2563EB" strokeWidth={2} />
              <Text style={styles.badgeText}>AI-Powered Note Taking</Text>
            </View>
            <Text style={styles.heroTitle}>Transform Your Documents{'\n'}Into Smart Notes</Text>
            <Text style={styles.heroSubtitle}>
              Upload documents, photos, PDFs, and more. Let AI summarize and create beautiful notes for you.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={handleNewNote}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.ctaButtonText}>Create New Note</Text>
            </Pressable>
          </View>


        </View>

        {notes.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Notes</Text>
            <View style={styles.notesGrid}>
              {notes.slice(0, 6).map((note) => (
                <Pressable
                  key={note.id}
                  style={({ pressed }) => [
                    styles.noteCard,
                    pressed && styles.noteCardPressed,
                  ]}
                  onPress={() => router.push(`/note/${note.id}` as any)}
                >
                  <Text style={styles.noteTitle} numberOfLines={2}>
                    {note.title}
                  </Text>
                  <Text style={styles.noteSummary} numberOfLines={3}>
                    {note.summary}
                  </Text>
                  <View style={styles.noteFooter}>
                    <View style={styles.formatBadge}>
                      <Text style={styles.formatBadgeText}>
                        {note.format === 'bullet-points' ? 'Bullet Points' : note.format === 'outline' ? 'Outline' : 'Paragraph'}
                      </Text>
                    </View>
                    <Text style={styles.noteDate}>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {notes.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <FileText size={48} color="#CBD5E1" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyDescription}>
              Start by uploading your first document or photo
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      default: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
      },
    }),
  },
  logo: {
    width: 80,
    height: 80,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 32,
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 17,
    fontWeight: '400' as const,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
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
  ctaButtonPressed: {
    backgroundColor: '#1E40AF',
    transform: [{ scale: 0.98 }],
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },

  recentSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0F172A',
    marginBottom: 20,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { width: 'calc(33.333% - 11px)' as any, minWidth: 280 },
      default: { width: '100%' as const },
    }),
  },
  noteCardPressed: {
    backgroundColor: '#F8FAFC',
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#0F172A',
    marginBottom: 8,
  },
  noteSummary: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formatBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formatBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  noteDate: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#94A3B8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#64748B',
    textAlign: 'center',
  },
});
