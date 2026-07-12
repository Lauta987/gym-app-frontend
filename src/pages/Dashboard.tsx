import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Exercise, Routine, Student } from "../types";

type DashboardStudent = Omit<Student, "assignedRoutine"> & {
  createdAt?: string;
  assignedRoutine?:
    | string
    | {
        _id: string;
        name: string;
      };
};

export default function Dashboard() {
  const [students, setStudents] = useState<DashboardStudent[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [studentsResponse, routinesResponse, exercisesResponse] =
        await Promise.all([
          api.get<{ students: DashboardStudent[] }>("/students"),
          api.get<{ routines: Routine[] }>("/routines"),
          api.get<{ exercises: Exercise[] }>("/exercises"),
        ]);

      setStudents(studentsResponse.data.students);
      setRoutines(routinesResponse.data.routines);
      setExercises(exercisesResponse.data.exercises);
    } catch (error) {
      console.error("Error al cargar dashboard", error);
      setError("No se pudo cargar la información del dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const hasAssignedRoutine = (student: DashboardStudent) => {
    return Boolean(student.assignedRoutine);
  };

  const activeStudents = students.filter((student) => student.active).length;

  const inactiveStudents = students.length - activeStudents;

  const studentsWithoutRoutine = students.filter(
    (student) => student.active && !hasAssignedRoutine(student)
  );

  const studentsWithRoutine = students.filter((student) =>
    hasAssignedRoutine(student)
  ).length;

  const recentStudents = [...students]
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      return b._id.localeCompare(a._id);
    })
    .slice(0, 5);

  const recentStudentsWithoutRoutine = studentsWithoutRoutine.slice(0, 5);

  return (
    <AdminLayout>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Resumen general de tu gimnasio.</p>
          </div>

          <button
            type="button"
            className="date-pill"
            onClick={loadDashboardData}
          >
            Actualizar
          </button>
        </header>

        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <p className="loading-text">Cargando información...</p>
        ) : (
          <>
            <section className="stats-grid dashboard-stats-grid">
              <article className="stat-card">
                <span>Alumnos activos</span>
                <strong>{activeStudents}</strong>
                <p>{students.length} alumnos totales</p>
              </article>

              <article className="stat-card dashboard-alert-card">
                <span>Sin rutina</span>
                <strong>{studentsWithoutRoutine.length}</strong>
                <p>alumnos activos pendientes</p>

                {studentsWithoutRoutine.length > 0 && (
                  <Link to="/assign-routine">Asignar ahora</Link>
                )}
              </article>

              <article className="stat-card">
                <span>Rutinas creadas</span>
                <strong>{routines.length}</strong>
                <p>{studentsWithRoutine} alumnos con rutina</p>
              </article>

              <article className="stat-card">
                <span>Ejercicios cargados</span>
                <strong>{exercises.length}</strong>
                <p>Biblioteca del gimnasio</p>
              </article>
            </section>

            <section className="dashboard-mini-grid">
              <article>
                <span>Total alumnos</span>
                <strong>{students.length}</strong>
              </article>

              <article>
                <span>Activos</span>
                <strong>{activeStudents}</strong>
              </article>

              <article>
                <span>Inactivos</span>
                <strong>{inactiveStudents}</strong>
              </article>

              <article>
                <span>Con rutina</span>
                <strong>{studentsWithRoutine}</strong>
              </article>
            </section>

            <section className="dashboard-grid">
              <article className="panel-card recent-students-panel">
                <div className="panel-header">
                  <h2>Últimos alumnos creados</h2>
                  <Link to="/students">Ver todos</Link>
                </div>

                {recentStudents.length === 0 ? (
                  <div className="empty-state">
                    <h3>No hay alumnos cargados</h3>
                    <p>
                      Cuando agregues alumnos, van a aparecer en esta sección.
                    </p>
                  </div>
                ) : (
                  <div className="recent-students-list">
                    {recentStudents.map((student) => (
                      <article
                        key={student._id}
                        className="recent-student-card"
                      >
                        <div className="recent-student-avatar">
                          {student.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="recent-student-info">
                          <strong>
                            {student.name} {student.lastName}
                          </strong>
                          <span>{student.email}</span>
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
                    ))}
                  </div>
                )}
              </article>

              <article className="panel-card quick-actions-panel">
                <div className="panel-header">
                  <h2>Acciones rápidas</h2>
                </div>

                <div className="quick-actions-list">
                  <Link to="/students" className="quick-action-card">
                    <span>＋</span>
                    <div>
                      <strong>Crear alumno</strong>
                      <p>Agregá un nuevo alumno al gimnasio.</p>
                    </div>
                  </Link>

                  <Link to="/routines" className="quick-action-card">
                    <span>▣</span>
                    <div>
                      <strong>Crear rutina</strong>
                      <p>Armá una rutina con días y ejercicios.</p>
                    </div>
                  </Link>

                  <Link to="/exercises" className="quick-action-card">
                    <span>⌁</span>
                    <div>
                      <strong>Crear ejercicio</strong>
                      <p>Cargá ejercicios para usar en rutinas.</p>
                    </div>
                  </Link>

                  <Link to="/assign-routine" className="quick-action-card">
                    <span>✓</span>
                    <div>
                      <strong>Asignar rutina</strong>
                      <p>Asignale un plan de entrenamiento a un alumno.</p>
                    </div>
                  </Link>
                </div>
              </article>
            </section>

            <section className="dashboard-grid">
              <article className="panel-card dashboard-pending-panel">
                <div className="panel-header">
                  <h2>Alumnos sin rutina</h2>
                  <Link to="/assign-routine">Asignar rutina</Link>
                </div>

                {recentStudentsWithoutRoutine.length === 0 ? (
                  <div className="empty-state">
                    <h3>Todo al día</h3>
                    <p>Todos los alumnos activos tienen una rutina asignada.</p>
                  </div>
                ) : (
                  <div className="recent-students-list">
                    {recentStudentsWithoutRoutine.map((student) => (
                      <article
                        key={student._id}
                        className="recent-student-card pending"
                      >
                        <div className="recent-student-avatar">
                          {student.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="recent-student-info">
                          <strong>
                            {student.name} {student.lastName}
                          </strong>
                          <span>{student.email}</span>
                        </div>

                        <Link
                          to="/assign-routine"
                          className="dashboard-assign-link"
                        >
                          Asignar
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </article>

              <article className="panel-card dashboard-health-panel">
                <div className="panel-header">
                  <h2>Estado del sistema</h2>
                </div>

                <div className="dashboard-health-list">
                  <article>
                    <div>
                      <strong>Base de alumnos</strong>
                      <span>
                        {students.length > 0
                          ? "Ya hay alumnos cargados"
                          : "Todavía no hay alumnos"}
                      </span>
                    </div>

                    <b>{students.length > 0 ? "OK" : "Pendiente"}</b>
                  </article>

                  <article>
                    <div>
                      <strong>Rutinas disponibles</strong>
                      <span>
                        {routines.length > 0
                          ? "Hay planes para asignar"
                          : "Faltan rutinas"}
                      </span>
                    </div>

                    <b>{routines.length > 0 ? "OK" : "Pendiente"}</b>
                  </article>

                  <article>
                    <div>
                      <strong>Ejercicios cargados</strong>
                      <span>
                        {exercises.length > 0
                          ? "La biblioteca está lista"
                          : "Faltan ejercicios"}
                      </span>
                    </div>

                    <b>{exercises.length > 0 ? "OK" : "Pendiente"}</b>
                  </article>
                </div>
              </article>
            </section>
          </>
        )}
      </section>
    </AdminLayout>
  );
} 