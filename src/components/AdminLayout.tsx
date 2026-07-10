import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-logo">GymStart</div>

        <nav>
          <NavLink to="/dashboard">Inicio</NavLink>
          <NavLink to="/students">Alumnos</NavLink>
          <NavLink to="/routines">Rutinas</NavLink>
          <NavLink to="/exercises">Ejercicios</NavLink>
          <NavLink to="/assign-routine">Asignar rutina</NavLink>
          <NavLink to="/progress">Progreso</NavLink>
          <NavLink to="/settings">Configuración</NavLink>
        </nav>

        <button onClick={handleLogout} className="logout-button">
          Cerrar sesión
        </button>
      </aside>

      {children}
    </main>
  );
} 