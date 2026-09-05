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
  type PricingMode,
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
  pricingMode?: PricingMode;
};

type ViewKey = "project" | "time" | "context" | "finance";
type SelectionKey = "projectType" | "workModel" | "complexity" | "scope" | "urgency";
type SelectionState = Record<SelectionKey, boolean>;

const HISTORY_KEY = "mond:quotes";
const PROFILE_KEY = "mond:pricing-profile";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const EMPTY_SELECTIONS: SelectionState = {
  projectType: false,
  workModel: false,
  complexity: false,
  scope: false,
  urgency: false,
};

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

const pricingModeDescriptions: Record<PricingMode, string> = {
  starter: "Preço mais agressivo para facilitar fechamento e ganhar volume.",
  balanced: "Usa sua hora sustentável inteira e protege melhor a margem.",
  positioned: "Para clientes com maior valor percebido ou melhor posicionamento comercial.",
};

function readJson<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

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
          value={value === 0 ? "" : value}
          min={min}
          max={max}
          step={step}
          placeholder="—"
          onChange={(event) => {
            if (event.target.value === "") {
              onChange(0);
              return;
            }

            const parsed = Number(event.target.value.replace(",", "."));
            if (!Number.isFinite(parsed)) return;

            onChange(Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, parsed)));
          }}
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
  value: T | null;
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
  const [input, setInput] = useState<QuoteInput>(() => ({ ...DEFAULT_QUOTE }));
  const [pricingMode, setPricingMode] = useState<PricingMode | null>(null);
  const [selected, setSelected] = useState<SelectionState>(EMPTY_SELECTIONS);
  const [activeView, setActiveView] = useState<ViewKey>("project");
  const [history, setHistory] = useState<SavedQuote[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const calculationMode = pricingMode ?? "balanced";
  const result = useMemo(() => calculateQuote(input, calculationMode), [input, calculationMode]);

  const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const choose = <K extends SelectionKey>(key: K, value: QuoteInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setSelected((current) => ({ ...current, [key]: true }));
  };

  useEffect(() => {
    const storedHistory = readJson<SavedQuote[]>(HISTORY_KEY);
    if (storedHistory) setHistory(storedHistory);

    const profile = readJson<Partial<QuoteInput>>(PROFILE_KEY);
    if (!profile) return;

    setInput((current) => ({
      ...current,
      monthlyTarget: profile.monthlyTarget ?? 0,
      monthlyCosts: profile.monthlyCosts ?? 0,
      billableHours: profile.billableHours ?? 0,
      taxes: profile.taxes ?? 0,
      paymentFee: profile.paymentFee ?? 0,
      margin: profile.margin ?? 0,
    }));
  }, []);

  const missing = useMemo(() => {
    const items: string[] = [];

    if (!pricingMode) items.push("modo de preço");
    if (!selected.projectType) items.push("tipo de projeto");
    if (!selected.workModel) items.push("modelo do trabalho");
    if (!selected.complexity) items.push("complexidade");
    if (!selected.scope) items.push("escopo");
    if (!selected.urgency) items.push("urgência");
    if (input.executionHours <= 0) items.push("horas de execução");
    if (input.revisions <= 0) items.push("revisões");
    if (input.billableHours <= 0 || input.monthlyTarget + input.monthlyCosts <= 0) {
      items.push("sua base de preço");
    }

    return items;
  }, [
    input.billableHours,
    input.executionHours,
    input.monthlyCosts,
    input.monthlyTarget,
    input.revisions,
    pricingMode,
    selected,
  ]);

  const isReady = missing.length === 0;
  const hasPricingBase = input.billableHours > 0 && input.monthlyTarget + input.monthlyCosts > 0;
  const maxDiscount = Math.floor(result.maxSafeDiscount);
  const safeDiscount = input.discount <= result.maxSafeDiscount + 0.2;

  const showMoney = (value: number) => (isReady ? currency.format(value) : "—");
  const showMetric = (value: number, suffix = "") =>
    isReady ? `${number.format(value)}${suffix}` : "—";

  const summary = useMemo(() => {
    if (!isReady || !pricingMode) {
      return "Complete as opções do orçamento antes de gerar o resumo.";
    }

    return [
      `ORÇAMENTO — ${input.projectName || "Novo projeto"}`,
      `${labels.projectType[input.projectType]} · ${labels.workModel[input.workModel]}`,
      `Modo de preço: ${labels.pricingMode[pricingMode]}`,
      "",
      `Horas previstas: ${number.format(result.totalHours)}h`,
      `Hora-base sustentável: ${currency.format(result.baseHourlyRate)}/h`,
      `Hora comercial do modo: ${currency.format(result.pricingHourlyRate)}/h`,
      `Preço mínimo do modo: ${currency.format(result.floorPrice)}`,
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
    ].join("\n");
  }, [input, isReady, pricingMode, result]);

  const copySummary = async () => {
    if (!isReady) return;

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
    if (!isReady) return;

    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${(input.projectName || "orcamento").toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveQuote = () => {
    if (!isReady || !pricingMode) return;

    const item: SavedQuote = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
      name: input.projectName || "Novo projeto",
      price: result.finalPrice,
      createdAt: new Date().toISOString(),
      input,
      pricingMode,
    };

    const next = [item, ...history].slice(0, 8);
    setHistory(next);
    writeJson(HISTORY_KEY, next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const saveProfile = () => {
    if (!hasPricingBase) return;

    writeJson(PROFILE_KEY, {
      monthlyTarget: input.monthlyTarget,
      monthlyCosts: input.monthlyCosts,
      billableHours: input.billableHours,
      taxes: input.taxes,
      paymentFee: input.paymentFee,
      margin: input.margin,
    });

    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 1600);
  };

  const removeSaved = (id: string) => {
    const next = history.filter((item) => item.id !== id);
    setHistory(next);
    writeJson(HISTORY_KEY, next);
  };

  const loadSaved = (item: SavedQuote) => {
    setInput(item.input);
    setPricingMode(item.pricingMode ?? "balanced");
    setSelected({
      projectType: true,
      workModel: true,
      complexity: true,
      scope: true,
      urgency: true,
    });
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
    setPricingMode(null);
    setSelected(EMPTY_SELECTIONS);
    setActiveView("project");
  };

  const renderProjectView = () => (
    <div className="view-stack">
      <label className="project-name-field">
        <span>Nome da demanda</span>
        <input
          value={input.projectName}
          maxLength={70}
          onChange={(event) => set("projectName", event.target.value)}
          placeholder="Ex.: Landing page para clínica"
        />
      </label>

      <div className="control-block pricing-mode-block">
        <div className="control-heading">
          <strong>Modo de preço</strong>
          <span>
            {pricingMode
              ? pricingModeDescriptions[pricingMode]
              : "Escolha como você quer posicionar este orçamento."}
          </span>
        </div>
        <ChoiceGroup<PricingMode>
          value={pricingMode}
          onChange={setPricingMode}
          options={[
            { value: "starter", label: "Captação", meta: "mais fácil de fechar" },
            { value: "balanced", label: "Equilibrado", meta: "sustentável" },
            { value: "positioned", label: "Posicionado", meta: "maior valor" },
          ]}
          columns={3}
        />
      </div>

      <div className="control-block">
        <div className="control-heading">
          <strong>Tipo de projeto</strong>
          <span>
            {selected.projectType
              ? projectDescriptions[input.projectType]
              : "Selecione o tipo desta demanda."}
          </span>
        </div>
        <ChoiceGroup<ProjectType>
          value={selected.projectType ? input.projectType : null}
          onChange={(value) => choose("projectType", value)}
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
          <span>
            {selected.workModel
              ? workDescriptions[input.workModel]
              : "Selecione a relação comercial deste trabalho."}
          </span>
        </div>
        <ChoiceGroup<WorkModel>
          value={selected.workModel ? input.workModel : null}
          onChange={(value) => choose("workModel", value)}
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
          <span>tempo informado</span>
          <strong>
            {input.executionHours || input.meetingHours || input.supportHours
              ? `${number.format(result.totalHours)}h`
              : "—"}
          </strong>
        </div>
        <p>Preencha o tempo real da demanda. Nada vem estimado automaticamente.</p>
      </div>

      <div className="field-grid">
        <NumberField
          label="Execução"
          hint="Design, código, configuração e testes."
          value={input.executionHours}
          suffix="h"
          step={0.5}
          onChange={(value) => set("executionHours", value)}
        />
        <NumberField
          label="Reuniões"
          hint="Calls, apresentação e alinhamentos."
          value={input.meetingHours}
          suffix="h"
          step={0.5}
          onChange={(value) => set("meetingHours", value)}
        />
        <NumberField
          label="Pós-entrega"
          hint="Publicação, suporte e pequenos ajustes."
          value={input.supportHours}
          suffix="h"
          step={0.5}
          onChange={(value) => set("supportHours", value)}
        />
        <NumberField
          label="Revisões"
          hint={
            input.revisions > 0
              ? `${number.format(result.revisionHours)}h de buffer calculado.`
              : "Informe quantas rodadas serão incluídas."
          }
          value={input.revisions}
          suffix="x"
          min={1}
          max={8}
          onChange={(value) => set("revisions", Math.round(value))}
        />
      </div>
    </div>
  );

  const renderContextView = () => (
    <div className="view-stack compact-groups">
      <div className="control-block">
        <div className="control-heading">
          <strong>Complexidade</strong>
          <span>Escolha o nível técnico da demanda.</span>
        </div>
        <ChoiceGroup<Level>
          value={selected.complexity ? input.complexity : null}
          onChange={(value) => choose("complexity", value)}
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
        <div className="control-heading">
          <strong>Escopo</strong>
          <span>Escolha o quanto o escopo está definido.</span>
        </div>
        <ChoiceGroup<ScopeLevel>
          value={selected.scope ? input.scope : null}
          onChange={(value) => choose("scope", value)}
          options={[
            { value: "clear", label: "Fechado", meta: "base" },
            { value: "partial", label: "Parcial", meta: "+10%" },
            { value: "open", label: "Aberto", meta: "+22%" },
          ]}
          columns={3}
        />
      </div>

      <div className="control-block">
        <div className="control-heading">
          <strong>Urgência</strong>
          <span>Escolha o prazo real combinado com o cliente.</span>
        </div>
        <ChoiceGroup<Urgency>
          value={selected.urgency ? input.urgency : null}
          onChange={(value) => choose("urgency", value)}
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
        <NumberField
          label="Despesa do projeto"
          hint="Licença, plugin, mídia ou compra específica."
          value={input.projectExpenses}
          prefix="R$"
          step={10}
          onChange={(value) => set("projectExpenses", value)}
        />
        <NumberField
          label="Impostos"
          value={input.taxes}
          suffix="%"
          max={45}
          step={0.5}
          onChange={(value) => set("taxes", value)}
        />
        <NumberField
          label="Taxa de pagamento"
          value={input.paymentFee}
          suffix="%"
          max={20}
          step={0.5}
          onChange={(value) => set("paymentFee", value)}
        />
        <NumberField
          label="Margem"
          value={input.margin}
          suffix="%"
          max={45}
          onChange={(value) => set("margin", value)}
        />
        <NumberField
          label="Desconto"
          hint={
            isReady
              ? `Limite seguro agora: ~${maxDiscount}%`
              : "Preencha o restante para calcular o limite."
          }
          value={input.discount}
          suffix="%"
          max={60}
          onChange={(value) => set("discount", value)}
        />
      </div>

      <label className="travel-toggle">
        <span className="travel-toggle-copy">
          <MapPin size={18} />
          <span>
            <strong>Deslocamento</strong>
            <small>Ative somente quando houver saída presencial.</small>
          </span>
        </span>
        <input
          type="checkbox"
          checked={input.travelEnabled}
          onChange={(event) => set("travelEnabled", event.target.checked)}
        />
        <span className="toggle-ui" aria-hidden="true" />
      </label>

      {input.travelEnabled ? (
        <div className="field-grid travel-fields">
          <NumberField
            label="Km por saída"
            value={input.kmPerTrip}
            suffix="km"
            onChange={(value) => set("kmPerTrip", value)}
          />
          <NumberField
            label="Saídas"
            value={input.trips}
            suffix="x"
            min={1}
            onChange={(value) => set("trips", Math.round(value))}
          />
          <NumberField
            label="Custo por km"
            value={input.costPerKm}
            prefix="R$"
            step={0.05}
            onChange={(value) => set("costPerKm", value)}
          />
          <NumberField
            label="Tempo na rua"
            value={input.travelHours}
            suffix="h"
            step={0.5}
            onChange={(value) => set("travelHours", value)}
          />
        </div>
      ) : null}

      <div className={`health-line ${isReady && safeDiscount ? "is-safe" : "is-risk"}`}>
        {isReady && safeDiscount ? <Check size={16} /> : <AlertTriangle size={16} />}
        <span>
          {isReady
            ? safeDiscount
              ? "Preço protegido com as escolhas atuais."
              : "O desconto atual invade o preço mínimo calculado."
            : `Faltam ${missing.length} item(ns) para fechar o cálculo.`}
        </span>
      </div>
    </div>
  );

  return (
    <main className="mond-tool">
      <header className="tool-header">
        <div className="brand-lockup" aria-label="Mond Orçamentos">
          <span className="brand-glyph">m</span>
          <span className="brand-name">mond</span>
          <span className="brand-divider">/</span>
          <span className="brand-product">orçamentos</span>
        </div>
        <div className="header-actions">
          <button type="button" className="header-chip" onClick={() => setProfileOpen(true)}>
            <Gauge size={16} />
            <span>
              {result.baseHourlyRate > 0 ? `${currency.format(result.baseHourlyRate)}/h` : "Minha hora"}
            </span>
          </button>
          <button type="button" className="header-chip" onClick={() => setHistoryOpen(true)}>
            <History size={16} />
            <span>Histórico</span>
            {history.length ? <b>{history.length}</b> : null}
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="profile-panel">
          <div className="panel-label">
            <span>Base da Mond</span>
            <button type="button" onClick={() => setProfileOpen(true)} aria-label="Editar minha hora">
              <Settings2 size={16} />
            </button>
          </div>
          <div className="profile-rate">
            <span>sua hora-base</span>
            <strong>{result.baseHourlyRate > 0 ? currency.format(result.baseHourlyRate) : "—"}</strong>
            <small>por hora faturável</small>
          </div>
          <dl className="profile-list">
            <div>
              <dt>Meta mensal</dt>
              <dd>{input.monthlyTarget > 0 ? currency.format(input.monthlyTarget) : "—"}</dd>
            </div>
            <div>
              <dt>Custos fixos</dt>
              <dd>{input.monthlyCosts > 0 ? currency.format(input.monthlyCosts) : "—"}</dd>
            </div>
            <div>
              <dt>Horas vendáveis</dt>
              <dd>{input.billableHours > 0 ? `${number.format(input.billableHours)}h` : "—"}</dd>
            </div>
          </dl>
          <button type="button" className="profile-edit" onClick={() => setProfileOpen(true)}>
            Ajustar minha base
          </button>
          <div className="profile-insights">
            <span>leitura rápida</span>
            <div>
              <small>Modo</small>
              <strong>{pricingMode ? labels.pricingMode[pricingMode] : "—"}</strong>
            </div>
            <div>
              <small>Horas</small>
              <strong>{input.executionHours > 0 ? `${number.format(result.totalHours)}h` : "—"}</strong>
            </div>
            <div>
              <small>Status</small>
              <strong>{isReady ? "Pronto" : `${missing.length} falta(m)`}</strong>
            </div>
          </div>
        </aside>

        <section className="editor-panel">
          <div className="editor-top">
            <div>
              <span className="editor-kicker">orçamento atual</span>
              <h1>{input.projectName || "Novo orçamento"}</h1>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={reset}
              aria-label="Limpar orçamento"
              title="Limpar orçamento"
            >
              <RotateCcw size={17} />
            </button>
          </div>

          <nav className="tool-tabs" aria-label="Partes do orçamento">
            <button
              type="button"
              className={activeView === "project" ? "is-active" : ""}
              onClick={() => setActiveView("project")}
            >
              <FolderKanban size={17} />
              <span>Demanda</span>
            </button>
            <button
              type="button"
              className={activeView === "time" ? "is-active" : ""}
              onClick={() => setActiveView("time")}
            >
              <Clock3 size={17} />
              <span>Tempo</span>
            </button>
            <button
              type="button"
              className={activeView === "context" ? "is-active" : ""}
              onClick={() => setActiveView("context")}
            >
              <SlidersHorizontal size={17} />
              <span>Contexto</span>
            </button>
            <button
              type="button"
              className={activeView === "finance" ? "is-active" : ""}
              onClick={() => setActiveView("finance")}
            >
              <Receipt size={17} />
              <span>Custos</span>
            </button>
          </nav>

          <div className="editor-body">
            {activeView === "project" ? renderProjectView() : null}
            {activeView === "time" ? renderTimeView() : null}
            {activeView === "context" ? renderContextView() : null}
            {activeView === "finance" ? renderFinanceView() : null}
          </div>
        </section>

        <aside className="result-panel" aria-live="polite">
          <div className="result-topline">
            <span>valor para cobrar</span>
            <span className="status-pill">{isReady ? "atualizado" : "aguardando"}</span>
          </div>
          <div className="result-price">
            <strong>{showMoney(result.finalPrice)}</strong>
            <span>
              {isReady && pricingMode
                ? `${labels.pricingMode[pricingMode]} · ${input.discount > 0 ? `${input.discount}% de desconto aplicado` : "preço recomendado"}`
                : "preencha as opções para calcular"}
            </span>
          </div>
          <div className="price-bounds">
            <div>
              <span>piso</span>
              <strong>{showMoney(result.floorPrice)}</strong>
            </div>
            <div>
              <span>recomendado</span>
              <strong>{showMoney(result.recommendedPrice)}</strong>
            </div>
            <div>
              <span>premium</span>
              <strong>{showMoney(result.premiumPrice)}</strong>
            </div>
          </div>
          <div className="result-metrics">
            <div>
              <span>hora comercial</span>
              <strong>{showMoney(result.pricingHourlyRate)}</strong>
            </div>
            <div>
              <span>sobra estimada</span>
              <strong>{showMoney(result.expectedNet)}</strong>
            </div>
            <div>
              <span>margem final</span>
              <strong>{showMetric(result.expectedNetPercent, "%")}</strong>
            </div>
            <div>
              <span>horas totais</span>
              <strong>{showMetric(result.totalHours, "h")}</strong>
            </div>
          </div>
          <div className="payment-row">
            <div>
              <span>entrada</span>
              <strong>{showMoney(result.entryPrice)}</strong>
            </div>
            <div>
              <span>entrega</span>
              <strong>{showMoney(result.finalPayment)}</strong>
            </div>
          </div>

          {!isReady ? (
            <div className="warning-box">
              <AlertTriangle size={16} />
              <span>
                Complete: {missing.slice(0, 3).join(", ")}
                {missing.length > 3 ? ` +${missing.length - 3}` : ""}.
              </span>
            </div>
          ) : result.warnings.length ? (
            <div className="warning-box">
              <AlertTriangle size={16} />
              <span>{result.warnings[0]}</span>
              {result.warnings.length > 1 ? <small>+{result.warnings.length - 1} alerta(s)</small> : null}
            </div>
          ) : (
            <div className="healthy-box">
              <Check size={16} />
              <span>Orçamento equilibrado.</span>
            </div>
          )}

          <div className="result-actions">
            <button type="button" className="save-button" disabled={!isReady} onClick={saveQuote}>
              {saved ? <Check size={17} /> : <Save size={17} />}
              <span>{saved ? "Salvo" : "Salvar"}</span>
            </button>
            <button
              type="button"
              disabled={!isReady}
              onClick={copySummary}
              aria-label="Copiar resumo"
              title="Copiar resumo"
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
            <button
              type="button"
              disabled={!isReady}
              onClick={downloadSummary}
              aria-label="Baixar orçamento"
              title="Baixar orçamento"
            >
              <Download size={17} />
            </button>
          </div>
        </aside>
      </div>

      <nav className="mobile-dock" aria-label="Navegação do orçamento no celular">
        <button
          type="button"
          className={activeView === "project" ? "is-active" : ""}
          onClick={() => setActiveView("project")}
        >
          <FolderKanban size={18} />
          <span>Demanda</span>
        </button>
        <button
          type="button"
          className={activeView === "time" ? "is-active" : ""}
          onClick={() => setActiveView("time")}
        >
          <Clock3 size={18} />
          <span>Tempo</span>
        </button>
        <button
          type="button"
          className={activeView === "context" ? "is-active" : ""}
          onClick={() => setActiveView("context")}
        >
          <SlidersHorizontal size={18} />
          <span>Ajustes</span>
        </button>
        <button
          type="button"
          className={activeView === "finance" ? "is-active" : ""}
          onClick={() => setActiveView("finance")}
        >
          <Receipt size={18} />
          <span>Custos</span>
        </button>
      </nav>

      {profileOpen ? (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setProfileOpen(false)}>
          <section
            className="side-sheet profile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Configurar minha hora"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-header">
              <div>
                <span>perfil de preço</span>
                <h2>Minha hora</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setProfileOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <p className="sheet-intro">
              Nada é preenchido por padrão. Defina sua referência e salve apenas se quiser reutilizá-la.
            </p>
            <div className="sheet-fields">
              <NumberField
                label="Meta mensal"
                value={input.monthlyTarget}
                prefix="R$"
                step={100}
                onChange={(value) => set("monthlyTarget", value)}
              />
              <NumberField
                label="Custos mensais"
                value={input.monthlyCosts}
                prefix="R$"
                step={50}
                onChange={(value) => set("monthlyCosts", value)}
              />
              <NumberField
                label="Horas faturáveis"
                hint="Só o tempo que realmente pode virar receita."
                value={input.billableHours}
                suffix="h"
                min={1}
                max={220}
                onChange={(value) => set("billableHours", value)}
              />
              <NumberField
                label="Impostos padrão"
                value={input.taxes}
                suffix="%"
                max={45}
                step={0.5}
                onChange={(value) => set("taxes", value)}
              />
              <NumberField
                label="Taxa padrão"
                value={input.paymentFee}
                suffix="%"
                max={20}
                step={0.5}
                onChange={(value) => set("paymentFee", value)}
              />
              <NumberField
                label="Margem padrão"
                value={input.margin}
                suffix="%"
                max={45}
                onChange={(value) => set("margin", value)}
              />
            </div>
            <div className="profile-preview">
              <span>hora-base calculada</span>
              <strong>{result.baseHourlyRate > 0 ? currency.format(result.baseHourlyRate) : "—"}</strong>
            </div>
            <button
              type="button"
              className="sheet-primary"
              disabled={!hasPricingBase}
              onClick={saveProfile}
            >
              {profileSaved ? <Check size={17} /> : <Save size={17} />}
              {profileSaved ? "Base salva" : "Salvar como minha base"}
            </button>
          </section>
        </div>
      ) : null}

      {historyOpen ? (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setHistoryOpen(false)}>
          <section
            className="side-sheet history-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Histórico de orçamentos"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-header">
              <div>
                <span>referências salvas</span>
                <h2>Histórico</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {history.length ? (
              <div className="history-list">
                {history.map((item) => (
                  <article key={item.id} className="history-item">
                    <button type="button" className="history-load" onClick={() => loadSaved(item)}>
                      <span>
                        <strong>{item.name}</strong>
                        <small>
                          {labels.projectType[item.input.projectType]} · {labels.pricingMode[item.pricingMode ?? "balanced"]} ·{" "}
                          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(item.createdAt))}
                        </small>
                      </span>
                      <b>{currency.format(item.price)}</b>
                    </button>
                    <button
                      type="button"
                      className="history-delete"
                      aria-label={`Excluir ${item.name}`}
                      onClick={() => removeSaved(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <History size={22} />
                <strong>Nenhuma referência salva.</strong>
                <p>Salve um cálculo quando ele fizer sentido para usar depois.</p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
