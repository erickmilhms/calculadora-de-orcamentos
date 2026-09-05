import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Download,
  History,
  MapPin,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateQuote,
  DEFAULT_QUOTE,
  labels,
  type Level,
  type ProjectType,
  type QuoteInput,
  type ScopeLevel,
  type Urgency,
  type WorkModel,
} from "../lib/pricing";

type SavedQuote = {
  id: string;
  name: string;
  price: number;
  createdAt: string;
  input: QuoteInput;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const clampNumber = (value: string, fallback = 0) => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};

const projectDescriptions: Record<ProjectType, string> = {
  adjustment: "Correção, melhoria ou entrega pequena com escopo curto.",
  landing: "Página focada em apresentação, campanha ou conversão.",
  site: "Site com múltiplas páginas e estrutura institucional.",
  ecommerce: "Loja, checkout, catálogo ou integrações de venda.",
  webapp: "Dashboard, sistema, portal ou produto com regras próprias.",
  automation: "Integrações, fluxos, APIs e tarefas automatizadas.",
};

const workDescriptions: Record<WorkModel, string> = {
  direct: "Você negocia e responde diretamente pelo projeto.",
  freelance: "Você entra como freela ou execução para outra operação.",
  whitelabel: "Entrega sem exposição da sua marca e com responsabilidade extra.",
  recurring: "Relação contínua, com menor custo comercial de aquisição.",
};

const Field = ({
  label,
  note,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  step = 1,
}: {
  label: string;
  note?: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) => (
  <label className="number-field">
    <span className="field-copy">
      <strong>{label}</strong>
      {note ? <small>{note}</small> : null}
    </span>
    <span className="number-input-shell">
      {prefix ? <span>{prefix}</span> : null}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(clampNumber(event.target.value))}
      />
      {suffix ? <span>{suffix}</span> : null}
    </span>
  </label>
);

function ChoiceGrid<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; title: string; description?: string; tag?: string }>;
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`choice ${value === option.value ? "is-active" : ""}`}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          <span>
            <strong>{option.title}</strong>
            {option.description ? <small>{option.description}</small> : null}
          </span>
          {option.tag ? <em>{option.tag}</em> : <ChevronRight size={17} />}
        </button>
      ))}
    </div>
  );
}

const SectionIntro = ({ number: index, eyebrow, title, body }: { number: string; eyebrow: string; title: string; body: string }) => (
  <div className="section-intro" data-reveal>
    <span className="section-index">{index}</span>
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  </div>
);

