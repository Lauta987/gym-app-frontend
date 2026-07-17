import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "../styles/superadmin.css";

type GymPlan = "basic" | "personalized" | "premium";

interface Gym {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  email?: string;
  phone?: string;
  address?: string;
  plan: GymPlan;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GymResponse {
  message: string;
  gym: Gym;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

function generateSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPlanLabel(plan: GymPlan) {
  const labels: Record<GymPlan, string> = {
    basic: "Plan Básico",
    personalized: "Plan Personalizado",
    premium: "Plan Premium",
  };

  return labels[plan];
}

export default function SuperAdminEditGym() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#ff4b25");
  const [secondaryColor, setSecondaryColor] = useState("#111111");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [plan, setPlan] = useState<GymPlan>("basic");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadGym = async () => {
    if (!id) {
      setError("No se encontró el gimnasio solicitado.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get<GymResponse>(`/gyms/${id}`);
      const gym = response.data.gym;

      setName(gym.name);
      setSlug(gym.slug);
      setLogoUrl(gym.logoUrl || "");
      setPrimaryColor(gym.primaryColor || "#ff4b25");
      setSecondaryColor(gym.secondaryColor || "#111111");
      setEmail(gym.email || "");
      setPhone(gym.phone || "");
      setAddress(gym.address || "");
      setPlan(gym.plan);
      setActive(gym.active);
    } catch (error) {
      const apiError = error as ApiError;

      setError(
        apiError.response?.data?.message ||
          "No se pudo cargar el gimnasio."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGym();
  }, [id]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!id) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.put(`/gyms/${id}`, {
        name,
        slug,
        logoUrl,
        primaryColor,
        secondaryColor,
        email,
        phone,
        address,
        plan,
        active,
      });

      navigate(`/superadmin/gyms/${id}`, {
        replace: true,
      });
    } catch (error) {
      const apiError = error as ApiError;

      setError(
        apiError.response?.data?.message ||
          "No se pudo actualizar el gimnasio."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="sa-console">
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
            <p>Cargando gimnasio...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="sa-console sa-create-console">
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
          <span>Cliente existente</span>

          <h2>Editar gimnasio</h2>

          <p>
            Modificá los datos generales, el plan y la identidad visual del
            cliente.
          </p>

          <div>
            <article>
              <strong>1</strong>
              <span>Datos generales</span>
            </article>

            <article>
              <strong>2</strong>
              <span>Identidad visual</span>
            </article>

            <article>
              <strong>3</strong>
              <span>Estado y plan</span>
            </article>
          </div>
        </div>

        <button
          type="button"
          className="sa-logout"
          onClick={() => navigate(`/superadmin/gyms/${id}`)}
        >
          ← Volver al detalle
        </button>
      </aside>

      <section className="sa-main">
        <header className="sa-topbar">
          <div className="sa-breadcrumb">
            <span>GymStart</span>
            <b>/</b>
            <strong>Gimnasios</strong>
            <b>/</b>
            <strong>{name || "Editar"}</strong>
          </div>

          <button
            type="button"
            className="sa-secondary-button"
            onClick={() => navigate(`/superadmin/gyms/${id}`)}
          >
            Cancelar
          </button>
        </header>

        <section className="sa-create-header">
          <div>
            <span className="sa-eyebrow">Configuración del cliente</span>

            <h2>
              Editar <em>gimnasio</em>
            </h2>

            <p>
              Actualizá los datos y la identidad visual de la cuenta.
            </p>
          </div>

          <div className="sa-create-preview">
            <div
              style={{
                background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={`Logo de ${name}`} />
              ) : (
                <span>{name.charAt(0).toUpperCase() || "G"}</span>
              )}
            </div>

            <article>
              <strong>{name || "Nombre del gimnasio"}</strong>
              <span>{slug || "slug-del-gimnasio"}</span>
              <p>{getPlanLabel(plan)}</p>
            </article>
          </div>
        </section>

        <form className="sa-create-form" onSubmit={handleSubmit}>
          {error && <p className="sa-error sa-create-error">{error}</p>}

          <section className="sa-form-section">
            <div className="sa-form-section-title">
              <span>01</span>

              <div>
                <h3>Información general</h3>
                <p>Datos de contacto e identificación.</p>
              </div>
            </div>

            <div className="sa-form-grid">
              <label>
                Nombre del gimnasio
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={100}
                />
              </label>

              <label>
                Slug
                <input
                  type="text"
                  value={slug}
                  onChange={(event) =>
                    setSlug(generateSlug(event.target.value))
                  }
                  required
                  maxLength={60}
                />
                <small>
                  Identificador único dentro de GymStart.
                </small>
              </label>

              <label>
                Email de contacto
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label>
                Teléfono
                <input
                  type="text"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={30}
                />
              </label>

              <label className="full">
                Dirección
                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  maxLength={160}
                />
              </label>
            </div>
          </section>

          <section className="sa-form-section">
            <div className="sa-form-section-title">
              <span>02</span>

              <div>
                <h3>Identidad visual</h3>
                <p>Logo y colores del gimnasio.</p>
              </div>
            </div>

            <div className="sa-form-grid">
              <label className="full">
                URL del logo
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label>
                Color principal
                <div className="sa-color-field">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(event) =>
                      setPrimaryColor(event.target.value)
                    }
                  />

                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(event) =>
                      setPrimaryColor(event.target.value)
                    }
                    maxLength={7}
                  />
                </div>
              </label>

              <label>
                Color secundario
                <div className="sa-color-field">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(event) =>
                      setSecondaryColor(event.target.value)
                    }
                  />

                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(event) =>
                      setSecondaryColor(event.target.value)
                    }
                    maxLength={7}
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="sa-form-section">
            <div className="sa-form-section-title">
              <span>03</span>

              <div>
                <h3>Plan y estado</h3>
                <p>Configuración comercial del cliente.</p>
              </div>
            </div>

            <div className="sa-form-grid">
              <label>
                Plan contratado
                <select
                  value={plan}
                  onChange={(event) =>
                    setPlan(event.target.value as GymPlan)
                  }
                >
                  <option value="basic">Básico</option>
                  <option value="personalized">Personalizado</option>
                  <option value="premium">Premium</option>
                </select>
              </label>

              <label>
                Estado de la cuenta
                <select
                  value={active ? "active" : "inactive"}
                  onChange={(event) =>
                    setActive(event.target.value === "active")
                  }
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Suspendido</option>
                </select>

                <small>
                  Al suspenderlo, sus usuarios quedarán desactivados.
                </small>
              </label>
            </div>
          </section>

          <footer className="sa-create-footer">
            <div>
              <strong>Guardar cambios</strong>
              <p>
                La información del gimnasio se actualizará inmediatamente.
              </p>
            </div>

            <div>
              <button
                type="button"
                className="sa-secondary-button"
                onClick={() => navigate(`/superadmin/gyms/${id}`)}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="sa-primary-button"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </main>
  );
} 