// Shared by Android, the web field flow and BKO. IDs are permanent; labels are snapshots.
export const GROUPS = [
  {
    id: "trade",
    label: "Exposição e merchandising",
    description: "Ponto natural, pontos extras e execução no PDV",
  },
  {
    id: "commercial",
    label: "Vendas e experiência",
    description: "Abordagem, demonstração, venda e atendimento",
  },
  {
    id: "training",
    label: "Treinamento",
    description: "Capacitação de equipes e comprovação de atividades",
  },
  {
    id: "audit",
    label: "Auditoria e qualidade",
    description: "Padrões, conformidade e ocorrências",
  },
  {
    id: "service",
    label: "Serviços e manutenção",
    description: "Instalação, manutenção, limpeza e assistência",
  },
  {
    id: "logistics",
    label: "Logística e entregas",
    description: "Recebimento, entrega, estoque e devolução",
  },
];
export const STAGES = [
  { id: "record", label: "Registro" },
  { id: "before", label: "Antes" },
  { id: "during", label: "Durante" },
  { id: "after", label: "Depois" },
  { id: "result", label: "Resultado" },
];
const definitions = [
  [
    "trade.natural",
    "trade",
    "Ponto natural",
    "gondola regular|ponto natural|prateleira",
  ],
  ["trade.extra", "trade", "Ponto extra", "ponto extra"],
  [
    "trade.extra.endcap",
    "trade",
    "Ponta de gôndola",
    "ponta de gondola|ponta promocional",
    "trade.extra",
  ],
  [
    "trade.extra.island",
    "trade",
    "Ilha promocional",
    "ilha promocional|ilha de produtos",
    "trade.extra",
  ],
  [
    "trade.extra.display",
    "trade",
    "Display / expositor",
    "display|expositor",
    "trade.extra",
  ],
  [
    "trade.extra.checkout",
    "trade",
    "Check-out / frente de caixa",
    "frente de caixa|check out|checkout",
    "trade.extra",
  ],
  [
    "trade.extra.table",
    "trade",
    "Mesa de exposição",
    "mesa de exposicao",
    "trade.extra",
  ],
  ["trade.extra.window", "trade", "Vitrine", "vitrine", "trade.extra"],
  [
    "trade.extra.cross",
    "trade",
    "Cross merchandising",
    "cross merchandising",
    "trade.extra",
  ],
  [
    "trade.price",
    "trade",
    "Preço e etiqueta",
    "precificacao|etiqueta|comunicacao de preco",
  ],
  [
    "trade.material",
    "trade",
    "Material de PDV",
    "material promocional|material de pdv|comunicacao visual",
  ],
  [
    "trade.replenishment",
    "trade",
    "Abastecimento e organização",
    "abastecimento|reposicao|organizacao",
  ],
  [
    "trade.planogram",
    "trade",
    "Planograma / espaço em gôndola",
    "planograma|share de gondola",
  ],
  [
    "trade.stockout",
    "trade",
    "Ruptura / indisponibilidade",
    "ruptura|indisponibilidade",
  ],
  ["trade.expiry", "trade", "Validade e conservação", "validade|conservacao"],
  ["trade.competition", "trade", "Concorrência", "concorrencia|concorrente"],
  ["commercial.approach", "commercial", "Abordagem", "abordagem|prospeccao"],
  ["commercial.demo", "commercial", "Demonstração de produto", "demonstracao"],
  [
    "commercial.tasting",
    "commercial",
    "Degustação / experimentação",
    "degustacao|experimentacao",
  ],
  ["commercial.sale", "commercial", "Venda / conversão", "venda|conversao"],
  [
    "commercial.activation",
    "commercial",
    "Ativação / evento",
    "ativacao|evento|blitz",
  ],
  ["commercial.service", "commercial", "Atendimento ao cliente", "atendimento"],
  [
    "commercial.research",
    "commercial",
    "Pesquisa / feedback",
    "pesquisa|feedback",
  ],
  [
    "training.team",
    "training",
    "Treinamento da equipe",
    "treinamento|capacitacao",
  ],
  [
    "training.product",
    "training",
    "Treinamento de produto",
    "treinamento de produto",
  ],
  [
    "training.practice",
    "training",
    "Demonstração prática à equipe",
    "demonstracao pratica",
  ],
  [
    "training.attendance",
    "training",
    "Participação / presença",
    "participacao|presenca",
  ],
  [
    "training.material",
    "training",
    "Material de treinamento",
    "material de treinamento",
  ],
  ["audit.standard", "audit", "Padrão e conformidade", "conformidade|padrao"],
  [
    "audit.storefront",
    "audit",
    "Fachada / identificação",
    "fachada|identificacao da loja",
  ],
  ["audit.safety", "audit", "Segurança / EPI", "seguranca|epi"],
  ["audit.damage", "audit", "Avaria / ocorrência", "avaria|ocorrencia"],
  ["audit.cleanliness", "audit", "Higiene e conservação", "higiene"],
  ["audit.accessibility", "audit", "Acessibilidade", "acessibilidade"],
  [
    "service.installation",
    "service",
    "Instalação / montagem",
    "instalacao|montagem",
  ],
  [
    "service.preventive",
    "service",
    "Manutenção preventiva",
    "manutencao preventiva",
  ],
  [
    "service.repair",
    "service",
    "Reparo / manutenção corretiva",
    "reparo|manutencao corretiva",
  ],
  ["service.inspection", "service", "Inspeção técnica", "inspecao"],
  ["service.cleaning", "service", "Limpeza / facilities", "limpeza|facilities"],
  [
    "service.completion",
    "service",
    "Conclusão / aceite do serviço",
    "aceite|conclusao",
  ],
  ["logistics.delivery", "logistics", "Entrega", "entrega"],
  [
    "logistics.receipt",
    "logistics",
    "Recebimento / conferência",
    "recebimento|conferencia",
  ],
  [
    "logistics.inventory",
    "logistics",
    "Estoque / inventário",
    "estoque|inventario",
  ],
  ["logistics.return", "logistics", "Devolução / coleta", "devolucao|coleta"],
  [
    "logistics.shipping",
    "logistics",
    "Expedição / transporte",
    "expedicao|transporte",
  ],
];
export const CATEGORIES = definitions.map(
  ([id, group, label, words, parentId]) => ({
    id,
    group,
    label,
    aliases: words.split("|"),
    ...(parentId ? { parentId } : {}),
  }),
);
export const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export function getConfig(settings) {
  const raw = settings?.photo_classification || {};
  return {
    version: 1,
    enabledGroups: Array.isArray(raw.enabledGroups)
      ? raw.enabledGroups.filter((id) => GROUPS.some((g) => g.id === id))
      : ["trade", "commercial", "training"],
    hiddenIds: Array.isArray(raw.hiddenIds)
      ? raw.hiddenIds.filter((id) => typeof id === "string")
      : [],
    custom: Array.isArray(raw.custom)
      ? raw.custom
          .filter(
            (c) =>
              /^custom\.[a-z0-9-]{1,64}$/.test(c?.id) &&
              typeof c.label === "string" &&
              c.label.trim().length > 0 &&
              c.label.length <= 60 &&
              GROUPS.some((g) => g.id === c.group),
          )
          .map((c) => ({ id: c.id, label: c.label.trim(), group: c.group }))
      : [],
    taskDefaults:
      raw.taskDefaults &&
      typeof raw.taskDefaults === "object" &&
      !Array.isArray(raw.taskDefaults)
        ? raw.taskDefaults
        : {},
  };
}
export function catalog(settings, includeArchived = false) {
  const config = getConfig(settings);
  // Custom IDs cannot override built-ins, even in imported settings.
  const entries = [
    ...CATEGORIES,
    ...config.custom.filter(
      (c, i, a) => a.findIndex((x) => x.id === c.id) === i,
    ),
  ];
  return includeArchived
    ? entries
    : entries.filter(
        (c) =>
          config.enabledGroups.includes(c.group) &&
          !config.hiddenIds.includes(c.id),
      );
}
export function categoryPath(category) {
  return category.parentId === "trade.extra"
    ? "Ponto extra · " + category.label
    : category.label;
}
export function suggestCategory(task, settings) {
  const options = catalog(settings),
    config = getConfig(settings);
  const configured = options.find(
    (c) => c.id === config.taskDefaults[task?.id],
  );
  if (configured)
    return { category: configured, reason: "Definida para esta tarefa" };
  const title = " " + normalize(task?.title) + " ";
  const matches = options.flatMap((c) =>
    (c.aliases || [])
      .filter(
        (a) =>
          title.includes(" " + normalize(a) + " ") &&
          !(
            c.id === "commercial.sale" &&
            /\bponto de venda\b|\barea de venda\b/.test(title)
          ),
      )
      .map((a) => ({
        category: c,
        phrase: normalize(a),
        score: normalize(a).length,
      })),
  );
  matches.sort((a, b) => b.score - a.score);
  // Ambiguous equal-scoring suggestions require an explicit choice.
  if (
    !matches.length ||
    matches.some(
      (m) =>
        m.category.id !== matches[0].category.id &&
        !matches[0].phrase.includes(m.phrase),
    )
  )
    return null;
  return {
    category: matches[0].category,
    reason: "Sugestão pelo nome da tarefa",
  };
}
export function makeClassification(categoryId, stage, note, settings) {
  const c = catalog(settings).find((c) => c.id === categoryId);
  if (!c) throw new Error("Escolha uma categoria disponível neste Ambiente.");
  if (!STAGES.some((s) => s.id === stage)) throw new Error("Etapa inválida.");
  if (String(note || "").trim().length > 300)
    throw new Error("A observação deve ter até 300 caracteres.");
  return {
    version: 1,
    categoryId: c.id,
    label: c.label,
    path: categoryPath(c),
    group: c.group,
    groupLabel: GROUPS.find((g) => g.id === c.group).label,
    parentId: c.parentId || null,
    stage,
    note: String(note || "").trim(),
  };
}
export function readClassification(metadata) {
  const c = metadata?.classification;
  if (
    !c ||
    c.version !== 1 ||
    typeof c.categoryId !== "string" ||
    !/^[a-z][a-z0-9.-]{1,79}$/.test(c.categoryId) ||
    typeof c.label !== "string" ||
    !c.label ||
    c.label.length > 60 ||
    typeof c.path !== "string" ||
    c.path.length > 150 ||
    typeof c.groupLabel !== "string" ||
    c.groupLabel.length > 80 ||
    typeof c.note !== "string" ||
    c.note.length > 300 ||
    !GROUPS.some((g) => g.id === c.group) ||
    !STAGES.some((s) => s.id === c.stage)
  )
    return null;
  return c;
}
export function matchesClassification(metadata, filters) {
  const c = readClassification(metadata);
  if (filters.category === "uncategorized")
    return (
      !c &&
      (!filters.group || filters.group === "all") &&
      (!filters.stage || filters.stage === "all")
    );
  if (filters.group && filters.group !== "all" && c?.group !== filters.group)
    return false;
  if (
    filters.category &&
    filters.category !== "all" &&
    c?.categoryId !== filters.category &&
    c?.parentId !== filters.category
  )
    return false;
  return (
    !filters.stage || filters.stage === "all" || c?.stage === filters.stage
  );
}
export function classificationFromColumns(category, stage, note, settings) {
  const name = String(category || "").trim();
  if (!name || normalize(name) === "sem categoria") {
    if (String(stage || "").trim() || String(note || "").trim())
      throw new Error("Informe a categoria para importar etapa ou observação.");
    return null;
  }
  const options = catalog(settings);
  const exact = options.find((c) => c.id === name);
  const matches = exact
    ? [exact]
    : options.filter(
        (c) =>
          normalize(c.label) === normalize(name) ||
          normalize(categoryPath(c)) === normalize(name),
      );
  if (matches.length !== 1)
    throw new Error(
      "Categoria desconhecida ou ambígua: " +
        name +
        ". Use o ID de uma categoria disponível.",
    );
  const resolvedStage = String(stage || "").trim()
    ? STAGES.find(
        (s) => s.id === stage || normalize(s.label) === normalize(stage),
      )
    : STAGES[0];
  if (!resolvedStage) throw new Error("Etapa desconhecida: " + stage);
  return makeClassification(matches[0].id, resolvedStage.id, note, settings);
}
