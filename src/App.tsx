import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Exercises from "./pages/Exercises";
import Routines from "./pages/Routines";
import AssignRoutine from "./pages/AssignRoutine";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import MyRoutine from "./pages/MyRoutine";
import MyProgress from "./pages/MyProgress";

import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminCreateGym from "./pages/SuperAdminCreateGym";
import SuperAdminGymDetail from "./pages/SuperAdminGymDetail";
import SuperAdminEditGym from "./pages/SuperAdminEditGym";
import SuperAdminGymAdmins from "./pages/SuperAdminGymAdmins";

import type { User } from "./types";

function getLoggedUser(): User | null {
  const userStorage = localStorage.getItem("user");

  if (!userStorage) {
    return null;
  }

  try {
    return JSON.parse(userStorage) as User;
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    return null;
  }
}

function getLoginPath(): string {
  const gymSlug = localStorage.getItem("gymSlug");

  if (gymSlug) {
    return `/gym/${gymSlug}`;
  }

  return "/";
}

function AdminRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const user = getLoggedUser();

  if (!token || !user) {
    return <Navigate to={getLoginPath()} replace />;
  }

  if (user.role === "student") {
    return <Navigate to="/my-routine" replace />;
  }

  if (user.role === "superadmin") {
    return <Navigate to="/superadmin" replace />;
  }

  return children;
}

function StudentRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const user = getLoggedUser();

  if (!token || !user) {
    return <Navigate to={getLoginPath()} replace />;
  }

  if (user.role !== "student") {
    return <RedirectByRole />;
  }

  return children;
}

function SuperAdminRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const user = getLoggedUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "superadmin") {
    return <RedirectByRole />;
  }

  return children;
}

function RedirectByRole() {
  const token = localStorage.getItem("token");
  const user = getLoggedUser();

  if (!token || !user) {
    return <Navigate to={getLoginPath()} replace />;
  }

  if (user.role === "superadmin") {
    return <Navigate to="/superadmin" replace />;
  }

  if (user.role === "student") {
    return <Navigate to="/my-routine" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Login general de GymStart */}
      <Route path="/" element={<Login />} />

      {/* Login personalizado de cada gimnasio */}
      <Route path="/gym/:slug" element={<Login />} />

      {/* SuperAdmin */}
      <Route
        path="/superadmin"
        element={
          <SuperAdminRoute>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        }
      />

      <Route
        path="/superadmin/gyms/new"
        element={
          <SuperAdminRoute>
            <SuperAdminCreateGym />
          </SuperAdminRoute>
        }
      />

      <Route
        path="/superadmin/gyms/:id/admins"
        element={
          <SuperAdminRoute>
            <SuperAdminGymAdmins />
          </SuperAdminRoute>
        }
      />

      <Route
        path="/superadmin/gyms/:id/edit"
        element={
          <SuperAdminRoute>
            <SuperAdminEditGym />
          </SuperAdminRoute>
        }
      />

      <Route
        path="/superadmin/gyms/:id"
        element={
          <SuperAdminRoute>
            <SuperAdminGymDetail />
          </SuperAdminRoute>
        }
      />

      {/* Admin y entrenador */}
      <Route
        path="/admin"
        element={<Navigate to="/dashboard" replace />}
      />

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
        path="/settings"
        element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        }
      />

      {/* Alumno */}
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

      {/* Ruta desconocida */}
      <Route path="*" element={<RedirectByRole />} />
    </Routes>
  );
} 