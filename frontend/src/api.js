const API_BASE = "http://localhost:8000/api";

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API request failed");
  }
  return res.json();
}

export const api = {
  // Data
  generateData: (nRecords = 50, seed = 42) =>
    request("/generate", {
      method: "POST",
      body: JSON.stringify({ n_records: nRecords, seed }),
    }),

  getOriginalData: () => request("/data/original"),
  getAnonymizedData: () => request("/data/anonymized"),

  // Anonymization
  anonymize: (ageLevel, zipLevel, genderLevel) =>
    request("/anonymize", {
      method: "POST",
      body: JSON.stringify({
        age_level: ageLevel,
        zip_level: zipLevel,
        gender_level: genderLevel,
      }),
    }),

  autoAnonymize: (k) => request(`/auto-anonymize?k=${k}`, { method: "POST" }),

  // Analysis
  checkKAnonymity: (k, dataset = "anonymized") =>
    request(`/check/k-anonymity?k=${k}&dataset=${dataset}`),

  checkLDiversity: (l, dataset = "anonymized") =>
    request(`/check/l-diversity?l=${l}&dataset=${dataset}`),

  checkEntropyLDiversity: (l, dataset = "anonymized") =>
    request(`/check/entropy-l-diversity?l=${l}&dataset=${dataset}`),

  getEquivalenceClasses: (dataset = "anonymized") =>
    request(`/equivalence-classes?dataset=${dataset}`),

  // Attacks
  homogeneityAttack: (targetQi) =>
    request("/attack/homogeneity", {
      method: "POST",
      body: JSON.stringify({ target_qi: targetQi }),
    }),

  backgroundKnowledgeAttack: (targetQi, knownExclusions) =>
    request("/attack/background-knowledge", {
      method: "POST",
      body: JSON.stringify({
        target_qi: targetQi,
        known_exclusions: knownExclusions,
      }),
    }),

  skewnessAttack: (dataset = "anonymized", threshold = 70) =>
    request(`/attack/skewness?dataset=${dataset}&threshold=${threshold}`),

  vulnerabilityScan: (l = 2, dataset = "anonymized") =>
    request(`/vulnerability-scan?l=${l}&dataset=${dataset}`),

  // Info
  getGeneralizationInfo: () => request("/info/generalization-levels"),
  healthCheck: () => request("/health"),
};
