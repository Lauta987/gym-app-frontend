import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import type { User, WorkoutLog } from "../types";

interface ExerciseProgressGroup {
  exerciseId: string;
  exerciseName: string;
  logs: WorkoutLog[];
  latestWeight: number;
  bestWeight: number;
  latestReps: number;
  bestReps: number;
}

type ChartMode = "weight" | "reps";

export default function MyProgress() {
  const navigate = useNavigate();

  const userStorage = localStorage.getItem("user");
  const user: User | null = userStorage ? JSON.parse(userStorage) : null;

  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [chartMode, setChartMode] = useState<ChartMode>("weight");
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

  const parseReps = (value?: string) => {
    if (!value) return 0;

    const numbers = value.match(/\d+/g)?.map(Number) || [];

    if (numbers.length === 0) return 0;

    return numbers.reduce((total, number) => total + number, 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatHour = (date: string) => {
    return new Date(date).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sortedWorkoutLogs = useMemo(() => {
    return [...workoutLogs].sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }, [workoutLogs]);

  const exerciseGroups = useMemo<ExerciseProgressGroup[]>(() => {
    const groups = workoutLogs.reduce<Record<string, WorkoutLog[]>>(
      (acc, log) => {
        const exerciseId = log.exerciseId?._id;

        if (!exerciseId) return acc;

        if (!acc[exerciseId]) {
          acc[exerciseId] = [];
        }

        acc[exerciseId].push(log);

        return acc;
      },
      {}
    );

    return Object.entries(groups)
      .map(([exerciseId, logs]) => {
        const sortedLogs = [...logs].sort(
          (a, b) =>
            new Date(a.completedAt).getTime() -
            new Date(b.completedAt).getTime()
        );

        const latestLog = sortedLogs[sortedLogs.length - 1];

        const weights = sortedLogs
          .map((log) => log.weight || 0)
          .filter((weight) => weight > 0);

        const reps = sortedLogs
          .map((log) => parseReps(log.repsDone))
          .filter((rep) => rep > 0);

        return {
          exerciseId,
          exerciseName: latestLog.exerciseId?.name || "Ejercicio",
          logs: sortedLogs,
          latestWeight: latestLog.weight || 0,
          bestWeight: weights.length > 0 ? Math.max(...weights) : 0,
          latestReps: parseReps(latestLog.repsDone),
          bestReps: reps.length > 0 ? Math.max(...reps) : 0,
        };
      })
      .sort((a, b) => b.logs.length - a.logs.length);
  }, [workoutLogs]);

  useEffect(() => {
    if (!selectedExerciseId && exerciseGroups.length > 0) {
      setSelectedExerciseId(exerciseGroups[0].exerciseId);
    }
  }, [exerciseGroups, selectedExerciseId]);

  const selectedExercise = exerciseGroups.find(
    (group) => group.exerciseId === selectedExerciseId
  );

  const totalCompleted = workoutLogs.length;

  const totalWeightLogs = workoutLogs.filter(
    (log) => log.weight !== undefined && log.weight !== null
  ).length;

  const lastLog = sortedWorkoutLogs[0];

  const getChartValue = (log: WorkoutLog) => {
    if (chartMode === "weight") return log.weight || 0;
    return parseReps(log.repsDone);
  };

  const buildChartPoints = (logs: WorkoutLog[]) => {
    const values = logs.map(getChartValue);
    const maxValue = Math.max(...values, 1);

    if (logs.length === 1) {
      const value = values[0];
      const y = 105 - (value / maxValue) * 75;
      return `150,${y}`;
    }

    return values
      .map((value, index) => {
        const x = 18 + (index / (logs.length - 1)) * 264;
        const y = 105 - (value / maxValue) * 75;

        return `${x},${y}`;
      })
      .join(" ");
  };

  const chartMaxValue = selectedExercise
    ? Math.max(...selectedExercise.logs.map(getChartValue), 0)
    : 0;

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

                <Link
                  to="/my-routine"
                  className="student-menu-link"
                  onClick={() => setShowUserMenu(false)}
                >
                  Mi rutina
                </Link>

                <Link
                  to="/my-progress"
                  className="student-menu-link"
                  onClick={() => setShowUserMenu(false)}
                >
                  Mi progreso
                </Link>

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

        <section className="visual-progress-hero">
          <div>
            <span>Seguimiento personal</span>
            <h2>Tu progreso</h2>
            <p>
              Mirá la evolución de tus ejercicios, pesos usados y repeticiones.
            </p>
          </div>

          <div className="visual-progress-icon">📈</div>
        </section>

        <section className="visual-progress-summary">
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
            <strong>{lastLog ? formatShortDate(lastLog.completedAt) : "-"}</strong>
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
              Cuando registres ejercicios desde tu rutina, van a aparecer acá.
            </p>

            <button type="button" onClick={() => navigate("/my-routine")}>
              Ir a mi rutina
            </button>
          </div>
        ) : (
          <>
            <section className="visual-exercise-selector">
              <label>Ejercicio</label>

              <select
                value={selectedExerciseId}
                onChange={(event) => setSelectedExerciseId(event.target.value)}
              >
                {exerciseGroups.map((group) => (
                  <option key={group.exerciseId} value={group.exerciseId}>
                    {group.exerciseName}
                  </option>
                ))}
              </select>
            </section>

            {selectedExercise && (
              <section className="visual-evolution-panel">
                <div className="visual-stat-grid">
                  <article className="visual-stat-card">
                    <div>🏋️</div>
                    <span>Último peso</span>
                    <strong>
                      {selectedExercise.latestWeight
                        ? selectedExercise.latestWeight
                        : "-"}
                    </strong>
                    <p>kg</p>
                  </article>

                  <article className="visual-stat-card featured">
                    <div>🏆</div>
                    <span>Mejor peso</span>
                    <strong>
                      {selectedExercise.bestWeight
                        ? selectedExercise.bestWeight
                        : "-"}
                    </strong>
                    <p>kg</p>
                  </article>

                  <article className="visual-stat-card">
                    <div>🔥</div>
                    <span>Últimas reps</span>
                    <strong>
                      {selectedExercise.latestReps
                        ? selectedExercise.latestReps
                        : "-"}
                    </strong>
                    <p>reps</p>
                  </article>

                  <article className="visual-stat-card featured">
                    <div>⭐</div>
                    <span>Mejor reps</span>
                    <strong>
                      {selectedExercise.bestReps
                        ? selectedExercise.bestReps
                        : "-"}
                    </strong>
                    <p>reps</p>
                  </article>
                </div>

                <div className="visual-chart-switch">
                  <button
                    type="button"
                    className={chartMode === "weight" ? "active" : ""}
                    onClick={() => setChartMode("weight")}
                  >
                    Peso (kg)
                  </button>

                  <button
                    type="button"
                    className={chartMode === "reps" ? "active" : ""}
                    onClick={() => setChartMode("reps")}
                  >
                    Repeticiones
                  </button>
                </div>

                <article className="visual-chart-card">
                  <div className="visual-chart-header">
                    <div>
                      <span>
                        {chartMode === "weight"
                          ? "Evolución de peso"
                          : "Evolución de repeticiones"}
                      </span>

                      <h3>{selectedExercise.exerciseName}</h3>
                    </div>

                    <strong>
                      {chartMaxValue || "-"}{" "}
                      {chartMode === "weight" ? "kg" : "reps"}
                    </strong>
                  </div>

                  <svg viewBox="0 0 300 120" className="visual-svg-chart">
                    <defs>
                      <linearGradient
                        id="progressGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ef4444"
                          stopOpacity="0.5"
                        />
                        <stop
                          offset="100%"
                          stopColor="#ef4444"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <polyline
                      className="chart-line-shadow"
                      points={buildChartPoints(selectedExercise.logs)}
                    />

                    <polyline
                      className="chart-line"
                      points={buildChartPoints(selectedExercise.logs)}
                    />

                    {selectedExercise.logs.map((log, index) => {
                      const value = getChartValue(log);
                      const maxValue = Math.max(
                        ...selectedExercise.logs.map(getChartValue),
                        1
                      );

                      const x =
                        selectedExercise.logs.length === 1
                          ? 150
                          : 18 +
                            (index / (selectedExercise.logs.length - 1)) * 264;

                      const y = 105 - (value / maxValue) * 75;

                      return (
                        <circle
                          key={log._id}
                          cx={x}
                          cy={y}
                          r="4"
                          className="chart-dot"
                        />
                      );
                    })}
                  </svg>

                  <div className="visual-chart-dates">
                    {selectedExercise.logs.slice(-4).map((log) => (
                      <span key={log._id}>
                        {formatShortDate(log.completedAt)}
                      </span>
                    ))}
                  </div>
                </article>

                <section className="visual-history-section">
                  <div className="visual-history-header">
                    <div>
                      <span>Historial reciente</span>
                      <h3>Registros del ejercicio</h3>
                    </div>

                    <strong>{selectedExercise.logs.length}</strong>
                  </div>

                  <div className="visual-history-list">
                    {selectedExercise.logs
                      .slice()
                      .reverse()
                      .map((log) => (
                        <article key={log._id} className="visual-history-card">
                          <div className="history-icon">🏋️</div>

                          <div>
                            <strong>{formatDate(log.completedAt)}</strong>
                            <span>{formatHour(log.completedAt)}</span>
                          </div>

                          <div>
                            <span>Peso</span>
                            <strong>{log.weight ? `${log.weight} kg` : "-"}</strong>
                          </div>

                          <div>
                            <span>Reps</span>
                            <strong>{log.repsDone || "-"}</strong>
                          </div>
                        </article>
                      ))}
                  </div>
                </section>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
} 