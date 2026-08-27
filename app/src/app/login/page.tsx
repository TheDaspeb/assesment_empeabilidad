"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Language = "es" | "en";

const loginTranslations = {
  es: {
    subtitle: "Comunicación interna segura",
    email: "Correo",
    password: "Contraseña",
    login: "Iniciar sesión",
    loggingIn: "Ingresando...",
    demoUser: "Usuario demo:",
    invalidCredentials: "Credenciales incorrectas",
    loginError: "No fue posible iniciar sesión",
  },
  en: {
    subtitle: "Secure internal communication",
    email: "Email",
    password: "Password",
    login: "Log in",
    loggingIn: "Logging in...",
    demoUser: "Demo user:",
    invalidCredentials: "Invalid credentials",
    loginError: "Unable to log in",
  },
};

export default function LoginPage() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("es");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const t = loginTranslations[language];

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message === "Invalid credentials"
            ? t.invalidCredentials
            : data.message ?? t.invalidCredentials,
        );

        return;
      }

      localStorage.setItem(
        "access_token",
        data.accessToken,
      );

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(
        "Login frontend error:",
        error,
      );

      setError(t.loginError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage("es")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                language === "es"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              ES
            </button>

            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                language === "en"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              EN
            </button>
          </div>

          <h1 className="text-4xl font-bold text-white">
            Riwi Chat
          </h1>

          <p className="mt-2 text-slate-400">
            {t.subtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8"
        >
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              {t.email}
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="daniel@riwi.local"
              autoComplete="username"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              {t.password}
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading || !email || !password
            }
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? t.loggingIn
              : t.login}
          </button>

          <div className="mt-6 rounded-xl bg-slate-950 p-4 text-sm text-slate-400">
            <p>{t.demoUser}</p>

            <p className="mt-1 text-slate-200">
              daniel@riwi.local
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
