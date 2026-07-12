import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import type { User } from "../types";

export default function Settings() {
  const navigate = useNavigate();

  const userStorage = localStorage.getItem("user");
  const user: User | null = userStorage ? JSON.parse(userStorage) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <AdminLayout>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Configuración</h1>
            <p>Administrá la información general de GymStart.</p>
          </div>

          <div className="date-pill">Sistema activo</div>
        </header>

        <section className="settings-grid">
          <article className="settings-profile-card">
            <div className="settings-profile-avatar">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>

            <div>
              <span>Administrador</span>
              <h2>
                {user?.name || "Admin"} {user?.lastName || ""}
              </h2>
              <p>{user?.email || "Sin email cargado"}</p>
            </div>

            <button type="button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </article>

          <article className="settings-card">
            <div className="settings-card-header">
              <span>App</span>
              <h2>GymStart</h2>
              <p>Panel de administración y app de alumno para rutinas.</p>
            </div>

            <div className="settings-info-list">
              <div>
                <span>Versión</span>
                <strong>1.0.0</strong>
              </div>

              <div>
                <span>Estado</span>
                <strong>Activo</strong>
              </div>

              <div>
                <span>Tipo</span>
                <strong>PWA</strong>
              </div>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card-header">
              <span>Módulos</span>
              <h2>Funciones disponibles</h2>
              <p>Estas son las secciones principales activas en el sistema.</p>
            </div>

            <div className="settings-module-list">
              <article>
                <span>✓</span>
                <div>
                  <strong>Gestión de alumnos</strong>
                  <p>Crear, editar, activar y desactivar alumnos.</p>
                </div>
              </article>

              <article>
                <span>✓</span>
                <div>
                  <strong>Rutinas</strong>
                  <p>Crear planes con días, ejercicios, series y descansos.</p>
                </div>
              </article>

              <article>
                <span>✓</span>
                <div>
                  <strong>Ejercicios</strong>
                  <p>Biblioteca con imágenes, videos, músculos y dificultad.</p>
                </div>
              </article>

              <article>
                <span>✓</span>
                <div>
                  <strong>Progreso</strong>
                  <p>Seguimiento de peso, repeticiones e historial.</p>
                </div>
              </article>
            </div>
          </article>

          <article className="settings-card dark">
            <div className="settings-card-header">
              <span>Estado del sistema</span>
              <h2>Todo funcionando</h2>
              <p>
                El panel admin, la app del alumno y el registro de progreso ya
                están operativos.
              </p>
            </div>

            <div className="settings-status-list">
              <div>
                <span>Frontend</span>
                <strong>Online</strong>
              </div>

              <div>
                <span>Backend</span>
                <strong>Online</strong>
              </div>

              <div>
                <span>Base de datos</span>
                <strong>Conectada</strong>
              </div>
            </div>
          </article>
        </section>
      </section>
    </AdminLayout>
  );
} 