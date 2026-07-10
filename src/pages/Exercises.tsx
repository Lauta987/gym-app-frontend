import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Exercise } from "../types";

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [muscles, setMuscles] = useState("");
  const [difficulty, setDifficulty] = useState<
    "principiante" | "intermedio" | "avanzado"
  >("principiante");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadExercises = async () => {
    try {
      setLoading(true);

      const response = await api.get<{ exercises: Exercise[] }>("/exercises");

      setExercises(response.data.exercises);
    } catch (error) {
      console.error("Error al cargar ejercicios", error);
      setError("No se pudieron cargar los ejercicios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, []);

  const handleCreateExercise = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const musclesArray = muscles
        .split(",")
        .map((muscle) => muscle.trim())
        .filter((muscle) => muscle.length > 0);

      await api.post("/exercises", {
        name,
        description,
        videoUrl,
        imageUrl,
        muscles: musclesArray,
        difficulty,
      });

      setMessage("Ejercicio creado correctamente.");
      setName("");
      setDescription("");
      setVideoUrl("");
      setImageUrl("");
      setMuscles("");
      setDifficulty("principiante");

      await loadExercises();
    } catch {
      setError("No se pudo crear el ejercicio. Revisá los datos ingresados.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Ejercicios</h1>
            <p>Gestioná la biblioteca de ejercicios del gimnasio.</p>
          </div>

          <div className="date-pill">{exercises.length} ejercicios</div>
        </header>

        <section className="page-grid">
          <article className="form-card">
            <h2>Crear ejercicio</h2>

            <form onSubmit={handleCreateExercise} className="student-form">
              <label>
                Nombre
                <input
                  type="text"
                  placeholder="Press de banca"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label>
                Descripción
                <textarea
                  placeholder="Explicación breve del ejercicio..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <label>
                Video URL
                <input
                  type="text"
                  placeholder="https://youtube.com/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </label>

              <label>
                Imagen URL
                <input
                  type="text"
                  placeholder="https://imagen.com/ejercicio.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </label>

              <label>
                Músculos trabajados
                <input
                  type="text"
                  placeholder="Pecho, Tríceps, Hombros"
                  value={muscles}
                  onChange={(e) => setMuscles(e.target.value)}
                />
              </label>

              <label>
                Dificultad
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(
                      e.target.value as
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

              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}

              <button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Crear ejercicio"}
              </button>
            </form>
          </article>

          <article className="table-card">
            <div className="panel-header">
              <h2>Biblioteca de ejercicios</h2>
              <button onClick={loadExercises}>Actualizar</button>
            </div>

            {loading ? (
              <p className="loading-text">Cargando ejercicios...</p>
            ) : exercises.length === 0 ? (
              <div className="empty-state">
                <h3>No hay ejercicios cargados</h3>
                <p>
                  Cuando crees ejercicios, van a aparecer en esta biblioteca.
                </p>
              </div>
            ) : (
              <div className="exercise-grid">
                {exercises.map((exercise) => (
                  <article key={exercise._id} className="exercise-card">
                    <div className="exercise-image">
                      {exercise.imageUrl ? (
                        <img src={exercise.imageUrl} alt={exercise.name} />
                      ) : (
                        <span>Sin imagen</span>
                      )}
                    </div>

                    <div className="exercise-info">
                      <div>
                        <h3>{exercise.name}</h3>
                        <span className="difficulty-pill">
                          {exercise.difficulty}
                        </span>
                      </div>

                      <p>{exercise.description}</p>

                      <div className="muscle-list">
                        {exercise.muscles.map((muscle) => (
                          <span key={muscle}>{muscle}</span>
                        ))}
                      </div>
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