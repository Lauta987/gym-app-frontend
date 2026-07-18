import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import type { Routine, RoutineExercise, User, WorkoutLog } from "../types";
import { isValidImageUrl } from "../utils/image";

interface SelectedExercise {
  dayName: string;
  dayOrder: number;
  item: RoutineExercise;
}

export default function MyRoutine() {
  const navigate = useNavigate();

  const userStorage = localStorage.getItem("user");
  const user: User | null = userStorage ? JSON.parse(userStorage) : null;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const [selectedExercise, setSelectedExercise] =
    useState<SelectedExercise | null>(null);

  const [weight, setWeight] = useState("");
  const [repsDone, setRepsDone] = useState("");
  const [progressNotes, setProgressNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const loadMyData = async () => {
    try {
      setLoading(true);
      setError("");

      const [routineResponse, logsResponse] = await Promise.all([
        api.get<{ routine: Routine }>("/routines/my-routine"),
        api.get<{ workoutLogs: WorkoutLog[] }>("/workout-logs/my-logs"),
      ]);

      setRoutine(routineResponse.data.routine);
      setWorkoutLogs(logsResponse.data.workoutLogs);
      setActiveDayIndex(0);
    } catch (error) {
      console.error("Error al cargar datos del alumno", error);
      setRoutine(null);
      setWorkoutLogs([]);
      setError("Todavía no tenés una rutina asignada.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyData();
  }, []);

  const activeDay = routine?.days?.[activeDayIndex];

  /*
   * Una rutina puede conservar referencias a ejercicios eliminados.
   * Cuando MongoDB hace populate, esas referencias llegan como null.
   * Filtramos esos elementos para evitar que la pantalla se rompa.
   */
  const validActiveExercises =
    activeDay?.exercises?.filter((item) => Boolean(item?.exerciseId)) ?? [];

  const isCompletedToday = (exerciseId: string, dayOrder: number) => {
    const today = new Date().toDateString();

    return workoutLogs.some((log) => {
      const logDate = new Date(log.completedAt).toDateString();
      const populatedExercise = log.exerciseId as
        | { _id?: string }
        | null
        | undefined;

      return (
        populatedExercise?._id === exerciseId &&
        log.dayOrder === dayOrder &&
        logDate === today
      );
    });
  };

  const getDefaultReps = (reps: string) => {
    const match = reps.match(/\d+/);
    return match ? match[0] : "10";
  };

  const formatDayTabName = (dayName: string, order: number) => {
    return dayName.replace(`Día ${order} -`, "").trim();
  };

  const openProgressForm = (
    dayName: string,
    dayOrder: number,
    item: RoutineExercise
  ) => {
    setSelectedExercise({
      dayName,
      dayOrder,
      item,
    });

    setWeight("0");
    setRepsDone(getDefaultReps(item.reps));
    setProgressNotes("");
    setSuccessMessage("");
  };

  const closeProgressForm = () => {
    setSelectedExercise(null);
    setWeight("");
    setRepsDone("");
    setProgressNotes("");
  };

  const decreaseWeight = () => {
    setWeight((prev) => {
      const current = Number(prev) || 0;
      return String(Math.max(0, current - 5));
    });
  };

  const increaseWeight = () => {
    setWeight((prev) => {
      const current = Number(prev) || 0;
      return String(current + 5);
    });
  };

  const decreaseReps = () => {
    setRepsDone((prev) => {
      const current = Number(prev) || 1;
      return String(Math.max(1, current - 1));
    });
  };

  const increaseReps = () => {
    setRepsDone((prev) => {
      const current = Number(prev) || 0;
      return String(current + 1);
    });
  };

  const handleSaveProgress = async () => {
    if (!routine || !selectedExercise) return;

    const exercise = selectedExercise.item.exerciseId;

    if (!exercise) {
      setError(
        "Este ejercicio ya no está disponible. Pedile al gimnasio que actualice tu rutina."
      );
      closeProgressForm();
      return;
    }

    try {
      setSavingProgress(true);
      setSuccessMessage("");
      setError("");

      await api.post("/workout-logs", {
        routineId: routine._id,
        exerciseId: exercise._id,
        dayName: selectedExercise.dayName,
        dayOrder: selectedExercise.dayOrder,
        setsPlanned: selectedExercise.item.sets,
        repsPlanned: selectedExercise.item.reps,
        restPlanned: selectedExercise.item.rest,
        weight: weight ? Number(weight) : undefined,
        repsDone,
        notes: progressNotes,
      });

      setSuccessMessage("Progreso registrado correctamente.");
      closeProgressForm();
      await loadMyData();
    } catch (error) {
      console.error("Error al registrar progreso", error);
      setError("No se pudo registrar el progreso.");
    } finally {
      setSavingProgress(false);
    }
  };

  return (
    <main className="forma-page">
      <section className="forma-app-shell">
        <header className="forma-topbar">
          <div>
            <h1>
              Gym<span>Start.</span>
            </h1>
            <p>Mi rutina</p>
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

        {loading ? (
          <div className="forma-empty">
            <p>Cargando tu rutina...</p>
          </div>
        ) : error && !routine ? (
          <section className="forma-waiting-routine">
            <div className="forma-waiting-intro">
              <span>Buen día,</span>
              <h2>
                {user?.name || "Alumno"}
                <strong>.</strong>
              </h2>
              <p>Estás un paso más cerca de tu mejor versión.</p>
            </div>

            <article className="forma-waiting-card">
              <div className="forma-waiting-status">
                <span>◷</span>
                Esperando rutina
              </div>

              <h3>
                Tu profesor todavía no te asignó <strong>una rutina</strong>
              </h3>

              <div className="forma-waiting-line"></div>

              <p>
                Cuando tu rutina esté lista, la vas a ver acá junto con tus
                ejercicios, series, descansos y progreso.
              </p>

              <div className="forma-waiting-illustration">
                <div className="forma-waiting-board">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="forma-waiting-dumbbell">
                  <span></span>
                </div>
              </div>
            </article>

            <div className="forma-waiting-actions">
              <button
                type="button"
                className="forma-waiting-refresh"
                onClick={loadMyData}
              >
                ↻ Actualizar
              </button>

              <button
                type="button"
                className="forma-waiting-logout"
                onClick={handleLogout}
              >
                ↪ Cerrar sesión
              </button>
            </div>

            <article className="forma-waiting-tip">
              <div>i</div>

              <p>
                <strong>Mientras tanto,</strong>
                mantené tus datos al día y consultá con tu gimnasio si tu rutina
                ya fue creada.
              </p>

              <span>›</span>
            </article>
          </section>
        ) : routine ? (
          <>
            <section className="forma-hero-card">
              <span>Rutina asignada</span>

              <div>
                <h2>{routine.name}</h2>
                <p>
                  Objetivo:{" "}
                  <strong>{routine.objective || "No definido"}</strong>
                </p>
              </div>

              <div className="forma-hero-stats">
                <article>
                  <small>Nivel</small>
                  <strong>{routine.level}</strong>
                </article>

                <article>
                  <small>Días</small>
                  <strong>{routine.days.length}</strong>
                </article>

                <article>
                  <small>Actual</small>
                  <strong>{activeDay?.dayName || "-"}</strong>
                </article>
              </div>
            </section>

            {successMessage && (
              <p className="forma-success-message">{successMessage}</p>
            )}

            <nav className="forma-day-tabs">
              {routine.days.map((day, index) => (
                <button
                  type="button"
                  key={`${day.order}-${day.dayName}`}
                  className={index === activeDayIndex ? "active" : ""}
                  onClick={() => setActiveDayIndex(index)}
                >
                  <strong>Día {day.order}</strong>
                  <span>{formatDayTabName(day.dayName, day.order)}</span>
                </button>
              ))}
            </nav>

            {activeDay ? (
              <section className="forma-routine-content">
                <div className="forma-section-heading">
                  <div>
                    <span>Ejercicios</span>
                    <h2>{activeDay.dayName}</h2>
                  </div>

                  <strong>{validActiveExercises.length} de rutina</strong>
                </div>

                <div className="forma-exercise-list">
                  {validActiveExercises.map((item) => {
                    const exercise = item.exerciseId;

                    if (!exercise) return null;

                    const completedToday = isCompletedToday(
                      exercise._id,
                      activeDay.order
                    );

                    return (
                      <article
                        key={`${activeDay.order}-${exercise._id}`}
                        className={
                          completedToday
                            ? "forma-exercise-card completed"
                            : "forma-exercise-card"
                        }
                      >
                        <div className="forma-exercise-number">
                          {isValidImageUrl(exercise.imageUrl) ? (
                            <img
                              src={exercise.imageUrl}
                              alt={exercise.name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span>{item.order}</span>
                          )}
                        </div>

                        <div className="forma-exercise-main">
                          <div className="forma-exercise-title">
                            <div>
                              <strong>{exercise.name}</strong>
                              <p>
                                {item.sets} series · {item.reps} reps ·{" "}
                                {item.rest} descanso
                              </p>
                            </div>

                            {completedToday ? (
                              <span className="forma-done-pill">✓</span>
                            ) : (
                              <button
                                type="button"
                                className="forma-open-progress"
                                onClick={() =>
                                  openProgressForm(
                                    activeDay.dayName,
                                    activeDay.order,
                                    item
                                  )
                                }
                              >
                                ›
                              </button>
                            )}
                          </div>

                          {exercise.muscles?.length > 0 && (
                            <div className="forma-muscle-row">
                              {exercise.muscles.map((muscle) => (
                                <span key={muscle}>{muscle}</span>
                              ))}
                            </div>
                          )}

                          <div className="forma-exercise-actions">
                            {exercise.videoUrl && (
                              <a
                                href={exercise.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Ver video
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                openProgressForm(
                                  activeDay.dayName,
                                  activeDay.order,
                                  item
                                )
                              }
                              disabled={completedToday}
                            >
                              {completedToday
                                ? "Completado hoy"
                                : "Registrar progreso"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <article className="forma-coach-card">
                  <div>💡</div>
                  <div>
                    <h3>Consejo del coach</h3>
                    <p>La constancia de hoy son los resultados de mañana.</p>
                  </div>
                </article>
              </section>
            ) : (
              <div className="forma-empty">
                <h2>Rutina sin días</h2>
                <p>Esta rutina todavía no tiene días cargados.</p>
              </div>
            )}
          </>
        ) : null}

        <nav className="forma-bottom-nav">
          <Link to="/my-routine" className="active">
            <span>⌂</span>
            Rutina
          </Link>

          <Link to="/my-progress">
            <span>↗</span>
            Progreso
          </Link>

          <button type="button" onClick={() => setShowUserMenu(true)}>
            <span>○</span>
            Perfil
          </button>
        </nav>
      </section>

      {selectedExercise && (
        <section className="forma-sheet-backdrop">
          <article className="forma-progress-sheet">
            <div className="forma-sheet-handle"></div>

            <header className="forma-sheet-header">
              <button type="button" onClick={closeProgressForm}>
                ‹
              </button>

              <div>
                <span>
                  {selectedExercise.dayName} · {selectedExercise.item.sets}{" "}
                  series
                </span>
                <h2>{selectedExercise.item.exerciseId.name}</h2>
                <p>
                  {selectedExercise.item.exerciseId.muscles?.join(" · ") ||
                    "Ejercicio"}
                </p>
              </div>

              <button type="button" onClick={closeProgressForm}>
                ×
              </button>
            </header>

            <section className="forma-progress-info">
              <article>
                <span>Plan</span>
                <strong>
                  {selectedExercise.item.sets} x {selectedExercise.item.reps}
                </strong>
              </article>

              <article>
                <span>Descanso</span>
                <strong>{selectedExercise.item.rest}</strong>
              </article>
            </section>

            <section className="forma-progress-table">
              <div className="forma-progress-row muted">
                <span>Serie</span>
                <span>Peso (kg)</span>
                <span>Reps</span>
                <span></span>
              </div>

              <div className="forma-progress-row active">
                <span>1</span>

                <div className="forma-counter-mini">
                  <button type="button" onClick={decreaseWeight}>
                    −
                  </button>
                  <strong>{weight || "0"}</strong>
                  <button type="button" onClick={increaseWeight}>
                    +
                  </button>
                </div>

                <div className="forma-counter-mini">
                  <button type="button" onClick={decreaseReps}>
                    −
                  </button>
                  <strong>{repsDone || "0"}</strong>
                  <button type="button" onClick={increaseReps}>
                    +
                  </button>
                </div>

                <span className="forma-current-dot">●</span>
              </div>
            </section>

            <textarea
              className="forma-progress-notes"
              placeholder="Agregar nota opcional..."
              value={progressNotes}
              onChange={(event) => setProgressNotes(event.target.value)}
            />

            <button
              type="button"
              className="forma-save-progress"
              onClick={handleSaveProgress}
              disabled={savingProgress}
            >
              {savingProgress ? "Guardando..." : "Guardar progreso"}
            </button>
          </article>
        </section>
      )}
    </main>
  );
}  