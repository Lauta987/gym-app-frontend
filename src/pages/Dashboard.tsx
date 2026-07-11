import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Exercise, Routine, Student } from "../types";

interface DashboardStudent extends Student {
  createdAt?: string;
}

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

  const activeStudents = students.filter((student) => student.active).length;

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
            <section className="stats-grid">
              <article className="stat-card">
                <span>Alumnos activos</span>
                <strong>{activeStudents}</strong>
                <p>{students.length} alumnos totales</p>
              </article>

              <article className="stat-card">
                <span>Rutinas creadas</span>
                <strong>{routines.length}</strong>
                <p>Planes disponibles</p>
              </article>

              <article className="stat-card">
                <span>Ejercicios cargados</span>
                <strong>{exercises.length}</strong>
                <p>Biblioteca del gimnasio</p>
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
          </>
        )}
      </section>
    </AdminLayout>
  );
} 