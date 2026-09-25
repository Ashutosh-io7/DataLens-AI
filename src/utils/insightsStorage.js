const STORAGE_KEY = "datalens_saved_insights";

export function getSavedInsights() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveInsight(insight) {
  try {
    const current = getSavedInsights();
    // Avoid duplicate saves
    const exists = current.some((item) => item.id === insight.id);
    if (!exists) {
      const updated = [insight, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch {
    return [];
  }
}

export function removeInsight(id) {
  try {
    const current = getSavedInsights();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function isInsightSaved(id) {
  try {
    const current = getSavedInsights();
    return current.some((item) => item.id === id);
  } catch {
    return false;
  }
}
