import { useEffect, useState } from "react";
import type { FormEvent } from "react"; 
import api from "../api/api";
import AdminLayout from "../components/AdminLayout";
import type { Student } from "../types";

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStudents = async () => {
    try {
      setLoading(true);

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

  const handleCreateStudent = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.post("/students", {
        name,
        lastName,
        email,
        password,
      });

      setMessage("Alumno creado correctamente.");
      setName("");
      setLastName("");
      setEmail("");
      setPassword("123456");

      await loadStudents();
    } catch {
      setError("No se pudo crear el alumno. Revisá los datos ingresados.");
    } finally {
      setSaving(false);
    }
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
            <h2>Registrar alumno</h2>

            <form onSubmit={handleCreateStudent} className="student-form">
              <label>
                Nombre
                <input
                  type="text"
                  placeholder="Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label>
                Apellido
                <input
                  type="text"
                  placeholder="Morales"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  placeholder="alex@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label>
                Contraseña inicial
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}

              <button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Crear alumno"}
              </button>
            </form>
          </article>

          <article className="table-card">
            <div className="panel-header">
              <h2>Listado de alumnos</h2>
              <button onClick={loadStudents}>Actualizar</button>
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
                      <th>Rol</th>
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
                        <td>{student.role}</td>
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