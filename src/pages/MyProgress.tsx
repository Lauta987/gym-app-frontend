import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import type { User, WorkoutLog } from "../types";

export default function MyProgress() {
  const navigate = useNavigate();

  const userStorage = localStorage.getItem("user");
  const user: User | null = userStorage ? JSON.parse(userStorage) : null;

  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const loadMyProgress = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<{ workoutLogs: WorkoutLog[] }>(
        "/workout-logs/my-logs"
      );

      setWorkoutLogs(response.data.workoutLogs);
    } catch (error) {
      console.error("Error al cargar mi progreso", error);
      setError("No se pudo cargar tu progreso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyProgress();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatHour = (date: string) => {
    return new Date(date).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const groupedLogs = workoutLogs.reduce<Record<string, WorkoutLog[]>>(
    (groups, log) => {
      const date = formatDate(log.completedAt);

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(log);

      return groups;
    },
    {}
  );

  const groupedEntries = Object.entries(groupedLogs);

  const totalCompleted = workoutLogs.length;

  const totalWeightLogs = workoutLogs.filter(
    (log) => log.weight !== undefined && log.weight !== null
  ).length;

  const lastLog = workoutLogs[0];

  return (
    <main className="student-dark-page">
      <section className="student-phone-shell">
        <header className="student-dark-header">
          <div className="student-app-brand">
            <div className="student-app-logo">G</div>
            <span>GymStart</span>
          </div>

          <h1>Mi progreso</h1>

          <div className="student-user-menu">
            <button
              type="button"
              className="student-avatar-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </button>

            {showUserMenu && (
              <div className="student-user-dropdown">
                <div className="student-user-info">
                  <strong>
                    {user?.name} {user?.lastName}
                  </strong>
                  <span>{user?.email}</span>
                </div>

                <a href="/my-routine" className="student-menu-link">
                  Mi rutina
                </a>

                <a href="/my-progress" className="student-menu-link">
                  Mi progreso
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="logout-option"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="student-progress-hero-v2">
          <div>
            <span>Seguimiento personal</span>
            <h2>Tu progreso</h2>
            <p>
              Revisá tus ejercicios completados, pesos usados y repeticiones
              realizadas.
            </p>
          </div>

          <div className="progress-hero-icon">📈</div>
        </section>

        <section className="student-progress-summary">
          <article>
            <span>Completados</span>
            <strong>{totalCompleted}</strong>
            <p>ejercicios</p>
          </article>

          <article>
            <span>Con peso</span>
            <strong>{totalWeightLogs}</strong>
            <p>registros</p>
          </article>

          <article>
            <span>Último</span>
            <strong>{lastLog ? formatDate(lastLog.completedAt) : "-"}</strong>
            <p>entrenamiento</p>
          </article>
        </section>

        {loading ? (
          <div className="student-dark-empty">
            <p>Cargando tu progreso...</p>
          </div>
        ) : error ? (
          <div className="student-dark-empty">
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        ) : workoutLogs.length === 0 ? (
          <div className="student-progress-empty">
            <div>🏋️</div>
            <h2>Sin progreso todavía</h2>
            <p>
              Cuando registres ejercicios desde tu rutina, van a aparecer acá
              ordenados por fecha.
            </p>

            <button type="button" onClick={() => navigate("/my-routine")}>
              Ir a mi rutina
            </button>
          </div>
        ) : (
          <section className="student-progress-timeline">
            {groupedEntries.map(([date, logs]) => (
              <div key={date} className="progress-day-group">
                <div className="progress-day-title">
                  <span></span>
                  <h3>{date}</h3>
                </div>

                <div className="progress-day-cards">
                  {logs.map((log) => (
                    <article key={log._id} className="student-progress-card-v2">
                      <div className="progress-card-main">
                        <div className="progress-exercise-icon">
                          {log.exerciseId.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <h3>{log.exerciseId.name}</h3>
                          <p>
                            {log.routineId.name} · {log.dayName}
                          </p>
                        </div>

                        <span className="progress-hour">
                          {formatHour(log.completedAt)}
                        </span>
                      </div>

                      <div className="student-progress-data-v2">
                        <div>
                          <span>Peso</span>
                          <strong>
                            {log.weight ? `${log.weight} kg` : "-"}
                          </strong>
                        </div>

                        <div>
                          <span>Reps</span>
                          <strong>{log.repsDone || "-"}</strong>
                        </div>

                        <div>
                          <span>Plan</span>
                          <strong>
                            {log.setsPlanned} x {log.repsPlanned}
                          </strong>
                        </div>
                      </div>

                      {log.notes && (
                        <p className="student-progress-note-v2">{log.notes}</p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </section>
    </main>
  );
} 