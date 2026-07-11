import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Student, WorkoutLog } from "../types";

interface ExerciseProgressGroup {
  exerciseId: string;
  exerciseName: string;
  logs: WorkoutLog[];
  latestWeight: number;
  bestWeight: number;
  latestReps: number;
  bestReps: number;
}

export default function Progress() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      setError("");

      const response = await api.get<{ students: Student[] }>("/students");

      setStudents(response.data.students);
    } catch (error) {
      console.error("Error al cargar alumnos", error);
      setError("No se pudieron cargar los alumnos.");
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const selectedStudent = useMemo(() => {
    return students.find((student) => student._id === selectedStudentId);
  }, [students, selectedStudentId]);

  const parseReps = (value?: string) => {
    if (!value) return 0;

    const numbers = value.match(/\d+/g)?.map(Number) || [];

    return numbers.reduce((total, number) => total + number, 0);
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

  const loadStudentProgress = async (studentId: string) => {
    try {
      setLoadingLogs(true);
      setError("");
      setSelectedStudentId(studentId);

      if (!studentId) {
        setWorkoutLogs([]);
        return;
      }

      const response = await api.get<{ workoutLogs: WorkoutLog[] }>(
        `/workout-logs/student/${studentId}`
      );

      setWorkoutLogs(response.data.workoutLogs);
    } catch (error) {
      console.error("Error al cargar progreso", error);
      setError("No se pudo cargar el progreso del alumno.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatHour = (date: string) => {
    return new Date(date).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const lastLog = sortedWorkoutLogs[0];

  const totalExercises = exerciseGroups.length;

  const bestWeight = exerciseGroups.reduce((best, group) => {
    return Math.max(best, group.bestWeight);
  }, 0);

 
  return (
    <AdminLayout>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Progreso</h1>
            <p>Consultá la evolución registrada por cada alumno.</p>
          </div>

          <div className="date-pill">{workoutLogs.length} registros</div>
        </header>

        {error && <p className="error-message">{error}</p>}

        <section className="admin-progress-stats">
          <article>
            <span>Registros</span>
            <strong>{workoutLogs.length}</strong>
            <p>del alumno seleccionado</p>
          </article>

          <article>
            <span>Ejercicios</span>
            <strong>{totalExercises}</strong>
            <p>con progreso cargado</p>
          </article>

          <article>
            <span>Mejor peso</span>
            <strong>{bestWeight || "-"}</strong>
            <p>{bestWeight ? "kg registrados" : "sin datos"}</p>
          </article>

          <article>
            <span>Último entrenamiento</span>
            <strong>{lastLog ? formatDate(lastLog.completedAt) : "-"}</strong>
            <p>{lastLog ? formatHour(lastLog.completedAt) : "sin registros"}</p>
          </article>
        </section>

        <section className="admin-progress-grid">
          <article className="admin-progress-selector-card">
            <div className="admin-progress-heading">
              <span>Alumno</span>
              <h2>Seleccionar alumno</h2>
              <p>Elegí un alumno para analizar su historial de entrenamiento.</p>
            </div>

            {loadingStudents ? (
              <p className="loading-text">Cargando alumnos...</p>
            ) : (
              <label className="admin-progress-field">
                Alumno
                <select
                  value={selectedStudentId}
                  onChange={(event) => loadStudentProgress(event.target.value)}
                >
                  <option value="">Seleccionar alumno</option>

                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} {student.lastName} - {student.email}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {selectedStudent ? (
              <div className="admin-progress-student-card">
                <div className="admin-progress-avatar">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <strong>
                    {selectedStudent.name} {selectedStudent.lastName}
                  </strong>
                  <span>{selectedStudent.email}</span>

                  <p>
                    Estado:{" "}
                    <b>{selectedStudent.active ? "Activo" : "Inactivo"}</b>
                  </p>
                </div>
              </div>
            ) : (
              <div className="admin-progress-empty-box">
                Seleccioná un alumno para ver su progreso.
              </div>
            )}

            <button
              type="button"
              className="admin-progress-refresh"
              onClick={() => loadStudentProgress(selectedStudentId)}
              disabled={!selectedStudentId || loadingLogs}
            >
              {loadingLogs ? "Actualizando..." : "Actualizar progreso"}
            </button>
          </article>

          <article className="admin-progress-summary-card">
            <div className="admin-progress-heading dark">
              <span>Resumen</span>
              <h2>
                {selectedStudent
                  ? `${selectedStudent.name} ${selectedStudent.lastName}`
                  : "Sin alumno seleccionado"}
              </h2>
              <p>
                Visualizá los ejercicios completados, mejores marcas e historial.
              </p>
            </div>

            {!selectedStudentId ? (
              <div className="admin-progress-dark-empty">
                Elegí un alumno para cargar los datos.
              </div>
            ) : loadingLogs ? (
              <p className="loading-text">Cargando progreso...</p>
            ) : workoutLogs.length === 0 ? (
              <div className="admin-progress-dark-empty">
                Este alumno todavía no registró ejercicios completados.
              </div>
            ) : (
              <div className="admin-progress-exercise-grid">
                {exerciseGroups.slice(0, 4).map((group) => (
                  <article key={group.exerciseId}>
                    <span>{group.exerciseName}</span>

                    <div>
                      <strong>{group.bestWeight || "-"}</strong>
                      <small>kg</small>
                    </div>

                    <p>
                      {group.logs.length} registros · mejor reps{" "}
                      {group.bestReps || "-"}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="table-card admin-progress-history-card">
          <div className="panel-header">
            <h2>Historial reciente</h2>

            <button
              type="button"
              onClick={() => loadStudentProgress(selectedStudentId)}
              disabled={!selectedStudentId}
            >
              Actualizar
            </button>
          </div>

          {!selectedStudentId ? (
            <div className="empty-state">
              <h3>Seleccioná un alumno</h3>
              <p>Elegí un alumno para ver los ejercicios que fue completando.</p>
            </div>
          ) : loadingLogs ? (
            <p className="loading-text">Cargando progreso...</p>
          ) : workoutLogs.length === 0 ? (
            <div className="empty-state">
              <h3>Sin progreso registrado</h3>
              <p>
                Este alumno todavía no registró ejercicios completados desde su
                app.
              </p>
            </div>
          ) : (
            <div className="admin-progress-list">
              {sortedWorkoutLogs.map((log) => (
                <article key={log._id} className="admin-progress-log-card">
                  <div className="admin-progress-date">
                    <strong>{formatDate(log.completedAt)}</strong>
                    <span>{formatHour(log.completedAt)}</span>
                  </div>

                  <div className="admin-progress-log-main">
                    <strong>{log.exerciseId.name}</strong>
                    <span>
                      {log.routineId.name} · {log.dayName}
                    </span>
                  </div>

                  <div className="admin-progress-log-stat">
                    <span>Plan</span>
                    <strong>
                      {log.setsPlanned} x {log.repsPlanned}
                    </strong>
                  </div>

                  <div className="admin-progress-log-stat">
                    <span>Peso</span>
                    <strong>{log.weight ? `${log.weight} kg` : "-"}</strong>
                  </div>

                  <div className="admin-progress-log-stat">
                    <span>Reps</span>
                    <strong>{log.repsDone || "-"}</strong>
                  </div>

                  {log.notes && (
                    <p className="admin-progress-notes">Nota: {log.notes}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </AdminLayout>
  );
} 