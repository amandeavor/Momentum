export type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
};

export type Habit = {
  id: string;
  title: string;
  streak: number;
  frequency: 'daily' | 'weekly' | 'monthly';
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  progress: number;
  target: number;
};

export type User = {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
};

export type NavigationParams = {
  [key: string]: any;
};