import {
  AlertTriangle,
  Check,
  Clock3,
  Copy,
  Download,
  FolderKanban,
  Gauge,
  History,
  MapPin,
  Receipt,
  RotateCcw,
  Save,
  Settings2,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

type ViewKey = "project" | "time" | "context" | "finance";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const projectDescriptions: Record<ProjectType, string> = {
  adjustment: "Correção ou melhoria pequena, com entrega curta.",
  landing: "Página única com foco em apresentação ou conversão.",
  site: "Estrutura institucional com múltiplas páginas.",
  ecommerce: "Loja, catálogo, checkout e integrações de venda.",
  webapp: "Sistema, dashboard ou produto com regras próprias.",
  automation: "APIs, integrações e fluxos automatizados.",
};

const workDescriptions: Record<WorkModel, string> = {
  direct: "Você negocia e responde diretamente pelo projeto.",
  freelance: "Execução para outra pessoa, agência ou operação.",
  whitelabel: "Entrega sem exposição da Mond e com responsabilidade extra.",
  recurring: "Cliente já conhecido, com menor custo comercial.",
};

const clampNumber = (raw: string, min = 0, max = Number.POSITIVE_INFINITY) => {
  const parsed = Number(raw.replace(",", "."));
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
};

function NumberField({
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  step = 1,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="compact-field">
      <span className="compact-field-copy">
        <strong>{label}</strong>
        {hint ? <small>{hint}</small> : null}
      </span>
      <span className="compact-input">
        {prefix ? <span>{prefix}</span> : null}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(clampNumber(event.target.value, min, max))}
        />
        {suffix ? <span>{suffix}</span> : null}
      </span>
    </label>
  );
}

