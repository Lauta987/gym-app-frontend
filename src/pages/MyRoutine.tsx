import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
      setError("Todavía no tenés una rutina asignada.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyData();
  }, []);

  const activeDay = routine?.days?.[activeDayIndex];

  const isCompletedToday = (exerciseId: string, dayOrder: number) => {
    const today = new Date().toDateString();

    return workoutLogs.some((log) => {
      const logDate = new Date(log.completedAt).toDateString();

      return (
        log.exerciseId._id === exerciseId &&
        log.dayOrder === dayOrder &&
        logDate === today
      );
    });
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

    setWeight("");
    setRepsDone("");
    setProgressNotes("");
    setSuccessMessage("");
  };

  const closeProgressForm = () => {
    setSelectedExercise(null);
    setWeight("");
    setRepsDone("");
    setProgressNotes("");
  };

  const handleSaveProgress = async () => {
    if (!routine || !selectedExercise) return;

    try {
      setSavingProgress(true);
      setSuccessMessage("");
      setError("");

      await api.post("/workout-logs", {
        routineId: routine._id,
        exerciseId: selectedExercise.item.exerciseId._id,
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
    <main className="student-dark-page">
      <section className="student-phone-shell">
        <header className="student-dark-header">
          <div className="student-app-brand">
            <div className="student-app-logo">G</div>
            <span>GymStart</span>
          </div>

          <h1>Mi rutina</h1>

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

        {loading ? (
          <div className="student-dark-empty">
            <p>Cargando tu rutina...</p>
          </div>
        ) : error && !routine ? (
          <div className="student-dark-empty">
            <h2>Sin rutina asignada</h2>
            <p>
              Todavía no tenés una rutina cargada. Cuando el profesor te asigne
              una, va a aparecer en esta pantalla.
            </p>

            <button type="button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        ) : routine ? (
          <>
            <section className="student-routine-hero">
              <div className="routine-icon">🏋️</div>

              <div>
                <h2>{routine.name}</h2>
                <p>
                  Objetivo:{" "}
                  <strong>{routine.objective || "No definido"}</strong>
                </p>
                <span>{routine.level}</span>
              </div>
            </section>

            {successMessage && (
              <p className="student-progress-success">{successMessage}</p>
            )}

            <nav className="routine-day-tabs">
              {routine.days.map((day, index) => (
                <button
                  type="button"
                  key={`${day.order}-${day.dayName}`}
                  className={index === activeDayIndex ? "active" : ""}
                  onClick={() => setActiveDayIndex(index)}
                >
                  <strong>Día {day.order}</strong>
                  <span>
                    {day.dayName.replace(`Día ${day.order} -`, "").trim()}
                  </span>
                </button>
              ))}
            </nav>

            {activeDay ? (
              <section className="student-dark-content">
                <div className="student-day-heading">
                  <div>
                    <h2>{activeDay.dayName}</h2>
                    <p>{activeDay.exercises.length} ejercicios asignados</p>
                  </div>

                  <span>{activeDay.order}</span>
                </div>

                <div className="student-dark-exercises">
                  {activeDay.exercises.map((item) => {
                    const completedToday = isCompletedToday(
                      item.exerciseId._id,
                      activeDay.order
                    );

                    return (
                      <article
                        key={`${activeDay.order}-${item.exerciseId._id}`}
                        className={
                          completedToday
                            ? "student-dark-exercise completed"
                            : "student-dark-exercise"
                        }
                      >
                        <div className="exercise-thumb">
                          {isValidImageUrl(item.exerciseId.imageUrl) ? (
                            <img
                              src={item.exerciseId.imageUrl}
                              alt={item.exerciseId.name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span>{item.order}</span>
                          )}
                        </div>

                        <div className="exercise-dark-info">
                          <div className="exercise-dark-top">
                            <h3>{item.exerciseId.name}</h3>

                            {completedToday ? (
                              <span className="completed-pill">Hecho</span>
                            ) : (
                              <button type="button">⋮</button>
                            )}
                          </div>

                          <div className="exercise-dark-stats">
                            <div>
                              <span>Series</span>
                              <strong>{item.sets}</strong>
                            </div>

                            <div>
                              <span>Reps</span>
                              <strong>{item.reps}</strong>
                            </div>

                            <div>
                              <span>Descanso</span>
                              <strong>{item.rest}</strong>
                            </div>
                          </div>

                          {item.notes && (
                            <p className="exercise-dark-note">
                              Nota: {item.notes}
                            </p>
                          )}

                          {item.exerciseId.muscles.length > 0 && (
                            <div className="exercise-dark-muscles">
                              {item.exerciseId.muscles.map((muscle) => (
                                <span key={muscle}>{muscle}</span>
                              ))}
                            </div>
                          )}

                          <div className="exercise-action-row">
                            {item.exerciseId.videoUrl && (
                              <a
                                href={item.exerciseId.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="exercise-video-button"
                              >
                                ▶ Ver video
                              </a>
                            )}

                            <button
                              type="button"
                              className="progress-button"
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

                <article className="coach-tip-card">
                  <div>💡</div>

                  <div>
                    <h3>Consejo del coach</h3>
                    <p>La constancia de hoy son los resultados de mañana.</p>
                  </div>
                </article>
              </section>
            ) : (
              <div className="student-dark-empty">
                <h2>Rutina sin días</h2>
                <p>Esta rutina todavía no tiene días cargados.</p>
              </div>
            )}
          </>
        ) : null}
      </section>

      {selectedExercise && (
        <section className="progress-modal-backdrop">
          <article className="progress-modal">
            <div className="progress-modal-header">
              <div>
                <h2>Registrar progreso</h2>
                <p>{selectedExercise.item.exerciseId.name}</p>
              </div>

              <button type="button" onClick={closeProgressForm}>
                ✕
              </button>
            </div>

            <div className="progress-form">
              <label>
                Peso usado en kg
                <input
                  type="number"
                  placeholder="Ej: 40"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                />
              </label>

              <label>
                Repeticiones realizadas
                <input
                  type="text"
                  placeholder="Ej: 10, 10, 8"
                  value={repsDone}
                  onChange={(event) => setRepsDone(event.target.value)}
                />
              </label>

              <label>
                Notas
                <textarea
                  placeholder="Ej: Me costó la última serie"
                  value={progressNotes}
                  onChange={(event) => setProgressNotes(event.target.value)}
                />
              </label>

              <button
                type="button"
                onClick={handleSaveProgress}
                disabled={savingProgress}
              >
                {savingProgress ? "Guardando..." : "Guardar progreso"}
              </button>
            </div>
          </article>
        </section>
      )}
    </main>
  );
} 