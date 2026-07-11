import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Student } from "../types";

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<{ students: Student[] }>("/students");

      setStudents(response.data.students);
    } catch (error) {
      console.error("Error al cargar alumnos", error);
      setError("No se pudieron cargar los alumnos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const resetForm = () => {
    setEditingStudentId(null);
    setName("");
    setLastName("");
    setEmail("");
    setPassword("123456");
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudentId(student._id);
    setName(student.name);
    setLastName(student.lastName);
    setEmail(student.email);
    setPassword("");
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

  const handleSubmitStudent = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editingStudentId) {
        const payload: {
          name: string;
          lastName: string;
          email: string;
          password?: string;
        } = {
          name,
          lastName,
          email,
        };

        if (password.trim().length > 0) {
          payload.password = password;
        }

        await api.put(`/students/${editingStudentId}`, payload);

        setMessage("Alumno actualizado correctamente.");
      } else {
        await api.post("/students", {
          name,
          lastName,
          email,
          password,
        });

        setMessage("Alumno creado correctamente.");
      }

      resetForm();
      await loadStudents();
    } catch (error) {
      console.error("Error al guardar alumno", error);

      setError(
        editingStudentId
          ? "No se pudo actualizar el alumno. Revisá los datos ingresados."
          : "No se pudo crear el alumno. Revisá los datos ingresados."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStudentStatus = async (student: Student) => {
    const nextStatus = !student.active;

    const confirmAction = window.confirm(
      nextStatus
        ? `¿Querés activar a ${student.name} ${student.lastName}?`
        : `¿Querés desactivar a ${student.name} ${student.lastName}?`
    );

    if (!confirmAction) return;

    try {
      setUpdatingStatusId(student._id);
      setError("");
      setMessage("");

      await api.put(`/students/${student._id}`, {
        name: student.name,
        lastName: student.lastName,
        email: student.email,
        active: nextStatus,
      });

      setMessage(
        nextStatus
          ? "Alumno activado correctamente."
          : "Alumno desactivado correctamente."
      );

      await loadStudents();
    } catch (error) {
      console.error("Error al cambiar estado del alumno", error);
      setError("No se pudo cambiar el estado del alumno.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getRoutineText = (student: Student) => {
    if (!student.assignedRoutine) return "Sin rutina";

    if (typeof student.assignedRoutine === "string") {
      return "Rutina asignada";
    }

    return "Rutina asignada";
  };

  return (
    <AdminLayout>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Alumnos</h1>
            <p>Gestioná los alumnos registrados en el gimnasio.</p>
          </div>

          <div className="date-pill">{students.length} alumnos</div>
        </header>

        <section className="page-grid">
          <article className="form-card">
            <div className="form-card-header">
              <h2>{editingStudentId ? "Editar alumno" : "Registrar alumno"}</h2>

              {editingStudentId && (
                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitStudent} className="student-form">
              <label>
                Nombre
                <input
                  type="text"
                  placeholder="Alex"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>

              <label>
                Apellido
                <input
                  type="text"
                  placeholder="Morales"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  placeholder="alex@gmail.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label>
                {editingStudentId
                  ? "Nueva contraseña opcional"
                  : "Contraseña inicial"}

                <input
                  type="text"
                  placeholder={
                    editingStudentId
                      ? "Dejar vacío para no cambiarla"
                      : "123456"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required={!editingStudentId}
                />
              </label>

              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}

              <button type="submit" disabled={saving}>
                {saving
                  ? "Guardando..."
                  : editingStudentId
                    ? "Guardar cambios"
                    : "Crear alumno"}
              </button>
            </form>
          </article>

          <article className="table-card">
            <div className="panel-header">
              <h2>Listado de alumnos</h2>
              <button type="button" onClick={loadStudents}>
                Actualizar
              </button>
            </div>

            {loading ? (
              <p className="loading-text">Cargando alumnos...</p>
            ) : students.length === 0 ? (
              <div className="empty-state">
                <h3>No hay alumnos registrados</h3>
                <p>Cuando crees alumnos, van a aparecer en esta sección.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Email</th>
                      <th>Estado</th>
                      <th>Rutina</th>
                      <th>Rol</th>
                      <th>Acciones</th>
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

                        <td>{getRoutineText(student)}</td>

                        <td>{student.role}</td>

                        <td>
                          <div className="student-admin-actions">
                            <button
                              type="button"
                              className="edit-student-button"
                              onClick={() => handleEditStudent(student)}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className={
                                student.active
                                  ? "disable-student-button"
                                  : "enable-student-button"
                              }
                              onClick={() => handleToggleStudentStatus(student)}
                              disabled={updatingStatusId === student._id}
                            >
                              {updatingStatusId === student._id
                                ? "Actualizando..."
                                : student.active
                                  ? "Desactivar"
                                  : "Activar"}
                            </button>
                          </div>
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