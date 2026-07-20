import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/api";
import type { LoginResponse } from "../types";

import {
  clearGymTheme,
  saveAndApplyGymTheme,
  type GymTheme,
} from "../utils/theme";

import {
  configureGymPwa,
  type PublicGym,
} from "../utils/gymPwa";

interface ThemedLoginResponse
  extends LoginResponse {
  gym?: GymTheme | null;
}

export default function Login() {
  const navigate = useNavigate();

  const { slug } =
    useParams<{ slug?: string }>();

  const [gymBrand, setGymBrand] =
    useState<PublicGym | null>(null);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!slug) {
      return;
    }

    let active = true;

    configureGymPwa(slug)
      .then((gym) => {
        if (active) {
          setGymBrand(gym);
        }
      })
      .catch((error) => {
        console.error(
          "Error al cargar el gimnasio:",
          error
        );

        if (active) {
          setError(
            "No se pudo cargar la información del gimnasio."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response =
        await api.post<ThemedLoginResponse>(
          "/auth/login",
          {
            email:
              email.trim().toLowerCase(),
            password,
          }
        );

      const {
        token,
        user,
        gym,
      } = response.data;

      /*
       * Impide iniciar sesión desde el enlace
       * correspondiente a otro gimnasio.
       */
      if (
        slug &&
        user.role !== "superadmin" &&
        (
          !gym?.slug ||
          gym.slug.toLowerCase() !==
            slug.toLowerCase()
        )
      ) {
        setError(
          "Esta cuenta pertenece a otro gimnasio."
        );

        return;
      }

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      if (user.role === "superadmin") {
        localStorage.removeItem("gymSlug");
        clearGymTheme();

        navigate("/superadmin");
        return;
      }

      if (gym) {
        saveAndApplyGymTheme(gym);

        if (gym.slug) {
          localStorage.setItem(
            "gymSlug",
            gym.slug
          );

          /*
           * Actualiza manifest, favicon y nombre,
           * incluso si el login fue realizado desde "/".
           */
          try {
            await configureGymPwa(
              gym.slug
            );
          } catch (error) {
            console.error(
              "No se pudo actualizar la PWA:",
              error
            );
          }
        }
      } else {
        clearGymTheme();
      }

      if (user.role === "student") {
        const gymQuery = gym?.slug
          ? `?gym=${encodeURIComponent(
              gym.slug
            )}`
          : "";

        navigate(
          `/my-routine${gymQuery}`
        );

        return;
      }

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Error al iniciar sesión:",
        error
      );

      setError(
        "Email o contraseña incorrectos."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forma-login-page">
      <section className="forma-login-shell">
        <div className="forma-login-top">
          <div className="forma-login-brand">
            <div className="forma-login-logo">
              {gymBrand?.logoUrl ? (
                <img
                  src={gymBrand.logoUrl}
                  alt={`Logo de ${gymBrand.name}`}
                />
              ) : (
                "G"
              )}
            </div>

            <div>
              {gymBrand ? (
                <h1>{gymBrand.name}</h1>
              ) : (
                <h1>
                  Gym<span>Start.</span>
                </h1>
              )}

              <p>
                Entrená, registrá y medí tu evolución
              </p>
            </div>
          </div>

          <div className="forma-login-badge">
            App de entrenamiento
          </div>
        </div>

        <section className="forma-login-hero">
          <span>Bienvenido</span>

          <h2>
            Tu progreso
            <br />
            empieza hoy
          </h2>

          <p>
            Ingresá con tu cuenta para ver tu
            rutina, registrar tus ejercicios y
            seguir tu evolución.
          </p>
        </section>

        <form
          onSubmit={handleLogin}
          className="forma-login-form"
        >
          <label>
            Email

            <input
              type="email"
              placeholder="tuemail@gymstart.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </label>

          <label>
            Contraseña

            <input
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="forma-login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Ingresando..."
              : "Ingresar"}
          </button>
        </form>

        <div className="forma-login-footer">
          <span>
            {gymBrand?.name || "GymStart"}
          </span>

          <p>
            Rutinas, progreso y seguimiento
            para alumnos.
          </p>
        </div>
      </section>
    </main>
  );
} 