import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type NoteFormat = 'paragraph' | 'bullet-points' | 'outline';

export interface Note {
  id: string;
  title: string;
  content: string;
  format: NoteFormat;
  sourceFileName: string;
  sourceType: string;
  createdAt: string;
  summary: string;
  fileUri?: string;
  fileMimeType?: string;
  customInstructions?: string;
}

export const [NotesProvider, useNotes] = createContextHook(() => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem('notably-notes');
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNote = useCallback((note: Note) => {
    setNotes(currentNotes => {
      const updatedNotes = [note, ...currentNotes];
      AsyncStorage.setItem('notably-notes', JSON.stringify(updatedNotes)).catch(error => {
        console.error('Failed to save notes:', error);
      });
      return updatedNotes;
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(currentNotes => {
      const updatedNotes = currentNotes.filter(n => n.id !== id);
      AsyncStorage.setItem('notably-notes', JSON.stringify(updatedNotes)).catch(error => {
        console.error('Failed to save notes:', error);
      });
      return updatedNotes;
    });
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(currentNotes => {
      const updatedNotes = currentNotes.map(n => 
        n.id === id ? { ...n, ...updates } : n
      );
      AsyncStorage.setItem('notably-notes', JSON.stringify(updatedNotes)).catch(error => {
        console.error('Failed to save notes:', error);
      });
      return updatedNotes;
    });
  }, []);

  return useMemo(() => ({
    notes,
    isLoading,
    addNote,
    deleteNote,
    updateNote,
  }), [notes, isLoading, addNote, deleteNote, updateNote]);
});
