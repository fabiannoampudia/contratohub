"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Sidebar from "@/app/lib/Sidebar";

type Company = { id: string; name: string };
type Supplier = { id: string; legalName: string; tradeName: string | null };
type Contract = {
  id: string; contractNumber: string; description: string; status: string;
  startDate: string; endDate: string | null; unitValue: number | null;
  totalValue: number | null; responsible: string | null;
  billingType: string | null; paymentFrequency: string | null;
  supplier: Supplier; company: Company;
};

const STATUS_COLORS: Record<string, string> = { Novo: "#7F77DD", Ativo: "#1D9E75", Cancelado: "#E24B4A", Bloqueado: "#BA7517" };
const COMPANY_COLORS = ["#534AB7", "#1D9E75", "#D85A30", "#378ADD", "#D4537E"];
const BILLING_COLORS = ["#534AB7", "#1D9E75", "#D85A30", "#378ADD", "#BA7517", "#D4537E", "#888780"];

function fmtCur(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function calcDaysLeft(e: string | null) { if (!e) return null; return Math.ceil((new Date(e).getTime() - Date.now()) / 864e5); }
function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("pt-BR"); }

function IconGrid() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>; }
function IconDoc() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>; }
function IconUsers() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>; }

export default function DashboardPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contracts")
      .then(r => r.json())
      .then(c => { setContracts(c); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active="dashboard" />
      <main style={{ flex: 1, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
        Carregando dashboard...
      </main>
    </div>
  );

  const total = contracts.length;
  const ativos = contracts.filter(c => c.status === "Ativo").length;
  const vencendo = contracts.filter(c => {
    if (!c.endDate || c.status !== "Ativo") return false;
    const d = calcDaysLeft(c.endDate);
    return d !== null && d >= 0 && d <= 90;
  }).length;
  const vencidos = contracts.filter(c => {
    if (!c.endDate) return false;
    const d = calcDaysLeft(c.endDate);
    return d !== null && d < 0 && c.status === "Ativo";
  }).length;
  const valorMensal = contracts.reduce((s, c) => s + (c.unitValue || 0), 0);
  const valorTotal = contracts.reduce((s, c) => s + (c.totalValue || 0), 0);

  const byStatus = Object.entries(
    contracts.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || "#888" }));

  const byCompany = Object.entries(
    contracts.reduce((acc, c) => { const n = c.company.name; acc[n] = (acc[n] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const bySupplierValue = Object.entries(
    contracts.reduce((acc, c) => {
      const n = c.supplier.tradeName || c.supplier.legalName;
      acc[n] = (acc[n] || 0) + (c.unitValue || 0);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);

  const byResponsible = Object.entries(
    contracts.reduce((acc, c) => {
      const n = c.responsible || "Sem responsável";
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);

  const byBilling = Object.entries(
    contracts.reduce((acc, c) => {
      const n = c.billingType || "Não informado";
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const urgentes = contracts
    .filter(c => {
      if (!c.endDate || c.status !== "Ativo") return false;
      const d = calcDaysLeft(c.endDate);
      return d !== null && d <= 90;
    })
    .map(c => ({ ...c, daysLeft: calcDaysLeft(c.endDate)! }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 8);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active="dashboard" />
      <main style={{ flex: 1, padding: "28px 32px", overflowX: "auto" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 24px" }}>Dashboard</h2>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 12, marginBottom: 28 }}>
          <a href="/" style={{ textDecoration: "none" }}><Kpi label="Total" value={String(total)} accent="#534AB7" /></a>
          <a href="/?status=Ativo" style={{ textDecoration: "none" }}><Kpi label="Ativos" value={String(ativos)} accent="#0F6E56" /></a>
          <a href="/?vencendo=90" style={{ textDecoration: "none" }}><Kpi label="Vencendo (90d)" value={String(vencendo)} accent="#854F0B" /></a>
          <a href="/?status=Cancelado" style={{ textDecoration: "none" }}><Kpi label="Vencidos" value={String(vencidos)} accent="#A32D2D" /></a>
          <Kpi label="Valor mensal" value={fmtCur(valorMensal)} accent="#185FA5" small />
          <Kpi label="Valor total" value={fmtCur(valorTotal)} accent="#185FA5" small />
        </div>

        {/* Gráficos linha 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Card title="Contratos por status">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 11 }}>
                  {byStatus.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Contratos por empresa">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byCompany} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 11 }}>
                  {byCompany.map((_, i) => <Cell key={i} fill={COMPANY_COLORS[i % COMPANY_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Por tipo de cobrança">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byBilling} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 11 }}>
                  {byBilling.map((_, i) => <Cell key={i} fill={BILLING_COLORS[i % BILLING_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Gráficos linha 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Card title="Top fornecedores por valor mensal">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bySupplierValue} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tickFormatter={v => fmtCur(v)} style={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={120} style={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtCur(v)} labelStyle={{ fontWeight: 600 }} />
                <Bar dataKey="value" fill="#534AB7" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Contratos por responsável">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byResponsible} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" allowDecimals={false} style={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={120} style={{ fontSize: 11 }} />
                <Tooltip labelStyle={{ fontWeight: 600 }} />
                <Bar dataKey="value" fill="#1D9E75" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tabela de urgentes */}
        <Card title="Contratos que requerem atenção">
          {urgentes.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>
              Nenhum contrato ativo vencendo nos próximos 90 dias
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e0e2e7" }}>
                  {["Nº Contrato", "Objeto", "Fornecedor", "Empresa", "Término", "Dias restantes", "Responsável"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", fontSize: "11px", color: "#6b7280", fontWeight: 500, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {urgentes.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                    <td style={{ ...tdc, fontWeight: 600 }}>{c.contractNumber}</td>
                    <td style={{ ...tdc, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description}</td>
                    <td style={tdc}>{c.supplier.tradeName || c.supplier.legalName}</td>
                    <td style={tdc}>{c.company.name}</td>
                    <td style={tdc}>{fmtDate(c.endDate)}</td>
                    <td style={tdc}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 10, fontSize: "11px", fontWeight: 500,
                        background: c.daysLeft < 0 ? "#FCEBEB" : c.daysLeft <= 30 ? "#FCEBEB" : "#FAEEDA",
                        color: c.daysLeft < 0 ? "#A32D2D" : c.daysLeft <= 30 ? "#A32D2D" : "#854F0B",
                      }}>
                        {c.daysLeft < 0 ? `Vencido há ${Math.abs(c.daysLeft)}d` : `${c.daysLeft}d`}
                      </span>
                    </td>
                    <td style={tdc}>{c.responsible || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </main>
    </div>
  );
}

function NavItem({ icon, label, href, active }: { icon: React.ReactNode; label: string; href: string; active: boolean }) {
  return (
    <a href={href} style={{ textDecoration: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: "13px", fontWeight: active ? 500 : 400, color: active ? "#1a1a2e" : "#6b7280", background: active ? "#f1f3f5" : "transparent", marginBottom: 2 }}>
        {icon}{label}
      </div>
    </a>
  );
}

function Kpi({ label, value, accent, small }: { label: string; value: string; accent: string; small?: boolean }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e2e7", borderRadius: 12, padding: "14px 16px", borderTop: `3px solid ${accent}` }}>
      <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: small ? "16px" : "22px", fontWeight: 700, margin: 0, color: "#1a1a2e" }}>{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e2e7", borderRadius: 12, padding: "18px 20px" }}>
      <p style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 14px", color: "#1a1a2e" }}>{title}</p>
      {children}
    </div>
  );
}

const tdc: React.CSSProperties = { padding: "10px 10px", color: "#374151" };