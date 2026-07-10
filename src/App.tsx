import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Exercises from "./pages/Exercises";
import Routines from "./pages/Routines";
import AssignRoutine from "./pages/AssignRoutine";
import Progress from "./pages/Progress";
import MyRoutine from "./pages/MyRoutine";
import MyProgress from "./pages/MyProgress";

import type { User } from "./types";

function getLoggedUser(): User | null {
  const userStorage = localStorage.getItem("user");

  if (!userStorage) {
    return null;
  }

  return JSON.parse(userStorage);
}

function AdminRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const user = getLoggedUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === "student") {
    return <Navigate to="/my-routine" replace />;
  }

  return children;
}

function StudentRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const user = getLoggedUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "student") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RedirectByRole() {
  const user = getLoggedUser();

  if (user?.role === "student") {
    return <Navigate to="/my-routine" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/students"
        element={
          <AdminRoute>
            <Students />
          </AdminRoute>
        }
      />

      <Route
        path="/exercises"
        element={
          <AdminRoute>
            <Exercises />
          </AdminRoute>
        }
      />

      <Route
        path="/routines"
        element={
          <AdminRoute>
            <Routines />
          </AdminRoute>
        }
      />

      <Route
        path="/assign-routine"
        element={
          <AdminRoute>
            <AssignRoutine />
          </AdminRoute>
        }
      />

      <Route
        path="/progress"
        element={
          <AdminRoute>
            <Progress />
          </AdminRoute>
        }
      />

      <Route
        path="/my-routine"
        element={
          <StudentRoute>
            <MyRoutine />
          </StudentRoute>
        }
      />

      <Route
        path="/my-progress"
        element={
          <StudentRoute>
            <MyProgress />
          </StudentRoute>
        }
      />

      <Route path="*" element={<RedirectByRole />} />
    </Routes>
  );
} 