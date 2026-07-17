import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "../styles/superadmin.css";

interface GymSummary {
  _id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface GymAdmin {
  _id?: string;
  id?: string;
  gymId: string;
  name: string;
  lastName: string;
  email: string;
  role: "admin";
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface AdminsResponse {
  message: string;
  gym: GymSummary;
  admins: GymAdmin[];
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface CreateAdminForm {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getAdminId(admin: GymAdmin) {
  return admin._id || admin.id || "";
}

function getInitials(name: string, lastName: string) {
  return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const initialForm: CreateAdminForm = {
  name: "",
  lastName: "",
  email: "",
  password: "",
};

export default function SuperAdminGymAdmins() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [gym, setGym] = useState<GymSummary | null>(null);
  const [admins, setAdmins] = useState<GymAdmin[]>([]);
  const [form, setForm] = useState<CreateAdminForm>(initialForm);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingAdminId, setUpdatingAdminId] = useState("");
  const [passwordAdmin, setPasswordAdmin] =
    useState<GymAdmin | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAdmins = async () => {
    if (!id) {
      setError("No se encontró el gimnasio solicitado.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get<AdminsResponse>(
        `/gyms/${id}/admins`
      );

      setGym(response.data.gym);
      setAdmins(response.data.admins);
    } catch (error) {
      const apiError = error as ApiError;

      setError(
        apiError.response?.data?.message ||
          "No se pudieron cargar los administradores."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [id]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateAdmin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!id) {
      return;
    }

    if (
      !form.name.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError("Completá todos los datos del administrador.");
      return;
    }

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      await api.post(`/gyms/${id}/admins`, {
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setForm(initialForm);
      setSuccess("Administrador creado correctamente.");

      await loadAdmins();
    } catch (error) {
      const apiError = error as ApiError;

      setError(
        apiError.response?.data?.message ||
          "No se pudo crear el administrador."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleChangeStatus = async (admin: GymAdmin) => {
    if (!id) {
      return;
    }

    const adminId = getAdminId(admin);

    if (!adminId) {
      setError("No se encontró el ID del administrador.");
      return;
    }

    try {
      setUpdatingAdminId(adminId);
      setError("");
      setSuccess("");

      await api.patch(
        `/gyms/${id}/admins/${adminId}/status`,
        {
          active: !admin.active,
        }
      );

      setSuccess(
        admin.active
          ? "Administrador desactivado correctamente."
          : "Administrador activado correctamente."
      );

      await loadAdmins();
    } catch (error) {
      const apiError = error as ApiError;

      setError(
        apiError.response?.data?.message ||
          "No se pudo actualizar el administrador."
      );
    } finally {
      setUpdatingAdminId("");
    }
  };

  const openPasswordModal = (admin: GymAdmin) => {
    setPasswordAdmin(admin);
    setNewPassword("");
    setError("");
    setSuccess("");
  };

  const closePasswordModal = () => {
    if (changingPassword) {
      return;
    }

    setPasswordAdmin(null);
    setNewPassword("");
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!id || !passwordAdmin) {
      return;
    }

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const adminId = getAdminId(passwordAdmin);

    if (!adminId) {
      setError("No se encontró el ID del administrador.");
      return;
    }

    try {
      setChangingPassword(true);
      setError("");
      setSuccess("");

      await api.patch(
        `/gyms/${id}/admins/${adminId}/password`,
        {
          password: newPassword,
        }
      );

      setPasswordAdmin(null);
      setNewPassword("");
      setSuccess("Contraseña actualizada correctamente.");
    } catch (error) {
      const apiError = error as ApiError;

      setError(
        apiError.response?.data?.message ||
          "No se pudo actualizar la contraseña."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="sa-console sa-admins-console">
        <aside className="sa-sidebar">
          <div className="sa-sidebar-brand">
            <div>
              <h1>
                Gym<span>Start.</span>
              </h1>
              <p>Control central</p>
            </div>

            <span className="sa-admin-tag">Admin</span>
          </div>
        </aside>

        <section className="sa-main">
          <div className="sa-detail-loading">
            <span className="sa-loading-circle" />
            <p>Cargando administradores...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!gym) {
    return (
      <main className="sa-console sa-admins-console">
        <aside className="sa-sidebar">
          <div className="sa-sidebar-brand">
            <div>
              <h1>
                Gym<span>Start.</span>
              </h1>
              <p>Control central</p>
            </div>
          </div>
        </aside>

        <section className="sa-main">
          <div className="sa-detail-error">
            <h2>No se pudieron cargar los administradores</h2>
            <p>{error}</p>

            <button
              type="button"
              className="sa-primary-button"
              onClick={() => navigate("/superadmin")}
            >
              Volver al panel
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="sa-console sa-admins-console">
      <aside className="sa-sidebar">
        <div className="sa-sidebar-brand">
          <div>
            <h1>
              Gym<span>Start.</span>
            </h1>
            <p>Control central</p>
          </div>

          <span className="sa-admin-tag">Admin</span>
        </div>

        <div className="sa-create-sidebar-info">
          <span>Administradores</span>
          <h2>{gym.name}</h2>

          <p>
            Gestioná las cuentas que tienen acceso administrativo al
            gimnasio.
          </p>

          <div>
            <article>
              <strong>01</strong>
              <span>Crear cuentas</span>
            </article>

            <article>
              <strong>02</strong>
              <span>Controlar accesos</span>
            </article>

            <article>
              <strong>03</strong>
              <span>Cambiar contraseñas</span>
            </article>
          </div>
        </div>

        <button
          type="button"
          className="sa-logout"
          onClick={() =>
            navigate(`/superadmin/gyms/${gym._id}`)
          }
        >
          ← Volver al gimnasio
        </button>
      </aside>

      <section className="sa-main">
        <header className="sa-topbar">
          <div className="sa-breadcrumb">
            <span>GymStart</span>
            <b>/</b>
            <strong>{gym.name}</strong>
            <b>/</b>
            <strong>Administradores</strong>
          </div>

          <button
            type="button"
            className="sa-secondary-button"
            onClick={loadAdmins}
          >
            Actualizar
          </button>
        </header>

        <section className="sa-admins-header">
          <div>
            <span>ACCESOS DEL GIMNASIO</span>
            <h2>Administradores</h2>

            <p>
              Creá y controlá las cuentas encargadas de gestionar el
              gimnasio.
            </p>
          </div>

          <article>
            <span>Total de administradores</span>
            <strong>{admins.length}</strong>
          </article>
        </section>

        {error && <p className="sa-error">{error}</p>}
        {success && <p className="sa-success">{success}</p>}

        <section className="sa-admins-layout">
          <article className="sa-detail-card sa-admin-create-card">
            <div className="sa-detail-card-header">
              <div>
                <span>Nueva cuenta</span>
                <h3>Crear administrador</h3>
              </div>
            </div>

            {!gym.active && (
              <p className="sa-warning-message">
                El gimnasio está suspendido. No se pueden crear nuevos
                administradores.
              </p>
            )}

            <form
              className="sa-admin-form"
              onSubmit={handleCreateAdmin}
            >
              <div className="sa-admin-form-row">
                <label>
                  <span>Nombre</span>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Ej. Martín"
                    disabled={creating || !gym.active}
                  />
                </label>

                <label>
                  <span>Apellido</span>

                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleInputChange}
                    placeholder="Ej. López"
                    disabled={creating || !gym.active}
                  />
                </label>
              </div>

              <label>
                <span>Email</span>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="admin@gimnasio.com"
                  disabled={creating || !gym.active}
                />
              </label>

              <label>
                <span>Contraseña temporal</span>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 8 caracteres"
                  disabled={creating || !gym.active}
                />
              </label>

              <button
                type="submit"
                className="sa-primary-button sa-admin-submit"
                disabled={creating || !gym.active}
              >
                {creating
                  ? "Creando administrador..."
                  : "Crear administrador"}
              </button>
            </form>
          </article>

          <article className="sa-detail-card sa-admin-list-card">
            <div className="sa-detail-card-header">
              <div>
                <span>Cuentas registradas</span>
                <h3>Equipo administrador</h3>
              </div>
            </div>

            {admins.length === 0 ? (
              <div className="sa-admin-empty">
                <strong>No hay administradores</strong>
                <p>
                  Creá la primera cuenta administrativa para este
                  gimnasio.
                </p>
              </div>
            ) : (
              <div className="sa-admin-list">
                {admins.map((admin) => {
                  const adminId = getAdminId(admin);
                  const isUpdating =
                    updatingAdminId === adminId;

                  return (
                    <article
                      key={adminId}
                      className="sa-admin-item"
                    >
                      <div className="sa-admin-avatar">
                        {getInitials(
                          admin.name,
                          admin.lastName
                        )}
                      </div>

                      <div className="sa-admin-user-info">
                        <div>
                          <strong>
                            {admin.name} {admin.lastName}
                          </strong>

                          <span
                            className={
                              admin.active
                                ? "sa-card-status active"
                                : "sa-card-status inactive"
                            }
                          >
                            <i />
                            {admin.active
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </div>

                        <p>{admin.email}</p>

                        <small>
                          Creado el {formatDate(admin.createdAt)}
                        </small>
                      </div>

                      <div className="sa-admin-actions">
                        <button
                          type="button"
                          className="sa-secondary-button"
                          onClick={() =>
                            openPasswordModal(admin)
                          }
                        >
                          Cambiar clave
                        </button>

                        <button
                          type="button"
                          className={
                            admin.active
                              ? "sa-danger-button"
                              : "sa-reactivate-button"
                          }
                          onClick={() =>
                            handleChangeStatus(admin)
                          }
                          disabled={
                            isUpdating ||
                            (!gym.active && !admin.active)
                          }
                        >
                          {isUpdating
                            ? "Actualizando..."
                            : admin.active
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </section>

      {passwordAdmin && (
        <div
          className="sa-modal-backdrop"
          onMouseDown={closePasswordModal}
        >
          <div
            className="sa-password-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sa-password-modal-header">
              <div>
                <span>SEGURIDAD</span>
                <h3>Cambiar contraseña</h3>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword}
              >
                ×
              </button>
            </div>

            <p>
              Nueva contraseña para{" "}
              <strong>
                {passwordAdmin.name} {passwordAdmin.lastName}
              </strong>
              .
            </p>

            <form onSubmit={handleChangePassword}>
              <label>
                <span>Nueva contraseña</span>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                />
              </label>

              <div className="sa-password-modal-actions">
                <button
                  type="button"
                  className="sa-secondary-button"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="sa-primary-button"
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? "Guardando..."
                    : "Guardar contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
} 