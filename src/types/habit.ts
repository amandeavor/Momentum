export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequencyDays?: number[]; // Days of week (1=Mon, 7=Sun)
  color?: string;
  icon?: string;
  reminderTime?: string;
  streak: number;
  bestStreak?: number;
  lastCheckedIn?: Date;
  isArchived?: boolean;
  createdAt: Date;
  updatedAt: Date;
}