/**
 * Configuração única da landing de recrutamento de promotor.
 *
 * Esta página NÃO é a landing de captação de aluno (aquela que o promotor
 * compartilha com ?ref=<external_id dele>). Aqui o público é quem quer ganhar
 * dinheiro indicando matrículas — o CTA inicia o funil do candidato a promotor.
 */

/* ----------------------------------------------------------------------------
 * Destino do CTA (cadastro do candidato a promotor)
 * -------------------------------------------------------------------------- */
const rawAppUrl =
  import.meta.env.PUBLIC_APP_URL ??
  (import.meta.env.DEV ? 'http://localhost:3000' : 'https://app.v7m.org');

// sem barra final: evita param colado em path duplicado e 301 no destino
export const APP_URL: string = rawAppUrl.replace(/\/+$/, '');

export const BRAND = 'Supletivo Brasil';
/** Selo do programa exibido junto ao wordmark */
export const PROGRAM = 'Promotor';

/** Texto único de CTA em toda a página (regra de copy) */
export const CTA_LABEL = 'Quero ser promotor';

/* ----------------------------------------------------------------------------
 * Vínculo com o polo (hub) via URL
 *
 * A landing lê ?hub=<polo> (nome próprio, não colide com o ?ref= que é o link
 * de trabalho do promotor já aprovado). No clique do CTA o valor é repassado ao
 * app como ?ref=<polo> — que é o parâmetro consumido por create_candidate para
 * amarrar o novo promotor ao polo certo. Sem hub → polo padrão (decidido na API).
 * `ref` na URL é aceito como alias de entrada (compatibilidade).
 * -------------------------------------------------------------------------- */
/** Parâmetro lido da URL da landing para identificar o polo */
export const HUB_PARAM = 'hub';
/** Parâmetro enviado ao app (o que create_candidate consome) */
export const APP_REF_PARAM = 'ref';

/* ----------------------------------------------------------------------------
 * Comissão — FONTE ÚNICA dos números (espelha finance/config.py).
 * Valores via .env (PUBLIC_*) para a calculadora poder ler no client.
 * -------------------------------------------------------------------------- */
const num = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Comissão direta por matrícula PAGA (R$) */
export const COMMISSION_DIRECT = num(import.meta.env.PUBLIC_COMMISSION_DIRECT, 100);
/** Bônus flat por bloco de indicações pagas na semana (R$) */
export const BONUS_FLAT = num(import.meta.env.PUBLIC_BONUS_FLAT, 500);
/** Tamanho do bloco que destrava o bônus (ex.: 5 = a cada 5 pagas) */
export const BONUS_THRESHOLD = num(import.meta.env.PUBLIC_BONUS_THRESHOLD, 5);
/**
 * Bônus repete a cada bloco?
 *  - true  → a cada 5 pagas, +R$ 500 (escada: +500, +1000, ...)
 *  - false → degrau único: paga 1x ao atingir o threshold
 * ⚠️ Conferir contra finance/config.py antes de produção (promessa de dinheiro).
 */
export const BONUS_REPEATS = (import.meta.env.PUBLIC_BONUS_REPEATS ?? 'true') !== 'false';

/** Fechamento semanal (pagamento por Pix) — espelha closing_weekday/closing_hour */
export const CLOSING_LABEL = 'toda sexta, às 18h';

/**
 * Marcas das instituições do polo (HUB_BRANDS). Vazio por decisão de projeto:
 * exibir logo/nome é pendência jurídica/comercial. Preencher libera o bloco.
 */
export const HUB_BRANDS: string[] = [];

/* ----------------------------------------------------------------------------
 * Helpers de cálculo (usados no server p/ fallback e no client p/ a calculadora)
 * -------------------------------------------------------------------------- */
/** Quantos blocos de bônus uma quantidade de indicações pagas destrava */
export function bonusBlocks(paid: number): number {
  if (paid < BONUS_THRESHOLD) return 0;
  return BONUS_REPEATS ? Math.floor(paid / BONUS_THRESHOLD) : 1;
}

/** Ganho da semana para `paid` indicações pagas: comissão direta + bônus */
export function weeklyEarnings(paid: number): {
  direct: number;
  bonus: number;
  total: number;
} {
  const safe = Math.max(0, Math.floor(paid));
  const direct = safe * COMMISSION_DIRECT;
  const bonus = bonusBlocks(safe) * BONUS_FLAT;
  return { direct, bonus, total: direct + bonus };
}

/** Formata número como moeda BRL sem centavos (R$ 1.234) */
export function brl(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}
