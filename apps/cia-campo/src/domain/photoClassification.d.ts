export type Category = {
  id: string;
  group: string;
  label: string;
  aliases?: string[];
  parentId?: string;
};
export type Classification = {
  version: 1;
  categoryId: string;
  label: string;
  path: string;
  group: string;
  groupLabel: string;
  parentId: string | null;
  stage: string;
  note: string;
};
export type ClassificationConfig = {
  version: number;
  enabledGroups: string[];
  hiddenIds: string[];
  custom: Category[];
  taskDefaults: Record<string, string>;
};
export type ClassificationSettings =
  | { timezone?: string; photo_classification?: Partial<ClassificationConfig> }
  | null
  | undefined;
export const GROUPS: { id: string; label: string; description: string }[];
export const STAGES: { id: string; label: string }[];
export const CATEGORIES: Category[];
export function normalize(value: unknown): string;
export function getConfig(
  settings: ClassificationSettings,
): ClassificationConfig;
export function catalog(
  settings: ClassificationSettings,
  includeArchived?: boolean,
): Category[];
export function categoryPath(category: Category): string;
export function suggestCategory(
  task: { id: string; title: string },
  settings: ClassificationSettings,
): { category: Category; reason: string } | null;
export function makeClassification(
  categoryId: string,
  stage: string,
  note: string,
  settings: ClassificationSettings,
): Classification;
export function readClassification(metadata: unknown): Classification | null;
export function matchesClassification(
  metadata: unknown,
  filters: { category?: string; group?: string; stage?: string },
): boolean;
export function classificationFromColumns(
  category: string,
  stage: string,
  note: string,
  settings: ClassificationSettings,
): Classification | null;
