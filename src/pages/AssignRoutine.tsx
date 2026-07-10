import { useEffect, useState } from "react";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Routine, Student } from "../types";

export default function AssignRoutine() {
  const [students, setStudents] = useState<Student[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);

  const [studentId, setStudentId] = useState("");
  const [routineId, setRoutineId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [studentsResponse, routinesResponse] = await Promise.all([
        api.get<{ students: Student[] }>("/students"),
        api.get<{ routines: Routine[] }>("/routines"),
      ]);

      setStudents(studentsResponse.data.students);
      setRoutines(routinesResponse.data.routines);
    } catch (error) {
      console.error("Error al cargar datos", error);
      setError("No se pudieron cargar alumnos o rutinas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getRoutineName = (assignedRoutine?: string) => {
    if (!assignedRoutine) return "Sin rutina asignada";

    const routine = routines.find((item) => item._id === assignedRoutine);

    return routine ? routine.name : "Rutina asignada";
  };

  const handleAssignRoutine = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!studentId || !routineId) {
        setError("Seleccioná un alumno y una rutina.");
        return;
      }

      await api.put(`/routines/${routineId}/assign/${studentId}`);

      setMessage("Rutina asignada correctamente.");
      setStudentId("");
      setRoutineId("");

      await loadData();
    } catch (error) {
      console.error("Error al asignar rutina", error);
      setError("No se pudo asignar la rutina.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Asignar rutina</h1>
            <p>Asigná una rutina existente a un alumno del gimnasio.</p>
          </div>

          <div className="date-pill">Panel admin</div>
        </header>

        <section className="page-grid">
          <article className="form-card">
            <h2>Nueva asignación</h2>

            {loading ? (
              <p className="loading-text">Cargando datos...</p>
            ) : (
              <div className="student-form">
                <label>
                  Alumno
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  >
                    <option value="">Seleccionar alumno</option>

                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} {student.lastName} - {student.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Rutina
                  <select
                    value={routineId}
                    onChange={(e) => setRoutineId(e.target.value)}
                  >
                    <option value="">Seleccionar rutina</option>

                    {routines.map((routine) => (
                      <option key={routine._id} value={routine._id}>
                        {routine.name} - {routine.level}
                      </option>
                    ))}
                  </select>
                </label>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <button
                  type="button"
                  onClick={handleAssignRoutine}
                  disabled={saving}
                >
                  {saving ? "Asignando..." : "Asignar rutina"}
                </button>
              </div>
            )}
          </article>

          <article className="table-card">
            <div className="panel-header">
              <h2>Alumnos y rutinas</h2>
              <button onClick={loadData}>Actualizar</button>
            </div>

            {loading ? (
              <p className="loading-text">Cargando alumnos...</p>
            ) : students.length === 0 ? (
              <div className="empty-state">
                <h3>No hay alumnos registrados</h3>
                <p>Primero creá alumnos desde la sección Alumnos.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Email</th>
                      <th>Rutina asignada</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <strong>
                            {student.name} {student.lastName}
                          </strong>
                        </td>
                        <td>{student.email}</td>
                        <td>{getRoutineName(student.assignedRoutine)}</td>
                        <td>
                          <span
                            className={
                              student.active
                                ? "status-pill active"
                                : "status-pill inactive"
                            }
                          >
                            {student.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      </section>
    </AdminLayout>
  );
} 