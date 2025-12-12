/**
 * Export Service for Momentum
 * 
 * Handles data export functionality including journal entries,
 * focus sessions, habits, and user data.
 */
import * as Clipboard from 'expo-clipboard';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Journal } from '@/types/database';

export type ExportFormat = 'text' | 'json' | 'markdown';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Format a date for display in exports
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a date as YYYY-MM-DD
 */
const formatDateShort = (dateStr: string): string => {
  return new Date(dateStr).toISOString().split('T')[0];
};

/**
 * Export journal entries as plain text
 */
export const exportJournalsAsText = (entries: Journal[]): string => {
  if (entries.length === 0) {
    return 'No journal entries to export.';
  }

  const lines = [
    '═══════════════════════════════════════════════════════════',
    '                    MOMENTUM JOURNAL EXPORT',
    `                    Exported: ${new Date().toLocaleDateString()}`,
    '═══════════════════════════════════════════════════════════',
    '',
  ];

  entries.forEach((entry, index) => {
    lines.push(`📅 ${formatDate(entry.created_at)}`);
    if (entry.mood) {
      lines.push(`Mood: ${entry.mood}`);
    }
    lines.push('');
    lines.push(entry.body || '(No content)');
    
    if (index < entries.length - 1) {
      lines.push('');
      lines.push('───────────────────────────────────────────────────────────');
      lines.push('');
    }
  });

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`Total entries: ${entries.length}`);

  return lines.join('\n');
};

/**
 * Export journal entries as Markdown
 */
export const exportJournalsAsMarkdown = (entries: Journal[]): string => {
  if (entries.length === 0) {
    return '# Momentum Journal\n\nNo entries to export.';
  }

  const lines = [
    '# 📔 Momentum Journal Export',
    '',
    `*Exported on ${new Date().toLocaleDateString()}*`,
    '',
    `**Total Entries:** ${entries.length}`,
    '',
    '---',
    '',
  ];

  entries.forEach((entry) => {
    lines.push(`## ${formatDateShort(entry.created_at)}`);
    lines.push('');
    if (entry.mood) {
      lines.push(`**Mood:** ${entry.mood}`);
      lines.push('');
    }
    lines.push(entry.body || '*No content*');
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
};

/**
 * Export journal entries as JSON
 */
export const exportJournalsAsJson = (entries: Journal[], prettyPrint: boolean = true): string => {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    app: 'Momentum',
    totalEntries: entries.length,
    entries: entries.map(entry => ({
      date: entry.created_at,
      mood: entry.mood,
      moodRating: entry.mood_rating,
      body: entry.body,
      title: entry.title,
    })),
  };

  return prettyPrint 
    ? JSON.stringify(exportData, null, 2) 
    : JSON.stringify(exportData);
};

/**
 * Copy journal entries to clipboard
 */
export const copyJournalsToClipboard = async (
  entries: Journal[],
  format: ExportFormat = 'text'
): Promise<boolean> => {
  try {
    let content: string;
    
    switch (format) {
      case 'markdown':
        content = exportJournalsAsMarkdown(entries);
        break;
      case 'json':
        content = exportJournalsAsJson(entries);
        break;
      case 'text':
      default:
        content = exportJournalsAsText(entries);
        break;
    }
    
    await Clipboard.setStringAsync(content);
    return true;
  } catch (error) {
    console.error('[Export] Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Save journal entries to a file and share
 */
export const shareJournalsAsFile = async (
  entries: Journal[],
  format: ExportFormat = 'text'
): Promise<boolean> => {
  try {
    // Check if sharing is available
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      console.warn('[Export] Sharing is not available on this device');
      return false;
    }

    let content: string;
    let filename: string;
    let mimeType: string;
    
    const dateStr = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'markdown':
        content = exportJournalsAsMarkdown(entries);
        filename = `momentum-journal-${dateStr}.md`;
        mimeType = 'text/markdown';
        break;
      case 'json':
        content = exportJournalsAsJson(entries);
        filename = `momentum-journal-${dateStr}.json`;
        mimeType = 'application/json';
        break;
      case 'text':
      default:
        content = exportJournalsAsText(entries);
        filename = `momentum-journal-${dateStr}.txt`;
        mimeType = 'text/plain';
        break;
    }
    
    const tempFile = new File(Paths.cache, filename);
    tempFile.write(content);
    
    await Sharing.shareAsync(tempFile.uri, {
      mimeType,
      dialogTitle: 'Export Journal',
    });
    
    // Clean up temp file
    tempFile.delete();
    
    return true;
  } catch (error) {
    console.error('[Export] Failed to share file:', error);
    return false;
  }
};

/**
 * Export all user data (for GDPR compliance / data portability)
 */
export interface UserDataExport {
  profile: any;
  journals: Journal[];
  habits: any[];
  tasks: any[];
  focusSessions: any[];
  settings: any;
  exportedAt: string;
}

export const exportAllUserData = async (userData: UserDataExport): Promise<string> => {
  const exportData = {
    ...userData,
    version: '1.0',
    app: 'Momentum',
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(exportData, null, 2);
};

export const shareAllUserData = async (userData: UserDataExport): Promise<boolean> => {
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) return false;

    const content = await exportAllUserData(userData);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `momentum-data-export-${dateStr}.json`;
    
    const tempFile = new File(Paths.cache, filename);
    tempFile.write(content);
    
    await Sharing.shareAsync(tempFile.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export All Data',
    });
    
    tempFile.delete();
    
    return true;
  } catch (error) {
    console.error('[Export] Failed to export all data:', error);
    return false;
  }
};

export default {
  copyJournalsToClipboard,
  shareJournalsAsFile,
  exportJournalsAsText,
  exportJournalsAsMarkdown,
  exportJournalsAsJson,
  exportAllUserData,
  shareAllUserData,
};
