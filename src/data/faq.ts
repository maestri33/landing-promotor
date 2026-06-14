/**
 * Fonte única do FAQ: alimenta o componente <Faq /> e o schema FAQPage (JSON-LD).
 * Regras de copy: nada de promessa de "renda garantida"; só a mecânica real.
 * Ordem: maiores objeções primeiro (custo, como/quando recebe).
 */
import { COMMISSION_DIRECT, BONUS_FLAT, BONUS_THRESHOLD, BONUS_REPEATS, CLOSING_LABEL, brl } from '../config';

export interface FaqItem {
  q: string;
  a: string;
}

const bonusFrase = BONUS_REPEATS
  ? `${brl(BONUS_FLAT)} de bônus a cada ${BONUS_THRESHOLD} matrículas pagas na mesma semana`
  : `${brl(BONUS_FLAT)} de bônus ao atingir ${BONUS_THRESHOLD} matrículas pagas na semana`;

export const faq: FaqItem[] = [
  {
    q: 'Preciso pagar alguma coisa para ser promotor?',
    a: 'Não. Entrar é de graça e você nunca paga nada para ser promotor. Quem se inscreve são as pessoas que você indica — e é a matrícula delas que gera a sua comissão.',
  },
  {
    q: 'Como eu recebo?',
    a: `Por Pix, ${CLOSING_LABEL}, de forma automática. O fechamento da semana soma suas comissões e o valor cai direto na sua chave Pix — a mesma que você cadastra e que é validada no banco.`,
  },
  {
    q: 'Quando começo a ganhar?',
    a: 'Assim que alguém que você indicou paga a matrícula. A comissão é sua a partir daí — você não precisa acompanhar o aluno depois disso.',
  },
  {
    q: 'Quanto eu ganho por indicação?',
    a: `Você recebe ${brl(COMMISSION_DIRECT)} por cada matrícula paga que vier do seu link, mais ${bonusFrase}. Os valores podem mudar; sempre valem os do seu painel.`,
  },
  {
    q: 'Preciso vender, ter estoque ou investir em alguma coisa?',
    a: 'Não. Não tem estoque, não tem mensalidade e você não vende nada. Você só compartilha o seu link com quem quer estudar; quem se matricula e paga é a pessoa.',
  },
  {
    q: 'Preciso acompanhar o aluno depois que ele se matricula?',
    a: 'Não. Sua parte termina quando a pessoa paga a matrícula. O acompanhamento do estudo é com a equipe do polo, não com você.',
  },
  {
    q: 'Como eu faço login? Tem senha?',
    a: 'Não tem senha. Você entra com um código que chega no seu WhatsApp (login por OTP). É mais simples e mais seguro do que decorar senha.',
  },
  {
    q: 'Por que pedem documento, selfie e chave Pix?',
    a: 'Para garantir que o dinheiro vai para a pessoa certa e manter o programa sério. Sua chave Pix é validada de verdade no banco (precisa estar no seu CPF), o documento e a selfie confirmam que é você mesmo.',
  },
  {
    q: 'Quanto tempo leva para ser aprovado?',
    a: 'É rápido, mas tem um filtro: cadastro pelo celular, um treino curto online (com correção automática) e uma entrevista rápida com o coordenador do polo. Aprovado, seu link é liberado na hora.',
  },
  {
    q: 'Posso perder o cadastro?',
    a: 'Pode. Condutas que violam as regras do programa (fraude, indicação falsa, abuso) podem suspender o seu acesso e travar o seu link. Jogando limpo, não tem com o que se preocupar.',
  },
];
