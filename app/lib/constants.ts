export const AREAS = [
  "Operações de TI",
  "BI e Analytics",
  "Corporativo",
  "Backoffice",
  "Digital",
  "Segurança da Informação",
];

export function maskCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return digits.slice(0, 2) + "." + digits.slice(2);
  if (digits.length <= 8) return digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5);
  if (digits.length <= 12) return digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5, 8) + "/" + digits.slice(8);
  return digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5, 8) + "/" + digits.slice(8, 12) + "-" + digits.slice(12);
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const calc = (s: string, w: number[]) => {
    const sum = s.split("").reduce((acc, d, i) => acc + parseInt(d) * w[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const d1 = calc(digits.slice(0, 12), w1);
  const d2 = calc(digits.slice(0, 13), w2);
  return parseInt(digits[12]) === d1 && parseInt(digits[13]) === d2;
}