function ChoiceGroup<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; meta?: string }>;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div className={`choice-group cols-${columns}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "is-selected" : ""}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          <span>{option.label}</span>
          {option.meta ? <small>{option.meta}</small> : null}
        </button>
      ))}
    </div>
  );
}

export function BudgetCalculator() {
  const [input, setInput] = useState<QuoteInput>(DEFAULT_QUOTE);
  const [activeView, setActiveView] = useState<ViewKey>("project");
  const [history, setHistory] = useState<SavedQuote[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const result = useMemo(() => calculateQuote(input), [input]);

  const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    try {
      const storedHistory = window.localStorage.getItem("mond:quotes");
      if (storedHistory) setHistory(JSON.parse(storedHistory) as SavedQuote[]);

      const storedProfile = window.localStorage.getItem("mond:pricing-profile");
      if (storedProfile) {
        const profile = JSON.parse(storedProfile) as Partial<QuoteInput>;
        setInput((current) => ({
          ...current,
          monthlyTarget: profile.monthlyTarget ?? current.monthlyTarget,
          monthlyCosts: profile.monthlyCosts ?? current.monthlyCosts,
          billableHours: profile.billableHours ?? current.billableHours,
          taxes: profile.taxes ?? current.taxes,
          paymentFee: profile.paymentFee ?? current.paymentFee,
          margin: profile.margin ?? current.margin,
        }));
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const summary = useMemo(
    () =>
      [
        `ORÇAMENTO — ${input.projectName || "Novo projeto"}`,
        `${labels.projectType[input.projectType]} · ${labels.workModel[input.workModel]}`,
        "",
        `Horas previstas: ${number.format(result.totalHours)}h`,
        `Hora-base: ${currency.format(result.baseHourlyRate)}/h`,
        `Preço mínimo: ${currency.format(result.floorPrice)}`,
        `Preço recomendado: ${currency.format(result.finalPrice)}`,
        `Faixa premium: ${currency.format(result.premiumPrice)}`,
        `Entrada sugerida: ${currency.format(result.entryPrice)}`,
        `Saldo na entrega: ${currency.format(result.finalPayment)}`,
        "",
        `Complexidade: ${input.complexity}`,
        `Escopo: ${input.scope}`,
        `Urgência: ${input.urgency}`,
        `Revisões: ${input.revisions}`,
        input.travelEnabled ? `Deslocamento: ${currency.format(result.travelCost)}` : "Sem deslocamento",
        input.discount > 0 ? `Desconto: ${input.discount}%` : "Sem desconto comercial",
      ].join("\n"),
    [input, result],
  );

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      const area = document.createElement("textarea");
      area.value = summary;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
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
      // O orçamento ainda funciona sem armazenamento local.
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const saveProfile = () => {
    try {
      window.localStorage.setItem(
        "mond:pricing-profile",
        JSON.stringify({
          monthlyTarget: input.monthlyTarget,
          monthlyCosts: input.monthlyCosts,
          billableHours: input.billableHours,
          taxes: input.taxes,
          paymentFee: input.paymentFee,
          margin: input.margin,
        }),
      );
    } catch {
      // Mantém os valores da sessão mesmo se o navegador bloquear storage.
    }
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 1600);
  };

  const removeSaved = (id: string) => {
    const next = history.filter((item) => item.id !== id);
    setHistory(next);
    try {
      window.localStorage.setItem("mond:quotes", JSON.stringify(next));
    } catch {
      // Sem ação.
    }
  };

  const loadSaved = (item: SavedQuote) => {
    setInput(item.input);
    setHistoryOpen(false);
    setActiveView("project");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setInput((current) => ({
      ...DEFAULT_QUOTE,
      monthlyTarget: current.monthlyTarget,
      monthlyCosts: current.monthlyCosts,
      billableHours: current.billableHours,
      taxes: current.taxes,
      paymentFee: current.paymentFee,
      margin: current.margin,
    }));
    setActiveView("project");
  };

  const maxDiscount = Math.floor(result.maxSafeDiscount);
  const safeDiscount = input.discount <= result.maxSafeDiscount + 0.2;

  const renderProjectView = () => (
    <div className="view-stack">
      <label className="project-name-field">
        <span>Nome da demanda</span>
        <input
          value={input.projectName}
          maxLength={70}
          onChange={(event) => set("projectName", event.target.value)}
          placeholder="Ex.: Site para clínica"
        />
      </label>

      <div className="control-block">
        <div className="control-heading">
          <strong>Tipo de projeto</strong>
          <span>{projectDescriptions[input.projectType]}</span>
        </div>
        <ChoiceGroup<ProjectType>
          value={input.projectType}
          onChange={(value) => set("projectType", value)}
          options={(Object.keys(labels.projectType) as ProjectType[]).map((value) => ({
            value,
            label: labels.projectType[value],
          }))}
          columns={3}
        />
      </div>

      <div className="control-block">
        <div className="control-heading">
          <strong>Como o trabalho chegou</strong>
          <span>{workDescriptions[input.workModel]}</span>
        </div>
        <ChoiceGroup<WorkModel>
          value={input.workModel}
          onChange={(value) => set("workModel", value)}
          options={(Object.keys(labels.workModel) as WorkModel[]).map((value) => ({
            value,
            label: labels.workModel[value],
          }))}
          columns={2}
        />
      </div>
    </div>
  );

  const renderTimeView = () => (
    <div className="view-stack">
      <div className="view-summary">
        <div>
          <span>tempo calculado</span>
          <strong>{number.format(result.totalHours)}h</strong>
        </div>
        <p>Inclui execução, reuniões, suporte, revisão e trânsito quando houver.</p>
      </div>

      <div className="field-grid">
        <NumberField label="Execução" hint="Design, código, configuração e testes." value={input.executionHours} suffix="h" step={0.5} onChange={(value) => set("executionHours", value)} />
        <NumberField label="Reuniões" hint="Calls, apresentação e alinhamentos." value={input.meetingHours} suffix="h" step={0.5} onChange={(value) => set("meetingHours", value)} />
        <NumberField label="Pós-entrega" hint="Publicação, suporte e pequenos ajustes." value={input.supportHours} suffix="h" step={0.5} onChange={(value) => set("supportHours", value)} />
        <NumberField label="Revisões" hint={`${number.format(result.revisionHours)}h de buffer automático.`} value={input.revisions} suffix="x" min={1} max={8} onChange={(value) => set("revisions", Math.round(value))} />
      </div>
    </div>
  );

  const renderContextView = () => (
    <div className="view-stack compact-groups">
      <div className="control-block">
        <div className="control-heading"><strong>Complexidade</strong><span>Tecnologia, responsabilidade e raciocínio envolvidos.</span></div>
        <ChoiceGroup<Level>
          value={input.complexity}
          onChange={(value) => set("complexity", value)}
          options={[
            { value: "low", label: "Baixa", meta: "base" },
            { value: "medium", label: "Média", meta: "+15%" },
            { value: "high", label: "Alta", meta: "+32%" },
            { value: "extreme", label: "Muito alta", meta: "+52%" },
          ]}
          columns={4}
        />
      </div>

      <div className="control-block">
        <div className="control-heading"><strong>Escopo</strong><span>Quanto ainda pode mudar depois de aprovado.</span></div>
        <ChoiceGroup<ScopeLevel>
          value={input.scope}
          onChange={(value) => set("scope", value)}
          options={[
            { value: "clear", label: "Fechado", meta: "base" },
            { value: "partial", label: "Parcial", meta: "+10%" },
            { value: "open", label: "Aberto", meta: "+22%" },
          ]}
          columns={3}
        />
      </div>

      <div className="control-block">
        <div className="control-heading"><strong>Urgência</strong><span>Prazo curto ocupa espaço que poderia ir para outras demandas.</span></div>
        <ChoiceGroup<Urgency>
          value={input.urgency}
          onChange={(value) => set("urgency", value)}
          options={[
            { value: "normal", label: "Normal", meta: "base" },
            { value: "fast", label: "Até 7 dias", meta: "+12%" },
            { value: "rush", label: "Até 72h", meta: "+28%" },
            { value: "critical", label: "24–48h", meta: "+48%" },
          ]}
          columns={4}
        />
      </div>
    </div>
  );

  const renderFinanceView = () => (
    <div className="view-stack">
      <div className="field-grid finance-grid">
        <NumberField label="Despesa do projeto" hint="Licença, plugin, mídia ou compra específica." value={input.projectExpenses} prefix="R$" step={10} onChange={(value) => set("projectExpenses", value)} />
        <NumberField label="Impostos" value={input.taxes} suffix="%" max={45} step={0.5} onChange={(value) => set("taxes", value)} />
        <NumberField label="Taxa de pagamento" value={input.paymentFee} suffix="%" max={20} step={0.5} onChange={(value) => set("paymentFee", value)} />
        <NumberField label="Margem" value={input.margin} suffix="%" max={45} onChange={(value) => set("margin", value)} />
        <NumberField label="Desconto" hint={`Limite seguro agora: ~${maxDiscount}%`} value={input.discount} suffix="%" max={60} onChange={(value) => set("discount", value)} />
      </div>

      <label className="travel-toggle">
        <span className="travel-toggle-copy">
          <MapPin size={18} />
          <span><strong>Deslocamento</strong><small>Inclua custo do trajeto e tempo perdido na rua.</small></span>
        </span>
        <input type="checkbox" checked={input.travelEnabled} onChange={(event) => set("travelEnabled", event.target.checked)} />
        <span className="toggle-ui" aria-hidden="true" />
      </label>

      {input.travelEnabled ? (
        <div className="field-grid travel-fields">
          <NumberField label="Km por saída" value={input.kmPerTrip} suffix="km" onChange={(value) => set("kmPerTrip", value)} />
          <NumberField label="Saídas" value={input.trips} suffix="x" min={1} onChange={(value) => set("trips", Math.round(value))} />
          <NumberField label="Custo por km" value={input.costPerKm} prefix="R$" step={0.05} onChange={(value) => set("costPerKm", value)} />
          <NumberField label="Tempo na rua" value={input.travelHours} suffix="h" step={0.5} onChange={(value) => set("travelHours", value)} />
        </div>
      ) : null}

      <div className={`health-line ${safeDiscount ? "is-safe" : "is-risk"}`}>
        {safeDiscount ? <Check size={16} /> : <AlertTriangle size={16} />}
        <span>{safeDiscount ? "Preço ainda protegido mesmo com os ajustes comerciais." : "O desconto atual já atravessa o preço mínimo calculado."}</span>
      </div>
    </div>
  );

  return (
    <main className="mond-tool">
      <header className="tool-header">
        <div className="brand-lockup" aria-label="Mond Orçamentos">
          <span className="brand-glyph">m</span><span className="brand-name">mond</span><span className="brand-divider">/</span><span className="brand-product">orçamentos</span>
        </div>
        <div className="header-actions">
          <button type="button" className="header-chip" onClick={() => setProfileOpen(true)}><Gauge size={16} /><span>{currency.format(result.baseHourlyRate)}/h</span></button>
          <button type="button" className="header-chip" onClick={() => setHistoryOpen(true)}><History size={16} /><span>Histórico</span>{history.length ? <b>{history.length}</b> : null}</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="profile-panel">
          <div className="panel-label"><span>Base da Mond</span><button type="button" onClick={() => setProfileOpen(true)} aria-label="Editar minha hora"><Settings2 size={16} /></button></div>
          <div className="profile-rate"><span>sua hora-base</span><strong>{currency.format(result.baseHourlyRate)}</strong><small>por hora faturável</small></div>
          <dl className="profile-list">
            <div><dt>Meta mensal</dt><dd>{currency.format(input.monthlyTarget)}</dd></div>
            <div><dt>Custos fixos</dt><dd>{currency.format(input.monthlyCosts)}</dd></div>
            <div><dt>Horas vendáveis</dt><dd>{number.format(input.billableHours)}h</dd></div>
          </dl>
          <button type="button" className="profile-edit" onClick={() => setProfileOpen(true)}>Ajustar minha base</button>
          <div className="profile-insights">
            <span>leitura rápida</span>
            <div><small>Multiplicador</small><strong>{number.format(result.commercialMultiplier)}×</strong></div>
            <div><small>Horas</small><strong>{number.format(result.totalHours)}h</strong></div>
            <div><small>Sobra</small><strong>{number.format(result.expectedNetPercent)}%</strong></div>
          </div>
        </aside>

        <section className="editor-panel">
          <div className="editor-top">
            <div><span className="editor-kicker">orçamento atual</span><h1>{input.projectName || "Novo projeto"}</h1></div>
            <button type="button" className="icon-button" onClick={reset} aria-label="Limpar orçamento" title="Limpar orçamento"><RotateCcw size={17} /></button>
          </div>
          <nav className="tool-tabs" aria-label="Partes do orçamento">
            <button type="button" className={activeView === "project" ? "is-active" : ""} onClick={() => setActiveView("project")}><FolderKanban size={17} /><span>Demanda</span></button>
            <button type="button" className={activeView === "time" ? "is-active" : ""} onClick={() => setActiveView("time")}><Clock3 size={17} /><span>Tempo</span></button>
            <button type="button" className={activeView === "context" ? "is-active" : ""} onClick={() => setActiveView("context")}><SlidersHorizontal size={17} /><span>Contexto</span></button>
            <button type="button" className={activeView === "finance" ? "is-active" : ""} onClick={() => setActiveView("finance")}><Receipt size={17} /><span>Custos</span></button>
          </nav>
          <div className="editor-body">
            {activeView === "project" ? renderProjectView() : null}
            {activeView === "time" ? renderTimeView() : null}
            {activeView === "context" ? renderContextView() : null}
            {activeView === "finance" ? renderFinanceView() : null}
          </div>
        </section>

        <aside className="result-panel" aria-live="polite">
          <div className="result-topline"><span>valor para cobrar</span><span className="status-pill">atualizado</span></div>
          <div className="result-price"><strong>{currency.format(result.finalPrice)}</strong><span>{input.discount > 0 ? `${input.discount}% de desconto aplicado` : "preço recomendado"}</span></div>
          <div className="price-bounds">
            <div><span>piso</span><strong>{currency.format(result.floorPrice)}</strong></div>
            <div><span>recomendado</span><strong>{currency.format(result.recommendedPrice)}</strong></div>
            <div><span>premium</span><strong>{currency.format(result.premiumPrice)}</strong></div>
          </div>
          <div className="result-metrics">
            <div><span>hora efetiva</span><strong>{currency.format(result.effectiveHourlyRate)}</strong></div>
            <div><span>sobra estimada</span><strong>{currency.format(result.expectedNet)}</strong></div>
            <div><span>margem final</span><strong>{number.format(result.expectedNetPercent)}%</strong></div>
            <div><span>horas totais</span><strong>{number.format(result.totalHours)}h</strong></div>
          </div>
          <div className="payment-row">
            <div><span>entrada</span><strong>{currency.format(result.entryPrice)}</strong></div>
            <div><span>entrega</span><strong>{currency.format(result.finalPayment)}</strong></div>
          </div>
          {result.warnings.length ? (
            <div className="warning-box"><AlertTriangle size={16} /><span>{result.warnings[0]}</span>{result.warnings.length > 1 ? <small>+{result.warnings.length - 1} alerta(s)</small> : null}</div>
          ) : (
            <div className="healthy-box"><Check size={16} /><span>Orçamento equilibrado.</span></div>
          )}
          <div className="result-actions">
            <button type="button" className="save-button" onClick={saveQuote}>{saved ? <Check size={17} /> : <Save size={17} />}<span>{saved ? "Salvo" : "Salvar"}</span></button>
            <button type="button" onClick={copySummary} aria-label="Copiar resumo" title="Copiar resumo">{copied ? <Check size={17} /> : <Copy size={17} />}</button>
            <button type="button" onClick={downloadSummary} aria-label="Baixar orçamento" title="Baixar orçamento"><Download size={17} /></button>
          </div>
        </aside>
      </div>

      <nav className="mobile-dock" aria-label="Navegação do orçamento no celular">
        <button type="button" className={activeView === "project" ? "is-active" : ""} onClick={() => setActiveView("project")}><FolderKanban size={18} /><span>Demanda</span></button>
        <button type="button" className={activeView === "time" ? "is-active" : ""} onClick={() => setActiveView("time")}><Clock3 size={18} /><span>Tempo</span></button>
        <button type="button" className={activeView === "context" ? "is-active" : ""} onClick={() => setActiveView("context")}><SlidersHorizontal size={18} /><span>Ajustes</span></button>
        <button type="button" className={activeView === "finance" ? "is-active" : ""} onClick={() => setActiveView("finance")}><Receipt size={18} /><span>Custos</span></button>
      </nav>

      {profileOpen ? (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setProfileOpen(false)}>
          <section className="side-sheet profile-sheet" role="dialog" aria-modal="true" aria-label="Configurar minha hora" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-header"><div><span>perfil de preço</span><h2>Minha hora</h2></div><button type="button" className="icon-button" onClick={() => setProfileOpen(false)} aria-label="Fechar"><X size={18} /></button></div>
            <p className="sheet-intro">Esses valores viram sua referência e podem ficar salvos neste navegador.</p>
            <div className="sheet-fields">
              <NumberField label="Meta mensal" value={input.monthlyTarget} prefix="R$" step={100} onChange={(value) => set("monthlyTarget", value)} />
              <NumberField label="Custos mensais" value={input.monthlyCosts} prefix="R$" step={50} onChange={(value) => set("monthlyCosts", value)} />
              <NumberField label="Horas faturáveis" hint="Só o tempo que realmente pode virar receita." value={input.billableHours} suffix="h" min={1} max={220} onChange={(value) => set("billableHours", value)} />
              <NumberField label="Impostos padrão" value={input.taxes} suffix="%" max={45} step={0.5} onChange={(value) => set("taxes", value)} />
              <NumberField label="Taxa padrão" value={input.paymentFee} suffix="%" max={20} step={0.5} onChange={(value) => set("paymentFee", value)} />
              <NumberField label="Margem padrão" value={input.margin} suffix="%" max={45} onChange={(value) => set("margin", value)} />
            </div>
            <div className="profile-preview"><span>hora-base calculada</span><strong>{currency.format(result.baseHourlyRate)}</strong></div>
            <button type="button" className="sheet-primary" onClick={saveProfile}>{profileSaved ? <Check size={17} /> : <Save size={17} />}{profileSaved ? "Base salva" : "Salvar como minha base"}</button>
          </section>
        </div>
      ) : null}

      {historyOpen ? (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setHistoryOpen(false)}>
          <section className="side-sheet history-sheet" role="dialog" aria-modal="true" aria-label="Histórico de orçamentos" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-header"><div><span>referências salvas</span><h2>Histórico</h2></div><button type="button" className="icon-button" onClick={() => setHistoryOpen(false)} aria-label="Fechar"><X size={18} /></button></div>
            {history.length ? (
              <div className="history-list">
                {history.map((item) => (
                  <article key={item.id} className="history-item">
                    <button type="button" className="history-load" onClick={() => loadSaved(item)}>
                      <span><strong>{item.name}</strong><small>{labels.projectType[item.input.projectType]} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(item.createdAt))}</small></span>
                      <b>{currency.format(item.price)}</b>
                    </button>
                    <button type="button" className="history-delete" aria-label={`Excluir ${item.name}`} onClick={() => removeSaved(item.id)}><Trash2 size={16} /></button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><History size={22} /><strong>Nenhuma referência salva.</strong><p>Salve um cálculo quando ele fizer sentido para usar depois.</p></div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
