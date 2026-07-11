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

type RoutineLevel = "principiante" | "intermedio" | "avanzado";

export default function Routines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(
    null
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [level, setLevel] = useState<RoutineLevel>("principiante");

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

  const resetForm = () => {
    setEditingRoutineId(null);
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
  };

  const getExerciseId = (exercise: unknown) => {
    if (typeof exercise === "string") return exercise;

    if (
      typeof exercise === "object" &&
      exercise !== null &&
      "_id" in exercise
    ) {
      return String((exercise as Exercise)._id);
    }

    return "";
  };

  const getExerciseName = (exercise: unknown) => {
    if (
      typeof exercise === "object" &&
      exercise !== null &&
      "name" in exercise
    ) {
      return String((exercise as Exercise).name);
    }

    return "Ejercicio";
  };

  const buildRoutinePayload = () => {
    return {
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
    };
  };

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

    let exerciseWasAdded = false;

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

        exerciseWasAdded = true;

        return {
          ...day,
          exercises: [...day.exercises, newExercise],
        };
      })
    );

    if (exerciseWasAdded) {
      setSelectedExerciseId("");
      setSets(3);
      setReps("10-12");
      setRest("60 segundos");
      setNotes("");
    }
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

  const handleSubmitRoutine = async (event: FormEvent) => {
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

      const payload = buildRoutinePayload();

      if (editingRoutineId) {
        await api.put(`/routines/${editingRoutineId}`, payload);
        setMessage("Rutina actualizada correctamente.");
      } else {
        await api.post("/routines", payload);
        setMessage("Rutina creada correctamente.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error al guardar rutina", error);

      setError(
        editingRoutineId
          ? "No se pudo actualizar la rutina. Revisá los datos ingresados."
          : "No se pudo crear la rutina. Revisá los datos ingresados."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditRoutine = (routine: Routine) => {
    const formDays: RoutineFormDay[] = routine.days.map((day, dayIndex) => ({
      id: crypto.randomUUID(),
      dayName: day.dayName,
      order: day.order || dayIndex + 1,
      exercises: day.exercises.map((item, exerciseIndex) => {
        const exerciseId = getExerciseId(item.exerciseId);

        return {
          exerciseId,
          exerciseName: getExerciseName(item.exerciseId),
          sets: item.sets,
          reps: item.reps,
          rest: item.rest,
          order: item.order || exerciseIndex + 1,
          notes: item.notes || "",
        };
      }),
    }));

    setEditingRoutineId(routine._id);
    setName(routine.name);
    setDescription(routine.description || "");
    setObjective(routine.objective || "");
    setLevel(routine.level || "principiante");
    setDays(formDays);
    setSelectedDayId(formDays[0]?.id || "");
    setDayName("");
    setSelectedExerciseId("");
    setSets(3);
    setReps("10-12");
    setRest("60 segundos");
    setNotes("");
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    resetForm();
    setMessage("");
    setError("");
  };

  const handleDeleteRoutine = async (routine: Routine) => {
    const confirmDelete = window.confirm(
      `¿Seguro que querés eliminar la rutina "${routine.name}"? Si algún alumno la tiene asignada, se le va a quitar.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingRoutineId(routine._id);
      setMessage("");
      setError("");

      await api.delete(`/routines/${routine._id}`);

      if (editingRoutineId === routine._id) {
        resetForm();
      }

      setMessage("Rutina eliminada correctamente.");
      await loadData();
    } catch (error) {
      console.error("Error al eliminar rutina", error);
      setError("No se pudo eliminar la rutina.");
    } finally {
      setDeletingRoutineId(null);
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
            <div className="form-card-header">
              <h2>{editingRoutineId ? "Editar rutina" : "Crear rutina"}</h2>

              {editingRoutineId && (
                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitRoutine} className="student-form">
              <label>
                Nombre
                <input
                  type="text"
                  placeholder="Rutina Principiante"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
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
                    setLevel(event.target.value as RoutineLevel)
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
                      placeholder="Opcional"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </label>

                  <button type="button" onClick={handleAddExerciseToDay}>
                    Agregar ejercicio
                  </button>
                </div>
              )}

              {days.length > 0 && (
                <div className="routine-preview">
                  <h3>Días cargados</h3>

                  {days.map((day) => (
                    <article key={day.id} className="routine-day-card">
                      <div className="routine-day-header">
                        <div>
                          <strong>
                            Día {day.order}: {day.dayName}
                          </strong>
                          <span>{day.exercises.length} ejercicios</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDay(day.id)}
                        >
                          Eliminar día
                        </button>
                      </div>

                      {day.exercises.length === 0 ? (
                        <p className="routine-empty-day">
                          Todavía no agregaste ejercicios a este día.
                        </p>
                      ) : (
                        <div className="routine-exercise-list">
                          {day.exercises.map((exercise) => (
                            <div
                              key={`${day.id}-${exercise.exerciseId}`}
                              className="routine-exercise-item"
                            >
                              <div>
                                <strong>
                                  {exercise.order}. {exercise.exerciseName}
                                </strong>
                                <span>
                                  {exercise.sets} series · {exercise.reps} reps
                                  · {exercise.rest}
                                </span>
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
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}

              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}

              <button type="submit" disabled={saving}>
                {saving
                  ? "Guardando..."
                  : editingRoutineId
                    ? "Guardar cambios"
                    : "Crear rutina"}
              </button>
            </form>
          </article>

          <article className="table-card">
            <div className="panel-header">
              <h2>Rutinas creadas</h2>
              <button type="button" onClick={loadData}>
                Actualizar
              </button>
            </div>

            {loading ? (
              <p className="loading-text">Cargando rutinas...</p>
            ) : routines.length === 0 ? (
              <div className="empty-state">
                <h3>No hay rutinas cargadas</h3>
                <p>Cuando crees rutinas, van a aparecer en esta sección.</p>
              </div>
            ) : (
              <div className="routine-list">
                {routines.map((routine) => (
                  <article key={routine._id} className="routine-card">
                    <div className="routine-card-header">
                      <div>
                        <h3>{routine.name}</h3>
                        <p>{routine.description || "Sin descripción"}</p>
                      </div>

                      <span className="difficulty-pill">{routine.level}</span>
                    </div>

                    <div className="routine-meta">
                      <span>{routine.days.length} días</span>
                      <span>{routine.objective || "Sin objetivo"}</span>
                    </div>

                    <div className="routine-days-summary">
                      {routine.days.map((day) => (
                        <div key={`${routine._id}-${day.order}-${day.dayName}`}>
                          <strong>
                            Día {day.order}: {day.dayName}
                          </strong>
                          <span>{day.exercises.length} ejercicios</span>
                        </div>
                      ))}
                    </div>

                    <div className="routine-admin-actions">
                      <button
                        type="button"
                        className="edit-routine-button"
                        onClick={() => handleEditRoutine(routine)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="delete-routine-button"
                        onClick={() => handleDeleteRoutine(routine)}
                        disabled={deletingRoutineId === routine._id}
                      >
                        {deletingRoutineId === routine._id
                          ? "Eliminando..."
                          : "Eliminar"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>
      </section>
    </AdminLayout>
  );
} 