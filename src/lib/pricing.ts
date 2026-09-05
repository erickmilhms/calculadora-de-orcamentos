export type ProjectType = "adjustment" | "landing" | "site" | "ecommerce" | "webapp" | "automation";
export type WorkModel = "direct" | "freelance" | "whitelabel" | "recurring";
export type Level = "low" | "medium" | "high" | "extreme";
export type ScopeLevel = "clear" | "partial" | "open";
export type Urgency = "normal" | "fast" | "rush" | "critical";

export interface QuoteInput {
  projectName: string;
  projectType: ProjectType;
  workModel: WorkModel;
  executionHours: number;
  meetingHours: number;
  supportHours: number;
  revisions: number;
  complexity: Level;
  scope: ScopeLevel;
  urgency: Urgency;
  monthlyTarget: number;
  monthlyCosts: number;
  billableHours: number;
  taxes: number;
  margin: number;
  paymentFee: number;
  projectExpenses: number;
  travelEnabled: boolean;
  kmPerTrip: number;
  trips: number;
  costPerKm: number;
  travelHours: number;
  discount: number;
}

export interface QuoteResult {
  baseHourlyRate: number;
  totalHours: number;
  revisionHours: number;
  laborCost: number;
  travelCost: number;
  directCosts: number;
  adjustedCost: number;
  floorPrice: number;
  recommendedPrice: number;
  premiumPrice: number;
  finalPrice: number;
  entryPrice: number;
  finalPayment: number;
  maxSafeDiscount: number;
  effectiveHourlyRate: number;
  expectedNet: number;
  expectedNetPercent: number;
  commercialMultiplier: number;
  warnings: string[];
}

export const DEFAULT_QUOTE: QuoteInput = {
  projectName: "Novo projeto",
  projectType: "landing",
  workModel: "direct",
  executionHours: 18,
  meetingHours: 2,
  supportHours: 2,
  revisions: 2,
  complexity: "medium",
  scope: "clear",
  urgency: "normal",
  monthlyTarget: 5000,
  monthlyCosts: 650,
  billableHours: 100,
  taxes: 6,
  margin: 22,
  paymentFee: 0,
  projectExpenses: 0,
  travelEnabled: false,
  kmPerTrip: 0,
  trips: 1,
  costPerKm: 1.35,
  travelHours: 0,
  discount: 0,
};

const projectFactors: Record<ProjectType, number> = {
  adjustment: 0.95,
  landing: 1,
  site: 1.06,
  ecommerce: 1.16,
  webapp: 1.22,
  automation: 1.18,
};

const workFactors: Record<WorkModel, number> = {
  direct: 1,
  freelance: 0.96,
  whitelabel: 1.08,
  recurring: 0.92,
};

const complexityFactors: Record<Level, number> = {
  low: 1,
  medium: 1.15,
  high: 1.32,
  extreme: 1.52,
};

const scopeFactors: Record<ScopeLevel, number> = {
  clear: 1,
  partial: 1.1,
  open: 1.22,
};

const urgencyFactors: Record<Urgency, number> = {
  normal: 1,
  fast: 1.12,
  rush: 1.28,
  critical: 1.48,
};

const clean = (value: number, fallback = 0) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const roundUp = (value: number, step = 50) => Math.ceil(value / step) * step;

