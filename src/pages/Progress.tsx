import { useEffect, useState } from "react";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Student, WorkoutLog } from "../types";

export default function Progress() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState("");

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

  const loadStudentProgress = async (studentId: string) => {
    try {
      setLoadingLogs(true);
      setError("");
      setSelectedStudentId(studentId);

      if (!studentId) {
        setWorkoutLogs([]);
        setSelectedStudentName("");
        return;
      }

      const student = students.find((item) => item._id === studentId);

      if (student) {
        setSelectedStudentName(`${student.name} ${student.lastName}`);
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
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Progreso</h1>
            <p>Consultá el progreso registrado por cada alumno.</p>
          </div>

          <div className="date-pill">{workoutLogs.length} registros</div>
        </header>

        <section className="page-grid">
          <article className="form-card">
            <h2>Seleccionar alumno</h2>

            {loadingStudents ? (
              <p className="loading-text">Cargando alumnos...</p>
            ) : (
              <div className="student-form">
                <label>
                  Alumno
                  <select
                    value={selectedStudentId}
                    onChange={(event) =>
                      loadStudentProgress(event.target.value)
                    }
                  >
                    <option value="">Seleccionar alumno</option>

                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} {student.lastName} - {student.email}
                      </option>
                    ))}
                  </select>
                </label>

                {error && <p className="error-message">{error}</p>}
              </div>
            )}
          </article>

          <article className="table-card">
            <div className="panel-header">
              <h2>
                {selectedStudentName
                  ? `Progreso de ${selectedStudentName}`
                  : "Registros de progreso"}
              </h2>

              <button
                onClick={() => loadStudentProgress(selectedStudentId)}
                disabled={!selectedStudentId}
              >
                Actualizar
              </button>
            </div>

            {!selectedStudentId ? (
              <div className="empty-state">
                <h3>Seleccioná un alumno</h3>
                <p>
                  Elegí un alumno para ver los ejercicios que fue completando.
                </p>
              </div>
            ) : loadingLogs ? (
              <p className="loading-text">Cargando progreso...</p>
            ) : workoutLogs.length === 0 ? (
              <div className="empty-state">
                <h3>Sin progreso registrado</h3>
                <p>
                  Este alumno todavía no registró ejercicios completados desde
                  su app.
                </p>
              </div>
            ) : (
              <div className="progress-list">
                {workoutLogs.map((log) => (
                  <article key={log._id} className="progress-card">
                    <div className="progress-card-header">
                      <div>
                        <h3>{log.exerciseId.name}</h3>
                        <p>
                          {log.routineId.name} · {log.dayName}
                        </p>
                      </div>

                      <span>{formatDate(log.completedAt)}</span>
                    </div>

                    <div className="progress-stats">
                      <div>
                        <span>Series planificadas</span>
                        <strong>{log.setsPlanned}</strong>
                      </div>

                      <div>
                        <span>Reps planificadas</span>
                        <strong>{log.repsPlanned}</strong>
                      </div>

                      <div>
                        <span>Peso usado</span>
                        <strong>
                          {log.weight ? `${log.weight} kg` : "No cargado"}
                        </strong>
                      </div>

                      <div>
                        <span>Reps realizadas</span>
                        <strong>{log.repsDone || "No cargado"}</strong>
                      </div>
                    </div>

                    {log.notes && (
                      <p className="progress-notes">Nota: {log.notes}</p>
                    )}
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