import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/superadmin.css";

type GymPlan = "basic" | "personalized" | "premium";
type StatusFilter = "all" | "active" | "inactive";
type PlanFilter = "all" | GymPlan;

interface GymStats {
  admins: number;
  trainers: number;
  students: number;
  exercises: number;
  routines: number;
  workoutLogs: number;
}

interface Gym {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  email?: string;
  phone?: string;
  address?: string;
  plan: GymPlan;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  stats: GymStats;
}

interface GymsResponse {
  message: string;
  gyms: Gym[];
}

function getPlanLabel(plan: GymPlan) {
  const labels: Record<GymPlan, string> = {
    basic: "Básico",
    personalized: "Personalizado",
    premium: "Premium",
  };

  return labels[plan];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGyms = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<GymsResponse>("/gyms");
      setGyms(response.data.gyms);
    } catch (error) {
      console.error("Error al cargar gimnasios:", error);
      setError("No se pudieron cargar los gimnasios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGyms();
  }, []);

  const filteredGyms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return gyms.filter((gym) => {
      const matchesSearch =
        !normalizedSearch ||
        gym.name.toLowerCase().includes(normalizedSearch) ||
        gym.slug.toLowerCase().includes(normalizedSearch) ||
        gym.email?.toLowerCase().includes(normalizedSearch) ||
        gym.address?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && gym.active) ||
        (statusFilter === "inactive" && !gym.active);

      const matchesPlan =
        planFilter === "all" || gym.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [gyms, searchTerm, statusFilter, planFilter]);

  const activeGyms = gyms.filter((gym) => gym.active).length;
  const inactiveGyms = gyms.length - activeGyms;

  const totalStudents = gyms.reduce(
    (total, gym) => total + gym.stats.students,
    0
  );

  const totalRoutines = gyms.reduce(
    (total, gym) => total + gym.stats.routines,
    0
  );

  const totalWorkoutLogs = gyms.reduce(
    (total, gym) => total + gym.stats.workoutLogs,
    0
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <main className="sa-console">
      <aside className="sa-sidebar">
        <div className="sa-sidebar-brand">
          <div>
            <h1>
              Gym<span>Start.</span>
            </h1>
            <p>Control central</p>
          </div>

          <span className="sa-admin-tag">Admin</span>
        </div>

        <div className="sa-sidebar-section">
          <span className="sa-sidebar-label">Navegación</span>

          <nav className="sa-navigation">
            <button type="button">
              <span className="sa-nav-icon">⌂</span>
              <span>Resumen</span>
              <b>{gyms.length}</b>
            </button>

            <button type="button" className="active">
              <span className="sa-nav-icon">◇</span>
              <span>Gimnasios</span>
              <b>{activeGyms}</b>
            </button>

            <button type="button">
              <span className="sa-nav-icon">♧</span>
              <span>Alumnos</span>
              <b>{totalStudents}</b>
            </button>

            <button type="button">
              <span className="sa-nav-icon">▦</span>
              <span>Planes</span>
              <b>3</b>
            </button>

            <button type="button">
              <span className="sa-nav-icon">▭</span>
              <span>Facturación</span>
            </button>

            <button type="button">
              <span className="sa-nav-icon">⌁</span>
              <span>Actividad</span>
            </button>
          </nav>
        </div>

        <div className="sa-sidebar-section">
          <span className="sa-sidebar-label">Sistema</span>

          <nav className="sa-navigation">
            <button type="button">
              <span className="sa-nav-icon">⌘</span>
              <span>Integraciones</span>
            </button>

            <button type="button">
              <span className="sa-nav-icon">⚙</span>
              <span>Ajustes</span>
            </button>

            <button type="button">
              <span className="sa-nav-icon">?</span>
              <span>Soporte</span>
            </button>
          </nav>
        </div>

        <div className="sa-sidebar-footer">
          <div className="sa-owner">
            <div className="sa-owner-avatar">LE</div>

            <div>
              <strong>Lautaro Espil</strong>
              <span>Super Admin</span>
            </div>
          </div>

          <button
            type="button"
            className="sa-logout"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <section className="sa-main">
        <header className="sa-topbar">
          <div className="sa-breadcrumb">
            <span>GymStart</span>
            <b>/</b>
            <strong>Consola</strong>
            <b>/</b>
            <strong>Gimnasios</strong>
          </div>

          <div className="sa-topbar-actions">
            <label className="sa-global-search">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Buscar gimnasio, email o ciudad"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="sa-icon-button"
              onClick={loadGyms}
              aria-label="Actualizar gimnasios"
            >
              ↻
            </button>
          </div>
        </header>

        <section className="sa-hero">
          <div>
            <span className="sa-eyebrow">Plataforma GymStart</span>

            <h2>
              Gimnasios <em>activos</em>
            </h2>

            <p>
              {gyms.length} gimnasios registrados y {totalStudents} alumnos
              dentro de la plataforma.
            </p>
          </div>

          <div className="sa-hero-actions">
            <button type="button" className="sa-secondary-button">
              Exportar
            </button>

            <button
              type="button"
              className="sa-primary-button"
              onClick={() => navigate("/superadmin/gyms/new")}
            >
              <span>＋</span>
              Nuevo gimnasio
            </button>
          </div>
        </section>

        {error && <p className="sa-error">{error}</p>}

        <section className="sa-metrics">
          <article>
            <span>Gimnasios totales</span>
            <strong>{gyms.length}</strong>
            <p>{activeGyms} activos</p>
          </article>

          <article>
            <span>Alumnos activos</span>
            <strong>{totalStudents}</strong>
            <p>En toda la plataforma</p>
          </article>

          <article>
            <span>Rutinas creadas</span>
            <strong>{totalRoutines}</strong>
            <p>Planes de entrenamiento</p>
          </article>

          <article>
            <span>Sesiones registradas</span>
            <strong>{totalWorkoutLogs}</strong>
            <p>Registros de progreso</p>
          </article>
        </section>

        <section className="sa-toolbar">
          <div className="sa-status-tabs">
            <button
              type="button"
              className={statusFilter === "all" ? "active" : ""}
              onClick={() => setStatusFilter("all")}
            >
              Todos <span>{gyms.length}</span>
            </button>

            <button
              type="button"
              className={statusFilter === "active" ? "active" : ""}
              onClick={() => setStatusFilter("active")}
            >
              Activos <span>{activeGyms}</span>
            </button>

            <button
              type="button"
              className={statusFilter === "inactive" ? "active" : ""}
              onClick={() => setStatusFilter("inactive")}
            >
              Suspendidos <span>{inactiveGyms}</span>
            </button>
          </div>

          <div className="sa-filter-group">
            <label>
              Plan
              <select
                value={planFilter}
                onChange={(event) =>
                  setPlanFilter(event.target.value as PlanFilter)
                }
              >
                <option value="all">Todos</option>
                <option value="basic">Básico</option>
                <option value="personalized">Personalizado</option>
                <option value="premium">Premium</option>
              </select>
            </label>

            <span className="sa-results-count">
              {filteredGyms.length} resultados
            </span>
          </div>
        </section>

        <section className="sa-content">
          {loading ? (
            <div className="sa-loading-state">
              <span className="sa-loading-circle" />
              <p>Cargando gimnasios...</p>
            </div>
          ) : filteredGyms.length === 0 ? (
            <div className="sa-empty-state">
              <span>＋</span>
              <h3>No se encontraron gimnasios</h3>
              <p>Modificá los filtros o creá un nuevo gimnasio.</p>

              <button
                type="button"
                className="sa-primary-button"
                onClick={() => navigate("/superadmin/gyms/new")}
              >
                Crear gimnasio
              </button>
            </div>
          ) : (
            <div className="sa-gym-grid">
              {filteredGyms.map((gym) => (
                <article key={gym._id} className="sa-gym-card">
                  <div
                    className="sa-gym-cover"
                    style={{
                      background: `linear-gradient(135deg, ${
                        gym.secondaryColor || "#111111"
                      }, ${gym.primaryColor || "#ff5a1f"})`,
                    }}
                  >
                    <div className="sa-gym-cover-top">
                      <span
                        className={
                          gym.active
                            ? "sa-card-status active"
                            : "sa-card-status inactive"
                        }
                      >
                        <i />
                        {gym.active ? "Activo" : "Suspendido"}
                      </span>

                      <span className="sa-plan-badge">
                        {getPlanLabel(gym.plan)}
                      </span>
                    </div>

                    <div className="sa-gym-cover-brand">
                      {gym.logoUrl ? (
                        <img
                          src={gym.logoUrl}
                          alt={`Logo de ${gym.name}`}
                        />
                      ) : (
                        <span>{getInitials(gym.name)}</span>
                      )}
                    </div>

                    <small>GYM-{gym._id.slice(-4).toUpperCase()}</small>
                  </div>

                  <div className="sa-gym-card-body">
                    <div className="sa-gym-title">
                      <div>
                        <h3>{gym.name}</h3>

                        <p>
                          <span>⌖</span>
                          {gym.address || "Ubicación no cargada"}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="sa-card-menu"
                        aria-label={`Opciones de ${gym.name}`}
                      >
                        •••
                      </button>
                    </div>

                    <div className="sa-gym-numbers">
                      <article>
                        <strong>{gym.stats.students}</strong>
                        <span>Alumnos</span>
                      </article>

                      <article>
                        <strong>{gym.stats.routines}</strong>
                        <span>Rutinas</span>
                      </article>

                      <article>
                        <strong>{gym.stats.workoutLogs}</strong>
                        <span>Registros</span>
                      </article>
                    </div>

                    <div className="sa-gym-meta">
                      <p>{gym.email || "Sin email de contacto"}</p>
                      <span>Alta: {formatDate(gym.createdAt)}</span>
                    </div>

                    <div className="sa-gym-actions">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/superadmin/gyms/${gym._id}`)
                        }
                      >
                        Ver gimnasio
                      </button>

                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          navigate(`/superadmin/gyms/${gym._id}/edit`)
                        }
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
} 