export function calculateQuote(raw: QuoteInput): QuoteResult {
  const input = {
    ...raw,
    executionHours: clean(raw.executionHours),
    meetingHours: clean(raw.meetingHours),
    supportHours: clean(raw.supportHours),
    revisions: Math.max(1, Math.min(8, Math.round(clean(raw.revisions, 1)))),
    monthlyTarget: clean(raw.monthlyTarget),
    monthlyCosts: clean(raw.monthlyCosts),
    billableHours: Math.max(1, clean(raw.billableHours, 1)),
    taxes: Math.min(45, clean(raw.taxes)),
    margin: Math.min(45, clean(raw.margin)),
    paymentFee: Math.min(20, clean(raw.paymentFee)),
    projectExpenses: clean(raw.projectExpenses),
    kmPerTrip: clean(raw.kmPerTrip),
    trips: Math.max(0, Math.round(clean(raw.trips))),
    costPerKm: clean(raw.costPerKm),
    travelHours: clean(raw.travelHours),
    discount: Math.min(60, clean(raw.discount)),
  };

  const baseHourlyRate = (input.monthlyTarget + input.monthlyCosts) / input.billableHours;
  const revisionHours = Math.max(0, input.revisions - 1) * 0.75;
  const workingHours = input.executionHours + input.meetingHours + input.supportHours + revisionHours;
  const totalHours = workingHours + (input.travelEnabled ? input.travelHours : 0);
  const laborCost = workingHours * baseHourlyRate;

  const commercialMultiplier =
    projectFactors[input.projectType] *
    workFactors[input.workModel] *
    complexityFactors[input.complexity] *
    scopeFactors[input.scope] *
    urgencyFactors[input.urgency];

  const adjustedLabor = laborCost * commercialMultiplier;
  const travelCost = input.travelEnabled
    ? input.kmPerTrip * input.trips * input.costPerKm + input.travelHours * baseHourlyRate
    : 0;
  const directCosts = input.projectExpenses + travelCost;
  const adjustedCost = adjustedLabor + directCosts;

  const taxFeeRate = (input.taxes + input.paymentFee) / 100;
  const recommendedRate = (input.taxes + input.paymentFee + input.margin) / 100;
  const floorDenominator = Math.max(0.4, 1 - taxFeeRate);
  const recommendedDenominator = Math.max(0.35, 1 - recommendedRate);

  const floorPrice = roundUp(adjustedCost / floorDenominator);
  const recommendedPrice = roundUp(adjustedCost / recommendedDenominator);
  const premiumPrice = roundUp(recommendedPrice * 1.18);

  const maxSafeDiscount = Math.max(0, Math.min(60, (1 - floorPrice / recommendedPrice) * 100));
  const finalPrice = roundUp(recommendedPrice * (1 - input.discount / 100));
  const entryPrice = roundUp(finalPrice * 0.5, 10);
  const finalPayment = Math.max(0, finalPrice - entryPrice);

  const taxesAndFees = finalPrice * taxFeeRate;
  const expectedNet = finalPrice - taxesAndFees - adjustedCost;
  const expectedNetPercent = finalPrice > 0 ? (expectedNet / finalPrice) * 100 : 0;
  const effectiveHourlyRate = totalHours > 0 ? (finalPrice - directCosts) / totalHours : 0;

  const warnings: string[] = [];
  if (input.discount > maxSafeDiscount + 0.2) {
    warnings.push("O desconto passou do limite seguro e invade seu preço mínimo.");
  }
  if (input.billableHours > 140) {
    warnings.push("Muitas horas faturáveis no mês podem deixar sua hora artificialmente barata.");
  }
  if (input.scope === "open") {
    warnings.push("Escopo aberto: registre entregáveis e limite de revisões antes de fechar.");
  }
  if (input.urgency === "critical") {
    warnings.push("Prazo crítico: confirme disponibilidade real antes de vender a urgência.");
  }
  if (expectedNetPercent < 8) {
    warnings.push("A sobra estimada ficou baixa para absorver imprevistos.");
  }
  if (totalHours <= 0) {
    warnings.push("Informe pelo menos uma hora de trabalho para formar o orçamento.");
  }

  return {
    baseHourlyRate,
    totalHours,
    revisionHours,
    laborCost,
    travelCost,
    directCosts,
    adjustedCost,
    floorPrice,
    recommendedPrice,
    premiumPrice,
    finalPrice,
    entryPrice,
    finalPayment,
    maxSafeDiscount,
    effectiveHourlyRate,
    expectedNet,
    expectedNetPercent,
    commercialMultiplier,
    warnings,
  };
}

export const labels = {
  projectType: {
    adjustment: "Ajuste pontual",
    landing: "Landing page",
    site: "Site institucional",
    ecommerce: "E-commerce",
    webapp: "Web app / sistema",
    automation: "Automação / integração",
  } satisfies Record<ProjectType, string>,
  workModel: {
    direct: "Cliente direto",
    freelance: "Freela / subcontrato",
    whitelabel: "White-label",
    recurring: "Cliente recorrente",
  } satisfies Record<WorkModel, string>,
};
