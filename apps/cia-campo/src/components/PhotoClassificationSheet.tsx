import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  catalog,
  categoryPath,
  GROUPS,
  makeClassification,
  normalize,
  STAGES,
  suggestCategory,
} from "../domain/photoClassification";
import type {
  Classification,
  ClassificationSettings,
} from "../domain/photoClassification";
import { colors } from "../theme";

export function PhotoClassificationSheet({
  task,
  settings,
  onCancel,
  onConfirm,
}: {
  task: { id: string; title: string };
  settings: ClassificationSettings;
  onCancel: () => void;
  onConfirm: (value: Classification) => void;
}) {
  const options = useMemo(() => catalog(settings), [settings]);
  const suggestion = useMemo(
    () => suggestCategory(task, settings),
    [task, settings],
  );
  const [selected, setSelected] = useState(suggestion?.category.id || "");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [stage, setStage] = useState("record");
  const [note, setNote] = useState("");
  const visible = options.filter(
    (c) =>
      (group === "all" || c.group === group) &&
      normalize(
        categoryPath(c) + " " + GROUPS.find((g) => g.id === c.group)?.label,
      ).includes(normalize(query)),
  );
  const choice = options.find((c) => c.id === selected);
  return (
    <Modal visible animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={s.page}>
        <KeyboardAvoidingView
          style={s.page}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>FOTO COM CONTEXTO</Text>
              <Text style={s.title}>O que você vai registrar?</Text>
              <Text style={s.muted}>{task.title}</Text>
            </View>
            <Pressable
              accessibilityLabel="Cancelar categorização"
              onPress={onCancel}
              style={s.close}
            >
              <Text style={s.closeText}>×</Text>
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.body}
          >
            {suggestion ? (
              <View style={s.suggestion}>
                <Text style={s.eyebrow}>{suggestion.reason}</Text>
                <Text style={s.strong}>
                  {categoryPath(suggestion.category)}
                </Text>
                <Text style={s.muted}>
                  Confira a categoria antes de abrir a câmera.
                </Text>
              </View>
            ) : null}
            <TextInput
              accessibilityLabel="Buscar categoria"
              placeholder="Busque: ponta, treinamento, venda…"
              value={query}
              onChangeText={setQuery}
              style={s.input}
              autoCorrect={false}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chips}
            >
              {[
                { id: "all", label: "Todas" },
                ...GROUPS.filter((g) => options.some((c) => c.group === g.id)),
              ].map((g) => (
                <Pressable
                  key={g.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: group === g.id }}
                  onPress={() => setGroup(g.id)}
                  style={[s.chip, group === g.id && s.active]}
                >
                  <Text style={group === g.id ? s.activeText : s.muted}>
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View accessibilityRole="radiogroup" style={{ maxHeight: 320 }}>
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {visible.map((c) => (
                  <Pressable
                    key={c.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected === c.id }}
                    onPress={() => setSelected(c.id)}
                    style={[s.option, selected === c.id && s.selected]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.strong}>{categoryPath(c)}</Text>
                      <Text style={s.muted}>
                        {GROUPS.find((g) => g.id === c.group)?.label}
                      </Text>
                    </View>
                    <Text style={selected === c.id ? s.check : s.muted}>
                      {selected === c.id ? "●" : "○"}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            {!visible.length ? (
              <Text style={s.muted}>
                {options.length
                  ? "Nenhuma categoria encontrada. Tente outro termo."
                  : "O Admin precisa habilitar categorias neste Ambiente."}
              </Text>
            ) : null}
            <Text style={s.section}>Etapa do registro</Text>
            <Text style={s.muted}>
              Use “Registro” quando não houver comparação de etapas.
            </Text>
            <View style={s.chips}>
              {STAGES.map((x) => (
                <Pressable
                  key={x.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: stage === x.id }}
                  onPress={() => setStage(x.id)}
                  style={[s.chip, stage === x.id && s.active]}
                >
                  <Text style={stage === x.id ? s.activeText : s.muted}>
                    {x.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.section}>
              Observação <Text style={s.muted}>(opcional)</Text>
            </Text>
            <TextInput
              accessibilityLabel="Observação da foto"
              value={note}
              onChangeText={setNote}
              maxLength={300}
              multiline
              placeholder="Ex.: ilha na entrada da loja, lado direito"
              style={[s.input, { minHeight: 78, textAlignVertical: "top" }]}
            />
            <Text style={s.muted}>
              {note.length}/300 · Evite dados pessoais de clientes.
            </Text>
          </ScrollView>
          <View style={s.footer}>
            <Text style={s.summary}>
              {choice
                ? categoryPath(choice) +
                  " · " +
                  STAGES.find((x) => x.id === stage)?.label
                : "Selecione uma categoria"}
            </Text>
            <Pressable
              disabled={!choice}
              accessibilityRole="button"
              style={[s.button, !choice && { opacity: 0.4 }]}
              onPress={() => {
                try {
                  onConfirm(
                    makeClassification(selected, stage, note, settings),
                  );
                } catch (e) {
                  Alert.alert(
                    "Confira a categoria",
                    e instanceof Error ? e.message : "Tente novamente.",
                  );
                }
              }}
            >
              <Text style={s.buttonText}>Continuar para a câmera →</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 20,
    flexDirection: "row",
    gap: 12,
    borderBottomWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.primary,
    marginBottom: 6,
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  strong: { fontSize: 15, fontWeight: "700", color: colors.text },
  close: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 30, color: colors.textMuted },
  body: { padding: 20, gap: 12 },
  suggestion: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    gap: 4,
  },
  input: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.text,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 4 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 44,
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  activeText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    gap: 12,
    minHeight: 66,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  check: { fontSize: 23, color: colors.primary },
  section: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12,
  },
  footer: {
    padding: 18,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.line,
    gap: 9,
  },
  summary: { fontSize: 13, color: colors.primary, fontWeight: "700" },
  button: {
    padding: 17,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    minHeight: 52,
  },
  buttonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
