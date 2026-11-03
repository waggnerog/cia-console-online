import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { build } from "vite";
import {
  classificationBadge,
  classificationContext,
  exportClassifiedRows,
  filterMarkup,
  openClassificationSettings,
  pickClassification,
} from "../src/photo-classification-ui.js";
import { makeClassification } from "../apps/cia-campo/src/domain/photoClassification.js";
const dom = new JSDOM(
  '<button id="trigger">Abrir</button><div id="app"></div>',
  { url: "https://test.invalid" },
);
globalThis.document = dom.window.document;
const modal = (body) => {
  const r = document.createElement("div");
  r.innerHTML = '<section class="modal">' + body + "</section>";
  document.body.append(r);
  return r;
};

test("field picker confirms a suggestion, then permits category/stage/context correction", () => {
  let saved;
  const root = pickClassification({
    modal,
    task: { id: "t", title: "Ponta de gôndola" },
    settings: null,
    onConfirm: (value) => (saved = value),
  });
  assert.equal(
    root.querySelector("[role=dialog]").getAttribute("aria-modal"),
    "true",
  );
  assert.equal(
    root.querySelector("[aria-checked=true]").dataset.photoCategory,
    "trade.extra.endcap",
  );
  const search = root.querySelector("#categorySearch");
  search.value = "treinamento";
  search.dispatchEvent(new dom.window.Event("input"));
  root.querySelector('[data-photo-category="training.team"]').click();
  root.querySelector("#categoryStage").value = "after";
  root.querySelector("#categoryNote").value = "Equipe da loja treinada";
  root.querySelector("#categoryConfirm").click();
  assert.equal(saved.categoryId, "training.team");
  assert.equal(saved.stage, "after");
  assert.equal(saved.note, "Equipe da loja treinada");
  assert.equal(root.isConnected, false);
});
test("ambiguous task requires choice and cancel does not create a photo", () => {
  let invoked = false;
  const root = pickClassification({
    modal,
    task: { id: "t", title: "Abordagem e demonstração" },
    settings: null,
    onConfirm: () => (invoked = true),
  });
  assert.equal(root.querySelector("#categoryConfirm").disabled, true);
  root.querySelector("[data-close]").click();
  assert.equal(root.isConnected, false);
  assert.equal(invoked, false);
});
test("category manager configures profile, custom category, and task default in one saved value", async () => {
  let saved;
  const root = await openClassificationSettings({
    modal,
    settings: { timezone: "America/Sao_Paulo" },
    save: async (settings) => (saved = settings),
    loadTasks: async () => [
      { id: "t1", title: "Treinamento", operationName: "Cliente A" },
    ],
    toast: () => {},
  });
  root.querySelector('[data-profile="service,audit"]').click();
  root.querySelector("#customCategoryName").value =
    "Montagem de expositor Amazon";
  root.querySelector("#customCategoryGroup").value = "service";
  root.querySelector("#addCategory").click();
  const custom = root.querySelector('[data-enable-category^="custom."]');
  assert.ok(custom);
  const select = root.querySelector("[data-task-category=t1]");
  select.value = custom.dataset.enableCategory;
  select.dispatchEvent(new dom.window.Event("change"));
  root.querySelector("#saveCategories").click();
  await Promise.resolve();
  assert.deepEqual(saved.photo_classification.enabledGroups, [
    "service",
    "audit",
  ]);
  assert.equal(
    saved.photo_classification.custom[0].label,
    "Montagem de expositor Amazon",
  );
  assert.equal(
    saved.photo_classification.taskDefaults.t1,
    custom.dataset.enableCategory,
  );
});
test("failed settings save retains editable draft; empty catalogs cannot be saved", async () => {
  let attempts = 0;
  const root = await openClassificationSettings({
    modal,
    settings: null,
    save: async () => {
      attempts++;
      throw Error("Conexão indisponível");
    },
    loadTasks: async () => [],
    toast: () => {},
  });
  root.querySelector("#saveCategories").click();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(root.isConnected, true);
  assert.equal(root.querySelector("#saveCategories").disabled, false);
  assert.match(root.textContent, /Conexão indisponível/);
  root.querySelectorAll("[data-enable-group]").forEach((i) => {
    i.checked = false;
    i.dispatchEvent(new dom.window.Event("change"));
  });
  root.querySelector("#saveCategories").click();
  await Promise.resolve();
  assert.equal(attempts, 1);
  assert.match(root.textContent, /Habilite ao menos uma categoria/);
  root.remove();
});
test("historical custom categories remain filterable and untrusted text is escaped", () => {
  const c = {
    ...makeClassification(
      "trade.price",
      "record",
      "<img src=x onerror=alert(1)>",
      null,
    ),
    categoryId: "custom.historical",
    label: "Histórica",
    path: "Histórica",
  };
  document.querySelector("#app").innerHTML =
    filterMarkup(null, [{ _metadata: { classification: c } }], {
      group: "all",
      category: "custom.historical",
      stage: "all",
    }) +
    classificationBadge({ classification: c }) +
    classificationContext({ classification: c });
  assert.equal(
    document.querySelector("#photoCategory").value,
    "custom.historical",
  );
  assert.equal(document.querySelectorAll("img").length, 0);
  assert.match(document.querySelector("#app").textContent, /<img src=x/);
});
test("CSV export retains snapshot context and neutralizes spreadsheet formulas", async () => {
  let blob, download;
  const oldCreate = URL.createObjectURL,
    oldRevoke = URL.revokeObjectURL,
    oldClick = dom.window.HTMLAnchorElement.prototype.click;
  URL.createObjectURL = (value) => {
    blob = value;
    return "blob:test";
  };
  URL.revokeObjectURL = () => {};
  dom.window.HTMLAnchorElement.prototype.click = function () {
    download = this.download;
  };
  try {
    exportClassifiedRows([
      {
        id: "1",
        store: '  =HYPERLINK("x")',
        task: "Teste",
        promoter: "@SUM(A1)",
        status: "pending",
        _metadata: {
          classification: makeClassification(
            "trade.extra.endcap",
            "after",
            "Entrada; lado direito",
            null,
          ),
        },
      },
    ]);
    const text = await blob.text();
    assert.match(text, /'  =HYPERLINK/);
    assert.match(text, /'@SUM/);
    assert.match(text, /Ponto extra · Ponta de gôndola/);
    assert.match(text, /Depois/);
    assert.equal(download, "cia-fotos-categorizadas.csv");
  } finally {
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
    dom.window.HTMLAnchorElement.prototype.click = oldClick;
  }
});
test("BKO integration: filtering updates queue, totals, selected photo, empty state and reports", async () => {
  const bundle = await build({
    configFile: false,
    logLevel: "silent",
    define: { "import.meta.env.DEV": "true" },
    build: {
      write: false,
      lib: { entry: "src/main.js", formats: ["iife"], name: "CIA" },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  const code = (Array.isArray(bundle) ? bundle[0] : bundle).output.find(
    (o) => o.type === "chunk",
  ).code;
  const ui = new JSDOM('<div id="app"></div><div id="toastRoot"></div>', {
    url: "http://localhost/?demo=1#execucao",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const errors = [];
  ui.window.addEventListener("error", (e) => errors.push(e.message));
  ui.window.fetch = () =>
    Promise.reject(Error("Unexpected network call in preview"));
  try {
    ui.window.eval(code);
    await new Promise((resolve) => setTimeout(resolve, 30));
    const d = ui.window.document,
      change = (id, value) => {
        const el = d.getElementById(id);
        el.value = value;
        el.dispatchEvent(new ui.window.Event("change"));
      };
    assert.equal(d.querySelectorAll(".qcard").length, 4);
    change("photoCategory", "trade.extra");
    assert.equal(d.querySelectorAll(".qcard").length, 2);
    assert.equal(d.querySelector(".metrics b").textContent, "3");
    d.querySelector("[data-q=all]").click();
    assert.equal(d.querySelectorAll(".qcard").length, 3);
    change("photoStage", "after");
    assert.equal(d.querySelectorAll(".qcard").length, 1);
    assert.match(d.querySelector(".analysis").textContent, /Ponta de gôndola/);
    change("photoCategory", "trade.natural");
    assert.equal(d.querySelectorAll(".qcard").length, 0);
    assert.match(d.querySelector(".viewer").textContent, /Nenhuma foto/);
    assert.equal(d.querySelectorAll("[data-action]").length, 0);
    change("photoCategory", "uncategorized");
    assert.equal(d.querySelectorAll(".qcard").length, 1);
    assert.equal(d.getElementById("photoStage").value, "all");
    ui.window.location.hash = "relatorios";
    ui.window.dispatchEvent(new ui.window.HashChangeEvent("hashchange"));
    assert.equal(
      d.querySelectorAll(".photo-category-report .table-row").length,
      1,
    );
    d.getElementById("photoClear").click();
    assert.equal(d.querySelector(".report-masthead-meta b").textContent, "3");
    assert.equal(
      d.querySelectorAll(".photo-category-report .table-row").length,
      3,
    );
    assert.deepEqual(errors, []);
  } finally {
    ui.window.close();
  }
});
