import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminLinks = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: "⌂",
  },
  {
    to: "/students",
    label: "Alumnos",
    icon: "○",
  },
  {
    to: "/routines",
    label: "Rutinas",
    icon: "▣",
  },
  {
    to: "/exercises",
    label: "Ejercicios",
    icon: "⌁",
  },
  {
    to: "/assign-routine",
    label: "Asignar rutina",
    icon: "✓",
  },
  {
    to: "/progress",
    label: "Progreso",
    icon: "↗",
  },
  {
    to: "/settings",
    label: "Configuración",
    icon: "⚙",
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();

  const userStorage = localStorage.getItem("user");
  const user = userStorage ? JSON.parse(userStorage) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <main className="admin-forma-page">
      <aside className="admin-forma-sidebar">
        <div className="admin-forma-brand">
          <h1>
            Gym<span>Start.</span>
          </h1>
          <p>Admin panel</p>
        </div>

        <nav className="admin-forma-nav">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "admin-forma-link active" : "admin-forma-link"
              }
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-forma-sidebar-bottom">
          <div className="admin-forma-user-card">
            <div className="admin-forma-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>

            <div>
              <strong>{user?.name || "Administrador"}</strong>
              <p>{user?.role || "admin"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="admin-forma-logout"
          >
            <span>↩</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <section className="admin-forma-main">{children}</section>
    </main>
  );
} 