export function BudgetCalculator() {
  const [input, setInput] = useState<QuoteInput>(DEFAULT_QUOTE);
  const [history, setHistory] = useState<SavedQuote[]>([]);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => calculateQuote(input), [input]);

  const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("mond:quotes");
      if (stored) setHistory(JSON.parse(stored) as SavedQuote[]);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );
    items.forEach((item) => observer.observe(item));

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? window.scrollY / max : 0;
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${Math.min(1, progress)})`;
        if (!reduceMotion && heroRef.current) {
          heroRef.current.style.setProperty("--hero-shift", `${Math.min(54, window.scrollY * 0.07)}px`);
        }
        frame = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const summary = useMemo(
    () =>
      [
        `ORÇAMENTO — ${input.projectName || "Novo projeto"}`,
        `${labels.projectType[input.projectType]} · ${labels.workModel[input.workModel]}`,
        "",
        `Horas previstas: ${number.format(result.totalHours)}h`,
        `Minha hora-base: ${currency.format(result.baseHourlyRate)}/h`,
        `Preço mínimo: ${currency.format(result.floorPrice)}`,
        `Preço recomendado: ${currency.format(result.finalPrice)}`,
        `Faixa premium: ${currency.format(result.premiumPrice)}`,
        `Entrada sugerida: ${currency.format(result.entryPrice)}`,
        `Saldo na entrega: ${currency.format(result.finalPayment)}`,
        "",
        `Complexidade: ${input.complexity}`,
        `Escopo: ${input.scope}`,
        `Urgência: ${input.urgency}`,
        `Revisões incluídas: ${input.revisions}`,
        input.travelEnabled ? `Deslocamento considerado: ${currency.format(result.travelCost)}` : "Sem deslocamento",
        input.discount > 0 ? `Desconto aplicado: ${input.discount}%` : "Sem desconto comercial",
      ].join("\n"),
    [input, result],
  );

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const area = document.createElement("textarea");
      area.value = summary;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const downloadSummary = () => {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(input.projectName || "orcamento").toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveQuote = () => {
    const item: SavedQuote = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
      name: input.projectName || "Novo projeto",
      price: result.finalPrice,
      createdAt: new Date().toISOString(),
      input,
    };
    const next = [item, ...history].slice(0, 8);
    setHistory(next);
    try {
      window.localStorage.setItem("mond:quotes", JSON.stringify(next));
    } catch {
      // A calculadora continua funcional mesmo sem armazenamento local.
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const removeSaved = (id: string) => {
    const next = history.filter((item) => item.id !== id);
    setHistory(next);
    try {
      window.localStorage.setItem("mond:quotes", JSON.stringify(next));
    } catch {
      // Sem ação: histórico em memória ainda funciona nesta sessão.
    }
  };

  const reset = () => {
    setInput(DEFAULT_QUOTE);
    document.querySelector("#calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const maxDiscount = Math.floor(result.maxSafeDiscount);
  const safeDiscount = input.discount <= result.maxSafeDiscount + 0.2;

  return (
    <main className="mond-pricing">
      <div className="scroll-progress" ref={progressRef} />

      <header className="topbar">
        <a href="#top" className="brand" aria-label="Mond Pricing — início">
          <span className="brand-mark">m</span>
          <span>mond</span>
          <small>pricing</small>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#base">Sua hora</a>
          <a href="#calculator">Orçamento</a>
          <a href="#history">Histórico</a>
        </nav>
        <a className="topbar-cta" href="#calculator">
          Calcular <ArrowDown size={15} />
        </a>
      </header>

      <section className="hero" id="top" ref={heroRef}>
        <div className="hero-grid hero-parallax">
          <div className="hero-copy" data-reveal>
            <p className="eyebrow"><span /> Calculadora de orçamento Mond</p>
            <h1>
              Pare de <em>chutar.</em><br />
              Comece a cobrar.
            </h1>
          </div>
          <div className="hero-side" data-reveal>
            <p>
              Um orçamento que parte do seu custo real e considera o que normalmente fica esquecido: reunião,
              revisão, urgência, risco, taxa, deslocamento e margem.
            </p>
            <a href="#calculator" className="text-link">
              Montar um orçamento <ArrowRight size={18} />
            </a>
          </div>
        </div>

        <div className="hero-ticker" aria-label="Resumo atual do cálculo">
          <span>hora-base {currency.format(result.baseHourlyRate)}</span>
          <span>·</span>
          <span>{number.format(result.totalHours)} horas previstas</span>
          <span>·</span>
          <strong>{currency.format(result.finalPrice)} recomendado</strong>
          <span>·</span>
          <span>sem valor tirado da cabeça</span>
        </div>
      </section>

      <section className="base-section" id="base">
        <SectionIntro
          number="01"
          eyebrow="Primeiro, descubra seu chão"
          title="Quanto vale uma hora sua antes do projeto existir?"
          body="Em vez de escolher uma taxa por feeling, a calculadora divide sua meta mensal e seus custos pelas horas que você realmente consegue faturar. Horário de almoço, estudo, prospecção e administrativo não entram como hora vendida."
        />

        <div className="base-layout">
          <div className="base-fields" data-reveal>
            <Field
              label="Meta mensal"
              note="Quanto você quer que seu trabalho gere para você no mês."
              value={input.monthlyTarget}
              prefix="R$"
              step={100}
              onChange={(value) => set("monthlyTarget", value)}
            />
            <Field
              label="Custos mensais"
              note="Software, internet, contador, ferramentas e estrutura."
              value={input.monthlyCosts}
              prefix="R$"
              step={50}
              onChange={(value) => set("monthlyCosts", value)}
            />
            <Field
              label="Horas faturáveis / mês"
              note="Só as horas que podem virar receita. Não use 160h por padrão."
              value={input.billableHours}
              suffix="h"
              max={220}
              onChange={(value) => set("billableHours", value)}
            />
          </div>

          <div className="hour-result" data-reveal>
            <p>sua hora-base hoje</p>
            <strong>{currency.format(result.baseHourlyRate)}</strong>
            <span>/ hora</span>
            <div className="formula-line">
              <span>({currency.format(input.monthlyTarget)} + {currency.format(input.monthlyCosts)})</span>
              <i />
              <span>{number.format(input.billableHours)}h faturáveis</span>
            </div>
          </div>
        </div>
      </section>

      <section className="calculator-section" id="calculator">
        <SectionIntro
          number="02"
          eyebrow="Agora entra a demanda"
          title="Descreva o trabalho. O preço se monta sozinho."
          body="Você continua decidindo as premissas do projeto, mas não precisa inventar o número final. Alterou prazo, escopo ou horas? O orçamento recalcula na hora."
        />

        <div className="calculator-layout">
          <div className="calculator-form">
            <div className="form-block" data-reveal>
              <div className="block-title">
                <span>A</span>
                <div>
                  <h3>O que você vai fazer?</h3>
                  <p>Nomeie a demanda e escolha o tipo mais próximo.</p>
                </div>
              </div>

              <label className="text-field">
                <span>Nome do projeto</span>
                <input
                  value={input.projectName}
                  maxLength={70}
                  onChange={(event) => set("projectName", event.target.value)}
                  placeholder="Ex.: Landing page para clínica"
                />
              </label>

              <ChoiceGrid<ProjectType>
                value={input.projectType}
                onChange={(value) => set("projectType", value)}
                options={(Object.keys(labels.projectType) as ProjectType[]).map((value) => ({
                  value,
                  title: labels.projectType[value],
                  description: projectDescriptions[value],
                }))}
              />
            </div>

            <div className="form-block" data-reveal>
              <div className="block-title">
                <span>B</span>
                <div>
                  <h3>Tempo de verdade</h3>
                  <p>Execução é só uma parte. Reunião, pós-entrega e revisão também ocupam agenda.</p>
                </div>
              </div>

              <div className="field-stack">
                <Field
                  label="Execução"
                  note="Design, código, configuração, conteúdo e testes."
                  value={input.executionHours}
                  suffix="h"
                  step={0.5}
                  onChange={(value) => set("executionHours", value)}
                />
                <Field
                  label="Reuniões e alinhamentos"
                  note="Kickoff, apresentação, mensagens longas e calls."
                  value={input.meetingHours}
                  suffix="h"
                  step={0.5}
                  onChange={(value) => set("meetingHours", value)}
                />
                <Field
                  label="Suporte pós-entrega"
                  note="Ajustes assistidos, publicação e acompanhamento."
                  value={input.supportHours}
                  suffix="h"
                  step={0.5}
                  onChange={(value) => set("supportHours", value)}
                />
                <Field
                  label="Rodadas de revisão"
                  note="A partir da segunda rodada, a calculadora adiciona buffer de tempo."
                  value={input.revisions}
                  suffix="x"
                  min={1}
                  max={8}
                  onChange={(value) => set("revisions", Math.min(8, Math.max(1, Math.round(value))))}
                />
              </div>
              <div className="inline-note">
                <Sparkles size={17} />
                {number.format(result.revisionHours)}h de buffer já foram adicionadas pelas revisões.
              </div>
            </div>

            <div className="form-block" data-reveal>
              <div className="block-title">
                <span>C</span>
                <div>
                  <h3>O contexto muda o preço</h3>
                  <p>Um projeto bem definido e tranquilo não deve custar igual a uma entrega urgente e cheia de incerteza.</p>
                </div>
              </div>

              <div className="option-group">
                <div className="group-heading"><strong>Complexidade</strong><small>Quanto raciocínio, tecnologia e responsabilidade técnica existem?</small></div>
                <ChoiceGrid<Level>
                  value={input.complexity}
                  onChange={(value) => set("complexity", value)}
                  options={[
                    { value: "low", title: "Baixa", tag: "base" },
                    { value: "medium", title: "Média", tag: "+15%" },
                    { value: "high", title: "Alta", tag: "+32%" },
                    { value: "extreme", title: "Muito alta", tag: "+52%" },
                  ]}
                />
              </div>

              <div className="option-group">
                <div className="group-heading"><strong>Clareza do escopo</strong><small>Quanto ainda pode mudar depois do “fechado”?</small></div>
                <ChoiceGrid<ScopeLevel>
                  value={input.scope}
                  onChange={(value) => set("scope", value)}
                  options={[
                    { value: "clear", title: "Fechado", tag: "base" },
                    { value: "partial", title: "Parcial", tag: "+10%" },
                    { value: "open", title: "Aberto", tag: "+22%" },
                  ]}
                />
              </div>

              <div className="option-group">
                <div className="group-heading"><strong>Urgência</strong><small>Prazo menor ocupa espaço que poderia ser vendido para outras demandas.</small></div>
                <ChoiceGrid<Urgency>
                  value={input.urgency}
                  onChange={(value) => set("urgency", value)}
                  options={[
                    { value: "normal", title: "Sem pressa", tag: "base" },
                    { value: "fast", title: "Até 7 dias", tag: "+12%" },
                    { value: "rush", title: "Até 72h", tag: "+28%" },
                    { value: "critical", title: "24–48h", tag: "+48%" },
                  ]}
                />
              </div>
            </div>

            <div className="form-block" data-reveal>
              <div className="block-title">
                <span>D</span>
                <div>
                  <h3>Como esse trabalho chegou?</h3>
                  <p>Cliente direto, freela, white-label e recorrência têm custos comerciais diferentes.</p>
                </div>
              </div>

              <ChoiceGrid<WorkModel>
                value={input.workModel}
                onChange={(value) => set("workModel", value)}
                options={(Object.keys(labels.workModel) as WorkModel[]).map((value) => ({
                  value,
                  title: labels.workModel[value],
                  description: workDescriptions[value],
                }))}
              />
            </div>

            <div className="form-block" data-reveal>
              <div className="block-title">
                <span>E</span>
                <div>
                  <h3>Custos que costumam sumir</h3>
                  <p>Ferramentas compradas para o projeto, deslocamento e tempo na rua precisam aparecer no preço.</p>
                </div>
              </div>

              <Field
                label="Despesas específicas"
                note="Plugin, licença, banco de imagem, hospedagem temporária ou outro custo só desta demanda."
                value={input.projectExpenses}
                prefix="R$"
                step={10}
                onChange={(value) => set("projectExpenses", value)}
              />

              <label className="switch-row">
                <span className="switch-copy">
                  <MapPin size={19} />
                  <span><strong>Tem deslocamento?</strong><small>Inclua combustível/desgaste e também o seu tempo.</small></span>
                </span>
                <input
                  type="checkbox"
                  checked={input.travelEnabled}
                  onChange={(event) => set("travelEnabled", event.target.checked)}
                />
                <span className="switch-ui" aria-hidden="true" />
              </label>

              {input.travelEnabled ? (
                <div className="travel-grid">
                  <Field label="Km totais por saída" value={input.kmPerTrip} suffix="km" step={1} onChange={(value) => set("kmPerTrip", value)} />
                  <Field label="Número de saídas" value={input.trips} suffix="x" min={1} onChange={(value) => set("trips", Math.max(1, Math.round(value)))} />
                  <Field label="Custo por km" value={input.costPerKm} prefix="R$" step={0.05} onChange={(value) => set("costPerKm", value)} />
                  <Field label="Tempo total em trânsito" value={input.travelHours} suffix="h" step={0.5} onChange={(value) => set("travelHours", value)} />
                </div>
              ) : null}
            </div>

            <div className="form-block" data-reveal>
              <div className="block-title">
                <span>F</span>
                <div>
                  <h3>Venda, taxa e margem</h3>
                  <p>O valor que entra não é o valor que sobra. Aqui você protege o preço antes de negociar.</p>
                </div>
              </div>

              <div className="field-stack">
                <Field label="Impostos / reserva fiscal" value={input.taxes} suffix="%" max={45} step={0.5} onChange={(value) => set("taxes", Math.min(45, value))} />
                <Field label="Taxa de pagamento" note="Cartão, plataforma ou intermediador. Pix pode ficar em 0%." value={input.paymentFee} suffix="%" max={20} step={0.5} onChange={(value) => set("paymentFee", Math.min(20, value))} />
                <Field label="Margem desejada" note="Sobra do negócio para risco, reinvestimento e crescimento." value={input.margin} suffix="%" max={45} step={1} onChange={(value) => set("margin", Math.min(45, value))} />
                <Field label="Desconto comercial" note={`Hoje, até aproximadamente ${maxDiscount}% sem cruzar o preço mínimo.`} value={input.discount} suffix="%" max={60} step={1} onChange={(value) => set("discount", Math.min(60, value))} />
              </div>

              <div className={`discount-health ${safeDiscount ? "is-safe" : "is-risk"}`}>
                {safeDiscount ? <Check size={17} /> : <AlertTriangle size={17} />}
                <span>{safeDiscount ? "O desconto ainda está dentro da faixa segura." : "Esse desconto já empurra o projeto abaixo do seu piso calculado."}</span>
              </div>
            </div>
          </div>

          <aside className="result-panel" data-reveal aria-live="polite">
            <div className="result-kicker">
              <span>valor para apresentar</span>
              <span className="live-dot">ao vivo</span>
            </div>
            <p className="result-project">{input.projectName || "Novo projeto"}</p>
            <strong className="big-price">{currency.format(result.finalPrice)}</strong>
            {input.discount > 0 ? <span className="discount-label">com {input.discount}% de desconto aplicado</span> : <span className="discount-label">preço recomendado</span>}

            <div className="price-range">
              <div>
                <span>Mínimo</span>
                <strong>{currency.format(result.floorPrice)}</strong>
                <small>não negociar abaixo</small>
              </div>
              <div className="is-featured">
                <span>Recomendado</span>
                <strong>{currency.format(result.recommendedPrice)}</strong>
                <small>margem protegida</small>
              </div>
              <div>
                <span>Premium</span>
                <strong>{currency.format(result.premiumPrice)}</strong>
                <small>maior valor percebido</small>
              </div>
            </div>

            <div className="result-metrics">
              <div><span>Horas totais</span><strong>{number.format(result.totalHours)}h</strong></div>
              <div><span>Hora efetiva</span><strong>{currency.format(result.effectiveHourlyRate)}</strong></div>
              <div><span>Sobra estimada</span><strong>{currency.format(result.expectedNet)}</strong></div>
              <div><span>Margem resultante</span><strong>{number.format(result.expectedNetPercent)}%</strong></div>
            </div>

            <div className="payment-split">
              <p>Forma simples de fechar</p>
              <div><span>50% na entrada</span><strong>{currency.format(result.entryPrice)}</strong></div>
              <div><span>50% na entrega</span><strong>{currency.format(result.finalPayment)}</strong></div>
            </div>

            {result.warnings.length ? (
              <div className="warnings">
                {result.warnings.map((warning) => (
                  <p key={warning}><AlertTriangle size={15} /> {warning}</p>
                ))}
              </div>
            ) : (
              <div className="all-good"><Check size={16} /> Premissas equilibradas para este orçamento.</div>
            )}

            <div className="result-actions">
              <button type="button" className="primary-action" onClick={saveQuote}>
                {saved ? <Check size={17} /> : <Save size={17} />} {saved ? "Salvo" : "Salvar orçamento"}
              </button>
              <button type="button" onClick={copySummary}>
                {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "Copiado" : "Copiar resumo"}
              </button>
              <button type="button" onClick={downloadSummary}><Download size={17} /> Baixar .txt</button>
              <button type="button" className="reset-action" onClick={reset}><RotateCcw size={17} /> Recomeçar</button>
            </div>
          </aside>
        </div>
      </section>

      <section className="logic-section">
        <div className="logic-lead" data-reveal>
          <p className="eyebrow">O número não vem do nada</p>
          <h2>Você consegue explicar por que está cobrando isso.</h2>
        </div>
        <div className="logic-strip" data-reveal>
          <div><span>01</span><strong>Hora-base</strong><p>Meta mensal + estrutura divididas por horas faturáveis.</p></div>
          <ArrowRight size={22} />
          <div><span>02</span><strong>Trabalho real</strong><p>Execução, reuniões, suporte, revisão e deslocamento.</p></div>
          <ArrowRight size={22} />
          <div><span>03</span><strong>Contexto</strong><p>Complexidade, risco de escopo, urgência e contratação.</p></div>
          <ArrowRight size={22} />
          <div><span>04</span><strong>Proteção</strong><p>Despesas, impostos, taxas e margem antes do preço final.</p></div>
        </div>
      </section>

      <section className="history-section" id="history">
        <SectionIntro
          number="03"
          eyebrow="Não perca referência"
          title="Seus últimos orçamentos ficam por perto."
          body="Salve cenários para comparar projetos parecidos e parar de recomeçar do zero. Tudo fica somente no armazenamento deste navegador."
        />

        {history.length ? (
          <div className="history-list">
            {history.map((item) => (
              <article key={item.id} className="history-row" data-reveal>
                <div className="history-icon"><History size={19} /></div>
                <div className="history-name">
                  <strong>{item.name}</strong>
                  <span>{labels.projectType[item.input.projectType]} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(item.createdAt))}</span>
                </div>
                <strong className="history-price">{currency.format(item.price)}</strong>
                <div className="history-actions">
                  <button type="button" onClick={() => { setInput(item.input); document.querySelector("#calculator")?.scrollIntoView({ behavior: "smooth" }); }}>Carregar</button>
                  <button type="button" aria-label={`Excluir ${item.name}`} onClick={() => removeSaved(item.id)}><Trash2 size={16} /></button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-history" data-reveal>
            <History size={25} />
            <div><strong>Nenhum orçamento salvo ainda.</strong><p>Quando um cálculo fizer sentido, use “Salvar orçamento” no painel de resultado.</p></div>
          </div>
        )}
      </section>

      <footer>
        <div>
          <span className="brand-mark">m</span>
          <p>mond pricing</p>
        </div>
        <p>Preço com contexto, não com chute.</p>
        <a href="#top">Voltar ao topo <ArrowRight size={16} /></a>
      </footer>
    </main>
  );
}
