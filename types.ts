
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

export enum LessonStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED'
}

export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  attachments?: string[];
  order: number;
  status: LessonStatus;
}

export enum ResourceType {
  VIDEO = 'VIDEO',
  GAME = 'GAME', 
  WORKSHEET = 'WORKSHEET'
}

export interface Resource {
  id: string;
  lessonId: string;
  type: ResourceType;
  title: string;
  url: string;
  isRequired: boolean;
  order: number;
}

export enum StudentLessonStatus {
  LOCKED = 'LOCKED',
  OPEN = 'OPEN',
  COMPLETED = 'COMPLETED'
}

export interface StudentProgress {
  id: string;
  studentId: string;
  resourceId: string;
  lessonId?: string;
  completed: boolean;
  completedAt?: string;
}

export type Progress = StudentProgress;

export enum AssessmentLevel {
  T = 'T',
  H = 'H',
  C = 'C',
  HTT = 'T',
  HT = 'H',
  CHT = 'C'
}

export enum SubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED'
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  content: string;
  submissionUrl?: string; // Added field
  
  assessmentLevel?: AssessmentLevel;
  assessment?: AssessmentLevel; // Alias
  
  teacherFeedback?: string;
  feedback?: string; // Alias
  
  grade?: number;
  status?: SubmissionStatus;

  starsEarned: number;
  isGraded: boolean;
}

export interface WeeklyReportStats {
  studentId: string;
  weekRange: string;
  completedTasks: number;
  pendingTasks: number;
  totalStars: number;
  latestFeedback: string;
  nextGoal: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  classId?: string;
  dob?: string;
  parentPhone?: string;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  academicYear: string;
  joinCode?: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
}

export enum AssignmentType {
  ESSAY = 'ESSAY',
  FILE = 'FILE'
}

export interface Assignment extends Resource {
  description?: string;
  dueDate: string;
  rubric?: string;
  points?: number;
  type?: AssignmentType;
}

export enum AnnouncementTarget {
  ALL = 'ALL',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT'
}

export interface Announcement {
  id: string;
  classId?: string;
  target: AnnouncementTarget;
  title: string;
  content: string;
  createdAt: string;
  authorId: string;
}

export interface ClassReportStats {
  totalStudents: number;
  avgGrade: number;
  submissionRate: number;
  lessonCompletionRate: number;
}

export interface AtRiskStudent {
  student: User;
  reason?: string;
  issue?: string;
  missedCount?: number;
  avgGrade?: number;
}
