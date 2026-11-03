import {
  catalog,
  categoryPath,
  getConfig,
  GROUPS,
  makeClassification,
  normalize,
  readClassification,
  STAGES,
  suggestCategory,
} from "../apps/cia-campo/src/domain/photoClassification.js";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const option = (id, label, selected) =>
  `<option value="${esc(id)}" ${id === selected ? "selected" : ""}>${esc(label)}</option>`;
export function classificationBadge(metadata) {
  const c = readClassification(metadata);
  return `<span class="photo-category ${c ? "" : "unclassified"}">${esc(c?.path || c?.label || "Sem categoria")}${c && c.stage !== "record" ? " · " + esc(STAGES.find((s) => s.id === c.stage)?.label) : ""}</span>`;
}
export function classificationContext(metadata) {
  const c = readClassification(metadata);
  return `<section class="context-group photo-context"><h3>Categoria da foto</h3>${classificationBadge(metadata)}<p>${esc(c?.groupLabel || "Este registro ainda não foi categorizado.")}</p>${c?.note ? `<p class="photo-note">${esc(c.note)}</p>` : ""}</section>`;
}
export function filterMarkup(settings, rows, filters) {
  // Include snapshots of archived/renamed categories so historical photos stay discoverable.
  const categories = new Map(
    catalog(settings, true).map((c) => [c.id, { ...c, path: categoryPath(c) }]),
  );
  for (const row of rows) {
    const c = readClassification(row._metadata);
    if (c)
      categories.set(c.categoryId, {
        id: c.categoryId,
        group: c.group,
        path: c.path || c.label,
      });
  }
  const choices = [...categories.values()]
    .filter((c) => filters.group === "all" || c.group === filters.group)
    .sort((a, b) => a.path.localeCompare(b.path, "pt-BR"));
  return `<section class="photo-filter-bar" aria-label="Filtros de categorização"><div class="photo-filter-title"><b>Fotos com contexto</b><small>Combine categoria e etapa do registro</small></div><label>Frente<select id="photoGroup">${option("all", "Todas as frentes", filters.group)}${GROUPS.map((g) => option(g.id, g.label, filters.group)).join("")}</select></label><label>Categoria<select id="photoCategory">${option("all", "Todas as categorias", filters.category)}${option("uncategorized", "Sem categoria", filters.category)}${choices.map((c) => option(c.id, c.path + (c.id === "trade.extra" ? " · todos os formatos" : ""), filters.category)).join("")}</select></label><label>Etapa<select id="photoStage">${option("all", "Todas as etapas", filters.stage)}${STAGES.map((s) => option(s.id, s.label, filters.stage)).join("")}</select></label><button id="photoClear" class="btn ghost" ${Object.values(filters).every((v) => v === "all") ? "disabled" : ""}>Limpar</button></section>`;
}
export function bindFilters(filters, render) {
  for (const [id, key] of [
    ["photoGroup", "group"],
    ["photoCategory", "category"],
    ["photoStage", "stage"],
  ]) {
    document.getElementById(id)?.addEventListener("change", (e) => {
      filters[key] = e.target.value;
      if (key === "group") filters.category = "all";
      if (key === "category" && filters.category === "uncategorized") {
        filters.group = "all";
        filters.stage = "all";
      }
      render();
    });
  }
  document.getElementById("photoClear")?.addEventListener("click", () => {
    Object.assign(filters, { group: "all", category: "all", stage: "all" });
    render();
  });
}
function accessibleModal(modal, body) {
  const root = modal(body),
    panel = root.querySelector(".modal"),
    previous = document.activeElement;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute(
    "aria-label",
    panel.querySelector("h2")?.textContent || "Categoria da foto",
  );
  root.querySelectorAll("[data-close]").forEach(
    (button) =>
      (button.onclick = () => {
        root.remove();
        previous?.focus();
      }),
  );
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      root.remove();
      previous?.focus();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [
      ...panel.querySelectorAll("button:not(:disabled),input,select,textarea"),
    ].filter((x) => !x.hidden && x.offsetParent !== null);
    const first = focusable[0],
      last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  queueMicrotask(() => panel.querySelector("input,button")?.focus());
  return root;
}
export function pickClassification({ modal, task, settings, onConfirm }) {
  const categories = catalog(settings),
    suggestion = suggestCategory(task, settings);
  let selected = suggestion?.category.id || "",
    group = "all",
    query = "";
  const r = accessibleModal(
    modal,
    `<header><div><small>FOTO COM CONTEXTO</small><h2>O que você vai registrar?</h2><p>${esc(task.title)}</p></div><button data-close aria-label="Cancelar">×</button></header><div class="modal-body photo-picker">${suggestion ? `<div class="photo-suggestion"><small>${esc(suggestion.reason)}</small><b>${esc(categoryPath(suggestion.category))}</b><span>Confira a categoria antes de abrir a câmera.</span></div>` : ""}<label class="settings-field">Buscar categoria<input id="categorySearch" type="search" placeholder="Ponta, treinamento, venda…" autocomplete="off"></label><div id="categoryGroups" class="photo-group-chips"></div><div id="categoryOptions" class="photo-options" role="radiogroup" aria-label="Categoria da foto"></div><label class="settings-field">Etapa<select id="categoryStage">${STAGES.map((s) => option(s.id, s.label, "record")).join("")}</select><small>Use Registro quando não houver comparação de etapas.</small></label><label class="settings-field">Observação (opcional)<textarea id="categoryNote" maxlength="300" rows="2" placeholder="Detalhe o contexto sem dados pessoais de clientes"></textarea></label></div><footer><button data-close>Cancelar</button><button id="categoryConfirm" class="primary">Continuar para a câmera →</button></footer>`,
  );
  const draw = () => {
    r.querySelector("#categoryGroups").innerHTML = [
      { id: "all", label: "Todas" },
      ...GROUPS.filter((g) => categories.some((c) => c.group === g.id)),
    ]
      .map(
        (g) =>
          `<button data-photo-group="${g.id}" class="${g.id === group ? "active" : ""}" aria-pressed="${g.id === group}">${esc(g.label)}</button>`,
      )
      .join("");
    const visible = categories.filter(
      (c) =>
        (group === "all" || group === c.group) &&
        normalize(
          categoryPath(c) + " " + GROUPS.find((g) => g.id === c.group)?.label,
        ).includes(normalize(query)),
    );
    r.querySelector("#categoryOptions").innerHTML =
      visible
        .map(
          (c) =>
            `<button role="radio" aria-checked="${selected === c.id}" class="photo-option ${selected === c.id ? "selected" : ""}" data-photo-category="${esc(c.id)}"><span><b>${esc(categoryPath(c))}</b><small>${esc(GROUPS.find((g) => g.id === c.group)?.label)}</small></span><i>${selected === c.id ? "●" : "○"}</i></button>`,
        )
        .join("") ||
      '<p class="empty">Nenhuma categoria disponível. Tente outro termo ou peça ao Admin para habilitar categorias.</p>';
    r.querySelector("#categoryConfirm").disabled = !selected;
    r.querySelectorAll("[data-photo-group]").forEach(
      (b) =>
        (b.onclick = () => {
          group = b.dataset.photoGroup;
          draw();
        }),
    );
    r.querySelectorAll("[data-photo-category]").forEach(
      (b) =>
        (b.onclick = () => {
          selected = b.dataset.photoCategory;
          draw();
          r.querySelector(`[data-photo-category="${selected}"]`)?.focus();
        }),
    );
  };
  r.querySelector("#categorySearch").oninput = (e) => {
    query = e.target.value;
    draw();
  };
  r.querySelector("#categoryConfirm").onclick = () => {
    const value = makeClassification(
      selected,
      r.querySelector("#categoryStage").value,
      r.querySelector("#categoryNote").value,
      settings,
    );
    r.remove();
    onConfirm(value);
  };
  draw();
  return r;
}
export async function openClassificationSettings({
  modal,
  settings,
  save,
  loadTasks,
  toast,
}) {
  const config = getConfig(settings),
    tasks = await loadTasks();
  let draft = structuredClone(config);
  const r = accessibleModal(
    modal,
    `<header><div><small>CAMPO + BKO</small><h2>Categorias da operação</h2><p>Mostre ao promotor apenas o que faz sentido para este Ambiente.</p></div><button data-close aria-label="Fechar">×</button></header><div class="modal-body photo-settings"><div class="photo-profile-buttons"><button data-profile="trade,commercial,training">Trade e vendas</button><button data-profile="audit,trade">Auditoria de lojas</button><button data-profile="service,audit">Serviços e manutenção</button><button data-profile="logistics,audit">Logística</button></div><h3>Frentes disponíveis</h3><div class="photo-fronts">${GROUPS.map((g) => `<label><input type="checkbox" data-enable-group="${g.id}" ${draft.enabledGroups.includes(g.id) ? "checked" : ""}><span><b>${esc(g.label)}</b><small>${esc(g.description)}</small></span></label>`).join("")}</div><h3>Categorias disponíveis no Campo</h3><p>Desativar uma categoria preserva as fotos e filtros históricos. Fotos offline mantêm a classificação escolhida no registro.</p><div id="categoryAvailability" class="photo-availability"></div><h3>Categoria personalizada</h3><div class="photo-custom-form"><label>Nome<input id="customCategoryName" maxlength="60" placeholder="Ex.: Exposição de lançamentos"></label><label>Frente<select id="customCategoryGroup">${GROUPS.map((g) => option(g.id, g.label, "trade")).join("")}</select></label><button id="addCategory" class="btn ghost">Adicionar</button></div><h3>Sugestão por tarefa</h3><p>O promotor sempre pode corrigir a sugestão antes de fotografar.</p><div id="taskCategoryDefaults"></div><p id="categorySettingsError" role="alert"></p></div><footer><button data-close>Cancelar</button><button id="saveCategories" class="primary">Salvar categorias</button></footer>`,
  );
  const settingsFor = () => ({ ...settings, photo_classification: draft });
  const draw = () => {
    r.querySelectorAll("[data-enable-group]").forEach(
      (i) => (i.checked = draft.enabledGroups.includes(i.dataset.enableGroup)),
    );
    const all = catalog(settingsFor(), true).filter((c) =>
      draft.enabledGroups.includes(c.group),
    );
    r.querySelector("#categoryAvailability").innerHTML = all
      .map(
        (c) =>
          `<label><input type="checkbox" data-enable-category="${esc(c.id)}" ${draft.hiddenIds.includes(c.id) ? "" : "checked"}><span>${esc(categoryPath(c))}${c.id.startsWith("custom.") ? " · personalizada" : ""}</span></label>`,
      )
      .join("");
    const active = catalog(settingsFor());
    r.querySelector("#taskCategoryDefaults").innerHTML = tasks.length
      ? tasks
          .map(
            (t) =>
              `<label class="settings-field">${esc(t.operationName)} · ${esc(t.title)}<select data-task-category="${esc(t.id)}">${option("", "Sugerir pelo nome da tarefa", draft.taskDefaults[t.id] || "")}${active.map((c) => option(c.id, categoryPath(c), draft.taskDefaults[t.id])).join("")}</select></label>`,
          )
          .join("")
      : "<p>Nenhuma tarefa ativa neste Ambiente.</p>";
    r.querySelectorAll("[data-enable-category]").forEach(
      (i) =>
        (i.onchange = () => {
          draft.hiddenIds = draft.hiddenIds.filter(
            (id) => id !== i.dataset.enableCategory,
          );
          if (!i.checked) draft.hiddenIds.push(i.dataset.enableCategory);
          draw();
        }),
    );
    r.querySelectorAll("[data-task-category]").forEach(
      (i) =>
        (i.onchange = () => {
          draft.taskDefaults[i.dataset.taskCategory] = i.value;
        }),
    );
  };
  r.querySelectorAll("[data-profile]").forEach(
    (b) =>
      (b.onclick = () => {
        draft.enabledGroups = b.dataset.profile.split(",");
        draw();
      }),
  );
  r.querySelectorAll("[data-enable-group]").forEach(
    (i) =>
      (i.onchange = () => {
        draft.enabledGroups = draft.enabledGroups.filter(
          (id) => id !== i.dataset.enableGroup,
        );
        if (i.checked) draft.enabledGroups.push(i.dataset.enableGroup);
        draw();
      }),
  );
  r.querySelector("#addCategory").onclick = () => {
    const label = r.querySelector("#customCategoryName").value.trim(),
      group = r.querySelector("#customCategoryGroup").value;
    if (!label) {
      toast("Informe um nome para a categoria.", true);
      return;
    }
    if (
      catalog(settingsFor(), true).some(
        (c) => c.group === group && normalize(c.label) === normalize(label),
      )
    ) {
      toast("Esta categoria já existe nesta frente.", true);
      return;
    }
    if (draft.custom.length >= 100) {
      toast("Limite de 100 categorias personalizadas por Ambiente.", true);
      return;
    }
    draft.custom.push({ id: "custom." + crypto.randomUUID(), label, group });
    if (!draft.enabledGroups.includes(group)) draft.enabledGroups.push(group);
    r.querySelector("#customCategoryName").value = "";
    draw();
  };
  r.querySelector("#saveCategories").onclick = async (e) => {
    if (!catalog(settingsFor()).length) {
      r.querySelector("#categorySettingsError").textContent =
        "Habilite ao menos uma categoria antes de salvar.";
      return;
    }
    e.currentTarget.disabled = true;
    try {
      await save({ photo_classification: draft });
      r.remove();
      toast(
        "Categorias atualizadas. O Campo receberá a configuração ao atualizar a agenda.",
      );
    } catch (error) {
      r.querySelector("#categorySettingsError").textContent = error.message;
      r.querySelector("#saveCategories").disabled = false;
    }
  };
  draw();
  return r;
}
export function exportClassifiedRows(rows) {
  const cell = (value) => {
    const text = String(value ?? "");
    return (
      '"' +
      ((/^\s*[=+@-]|^[\t\r\n]/.test(text) ? "'" : "") + text).replace(
        /"/g,
        '""',
      ) +
      '"'
    );
  };
  const header = [
    "foto_id",
    "loja",
    "tarefa",
    "promotor",
    "status",
    "capturada_em",
    "frente",
    "categoria_id",
    "categoria",
    "etapa",
    "observacao",
  ];
  const content = [
    header,
    ...rows.map((r) => {
      const c = readClassification(r._metadata);
      return [
        r.id,
        r.store,
        r.task,
        r.promoter,
        r.status,
        r.captured_at,
        c?.groupLabel,
        c?.categoryId,
        c?.path || c?.label || "Sem categoria",
        STAGES.find((s) => s.id === c?.stage)?.label,
        c?.note,
      ];
    }),
  ]
    .map((row) => row.map(cell).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(
      new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = "cia-fotos-categorizadas.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
