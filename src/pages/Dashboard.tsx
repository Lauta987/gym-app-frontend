import { useEffect, useState } from "react";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Exercise, Routine, Student, User } from "../types";

export default function Dashboard() {
  const userStorage = localStorage.getItem("user");
  const user: User | null = userStorage ? JSON.parse(userStorage) : null;

  const [studentsCount, setStudentsCount] = useState(0);
  const [exercisesCount, setExercisesCount] = useState(0);
  const [routinesCount, setRoutinesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [studentsResponse, exercisesResponse, routinesResponse] =
          await Promise.all([
            api.get<{ students: Student[] }>("/students"),
            api.get<{ exercises: Exercise[] }>("/exercises"),
            api.get<{ routines: Routine[] }>("/routines"),
          ]);

        setStudentsCount(studentsResponse.data.students.length);
        setExercisesCount(exercisesResponse.data.exercises.length);
        setRoutinesCount(routinesResponse.data.routines.length);
      } catch (error) {
        console.error("Error al cargar datos del dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <AdminLayout>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Resumen general</h1>
            <p>
              Bienvenido, {user?.name} {user?.lastName}
            </p>
          </div>

          <div className="date-pill">Panel web</div>
        </header>

        {loading ? (
          <p className="loading-text">Cargando información...</p>
        ) : (
          <>
            <div className="stats-grid">
              <article className="stat-card">
                <span>Alumnos activos</span>
                <strong>{studentsCount}</strong>
                <p>Registrados en el sistema</p>
              </article>

              <article className="stat-card">
                <span>Rutinas creadas</span>
                <strong>{routinesCount}</strong>
                <p>Disponibles para asignar</p>
              </article>

              <article className="stat-card">
                <span>Ejercicios cargados</span>
                <strong>{exercisesCount}</strong>
                <p>Biblioteca de ejercicios</p>
              </article>
            </div>

            <section className="dashboard-grid">
              <article className="panel-card">
                <div className="panel-header">
                  <h2>Actividad reciente</h2>
                  <button>Ver todo</button>
                </div>

                <div className="empty-state">
                  <h3>Panel conectado</h3>
                  <p>
                    Ya estamos trayendo datos reales desde el backend. Ahora
                    seguimos con las pantallas de gestión.
                  </p>
                </div>
              </article>

              <article className="panel-card">
                <div className="panel-header">
                  <h2>Progreso general</h2>
                  <button>Ver reporte</button>
                </div>

                <div className="fake-chart">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </article>
            </section>
          </>
        )}
      </section>
    </AdminLayout>
  );
} 