import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Routine, Student } from "../types";

type AssignedRoutineValue =
  | string
  | {
      _id: string;
      name: string;
      level?: string;
      objective?: string;
    };

type AssignmentFilter = "all" | "withRoutine" | "withoutRoutine" | "active" | "inactive";

interface AssignStudent extends Omit<Student, "assignedRoutine"> {
  assignedRoutine?: AssignedRoutineValue;
}

export default function AssignRoutine() {
  const [students, setStudents] = useState<AssignStudent[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);

  const [studentId, setStudentId] = useState("");
  const [routineId, setRoutineId] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [routineSearch, setRoutineSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [studentsResponse, routinesResponse] = await Promise.all([
        api.get<{ students: AssignStudent[] }>("/students"),
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

  const selectedStudent = useMemo(() => {
    return students.find((student) => student._id === studentId);
  }, [students, studentId]);

  const selectedRoutine = useMemo(() => {
    return routines.find((routine) => routine._id === routineId);
  }, [routines, routineId]);

  const getAssignedRoutineId = (assignedRoutine?: AssignedRoutineValue) => {
    if (!assignedRoutine) return "";

    if (typeof assignedRoutine === "string") {
      return assignedRoutine;
    }

    return assignedRoutine._id;
  };

  const getRoutineName = (assignedRoutine?: AssignedRoutineValue) => {
    if (!assignedRoutine) return "Sin rutina asignada";

    if (typeof assignedRoutine === "object") {
      return assignedRoutine.name;
    }

    const routine = routines.find((item) => item._id === assignedRoutine);

    return routine ? routine.name : "Rutina asignada";
  };

  const filteredStudentsForSelect = useMemo(() => {
    const normalizedSearch = studentSearch.trim().toLowerCase();

    return students
      .filter((student) => student.active)
      .filter((student) => {
        if (!normalizedSearch) return true;

        return `${student.name} ${student.lastName} ${student.email}`
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [students, studentSearch]);

  const filteredRoutinesForSelect = useMemo(() => {
    const normalizedSearch = routineSearch.trim().toLowerCase();

    return routines.filter((routine) => {
      if (!normalizedSearch) return true;

      const daysText = routine.days.map((day) => day.dayName).join(" ");

      return `${routine.name} ${routine.level} ${routine.objective || ""} ${
        routine.description || ""
      } ${daysText}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [routines, routineSearch]);

  const filteredStudentsTable = useMemo(() => {
    const normalizedSearch = studentSearch.trim().toLowerCase();

    return students.filter((student) => {
      const assignedRoutineId = getAssignedRoutineId(student.assignedRoutine);
      const hasRoutine = Boolean(assignedRoutineId);

      const matchesSearch =
        !normalizedSearch ||
        `${student.name} ${student.lastName} ${student.email}`
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesFilter =
        assignmentFilter === "all" ||
        (assignmentFilter === "withRoutine" && hasRoutine) ||
        (assignmentFilter === "withoutRoutine" && !hasRoutine) ||
        (assignmentFilter === "active" && student.active) ||
        (assignmentFilter === "inactive" && !student.active);

      return matchesSearch && matchesFilter;
    });
  }, [students, studentSearch, assignmentFilter]);

  const studentsWithRoutine = students.filter((student) =>
    Boolean(getAssignedRoutineId(student.assignedRoutine))
  ).length;

  const studentsWithoutRoutine = students.length - studentsWithRoutine;

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
      setStudentSearch("");
      setRoutineSearch("");

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
            <p>Conectá cada alumno con su plan de entrenamiento.</p>
          </div>

          <div className="date-pill">
            {students.length} alumnos · {routines.length} rutinas
          </div>
        </header>

        <section className="assign-summary-grid">
          <article>
            <span>Total alumnos</span>
            <strong>{students.length}</strong>
            <p>registrados</p>
          </article>

          <article>
            <span>Con rutina</span>
            <strong>{studentsWithRoutine}</strong>
            <p>ya tienen plan</p>
          </article>

          <article>
            <span>Sin rutina</span>
            <strong>{studentsWithoutRoutine}</strong>
            <p>pendientes de asignar</p>
          </article>

          <article>
            <span>Rutinas</span>
            <strong>{routines.length}</strong>
            <p>disponibles</p>
          </article>
        </section>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        {loading ? (
          <p className="loading-text">Cargando datos...</p>
        ) : (
          <>
            <section className="assign-hero-grid">
              <article className="assign-main-card">
                <div className="assign-card-heading">
                  <span>Paso 1</span>
                  <h2>Seleccioná el alumno</h2>
                  <p>
                    Buscá y elegí el alumno al que querés asignarle una rutina.
                  </p>
                </div>

                <label className="assign-field">
                  Buscar alumno
                  <input
                    type="text"
                    placeholder="Nombre, apellido o email..."
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                  />
                </label>

                <label className="assign-field">
                  Alumno
                  <select
                    value={studentId}
                    onChange={(event) => setStudentId(event.target.value)}
                  >
                    <option value="">Seleccionar alumno</option>

                    {filteredStudentsForSelect.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} {student.lastName} - {student.email}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="assign-helper-text">
                  {filteredStudentsForSelect.length} alumno
                  {filteredStudentsForSelect.length === 1 ? "" : "s"} activo
                  {filteredStudentsForSelect.length === 1 ? "" : "s"} encontrado
                  {filteredStudentsForSelect.length === 1 ? "" : "s"}.
                </p>

                {selectedStudent ? (
                  <div className="assign-selected-card">
                    <div className="assign-avatar">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {selectedStudent.name} {selectedStudent.lastName}
                      </strong>
                      <span>{selectedStudent.email}</span>
                      <p>
                        Rutina actual:{" "}
                        <b>{getRoutineName(selectedStudent.assignedRoutine)}</b>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="assign-empty-box">
                    Seleccioná un alumno para ver su información.
                  </div>
                )}
              </article>

              <article className="assign-main-card featured">
                <div className="assign-card-heading">
                  <span>Paso 2</span>
                  <h2>Elegí la rutina</h2>
                  <p>Buscá el plan que va a ver el alumno en su app.</p>
                </div>

                <label className="assign-field">
                  Buscar rutina
                  <input
                    type="text"
                    placeholder="Nombre, nivel, objetivo o día..."
                    value={routineSearch}
                    onChange={(event) => setRoutineSearch(event.target.value)}
                  />
                </label>

                <label className="assign-field">
                  Rutina
                  <select
                    value={routineId}
                    onChange={(event) => setRoutineId(event.target.value)}
                  >
                    <option value="">Seleccionar rutina</option>

                    {filteredRoutinesForSelect.map((routine) => (
                      <option key={routine._id} value={routine._id}>
                        {routine.name} - {routine.level}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="assign-helper-text dark">
                  {filteredRoutinesForSelect.length} rutina
                  {filteredRoutinesForSelect.length === 1 ? "" : "s"} encontrada
                  {filteredRoutinesForSelect.length === 1 ? "" : "s"}.
                </p>

                {selectedRoutine ? (
                  <div className="assign-routine-preview">
                    <span>{selectedRoutine.level}</span>
                    <h3>{selectedRoutine.name}</h3>
                    <p>{selectedRoutine.objective || "Sin objetivo definido"}</p>

                    <div>
                      <strong>{selectedRoutine.days.length}</strong>
                      <small>días de entrenamiento</small>
                    </div>
                  </div>
                ) : (
                  <div className="assign-empty-box dark">
                    Seleccioná una rutina para ver el resumen.
                  </div>
                )}

                <button
                  type="button"
                  className="assign-submit-button"
                  onClick={handleAssignRoutine}
                  disabled={saving}
                >
                  {saving ? "Asignando..." : "Asignar rutina"}
                </button>
              </article>
            </section>

            <section className="table-card assign-table-card">
              <div className="panel-header">
                <h2>Alumnos y rutinas</h2>
                <button type="button" onClick={loadData}>
                  Actualizar
                </button>
              </div>

              <div className="assign-toolbar">
                <label>
                  Filtro
                  <select
                    value={assignmentFilter}
                    onChange={(event) =>
                      setAssignmentFilter(event.target.value as AssignmentFilter)
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="withRoutine">Con rutina</option>
                    <option value="withoutRoutine">Sin rutina</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </label>

                <p>
                  Mostrando {filteredStudentsTable.length} de {students.length}{" "}
                  alumnos.
                </p>
              </div>

              {students.length === 0 ? (
                <div className="empty-state">
                  <h3>No hay alumnos registrados</h3>
                  <p>Primero creá alumnos desde la sección Alumnos.</p>
                </div>
              ) : filteredStudentsTable.length === 0 ? (
                <div className="empty-state">
                  <h3>No se encontraron alumnos</h3>
                  <p>Probá cambiar la búsqueda o el filtro seleccionado.</p>
                </div>
              ) : (
                <div className="assign-students-grid">
                  {filteredStudentsTable.map((student) => {
                    const assignedRoutineId = getAssignedRoutineId(
                      student.assignedRoutine
                    );

                    const hasSelectedRoutine =
                      assignedRoutineId && assignedRoutineId === routineId;

                    return (
                      <article
                        key={student._id}
                        className={
                          hasSelectedRoutine
                            ? "assign-student-row highlighted"
                            : "assign-student-row"
                        }
                      >
                        <div className="assign-avatar small">
                          {student.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="assign-student-main">
                          <strong>
                            {student.name} {student.lastName}
                          </strong>
                          <span>{student.email}</span>
                        </div>

                        <div className="assign-student-routine">
                          <span>Rutina</span>
                          <strong>{getRoutineName(student.assignedRoutine)}</strong>
                        </div>

                        <span
                          className={
                            student.active
                              ? "status-pill active"
                              : "status-pill inactive"
                          }
                        >
                          {student.active ? "Activo" : "Inactivo"}
                        </span>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </AdminLayout>
  );
} 