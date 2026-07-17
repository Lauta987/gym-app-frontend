import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "../styles/superadmin.css";

type GymPlan = "basic" | "personalized" | "premium";

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
}

interface GymDetailResponse {
  message: string;
  gym: Gym;
  stats: GymStats;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
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
    month: "long",
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

export default function SuperAdminGymDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [gym, setGym] = useState<Gym | null>(null);
  const [stats, setStats] = useState<GymStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadGym = async () => {
    if (!id) {
      setError("No se encontró el gimnasio solicitado.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get<GymDetailResponse>(`/gyms/${id}`);

      setGym(response.data.gym);
      setStats(response.data.stats);
    } catch (error) {
      const apiError = error as ApiError;

      setError(
        apiError.response?.data?.message ||
          "No se pudo cargar la información del gimnasio."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGym();
  }, [id]);

  const handleChangeStatus = async () => {
    if (!gym) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      await api.put(`/gyms/${gym._id}`, {
        active: !gym.active,
      });

      await loadGym();
    } catch (error) {
      const apiError = error as ApiError;

      setError(
        apiError.response?.data?.message ||
          "No se pudo cambiar el estado del gimnasio."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="sa-console sa-detail-console">
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
        </aside>

        <section className="sa-main">
          <div className="sa-detail-loading">
            <span className="sa-loading-circle" />
            <p>Cargando gimnasio...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!gym || !stats) {
    return (
      <main className="sa-console sa-detail-console">
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
        </aside>

        <section className="sa-main">
          <div className="sa-detail-error">
            <h2>No se pudo abrir el gimnasio</h2>
            <p>{error}</p>

            <button
              type="button"
              className="sa-primary-button"
              onClick={() => navigate("/superadmin")}
            >
              Volver al panel
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="sa-console sa-detail-console">
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

        <div className="sa-create-sidebar-info">
          <span>Cliente</span>

          <h2>{gym.name}</h2>

          <p>
            Consultá la información general, estado y actividad del gimnasio.
          </p>

          <div>
            <article>
              <strong>01</strong>
              <span>Resumen general</span>
            </article>

            <article>
              <strong>02</strong>
              <span>Actividad</span>
            </article>

            <article>
              <strong>03</strong>
              <span>Configuración</span>
            </article>
          </div>
        </div>

        <button
          type="button"
          className="sa-logout"
          onClick={() => navigate("/superadmin")}
        >
          ← Volver a gimnasios
        </button>
      </aside>

      <section className="sa-main">
        <header className="sa-topbar">
          <div className="sa-breadcrumb">
            <span>GymStart</span>
            <b>/</b>
            <strong>Gimnasios</strong>
            <b>/</b>
            <strong>{gym.name}</strong>
          </div>

          <div className="sa-topbar-actions">
            <button
              type="button"
              className="sa-secondary-button"
              onClick={loadGym}
             >
              Actualizar
            </button>

             <Link
               className="sa-secondary-button"
               to={`/superadmin/gyms/${gym._id}/admins`}
             >
               Administradores
             </Link>

            <button
              type="button"
             className="sa-primary-button"
              onClick={() =>
               navigate(`/superadmin/gyms/${gym._id}/edit`)
            }
        >
          Editar gimnasio
        </button>
     </div>
        </header>

        {error && <p className="sa-error">{error}</p>}

        <section
          className="sa-detail-hero"
          style={{
            background: `linear-gradient(135deg, ${
              gym.secondaryColor || "#111111"
            }, ${gym.primaryColor || "#ff4b25"})`,
          }}
        >
          <div className="sa-detail-hero-overlay" />

          <div className="sa-detail-hero-content">
            <div className="sa-detail-logo">
              {gym.logoUrl ? (
                <img src={gym.logoUrl} alt={`Logo de ${gym.name}`} />
              ) : (
                <span>{getInitials(gym.name)}</span>
              )}
            </div>

            <div className="sa-detail-title">
              <span>GYM-{gym._id.slice(-4).toUpperCase()}</span>

              <h2>{gym.name}</h2>

              <p>{gym.address || "Ubicación no cargada"}</p>
            </div>

            <div className="sa-detail-status-area">
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
          </div>
        </section>

        <section className="sa-detail-metrics">
          <article>
            <span>Alumnos</span>
            <strong>{stats.students}</strong>
            <p>Registrados</p>
          </article>

          <article>
            <span>Rutinas</span>
            <strong>{stats.routines}</strong>
            <p>Activas</p>
          </article>

          <article>
            <span>Ejercicios</span>
            <strong>{stats.exercises}</strong>
            <p>Disponibles</p>
          </article>

          <article>
            <span>Registros</span>
            <strong>{stats.workoutLogs}</strong>
            <p>Sesiones guardadas</p>
          </article>

          <article>
            <span>Administradores</span>
            <strong>{stats.admins}</strong>
            <p>Cuentas admin</p>
          </article>

          <article>
            <span>Entrenadores</span>
            <strong>{stats.trainers}</strong>
            <p>Cuentas trainer</p>
          </article>
        </section>

        <section className="sa-detail-grid">
          <article className="sa-detail-card">
            <div className="sa-detail-card-header">
              <div>
                <span>Información</span>
                <h3>Datos del gimnasio</h3>
              </div>
            </div>

            <div className="sa-detail-info-list">
              <div>
                <span>Nombre</span>
                <strong>{gym.name}</strong>
              </div>

              <div>
                <span>Slug</span>
                <strong>{gym.slug}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{gym.email || "Sin email cargado"}</strong>
              </div>

              <div>
                <span>Teléfono</span>
                <strong>{gym.phone || "Sin teléfono cargado"}</strong>
              </div>

              <div>
                <span>Dirección</span>
                <strong>{gym.address || "Sin dirección cargada"}</strong>
              </div>

              <div>
                <span>Plan</span>
                <strong>{getPlanLabel(gym.plan)}</strong>
              </div>
            </div>
          </article>

          <article className="sa-detail-card">
            <div className="sa-detail-card-header">
              <div>
                <span>Identidad visual</span>
                <h3>Marca del cliente</h3>
              </div>
            </div>

            <div className="sa-brand-preview">
              <div
                className="sa-brand-color-preview"
                style={{
                  background: `linear-gradient(135deg, ${gym.secondaryColor}, ${gym.primaryColor})`,
                }}
              >
                {gym.logoUrl ? (
                  <img src={gym.logoUrl} alt={`Logo de ${gym.name}`} />
                ) : (
                  <span>{getInitials(gym.name)}</span>
                )}
              </div>

              <div className="sa-brand-colors">
                <article>
                  <span
                    style={{
                      backgroundColor: gym.primaryColor,
                    }}
                  />
                  <div>
                    <small>Principal</small>
                    <strong>{gym.primaryColor}</strong>
                  </div>
                </article>

                <article>
                  <span
                    style={{
                      backgroundColor: gym.secondaryColor,
                    }}
                  />
                  <div>
                    <small>Secundario</small>
                    <strong>{gym.secondaryColor}</strong>
                  </div>
                </article>
              </div>
            </div>
          </article>

          <article className="sa-detail-card">
            <div className="sa-detail-card-header">
              <div>
                <span>Actividad</span>
                <h3>Estado de la cuenta</h3>
              </div>
            </div>

            <div className="sa-detail-status-box">
              <div>
                <span>Estado actual</span>
                <strong>{gym.active ? "Activo" : "Suspendido"}</strong>
                <p>
                  {gym.active
                    ? "El gimnasio y sus usuarios pueden utilizar la plataforma."
                    : "El gimnasio se encuentra suspendido."}
                </p>
              </div>

              <button
                type="button"
                className={
                  gym.active
                    ? "sa-danger-button"
                    : "sa-reactivate-button"
                }
                onClick={handleChangeStatus}
                disabled={updating}
              >
                {updating
                  ? "Actualizando..."
                  : gym.active
                    ? "Suspender gimnasio"
                    : "Reactivar gimnasio"}
              </button>
            </div>
          </article>

          <article className="sa-detail-card">
            <div className="sa-detail-card-header">
              <div>
                <span>Historial</span>
                <h3>Información del sistema</h3>
              </div>
            </div>

            <div className="sa-detail-info-list">
              <div>
                <span>Fecha de alta</span>
                <strong>{formatDate(gym.createdAt)}</strong>
              </div>

              <div>
                <span>Última actualización</span>
                <strong>{formatDate(gym.updatedAt)}</strong>
              </div>

              <div>
                <span>ID interno</span>
                <strong className="sa-detail-id">{gym._id}</strong>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
} 