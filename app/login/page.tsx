"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-mail ou senha incorretos");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f8f9fb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>
        <div style={{
          background: "#fff", borderRadius: 16, overflow: "hidden",
          border: "1px solid #e0e2e7", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #2d2b55 100%)",
            padding: "32px 32px 28px", textAlign: "center", color: "#fff",
          }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.3px" }}>
              ContratoHub
            </h1>
            <p style={{ fontSize: "13px", opacity: 0.7, margin: 0 }}>
              Sistema de Gestão de Contratos e Fornecedores
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: "28px 32px 32px" }}>
            <p style={{ fontSize: "15px", fontWeight: 500, color: "#1a1a2e", margin: "0 0 20px" }}>
              Entrar na sua conta
            </p>

            {error && (
              <div style={{
                background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px",
                borderRadius: 8, fontSize: "13px", marginBottom: 16,
                border: "1px solid #F09595",
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: "block", fontSize: "12px", fontWeight: 500,
                  color: "#374151", marginBottom: 5,
                }}>
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid #e0e2e7",
                    borderRadius: 8, fontSize: "14px", boxSizing: "border-box",
                    background: "#fff", color: "#1a1a2e",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: "block", fontSize: "12px", fontWeight: 500,
                  color: "#374151", marginBottom: 5,
                }}>
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid #e0e2e7",
                    borderRadius: 8, fontSize: "14px", boxSizing: "border-box",
                    background: "#fff", color: "#1a1a2e",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "11px", background: loading ? "#9ca3af" : "#1a1a2e",
                  color: "#fff", border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px", fontWeight: 500, transition: "background 0.2s",
                }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>

        <p style={{
          textAlign: "center", fontSize: "11px", color: "#9ca3af",
          marginTop: 20,
        }}>
          TF Co · TFC · TFSports
        </p>
      </div>
    </div>
  );
}