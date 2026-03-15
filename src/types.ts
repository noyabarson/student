export interface ClassSession {
  id: string;
  name: string;
  day?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  date?: string; // YYYY-MM-DD for one-off tasks
  startTime: string;
  endTime: string;
  room?: string;
}

export interface ClassInstance {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface SemesterPeriod {
  id: string;
  start: string;
  end: string;
  type: 'study' | 'break';
  name: string;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  subject: string;
  details?: string;
  subtasks?: Subtask[];
}

export type Tab = 'schedule' | 'assignments' | 'calendar';
