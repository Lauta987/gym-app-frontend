import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import type { LoginResponse } from "../types";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "student") {
        navigate("/my-routine");
        return;
      }

      navigate("/dashboard");
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forma-login-page">
      <section className="forma-login-shell">
        <div className="forma-login-top">
          <div className="forma-login-brand">
            <div className="forma-login-logo">G</div>

            <div>
              <h1>
                Gym<span>Start.</span>
              </h1>
              <p>Entrená, registrá y medí tu evolución</p>
            </div>
          </div>

          <div className="forma-login-badge">App de entrenamiento</div>
        </div>

        <section className="forma-login-hero">
          <span>Bienvenido</span>

          <h2>
            Tu progreso
            <br />
            empieza hoy
          </h2>

          <p>
            Ingresá con tu cuenta para ver tu rutina, registrar tus ejercicios y
            seguir tu evolución.
          </p>
        </section>

        <form onSubmit={handleLogin} className="forma-login-form">
          <label>
            Email
            <input
              type="email"
              placeholder="tuemail@gymstart.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <p className="forma-login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="forma-login-footer">
          <span>GymStart</span>
          <p>Rutinas, progreso y seguimiento para alumnos.</p>
        </div>
      </section>
    </main>
  );
} 