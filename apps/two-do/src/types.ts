export type Priority = 'low' | 'medium' | 'high';
export type FilterType = 'all' | 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  completed: boolean;
  createdAt: number;
}
