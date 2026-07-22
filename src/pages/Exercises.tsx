import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Exercise } from "../types";
import { isValidImageUrl } from "../utils/image";
import {
  createExerciseNumberImage,
  replaceWithExerciseNumberImage,
} from "../utils/exerciseImage"; 

type Difficulty = "principiante" | "intermedio" | "avanzado";
type DifficultyFilter = "all" | Difficulty;

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(
    null
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [muscles, setMuscles] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("principiante");

  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadExercises = async () => {
    try {
      setLoading(true);
      setError("");

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

  const filteredExercises = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const musclesText = exercise.muscles.join(" ");

      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${exercise.name} ${exercise.description} ${musclesText}`
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesDifficulty =
        difficultyFilter === "all" || exercise.difficulty === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [exercises, searchTerm, difficultyFilter]);

  const beginnerCount = exercises.filter(
    (exercise) => exercise.difficulty === "principiante"
  ).length;

  const intermediateCount = exercises.filter(
    (exercise) => exercise.difficulty === "intermedio"
  ).length;

  const advancedCount = exercises.filter(
    (exercise) => exercise.difficulty === "avanzado"
  ).length;

  const resetForm = () => {
    setEditingExerciseId(null);
    setName("");
    setDescription("");
    setVideoUrl("");
    setImageUrl("");
    setMuscles("");
    setDifficulty("principiante");
  };

  const buildExercisePayload = () => {
    const musclesArray = muscles
      .split(",")
      .map((muscle) => muscle.trim())
      .filter((muscle) => muscle.length > 0);

    return {
      name,
      description,
      videoUrl,
      imageUrl,
      muscles: musclesArray,
      difficulty,
    };
  };

  const handleSubmitExercise = async (event: FormEvent) => {
    event.preventDefault();

    const normalizedImageUrl = imageUrl.trim();

    if (
      normalizedImageUrl &&
      !isValidImageUrl(normalizedImageUrl)
    ) {
      setMessage("");
      setError(
        "La imagen debe tener una URL válida que comience con http:// o https://."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = buildExercisePayload();

      if (editingExerciseId) {
        await api.put(`/exercises/${editingExerciseId}`, payload);
        setMessage("Ejercicio actualizado correctamente.");
      } else {
        await api.post("/exercises", payload);
        setMessage("Ejercicio creado correctamente.");
      }

      resetForm();
      await loadExercises();
    } catch (error) {
      console.error("Error al guardar ejercicio", error);

      setError(
        editingExerciseId
          ? "No se pudo actualizar el ejercicio. Revisá los datos ingresados."
          : "No se pudo crear el ejercicio. Revisá los datos ingresados."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise._id);
    setName(exercise.name);
    setDescription(exercise.description || "");
    setVideoUrl(exercise.videoUrl || "");
    setImageUrl(exercise.imageUrl || "");
    setMuscles(exercise.muscles.join(", "));
    setDifficulty(exercise.difficulty);
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

  const handleDeleteExercise = async (exercise: Exercise) => {
    const confirmDelete = window.confirm(
      `¿Seguro que querés eliminar el ejercicio "${exercise.name}"?`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(exercise._id);
      setError("");
      setMessage("");

      await api.delete(`/exercises/${exercise._id}`);

      if (editingExerciseId === exercise._id) {
        resetForm();
      }

      setMessage("Ejercicio eliminado correctamente.");
      await loadExercises();
    } catch (error) {
      console.error("Error al eliminar ejercicio", error);
      setError(
        "No se pudo eliminar el ejercicio. Puede estar usado en alguna rutina."
      );
    } finally {
      setDeletingId(null);
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

          <div className="date-pill">
            {filteredExercises.length} de {exercises.length} ejercicios
          </div>
        </header>

        <section className="exercises-summary-grid">
          <article>
            <span>Total</span>
            <strong>{exercises.length}</strong>
            <p>ejercicios cargados</p>
          </article>

          <article>
            <span>Principiante</span>
            <strong>{beginnerCount}</strong>
            <p>nivel inicial</p>
          </article>

          <article>
            <span>Intermedio</span>
            <strong>{intermediateCount}</strong>
            <p>nivel medio</p>
          </article>

          <article>
            <span>Avanzado</span>
            <strong>{advancedCount}</strong>
            <p>nivel alto</p>
          </article>
        </section>

        <section className="page-grid">
          <article className="form-card">
            <div className="form-card-header">
              <h2>{editingExerciseId ? "Editar ejercicio" : "Crear ejercicio"}</h2>

              {editingExerciseId && (
                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitExercise} className="student-form">
              <label>
                Nombre
                <input
                  type="text"
                  placeholder="Press de banca"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>

              <label>
                Descripción
                <textarea
                  placeholder="Explicación breve del ejercicio..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                />
              </label>

              <label>
                Video URL
                <input
                  type="text"
                  placeholder="https://youtube.com/..."
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                />
              </label>

              <label>
                Imagen URL
                <input
                  type="url"
                  placeholder="https://imagen.com/ejercicio.jpg"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                />
                <small>
                  Es opcional. Si no agregás una imagen, la app mostrará una
                  imagen con el número del ejercicio.
                </small>
              </label>

              <div className="exercise-image-preview">
                <img
                  src={
                    isValidImageUrl(imageUrl.trim())
                      ? imageUrl.trim()
                      : createExerciseNumberImage(1)
                  }
                  alt={
                    isValidImageUrl(imageUrl.trim())
                      ? "Vista previa del ejercicio"
                      : "Vista previa del número del ejercicio"
                  }
                  className={
                    isValidImageUrl(imageUrl.trim())
                      ? ""
                      : "is-number-placeholder"
                  }
                  onError={(event) =>
                    replaceWithExerciseNumberImage(
                      event.currentTarget,
                      1
                    )
                  }
                />

                <div>
                  <strong>Vista previa</strong>
                  <span>
                    La imagen se recortará para ocupar todo el recuadro.
                  </span>
                </div>
              </div>

              <label>
                Músculos trabajados
                <input
                  type="text"
                  placeholder="Pecho, Tríceps, Hombros"
                  value={muscles}
                  onChange={(event) => setMuscles(event.target.value)}
                />
              </label>

              <label>
                Dificultad
                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as Difficulty)
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
                {saving
                  ? "Guardando..."
                  : editingExerciseId
                    ? "Guardar cambios"
                    : "Crear ejercicio"}
              </button>
            </form>
          </article>

          <article className="table-card">
            <div className="panel-header">
              <h2>Biblioteca de ejercicios</h2>
              <button type="button" onClick={loadExercises}>
                Actualizar
              </button>
            </div>

            <div className="exercises-toolbar">
              <label>
                Buscar ejercicio
                <input
                  type="text"
                  placeholder="Buscar por nombre, descripción o músculo..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <label>
                Dificultad
                <select
                  value={difficultyFilter}
                  onChange={(event) =>
                    setDifficultyFilter(event.target.value as DifficultyFilter)
                  }
                >
                  <option value="all">Todas</option>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </label>
            </div>

            <p className="exercises-results-text">
              Mostrando {filteredExercises.length} resultado
              {filteredExercises.length === 1 ? "" : "s"}.
            </p>

            {loading ? (
              <p className="loading-text">Cargando ejercicios...</p>
            ) : exercises.length === 0 ? (
              <div className="empty-state">
                <h3>No hay ejercicios cargados</h3>
                <p>
                  Cuando crees ejercicios, van a aparecer en esta biblioteca.
                </p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="empty-state">
                <h3>No se encontraron ejercicios</h3>
                <p>
                  Probá cambiar el texto de búsqueda o el filtro de dificultad.
                </p>
              </div>
            ) : (
              <div className="exercise-grid">
                {filteredExercises.map((exercise, index) => {
                  const fallbackNumber = index + 1;
                  const hasExerciseImage = isValidImageUrl(
                    exercise.imageUrl
                  );

                  return (
                    <article key={exercise._id} className="exercise-card">
                      <div className="exercise-image">
                        <img
                          src={
                            hasExerciseImage
                              ? exercise.imageUrl
                              : createExerciseNumberImage(
                                  fallbackNumber
                                )
                          }
                          alt={
                            hasExerciseImage
                              ? exercise.name
                              : `Ejercicio ${fallbackNumber}`
                          }
                          className={
                            hasExerciseImage
                              ? ""
                              : "is-number-placeholder"
                          }
                          onError={(event) =>
                            replaceWithExerciseNumberImage(
                              event.currentTarget,
                              fallbackNumber
                            )
                          }
                        />
                      </div>

                    <div className="exercise-info">
                      <div className="exercise-info-header">
                        <div>
                          <h3>{exercise.name}</h3>
                          <span className="difficulty-pill">
                            {exercise.difficulty}
                          </span>
                        </div>

                        <div className="exercise-admin-actions">
                          <button
                            type="button"
                            className="edit-exercise-button"
                            onClick={() => handleEditExercise(exercise)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="delete-exercise-button"
                            onClick={() => handleDeleteExercise(exercise)}
                            disabled={deletingId === exercise._id}
                          >
                            {deletingId === exercise._id
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </div>
                      </div>

                      <p>{exercise.description}</p>

                      {exercise.videoUrl && (
                        <a
                          href={exercise.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="exercise-admin-video-link"
                        >
                          Ver video
                        </a>
                      )}

                      <div className="muscle-list">
                        {exercise.muscles.map((muscle) => (
                          <span key={muscle}>{muscle}</span>
                        ))}
                      </div>
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