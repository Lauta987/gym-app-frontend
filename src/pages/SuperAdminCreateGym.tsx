import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/superadmin.css";

type GymPlan = "basic" | "personalized" | "premium";

interface CreateGymResponse {
  message: string;
  gym: {
    _id: string;
    name: string;
    slug: string;
  };
  admin: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
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

export default function SuperAdminCreateGym() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#ff4b25");
  const [secondaryColor, setSecondaryColor] = useState("#111111");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [plan, setPlan] = useState<GymPlan>("basic");

  const [adminName, setAdminName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (value: string) => {
    setName(value);

    if (!slugEdited) {
      setSlug(generateSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await api.post<CreateGymResponse>("/gyms", {
        name,
        slug,
        logoUrl: logoUrl || undefined,
        primaryColor,
        secondaryColor,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        plan,
        adminName,
        adminLastName,
        adminEmail,
        adminPassword,
      });

      navigate("/superadmin", {
        replace: true,
        state: {
          successMessage: response.data.message,
        },
      });
    } catch (error) {
      const apiError = error as ApiError;

      setError(
        apiError.response?.data?.message ||
          "No se pudo crear el gimnasio. Revisá los datos ingresados."
      );
    } finally {
      setLoading(false);
    }
  };

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
          <span>Nuevo cliente</span>

          <h2>Crear gimnasio</h2>

          <p>
            Configurá la identidad del gimnasio y generá automáticamente su
            primera cuenta administradora.
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
              <span>Administrador</span>
            </article>
          </div>
        </div>

        <button
          type="button"
          className="sa-logout"
          onClick={() => navigate("/superadmin")}
        >
          ← Volver a gimnasios
        </button>
      </aside>

      <section className="sa-main">
        <header className="sa-topbar">
          <div className="sa-breadcrumb">
            <span>GymStart</span>
            <b>/</b>
            <strong>Gimnasios</strong>
            <b>/</b>
            <strong>Nuevo</strong>
          </div>

          <button
            type="button"
            className="sa-secondary-button"
            onClick={() => navigate("/superadmin")}
          >
            Cancelar
          </button>
        </header>

        <section className="sa-create-header">
          <div>
            <span className="sa-eyebrow">Alta de cliente</span>

            <h2>
              Nuevo <em>gimnasio</em>
            </h2>

            <p>
              Al confirmar se creará el gimnasio y su administrador inicial.
            </p>
          </div>

          <div className="sa-create-preview">
            <div
              style={{
                background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Vista previa del logo" />
              ) : (
                <span>{name.charAt(0).toUpperCase() || "G"}</span>
              )}
            </div>

            <article>
              <strong>{name || "Nombre del gimnasio"}</strong>
              <span>{slug || "slug-del-gimnasio"}</span>
              <p>{plan === "basic" ? "Plan Básico" : plan === "personalized" ? "Plan Personalizado" : "Plan Premium"}</p>
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
                <p>Datos principales del gimnasio.</p>
              </div>
            </div>

            <div className="sa-form-grid">
              <label>
                Nombre del gimnasio
                <input
                  type="text"
                  placeholder="Ej. Power Gym"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  required
                  maxLength={100}
                />
              </label>

              <label>
                Slug
                <input
                  type="text"
                  placeholder="power-gym"
                  value={slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  required
                  maxLength={60}
                />
                <small>Se utilizará para identificar al gimnasio.</small>
              </label>

              <label>
                Email de contacto
                <input
                  type="email"
                  placeholder="contacto@gimnasio.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label>
                Teléfono
                <input
                  type="text"
                  placeholder="3462000000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={30}
                />
              </label>

              <label className="full">
                Dirección
                <input
                  type="text"
                  placeholder="Ciudad, provincia o dirección completa"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  maxLength={160}
                />
              </label>

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
            </div>
          </section>

          <section className="sa-form-section">
            <div className="sa-form-section-title">
              <span>02</span>

              <div>
                <h3>Identidad visual</h3>
                <p>Logo y colores principales del cliente.</p>
              </div>
            </div>

            <div className="sa-form-grid">
              <label className="full">
                URL del logo
                <input
                  type="url"
                  placeholder="https://..."
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                />
              </label>

              <label>
                Color principal
                <div className="sa-color-field">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                  />

                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
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
                    onChange={(event) => setSecondaryColor(event.target.value)}
                  />

                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(event) => setSecondaryColor(event.target.value)}
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
                <h3>Administrador inicial</h3>
                <p>Cuenta que administrará el gimnasio.</p>
              </div>
            </div>

            <div className="sa-form-grid">
              <label>
                Nombre
                <input
                  type="text"
                  placeholder="Carlos"
                  value={adminName}
                  onChange={(event) => setAdminName(event.target.value)}
                  required
                  maxLength={50}
                />
              </label>

              <label>
                Apellido
                <input
                  type="text"
                  placeholder="Gómez"
                  value={adminLastName}
                  onChange={(event) => setAdminLastName(event.target.value)}
                  required
                  maxLength={50}
                />
              </label>

              <label>
                Email de acceso
                <input
                  type="email"
                  placeholder="admin@gimnasio.com"
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  required
                />
              </label>

              <label>
                Contraseña temporal
                <div className="sa-password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    required
                    minLength={8}
                    maxLength={72}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>

                <small>
                  El administrador podrá usarla para su primer ingreso.
                </small>
              </label>
            </div>
          </section>

          <footer className="sa-create-footer">
            <div>
              <strong>¿Todo listo?</strong>
              <p>
                Se crearán el gimnasio y su cuenta administradora.
              </p>
            </div>

            <div>
              <button
                type="button"
                className="sa-secondary-button"
                onClick={() => navigate("/superadmin")}
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="sa-primary-button"
                disabled={loading}
              >
                {loading ? "Creando gimnasio..." : "Crear gimnasio"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </main>
  );
}