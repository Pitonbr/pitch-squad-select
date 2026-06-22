// Centraliza todos os links e dados que aparecem em múltiplas páginas.
// Trocar os links placeholder pelos reais antes do lançamento.

export const APP = {
  name: "Soccer Squad",
  tagline: "O clube digital do futebol amador",
  domain: "soccersquad.com.br",
  email: "contato@soccersquad.com.br",
  whatsapp: "5511999999999", // TODO: trocar pelo número real
  ios: "https://apps.apple.com/br/app/soccer-squad/id0000000000", // TODO
  android: "https://play.google.com/store/apps/details?id=com.soccersquad.app", // TODO
  instagram: "https://instagram.com/soccersquadbr",
  tiktok: "https://tiktok.com/@soccersquadbr",
  youtube: "https://youtube.com/@soccersquadbr",
} as const;

export const PRICING = {
  monthly: "59,90",
  annual: "646,92",
  annualPerMonth: "53,91",
  annualSavings: "71,88",
  challengeFee: "10",
} as const;

// Link inteligente: detecta plataforma e redireciona para a loja certa.
// Em produção, substituir por um serviço de smart link (Branch, OneLink, etc).
export function getStoreLink(): string {
  if (typeof navigator === "undefined") return APP.android;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return APP.ios;
  return APP.android;
}
