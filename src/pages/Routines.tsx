import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Exercise, Routine } from "../types";

interface RoutineFormExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  rest: string;
  order: number;
  notes: string;
}

interface RoutineFormDay {
  id: string;
  dayName: string;
  order: number;
  exercises: RoutineFormExercise[];
}

export default function Routines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [level, setLevel] = useState<
    "principiante" | "intermedio" | "avanzado"
  >("principiante");

  const [dayName, setDayName] = useState("");
  const [days, setDays] = useState<RoutineFormDay[]>([]);

  const [selectedDayId, setSelectedDayId] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("10-12");
  const [rest, setRest] = useState("60 segundos");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [routinesResponse, exercisesResponse] = await Promise.all([
        api.get<{ routines: Routine[] }>("/routines"),
        api.get<{ exercises: Exercise[] }>("/exercises"),
      ]);

      setRoutines(routinesResponse.data.routines);
      setExercises(exercisesResponse.data.exercises);
    } catch (error) {
      console.error("Error al cargar rutinas", error);
      setError("No se pudieron cargar las rutinas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddDay = () => {
    setError("");
    setMessage("");

    if (!dayName.trim()) {
      setError("Ingresá un nombre para el día.");
      return;
    }

    const newDay: RoutineFormDay = {
      id: crypto.randomUUID(),
      dayName: dayName.trim(),
      order: days.length + 1,
      exercises: [],
    };

    setDays((prevDays) => [...prevDays, newDay]);
    setSelectedDayId(newDay.id);
    setDayName("");
  };

  const handleRemoveDay = (dayId: string) => {
    const updatedDays = days
      .filter((day) => day.id !== dayId)
      .map((day, index) => ({
        ...day,
        order: index + 1,
      }));

    setDays(updatedDays);

    if (selectedDayId === dayId) {
      setSelectedDayId(updatedDays[0]?.id || "");
    }
  };

  const handleAddExerciseToDay = () => {
    setError("");
    setMessage("");

    if (!selectedDayId) {
      setError("Seleccioná un día para agregar el ejercicio.");
      return;
    }

    if (!selectedExerciseId) {
      setError("Seleccioná un ejercicio.");
      return;
    }

    const selectedExercise = exercises.find(
      (exercise) => exercise._id === selectedExerciseId
    );

    if (!selectedExercise) {
      setError("El ejercicio seleccionado no existe.");
      return;
    }

    setDays((prevDays) =>
      prevDays.map((day) => {
        if (day.id !== selectedDayId) {
          return day;
        }

        const exerciseAlreadyAdded = day.exercises.some(
          (exercise) => exercise.exerciseId === selectedExerciseId
        );

        if (exerciseAlreadyAdded) {
          setError("Ese ejercicio ya fue agregado a este día.");
          return day;
        }

        const newExercise: RoutineFormExercise = {
          exerciseId: selectedExercise._id,
          exerciseName: selectedExercise.name,
          sets,
          reps,
          rest,
          order: day.exercises.length + 1,
          notes,
        };

        return {
          ...day,
          exercises: [...day.exercises, newExercise],
        };
      })
    );

    setSelectedExerciseId("");
    setSets(3);
    setReps("10-12");
    setRest("60 segundos");
    setNotes("");
  };

  const handleRemoveExerciseFromDay = (dayId: string, exerciseId: string) => {
    setDays((prevDays) =>
      prevDays.map((day) => {
        if (day.id !== dayId) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises
            .filter((exercise) => exercise.exerciseId !== exerciseId)
            .map((exercise, index) => ({
              ...exercise,
              order: index + 1,
            })),
        };
      })
    );
  };

  const handleCreateRoutine = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!name.trim()) {
        setError("El nombre de la rutina es obligatorio.");
        return;
      }

      if (days.length === 0) {
        setError("La rutina debe tener al menos un día.");
        return;
      }

      const hasEmptyDay = days.some((day) => day.exercises.length === 0);

      if (hasEmptyDay) {
        setError("Todos los días deben tener al menos un ejercicio.");
        return;
      }

      await api.post("/routines", {
        name,
        description,
        objective,
        level,
        days: days.map((day) => ({
          dayName: day.dayName,
          order: day.order,
          exercises: day.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            rest: exercise.rest,
            order: exercise.order,
            notes: exercise.notes,
          })),
        })),
      });

      setMessage("Rutina creada correctamente.");

      setName("");
      setDescription("");
      setObjective("");
      setLevel("principiante");
      setDayName("");
      setDays([]);
      setSelectedDayId("");
      setSelectedExerciseId("");
      setSets(3);
      setReps("10-12");
      setRest("60 segundos");
      setNotes("");

      await loadData();
    } catch (error) {
      console.error("Error al crear rutina", error);
      setError("No se pudo crear la rutina. Revisá los datos ingresados.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Rutinas</h1>
            <p>Creá rutinas divididas por días y ejercicios.</p>
          </div>

          <div className="date-pill">{routines.length} rutinas</div>
        </header>

        <section className="page-grid">
          <article className="form-card">
            <h2>Crear rutina</h2>

            <form onSubmit={handleCreateRoutine} className="student-form">
              <label>
                Nombre
                <input
                  type="text"
                  placeholder="Rutina Principiante"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <label>
                Descripción
                <textarea
                  placeholder="Rutina inicial para alumnos nuevos..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <label>
                Objetivo
                <input
                  type="text"
                  placeholder="Adaptación general"
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                />
              </label>

              <label>
                Nivel
                <select
                  value={level}
                  onChange={(event) =>
                    setLevel(
                      event.target.value as
                        | "principiante"
                        | "intermedio"
                        | "avanzado"
                    )
                  }
                >
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </label>

              <div className="routine-builder">
                <h3>Agregar día</h3>

                <label>
                  Nombre del día
                  <input
                    type="text"
                    placeholder="Día 1 - Torso"
                    value={dayName}
                    onChange={(event) => setDayName(event.target.value)}
                  />
                </label>

                <button type="button" onClick={handleAddDay}>
                  Agregar día
                </button>
              </div>

              {days.length > 0 && (
                <div className="routine-builder">
                  <h3>Agregar ejercicio a un día</h3>

                  <label>
                    Día
                    <select
                      value={selectedDayId}
                      onChange={(event) =>
                        setSelectedDayId(event.target.value)
                      }
                    >
                      <option value="">Seleccionar día</option>

                      {days.map((day) => (
                        <option key={day.id} value={day.id}>
                          {day.order}. {day.dayName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Ejercicio
                    <select
                      value={selectedExerciseId}
                      onChange={(event) =>
                        setSelectedExerciseId(event.target.value)
                      }
                    >
                      <option value="">Seleccionar ejercicio</option>

                      {exercises.map((exercise) => (
                        <option key={exercise._id} value={exercise._id}>
                          {exercise.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mini-grid">
                    <label>
                      Series
                      <input
                        type="number"
                        min="1"
                        value={sets}
                        onChange={(event) =>
                          setSets(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Reps
                      <input
                        type="text"
                        value={reps}
                        onChange={(event) => setReps(event.target.value)}
                      />
                    </label>
                  </div>

                  <label>
                    Descanso
                    <input
                      type="text"
                      value={rest}
                      onChange={(event) => setRest(event.target.value)}
                    />
                  </label>

                  <label>
                    Notas
                    <input
                      type="text"
                      placeholder="Controlar la técnica"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </label>

                  <button type="button" onClick={handleAddExerciseToDay}>
                    Agregar ejercicio al día
                  </button>
                </div>
              )}

              {days.length > 0 && (
                <div className="selected-exercises">
                  <h3>Días de la rutina</h3>

                  {days.map((day) => (
                    <div key={day.id} className="routine-day-box">
                      <div className="routine-day-header">
                        <strong>
                          {day.order}. {day.dayName}
                        </strong>

                        <button
                          type="button"
                          onClick={() => handleRemoveDay(day.id)}
                        >
                          Quitar día
                        </button>
                      </div>

                      {day.exercises.length === 0 ? (
                        <p className="muted-text">
                          Este día todavía no tiene ejercicios.
                        </p>
                      ) : (
                        day.exercises.map((exercise) => (
                          <div
                            key={exercise.exerciseId}
                            className="selected-exercise"
                          >
                            <div>
                              <strong>
                                {exercise.order}. {exercise.exerciseName}
                              </strong>

                              <p>
                                {exercise.sets} series · {exercise.reps} reps ·{" "}
                                {exercise.rest}
                              </p>

                              {exercise.notes && (
                                <p>Nota: {exercise.notes}</p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveExerciseFromDay(
                                  day.id,
                                  exercise.exerciseId
                                )
                              }
                            >
                              Quitar
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )}

              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}

              <button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Crear rutina"}
              </button>
            </form>
          </article>

          <article className="table-card">
            <div className="panel-header">
              <h2>Rutinas creadas</h2>
              <button onClick={loadData}>Actualizar</button>
            </div>

            {loading ? (
              <p className="loading-text">Cargando rutinas...</p>
            ) : routines.length === 0 ? (
              <div className="empty-state">
                <h3>No hay rutinas creadas</h3>
                <p>Cuando crees rutinas, van a aparecer en esta sección.</p>
              </div>
            ) : (
              <div className="routine-list">
                {routines.map((routine) => {
                  const routineDays = routine.days || [];

                  return (
                    <article key={routine._id} className="routine-card">
                      <div className="routine-card-header">
                        <div>
                          <h3>{routine.name}</h3>
                          <p>{routine.description || "Sin descripción"}</p>
                        </div>

                        <span className="difficulty-pill">
                          {routine.level}
                        </span>
                      </div>

                      <div className="routine-meta">
                        <span>
                          Objetivo:{" "}
                          <strong>{routine.objective || "No definido"}</strong>
                        </span>

                        <span>
                          Días: <strong>{routineDays.length}</strong>
                        </span>
                      </div>

                      <div className="routine-exercise-list">
                        {routineDays.map((day) => (
                          <div
                            key={`${routine._id}-${day.order}`}
                            className="routine-day-view"
                          >
                            <h4 className="day-title">
                              {day.order}. {day.dayName}
                            </h4>

                            {day.exercises.map((item) => (
                              <div
                                key={`${routine._id}-${day.order}-${item.exerciseId._id}`}
                                className="routine-exercise-row"
                              >
                                <strong>
                                  {item.order}. {item.exerciseId.name}
                                </strong>

                                <span>
                                  {item.sets} series · {item.reps} reps ·{" "}
                                  {item.rest}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </section>
    </AdminLayout>
  );
} 