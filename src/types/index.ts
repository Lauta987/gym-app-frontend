export type UserRole =
  | "superadmin"
  | "admin"
  | "trainer"
  | "student";

export interface User {
  id: string;
  gymId?: string | null;
  name: string;
  lastName: string;
  email: string;
  role: UserRole;
  active?: boolean;
}

export interface GymBranding {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  updatedAt?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface Student {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  role: UserRole;
  active: boolean;
  assignedRoutine?: string;
}

export interface Exercise {
  _id: string;
  name: string;
  description: string;
  videoUrl?: string;
  imageUrl?: string;
  muscles: string[];
  difficulty:
    | "principiante"
    | "intermedio"
    | "avanzado";
  active: boolean;
}

export interface RoutineExercise {
  exerciseId: Exercise;
  sets: number;
  reps: string;
  rest: string;
  order: number;
  notes?: string;
}

export interface RoutineDay {
  dayName: string;
  order: number;
  exercises: RoutineExercise[];
}

export interface Routine {
  _id: string;
  name: string;
  description?: string;
  objective?: string;
  level:
    | "principiante"
    | "intermedio"
    | "avanzado";
  days: RoutineDay[];
  active: boolean;
}

export interface WorkoutLog {
  _id: string;
  studentId: string;
  routineId: Routine;
  exerciseId: Exercise;
  dayName: string;
  dayOrder: number;
  setsPlanned: number;
  repsPlanned: string;
  restPlanned: string;
  weight?: number;
  repsDone?: string;
  notes?: string;
  completedAt: string;
} 