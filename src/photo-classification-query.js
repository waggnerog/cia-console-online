import { GROUPS, STAGES } from '../apps/cia-campo/src/domain/photoClassification.js';

// Applied before the page limit. Workspace scope and RLS remain on the caller's query.
export function applyClassificationQuery(query, filters) {
  if (filters.group !== 'all') {
    if (!GROUPS.some(g => g.id === filters.group)) throw new Error('Frente inválida.');
    query = query.eq('metadata->classification->>group', filters.group);
  }
  if (filters.category === 'uncategorized') {
    query = query.or('metadata->classification->>categoryId.is.null,metadata->classification->>version.is.null,metadata->classification->>version.neq.1');
  } else if (filters.category !== 'all') {
    if (!/^[a-z][a-z0-9.-]{1,79}$/.test(filters.category)) throw new Error('Categoria inválida.');
    query = query.eq('metadata->classification->>version','1').or(`metadata->classification->>categoryId.eq.${filters.category},metadata->classification->>parentId.eq.${filters.category}`);
  }
  if (filters.stage !== 'all') {
    if (!STAGES.some(s => s.id === filters.stage)) throw new Error('Etapa inválida.');
    query = query.eq('metadata->classification->>stage', filters.stage);
  }
  return query;
}
