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

  const totalExercises = exerciseGroups.length;

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
    <main className="forma-page">
      <section className="forma-app-shell">
        <header className="forma-topbar">
          <div>
            <h1>
              Gym<span>Start.</span>
            </h1>
            <p>Mi progreso</p>
          </div>

          <div className="forma-user-menu">
            <button
              type="button"
              className="forma-avatar-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </button>

            {showUserMenu && (
              <div className="forma-user-dropdown">
                <div>
                  <strong>
                    {user?.name} {user?.lastName}
                  </strong>
                  <span>{user?.email}</span>
                </div>

                <Link to="/my-routine" onClick={() => setShowUserMenu(false)}>
                  Mi rutina
                </Link>

                <Link to="/my-progress" onClick={() => setShowUserMenu(false)}>
                  Mi progreso
                </Link>

                <button type="button" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="forma-progress-hero-card">
          <span>Seguimiento personal</span>

          <div>
            <h2>
              Tu evolución
              <br />
              de entrenamiento
            </h2>

            <p>
              Revisá tus ejercicios, pesos usados y repeticiones registradas.
            </p>
          </div>

          <div className="forma-progress-hero-stats">
            <article>
              <small>Registros</small>
              <strong>{totalCompleted}</strong>
            </article>

            <article>
              <small>Ejercicios</small>
              <strong>{totalExercises}</strong>
            </article>

            <article>
              <small>Último</small>
              <strong>{lastLog ? formatShortDate(lastLog.completedAt) : "-"}</strong>
            </article>
          </div>
        </section>

        {loading ? (
          <div className="forma-empty">
            <p>Cargando tu progreso...</p>
          </div>
        ) : error ? (
          <div className="forma-empty">
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        ) : workoutLogs.length === 0 ? (
          <div className="forma-empty">
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
            <section className="forma-progress-selector">
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
              <section className="forma-progress-content">
                <div className="forma-section-heading">
                  <div>
                    <span>Evolución</span>
                    <h2>{selectedExercise.exerciseName}</h2>
                  </div>

                  <strong>{selectedExercise.logs.length} registros</strong>
                </div>

                <div className="forma-progress-stat-grid">
                  <article>
                    <span>Último peso</span>
                    <strong>
                      {selectedExercise.latestWeight
                        ? selectedExercise.latestWeight
                        : "-"}
                    </strong>
                    <p>kg</p>
                  </article>

                  <article className="highlight">
                    <span>Mejor peso</span>
                    <strong>
                      {selectedExercise.bestWeight
                        ? selectedExercise.bestWeight
                        : "-"}
                    </strong>
                    <p>kg</p>
                  </article>

                  <article>
                    <span>Últimas reps</span>
                    <strong>
                      {selectedExercise.latestReps
                        ? selectedExercise.latestReps
                        : "-"}
                    </strong>
                    <p>reps</p>
                  </article>

                  <article className="highlight">
                    <span>Mejor reps</span>
                    <strong>
                      {selectedExercise.bestReps
                        ? selectedExercise.bestReps
                        : "-"}
                    </strong>
                    <p>reps</p>
                  </article>
                </div>

                <div className="forma-chart-switch">
                  <button
                    type="button"
                    className={chartMode === "weight" ? "active" : ""}
                    onClick={() => setChartMode("weight")}
                  >
                    Peso
                  </button>

                  <button
                    type="button"
                    className={chartMode === "reps" ? "active" : ""}
                    onClick={() => setChartMode("reps")}
                  >
                    Repeticiones
                  </button>
                </div>

                <article className="forma-chart-card">
                  <div className="forma-chart-header">
                    <div>
                      <span>
                        {chartMode === "weight"
                          ? "Evolución de peso"
                          : "Evolución de reps"}
                      </span>

                      <h3>
                        {chartMaxValue || "-"}{" "}
                        {chartMode === "weight" ? "kg" : "reps"}
                      </h3>
                    </div>

                    <strong>{selectedExercise.logs.length}</strong>
                  </div>

                  <svg viewBox="0 0 300 120" className="forma-svg-chart">
                    <polyline
                      className="forma-chart-shadow"
                      points={buildChartPoints(selectedExercise.logs)}
                    />

                    <polyline
                      className="forma-chart-line"
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
                          className="forma-chart-dot"
                        />
                      );
                    })}
                  </svg>

                  <div className="forma-chart-dates">
                    {selectedExercise.logs.slice(-4).map((log) => (
                      <span key={log._id}>
                        {formatShortDate(log.completedAt)}
                      </span>
                    ))}
                  </div>
                </article>

                <section className="forma-history-section">
                  <div className="forma-history-heading">
                    <div>
                      <span>Historial</span>
                      <h3>Registros recientes</h3>
                    </div>
                  </div>

                  <div className="forma-history-list">
                    {selectedExercise.logs
                      .slice()
                      .reverse()
                      .map((log) => (
                        <article key={log._id} className="forma-history-card">
                          <div className="forma-history-number">
                            {formatShortDate(log.completedAt)}
                          </div>

                          <div className="forma-history-main">
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

        <nav className="forma-bottom-nav">
          <Link to="/my-routine">
            <span>⌂</span>
            Rutina
          </Link>

          <Link to="/my-progress" className="active">
            <span>↗</span>
            Progreso
          </Link>

          <button type="button" onClick={() => setShowUserMenu(true)}>
            <span>○</span>
            Perfil
          </button>
        </nav>
      </section>
    </main>
  );
} 