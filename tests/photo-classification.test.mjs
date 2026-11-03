import test from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  CATEGORIES,
  classificationFromColumns,
  getConfig,
  makeClassification,
  matchesClassification,
  readClassification,
  suggestCategory,
} from "../apps/cia-campo/src/domain/photoClassification.js";

test("point-extra rollup includes every format but excludes natural placement", () => {
  for (const c of CATEGORIES.filter((c) => c.parentId === "trade.extra")) {
    const metadata = {
      classification: makeClassification(c.id, "after", "", null),
    };
    assert.equal(
      matchesClassification(metadata, { category: "trade.extra" }),
      true,
      c.id,
    );
    assert.equal(
      matchesClassification(metadata, { category: "trade.natural" }),
      false,
    );
  }
  assert.equal(
    matchesClassification(
      {
        classification: makeClassification("trade.natural", "record", "", null),
      },
      { category: "trade.extra" },
    ),
    false,
  );
});
test("intersection of group/category/stage excludes unrelated photos", () => {
  const m = {
    classification: makeClassification(
      "trade.extra.endcap",
      "before",
      "",
      null,
    ),
  };
  assert.equal(
    matchesClassification(m, {
      group: "trade",
      category: "trade.extra",
      stage: "before",
    }),
    true,
  );
  assert.equal(
    matchesClassification(m, {
      group: "training",
      category: "trade.extra",
      stage: "before",
    }),
    false,
  );
  assert.equal(matchesClassification(m, { stage: "after" }), false);
});
test("legacy and malformed records remain unclassified without inventing categories", () => {
  for (const metadata of [
    undefined,
    null,
    {},
    { classification: { version: 1 } },
    {
      classification: {
        ...makeClassification("trade.price", "record", "", null),
        path: {},
      },
    },
  ]) {
    assert.equal(readClassification(metadata), null);
    assert.equal(
      matchesClassification(metadata, { category: "uncategorized" }),
      true,
    );
    assert.equal(
      matchesClassification(metadata, { category: "trade.price" }),
      false,
    );
  }
});
test("offline snapshot survives JSON persistence and subsequent catalog archival/rename", () => {
  const settings = {
    photo_classification: {
      enabledGroups: ["service"],
      custom: [
        {
          id: "custom.client-fixture",
          label: "Instalação de expositor Amazon",
          group: "service",
        },
      ],
    },
  };
  const persisted = JSON.parse(
    JSON.stringify({
      classification: makeClassification(
        "custom.client-fixture",
        "after",
        "Fixação concluída",
        settings,
      ),
    }),
  );
  settings.photo_classification.custom[0].label = "Nova descrição";
  settings.photo_classification.hiddenIds = ["custom.client-fixture"];
  assert.equal(
    catalog(settings).some((c) => c.id === "custom.client-fixture"),
    false,
  );
  assert.equal(
    readClassification(persisted).label,
    "Instalação de expositor Amazon",
  );
  assert.equal(
    matchesClassification(persisted, {
      category: "custom.client-fixture",
      stage: "after",
    }),
    true,
  );
  assert.throws(() =>
    makeClassification("custom.client-fixture", "record", "", settings),
  );
});
test("workspace profiles isolate custom categories and discard invalid config entries", () => {
  const settings = {
    photo_classification: {
      enabledGroups: ["service", "invalid"],
      custom: [
        { id: "trade.price", label: "Override", group: "service" },
        { id: "custom.valid", label: " Teste ", group: "service" },
        { id: "custom.invalid", label: "", group: "service" },
      ],
    },
  };
  assert.deepEqual(getConfig(settings).enabledGroups, ["service"]);
  assert.equal(
    catalog(settings).some((c) => c.group === "trade"),
    false,
  );
  assert.equal(
    catalog(settings).find((c) => c.id === "custom.valid").label,
    "Teste",
  );
  assert.equal(
    catalog(null).some((c) => c.id === "custom.valid"),
    false,
  );
  assert.equal(
    catalog(settings, true).filter((c) => c.id === "trade.price").length,
    1,
  );
});
test("task suggestions prefer explicit active defaults, then specific text; ambiguity needs choice", () => {
  const task = { id: "t1", title: "Material de treinamento" };
  assert.equal(suggestCategory(task, null).category.id, "training.material");
  assert.equal(
    suggestCategory({ id: "t2", title: "Ponta de gôndola" }, null).category.id,
    "trade.extra.endcap",
  );
  assert.equal(
    suggestCategory({ id: "t3", title: "Abordagem e demonstração" }, null),
    null,
  );
  assert.equal(
    suggestCategory({ id: "t4", title: "Ponto de venda" }, null),
    null,
  );
  const settings = {
    photo_classification: { taskDefaults: { t1: "trade.natural" } },
  };
  assert.equal(suggestCategory(task, settings).category.id, "trade.natural");
  settings.photo_classification.hiddenIds = ["trade.natural"];
  assert.equal(
    suggestCategory(task, settings).category.id,
    "training.material",
  );
});
test("CSV resolves stable IDs or unambiguous localized labels without guessing", () => {
  assert.equal(
    classificationFromColumns("Ponta de gôndola", "Depois", "Entrada", null)
      .categoryId,
    "trade.extra.endcap",
  );
  assert.equal(
    classificationFromColumns("trade.extra.endcap", "after", "", null).stage,
    "after",
  );
  assert.equal(classificationFromColumns("", "", "", null), null);
  assert.equal(classificationFromColumns("Sem categoria", "", "", null), null);
  assert.throws(
    () => classificationFromColumns("Categoria inexistente", "", "", null),
    /desconhecida/,
  );
  assert.throws(
    () => classificationFromColumns("trade.price", "ontem", "", null),
    /Etapa/,
  );
  assert.throws(
    () => classificationFromColumns("", "after", "", null),
    /categoria/,
  );
});
test("new capture rejects invalid stage, unavailable category and oversized note", () => {
  assert.throws(() => makeClassification("trade.natural", "invalid", "", null));
  assert.throws(() =>
    makeClassification("service.installation", "record", "", null),
  );
  assert.throws(() =>
    makeClassification("trade.price", "record", "x".repeat(301), null),
  );
  assert.equal(
    makeClassification("trade.price", "record", "  Etiqueta ausente  ", null)
      .note,
    "Etiqueta ausente",
  );
});
