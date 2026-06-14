/**
 * Entry único do client: atribuição, eventos e animações.
 * Tudo é progressive enhancement — a página funciona sem este arquivo.
 */
import { initAttribution, decorateCtas, ATTR_KEYS } from './attribution';
import { track } from './track';
import { weeklyEarnings, brl } from '../config';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Atribuição + page_view ---------- */
const attr = initAttribution();
decorateCtas(attr);

const attrPayload: Record<string, unknown> = {};
if (attr) {
  for (const key of ATTR_KEYS) if (attr[key]) attrPayload[key] = attr[key];
}
track('page_view', attrPayload);

/* ---------- cta_click (delegado) ---------- */
document.addEventListener('click', (e) => {
  const target = e.target as Element | null;
  const cta = target?.closest<HTMLAnchorElement>('a[data-cta]');
  if (cta) track('cta_click', { position: cta.dataset.cta });
});

/* ---------- faq_open ---------- */
document.querySelectorAll<HTMLDetailsElement>('details[data-faq]').forEach((details) => {
  details.addEventListener('toggle', () => {
    const question = details.querySelector('summary')?.textContent?.trim() ?? '';
    track(details.open ? 'faq_open' : 'faq_close', { question });
  });
});

/* ---------- section_view: funil por seção ---------- */
const sections = document.querySelectorAll<HTMLElement>('[data-section]');
if (sections.length > 0 && 'IntersectionObserver' in window) {
  const sectionIo = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          track('section_view', { section: (entry.target as HTMLElement).dataset.section });
          sectionIo.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.35 }
  );
  sections.forEach((el) => sectionIo.observe(el));
}

/* ---------- Erros de runtime → dataLayer (visível quando o GTM entrar) ---------- */
window.addEventListener('error', (e) => {
  track('js_error', { message: String(e.message ?? 'erro').slice(0, 150) });
});
window.addEventListener('unhandledrejection', (e) => {
  track('js_error', { message: `unhandledrejection: ${String(e.reason ?? '')}`.slice(0, 150) });
});

/* ---------- scroll_depth (25/50/75/100) ---------- */
const depthMarks = [25, 50, 75, 100];
const fired = new Set<number>();
function checkDepth(): void {
  const doc = document.documentElement;
  const viewport = window.innerHeight || doc.clientHeight;
  const depth = ((doc.scrollTop + viewport) / doc.scrollHeight) * 100;
  for (const mark of depthMarks) {
    if (depth >= mark && !fired.has(mark)) {
      fired.add(mark);
      track('scroll_depth', { depth: mark });
    }
  }
  if (fired.size === depthMarks.length) {
    window.removeEventListener('scroll', checkDepth);
  }
}
window.addEventListener('scroll', checkDepth, { passive: true });
checkDepth();

/* ---------- Calculadora de ganhos ----------
 * Fonte única dos números: weeklyEarnings() em src/config.ts.
 * Sem JS: a tabela estática (renderizada no server) já responde. */
const calcRange = document.querySelector<HTMLInputElement>('[data-calc-range]');
if (calcRange) {
  const out = {
    paid: document.querySelector<HTMLElement>('[data-calc-paid]'),
    total: document.querySelector<HTMLElement>('[data-calc-total]'),
    direct: document.querySelector<HTMLElement>('[data-calc-direct]'),
    bonus: document.querySelector<HTMLElement>('[data-calc-bonus]'),
    bonusRow: document.querySelector<HTMLElement>('[data-calc-bonus-row]'),
  };
  let calcTracked = false;
  const render = (): void => {
    const n = Number(calcRange.value);
    const { direct, bonus, total } = weeklyEarnings(n);
    if (out.paid) out.paid.textContent = String(n);
    if (out.total) out.total.textContent = brl(total);
    if (out.direct) out.direct.textContent = brl(direct);
    if (out.bonus) out.bonus.textContent = brl(bonus);
    if (out.bonusRow) out.bonusRow.classList.toggle('on', bonus > 0);
    calcRange.setAttribute('aria-valuetext', `${n} matrículas pagas, ${brl(total)} na semana`);
    calcRange.style.setProperty('--calc-fill', `${((n - Number(calcRange.min)) / (Number(calcRange.max) - Number(calcRange.min))) * 100}%`);
  };
  calcRange.addEventListener('input', () => {
    render();
    if (!calcTracked) {
      calcTracked = true;
      track('calc_use', {});
    }
  });
  render();
}

/* ---------- Reveals por scroll (Intersection Observer) ---------- */
const revealEls = document.querySelectorAll('[data-reveal], [data-seal]');
if (REDUCED || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('in-view'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      }
    },
    // pré-dispara 120px antes de entrar: rolagem rápida no mobile não
    // encontra seção "apagada" esperando o observer
    { threshold: 0.05, rootMargin: '0px 0px 120px 0px' }
  );
  // página pode carregar já rolada (restauração de scroll/âncora): o que
  // ficou acima do viewport aparece direto. Leituras de layout em lote
  // ANTES das escritas para não forçar reflow a cada elemento.
  const aboveViewport: Element[] = [];
  const toObserve: Element[] = [];
  revealEls.forEach((el) => {
    (el.getBoundingClientRect().bottom < 0 ? aboveViewport : toObserve).push(el);
  });
  aboveViewport.forEach((el) => el.classList.add('in-view'));
  toObserve.forEach((el) => io.observe(el));
}

/* ---------- Frases que "acendem" ao cruzar o centro ---------- */
const litEls = document.querySelectorAll('[data-lit]');
if (litEls.length > 0) {
  if (REDUCED || !('IntersectionObserver' in window)) {
    litEls.forEach((el) => el.classList.add('lit'));
  } else {
    const litIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('lit');
            litIo.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '-28% 0px -28% 0px' }
    );
    litEls.forEach((el) => litIo.observe(el));
  }
}

/* ---------- Spotlight seguindo o mouse (cards marcados) ---------- */
if (!REDUCED && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}

/* ---------- Sticky CTA ----------
 * Visível só quando: já passou do hero E nenhum CTA da própria página está
 * na tela (senão o sticky cobre exatamente o botão que o usuário ia tocar). */
const sticky = document.querySelector<HTMLElement>('.sticky-cta');
if (sticky && 'IntersectionObserver' in window) {
  const hero = document.querySelector('#hero');
  const inlineCtas = document.querySelectorAll('a[data-cta]:not([data-cta="sticky"])');

  let pastHero = !hero; // páginas sem hero: sticky liberado desde o topo
  const ctasOnScreen = new Set<Element>();
  const updateSticky = (): void => {
    sticky.classList.toggle('visible', pastHero && ctasOnScreen.size === 0);
  };

  if (hero) {
    new IntersectionObserver(
      ([entry]) => {
        pastHero = !entry.isIntersecting;
        updateSticky();
      },
      { rootMargin: '-64px 0px 0px 0px' }
    ).observe(hero);
  }

  const ctaIo = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) ctasOnScreen.add(entry.target);
        else ctasOnScreen.delete(entry.target);
      }
      updateSticky();
    },
    { threshold: 0.4 }
  );
  inlineCtas.forEach((el) => ctaIo.observe(el));
  updateSticky();
} else {
  sticky?.classList.add('visible');
}

/* ---------- Barra de progresso de leitura ---------- */
const bar = document.querySelector<HTMLElement>('.progress-bar');
if (bar) {
  let ticking = false;
  const update = (): void => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    bar.style.transform = `scaleX(${max > 0 ? doc.scrollTop / max : 0})`;
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}
