"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Sidebar from "@/app/lib/Sidebar";

type Company = { id: string; name: string };
type Supplier = { id: string; legalName: string; tradeName: string | null; responsible: string | null; area: string | null; _count?: { contracts: number } };
type Contract = {
  id: string; contractNumber: string; description: string; status: string;
  startDate: string; endDate: string | null; unitValue: number | null;
  totalValue: number | null; responsible: string | null; area: string | null;
  billingType: string | null; paymentFrequency: string | null;
  supplier: Supplier; company: Company;
};

const AREA_COLORS = ["#534AB7", "#1D9E75", "#D85A30", "#378ADD", "#BA7517", "#D4537E", "#888780"];
const COMPANY_COLORS = ["#534AB7", "#1D9E75", "#D85A30", "#378ADD", "#D4537E"];
const URGENT_COLORS = ["#E24B4A", "#BA7517", "#D85A30", "#378ADD", "#534AB7", "#D4537E"];

function fmtCur(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function calcDaysLeft(e: string | null) { if (!e) return null; return Math.ceil((new Date(e).getTime() - Date.now()) / 864e5); }
function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("pt-BR"); }

export default function DashboardPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/contracts?page=1&perPage=10000").then(r => r.json()).then(d => d.contracts || d),
      fetch("/api/suppliers").then(r => r.json()),
    ]).then(([c, s]) => { setContracts(c); setSuppliers(s); setLoading(false); });
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

  // Linha 1 - Pizza: Contratos por área responsável
  const byArea = Object.entries(
    contracts.reduce((acc, c) => {
      const n = c.area || "Não informada";
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Linha 1 - Pizza: A vencer por área responsável (90 dias)
  const urgentByArea = Object.entries(
    contracts.filter(c => {
      if (!c.endDate || c.status !== "Ativo") return false;
      const d = calcDaysLeft(c.endDate);
      return d !== null && d >= 0 && d <= 90;
    }).reduce((acc, c) => {
      const n = c.area || "Não informada";
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Linha 1 - Pizza: Contratos por empresa
  const byCompany = Object.entries(
    contracts.reduce((acc, c) => { const n = c.company.name; acc[n] = (acc[n] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Linha 2 - Barras: Contratos por responsável
  const byResponsible = Object.entries(
    contracts.reduce((acc, c) => {
      const n = c.responsible || "Sem responsável";
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);

  // Linha 2 - Barras: Fornecedores por responsável T&F
  const suppliersByResponsible = Object.entries(
    suppliers.reduce((acc, s) => {
      const n = s.responsible || "Sem responsável";
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);

  // Linha 3 - Barras: Top fornecedores por valor mensal
  const bySupplierValue = Object.entries(
    contracts.reduce((acc, c) => {
      const n = c.supplier.tradeName || c.supplier.legalName;
      acc[n] = (acc[n] || 0) + (c.unitValue || 0);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);

  // Linha 3 - Fornecedores sem contratos agrupados por área
  const suppliersNoContracts = suppliers.filter(s => s._count?.contracts === 0);
  const noContractsByArea = Object.entries(
    suppliersNoContracts.reduce((acc, s) => {
      const n = s.area || "Sem área";
      if (!acc[n]) acc[n] = [];
      acc[n].push(s);
      return acc;
    }, {} as Record<string, Supplier[]>)
  ).sort((a, b) => b[1].length - a[1].length);

  // Tabela urgentes
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

        {/* Linha 1: Pizzas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Card title="Contratos por área responsável">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byArea} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 11 }}>
                  {byArea.map((_, i) => <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="A vencer por área (próx. 90 dias)">
            {urgentByArea.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "13px", padding: "60px 0", textAlign: "center" }}>Nenhum contrato vencendo</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={urgentByArea} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 11 }}>
                    {urgentByArea.map((_, i) => <Cell key={i} fill={URGENT_COLORS[i % URGENT_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
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
        </div>

        {/* Linha 2: Barras */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
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
          <Card title="Fornecedores por responsável T&F">
            {suppliersByResponsible.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "13px", padding: "60px 0", textAlign: "center" }}>Nenhum responsável atribuído</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={suppliersByResponsible} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} style={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={120} style={{ fontSize: 11 }} />
                  <Tooltip labelStyle={{ fontWeight: 600 }} />
                  <Bar dataKey="value" fill="#D85A30" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Linha 3: Valor + Sem contratos por área */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Card title="Top fornecedores por valor mensal">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bySupplierValue} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tickFormatter={v => fmtCur(v)} style={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={120} style={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmtCur(Number(v ?? 0))} labelStyle={{ fontWeight: 600 }} />
                <Bar dataKey="value" fill="#534AB7" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title={`Fornecedores sem contratos (${suppliersNoContracts.length})`}>
            {suppliersNoContracts.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "13px", padding: "40px 0", textAlign: "center" }}>
                Todos os fornecedores possuem contratos vinculados
              </p>
            ) : (
              <div style={{ maxHeight: 220, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e0e2e7", position: "sticky", top: 0, background: "#fff" }}>
                      <th style={{ padding: "6px 10px", fontSize: "11px", color: "#6b7280", fontWeight: 500, textAlign: "left" }}>Fornecedor</th>
                      <th style={{ padding: "6px 10px", fontSize: "11px", color: "#6b7280", fontWeight: 500, textAlign: "left" }}>Área responsável</th>
                      <th style={{ padding: "6px 10px", fontSize: "11px", color: "#6b7280", fontWeight: 500, textAlign: "left" }}>Responsável T&F</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliersNoContracts.map(s => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td style={{ padding: "7px 10px", fontWeight: 500, color: "#1a1a2e" }}>{s.tradeName || s.legalName}</td>
                        <td style={{ padding: "7px 10px" }}>{s.area ? <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: "11px", fontWeight: 500, background: "#EEEDFE", color: "#534AB7" }}>{s.area}</span> : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                        <td style={{ padding: "7px 10px", color: "#374151" }}>{s.responsible || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {suppliersNoContracts.length > 0 && (
              <a href="/suppliers" style={{ display: "inline-block", marginTop: 8, fontSize: "12px", color: "#534AB7", textDecoration: "none", fontWeight: 500 }}>
                Ver todos os fornecedores →
              </a>
            )}
          </Card>
        </div>

        {/* Linha 4: Tabela de urgentes */}
        <Card title="Contratos que requerem atenção">
          {urgentes.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>
              Nenhum contrato ativo vencendo nos próximos 90 dias
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e0e2e7" }}>
                  {["Nº Contrato", "Objeto", "Fornecedor", "Empresa", "Término", "Dias restantes", "Área", "Responsável"].map(h => (
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
                    <td style={tdc}>{c.area ? <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: "11px", fontWeight: 500, background: "#EEEDFE", color: "#534AB7" }}>{c.area}</span> : "—"}</td>
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