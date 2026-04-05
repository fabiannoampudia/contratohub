import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "ContratoHub",
  description: "Sistema de Gestão de Contratos e Fornecedores",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}