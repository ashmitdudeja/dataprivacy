import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

const SENSITIVE_DIAGNOSES = [
  "HIV", "Cancer", "Tuberculosis", "Hepatitis B", "Depression",
];

export default function AttackPanel({ anonymizedData }) {
  const [activeAttack, setActiveAttack] = useState("homogeneity");
  const [eqClasses, setEqClasses] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attackResult, setAttackResult] = useState(null);
  const [exclusions, setExclusions] = useState([]);
  const [skewnessResult, setSkewnessResult] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load equivalence classes when anonymized data changes
  useEffect(() => {
    if (anonymizedData) {
      api
        .getEquivalenceClasses()
        .then((res) => setEqClasses(res))
        .catch(() => {});
    }
  }, [anonymizedData]);

  const runHomogeneityAttack = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      // Parse the equivalence class key to extract QI values
      const targetQi = parseEqClassKey(selectedClass.key, anonymizedData);
      const res = await api.homogeneityAttack(targetQi);
      setAttackResult(res);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  }, [selectedClass, anonymizedData]);

  const runBackgroundKnowledgeAttack = useCallback(async () => {
    if (!selectedClass || exclusions.length === 0) return;
    setLoading(true);
    try {
      const targetQi = parseEqClassKey(selectedClass.key, anonymizedData);
      const res = await api.backgroundKnowledgeAttack(targetQi, exclusions);
      setAttackResult(res);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  }, [selectedClass, exclusions, anonymizedData]);

  const runSkewnessAttack = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.skewnessAttack();
      setSkewnessResult(res);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  }, []);

  const runVulnerabilityScan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.vulnerabilityScan();
      setScanResult(res);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  }, []);

  const toggleExclusion = (diagnosis) => {
    setExclusions((prev) =>
      prev.includes(diagnosis)
        ? prev.filter((d) => d !== diagnosis)
        : [...prev, diagnosis]
    );
  };

  if (!anonymizedData) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚔️</div>
        <div className="empty-state-text">No anonymized data available</div>
        <div className="empty-state-hint">
          Generate and anonymize data first to run attack simulations.
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Attack Type Selector */}
      <div className="nav-tabs" style={{ marginBottom: 20 }}>
        {[
          { key: "homogeneity", icon: "🎯", label: "Homogeneity Attack" },
          {
            key: "background",
            icon: "🧠",
            label: "Background Knowledge Attack",
          },
          { key: "skewness", icon: "📊", label: "Skewness Attack" },
          { key: "scan", icon: "🔬", label: "Full Vulnerability Scan" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`nav-tab ${activeAttack === tab.key ? "active" : ""}`}
            onClick={() => {
              setActiveAttack(tab.key);
              setAttackResult(null);
            }}
          >
            <span className="nav-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Homogeneity Attack */}
      {activeAttack === "homogeneity" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🎯</span>
              Homogeneity Attack
            </h2>
          </div>
          <div className="alert alert-info mb-2">
            <span className="alert-icon">💡</span>
            <div>
              A <strong>homogeneity attack</strong> exploits equivalence classes
              where all records share the same sensitive value. Even with
              k-anonymity, if everyone in a group has the same diagnosis, an
              attacker who identifies the group can deduce the diagnosis with
              100% certainty.
            </div>
          </div>

          <h4
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              marginBottom: 12,
            }}
          >
            Select an equivalence class to attack:
          </h4>

          {eqClasses && (
            <div
              style={{ maxHeight: 320, overflowY: "auto", marginBottom: 16 }}
            >
              {eqClasses.classes.map((ec, idx) => (
                <div
                  key={idx}
                  className={`eq-class-card clickable-row ${
                    ec.distinct_diagnoses === 1 ? "vulnerable" : "safe"
                  } ${selectedClass?.key === ec.key ? "selected" : ""}`}
                  onClick={() => setSelectedClass(ec)}
                  style={{
                    outline:
                      selectedClass?.key === ec.key
                        ? "2px solid var(--accent-indigo)"
                        : "none",
                    cursor: "pointer",
                  }}
                >
                  <div className="eq-class-header">
                    <span className="eq-class-key">{ec.key}</span>
                    <div className="eq-class-meta">
                      <span
                        className={`badge ${ec.distinct_diagnoses === 1 ? "badge-danger" : "badge-success"}`}
                      >
                        {ec.distinct_diagnoses === 1
                          ? "⚠ HOMOGENEOUS"
                          : `${ec.distinct_diagnoses} diverse`}
                      </span>
                      <span className="badge badge-neutral">
                        {ec.size} records
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Object.entries(ec.diagnosis_distribution).map(
                      ([diag, count]) => (
                        <span
                          key={diag}
                          className={`diagnosis-tag ${SENSITIVE_DIAGNOSES.includes(diag) ? "diagnosis-sensitive" : "diagnosis-normal"}`}
                        >
                          {diag}: {count}
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn btn-danger"
            onClick={runHomogeneityAttack}
            disabled={!selectedClass || loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Attacking...
              </>
            ) : (
              <>⚡ Launch Homogeneity Attack</>
            )}
          </button>

          {attackResult && attackResult.attack_type === "homogeneity" && (
            <AttackResultDisplay result={attackResult} />
          )}
        </div>
      )}

      {/* Background Knowledge Attack */}
      {activeAttack === "background" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🧠</span>
              Background Knowledge Attack
            </h2>
          </div>
          <div className="alert alert-warning mb-2">
            <span className="alert-icon">💡</span>
            <div>
              A <strong>background knowledge attack</strong> uses external
              information to narrow down possibilities. An attacker who knows
              that a victim <em>doesn&apos;t</em> have certain conditions can
              eliminate those from the equivalence class, potentially identifying
              the true diagnosis.
            </div>
          </div>

          <h4
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              marginBottom: 12,
            }}
          >
            1. Select an equivalence class:
          </h4>
          {eqClasses && (
            <div
              style={{ maxHeight: 240, overflowY: "auto", marginBottom: 16 }}
            >
              {eqClasses.classes.map((ec, idx) => (
                <div
                  key={idx}
                  className={`eq-class-card clickable-row ${selectedClass?.key === ec.key ? "selected" : ""}`}
                  onClick={() => setSelectedClass(ec)}
                  style={{
                    outline:
                      selectedClass?.key === ec.key
                        ? "2px solid var(--accent-indigo)"
                        : "none",
                    cursor: "pointer",
                  }}
                >
                  <div className="eq-class-header">
                    <span className="eq-class-key">{ec.key}</span>
                    <div className="eq-class-meta">
                      <span className="badge badge-info">
                        {ec.distinct_diagnoses} diagnoses
                      </span>
                      <span className="badge badge-neutral">
                        {ec.size} records
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h4
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              marginBottom: 12,
            }}
          >
            2. Select diagnoses the attacker knows the victim does NOT have:
          </h4>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            {selectedClass &&
              Object.keys(selectedClass.diagnosis_distribution).map((diag) => (
                <button
                  key={diag}
                  className={`btn btn-sm ${exclusions.includes(diag) ? "btn-danger" : "btn-secondary"}`}
                  onClick={() => toggleExclusion(diag)}
                >
                  {exclusions.includes(diag) ? "✗ " : ""}
                  {diag}
                </button>
              ))}
          </div>

          {exclusions.length > 0 && (
            <div className="alert alert-info mb-2">
              <span className="alert-icon">🔎</span>
              <div>
                Attacker knows the victim does NOT have:{" "}
                <strong>{exclusions.join(", ")}</strong>
              </div>
            </div>
          )}

          <button
            className="btn btn-danger"
            onClick={runBackgroundKnowledgeAttack}
            disabled={!selectedClass || exclusions.length === 0 || loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Attacking...
              </>
            ) : (
              <>🧠 Launch Background Knowledge Attack</>
            )}
          </button>

          {attackResult &&
            attackResult.attack_type === "background_knowledge" && (
              <AttackResultDisplay result={attackResult} />
            )}
        </div>
      )}

      {/* Skewness Attack */}
      {activeAttack === "skewness" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">📊</span>
              Skewness Attack Detection
            </h2>
          </div>
          <div className="alert alert-warning mb-2">
            <span className="alert-icon">💡</span>
            <div>
              The <strong>skewness attack</strong> targets equivalence classes
              where, despite having multiple distinct sensitive values, one value
              dominates the distribution. Even with l-diversity, if 90% of a
              group has &quot;Cancer&quot;, the attacker can infer with high
              probability.
            </div>
          </div>

          <button
            className="btn btn-warning"
            onClick={runSkewnessAttack}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Scanning...
              </>
            ) : (
              <>📊 Detect Skewness Vulnerabilities</>
            )}
          </button>

          {skewnessResult && (
            <div className="mt-3 slide-up">
              <div className="grid-3 mb-2">
                <div className="stat-card">
                  <div className="stat-value">{skewnessResult.total_classes}</div>
                  <div className="stat-label">Total Classes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value danger">
                    {skewnessResult.vulnerable_count}
                  </div>
                  <div className="stat-label">Vulnerable Classes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value warning">
                    {skewnessResult.vulnerability_rate}%
                  </div>
                  <div className="stat-label">Vulnerability Rate</div>
                </div>
              </div>

              {skewnessResult.vulnerable_classes.map((vc, idx) => (
                <div key={idx} className="eq-class-card vulnerable">
                  <div className="eq-class-header">
                    <span className="eq-class-key">{vc.equivalence_class}</span>
                    <div className="eq-class-meta">
                      <span className="badge badge-danger">
                        {vc.dominant_value}: {vc.dominance_percentage}%
                      </span>
                    </div>
                  </div>
                  <DistributionBars
                    distribution={vc.distribution}
                    total={vc.size}
                  />
                </div>
              ))}

              {skewnessResult.vulnerable_count === 0 && (
                <div className="alert alert-success">
                  <span className="alert-icon">✅</span>
                  <div>
                    No skewness vulnerabilities found with threshold{" "}
                    {skewnessResult.threshold}%.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full Vulnerability Scan */}
      {activeAttack === "scan" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🔬</span>
              Full Vulnerability Scan
            </h2>
          </div>
          <div className="alert alert-info mb-2">
            <span className="alert-icon">💡</span>
            <div>
              Runs a comprehensive scan across all equivalence classes, checking
              for homogeneity vulnerabilities, low-diversity classes, and
              distribution skewness. Provides an overall risk assessment score.
            </div>
          </div>

          <button
            className="btn btn-danger btn-lg"
            onClick={runVulnerabilityScan}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Scanning...
              </>
            ) : (
              <>🔬 Run Full Vulnerability Scan</>
            )}
          </button>

          {scanResult && (
            <div className="mt-3 slide-up">
              {/* Risk Score */}
              <div
                className="card"
                style={{
                  background: "var(--bg-elevated)",
                  textAlign: "center",
                  padding: 32,
                }}
              >
                <div
                  style={{
                    fontSize: "3.5rem",
                    fontWeight: 900,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <span
                    className={`stat-value ${
                      scanResult.overall_risk_score >= 70
                        ? "danger"
                        : scanResult.overall_risk_score >= 40
                          ? "warning"
                          : "success"
                    }`}
                    style={{ fontSize: "3.5rem" }}
                  >
                    {scanResult.overall_risk_score}
                  </span>
                </div>
                <div className="stat-label" style={{ fontSize: "0.9rem" }}>
                  Overall Risk Score
                </div>
                <div className="risk-meter" style={{ marginTop: 16 }}>
                  <div
                    className={`risk-meter-fill ${
                      scanResult.risk_level === "CRITICAL"
                        ? "risk-critical"
                        : scanResult.risk_level === "HIGH"
                          ? "risk-high"
                          : scanResult.risk_level === "MEDIUM"
                            ? "risk-medium"
                            : "risk-low"
                    }`}
                    style={{
                      width: `${scanResult.overall_risk_score}%`,
                    }}
                  />
                </div>
                <span
                  className={`badge ${
                    scanResult.risk_level === "CRITICAL" ||
                    scanResult.risk_level === "HIGH"
                      ? "badge-danger"
                      : scanResult.risk_level === "MEDIUM"
                        ? "badge-warning"
                        : "badge-success"
                  }`}
                  style={{ marginTop: 12, fontSize: "0.85rem" }}
                >
                  {scanResult.risk_level} RISK
                </span>
              </div>

              <div className="grid-4 mt-2">
                <div className="stat-card">
                  <div className="stat-value">
                    {scanResult.total_records}
                  </div>
                  <div className="stat-label">Total Records</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {scanResult.total_equivalence_classes}
                  </div>
                  <div className="stat-label">Eq. Classes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value danger">
                    {scanResult.homogeneity_vulnerable.length}
                  </div>
                  <div className="stat-label">Homogeneous</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value warning">
                    {scanResult.skewed_classes.length}
                  </div>
                  <div className="stat-label">Skewed</div>
                </div>
              </div>

              {scanResult.homogeneity_vulnerable.length > 0 && (
                <div className="mt-3">
                  <h4
                    style={{
                      color: "var(--accent-rose)",
                      marginBottom: 12,
                      fontSize: "0.95rem",
                    }}
                  >
                    🚨 Homogeneity Vulnerabilities (100% Attack Success)
                  </h4>
                  {scanResult.homogeneity_vulnerable.map((v, idx) => (
                    <div key={idx} className="eq-class-card vulnerable">
                      <div className="eq-class-header">
                        <span className="eq-class-key">
                          {v.equivalence_class}
                        </span>
                        <div className="eq-class-meta">
                          <span className="badge badge-danger">
                            All have: {v.dominant_value}
                          </span>
                          <span className="badge badge-neutral">
                            {v.size} records
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helper: Parse eq class key to QI dict ──────────────────────────────────
function parseEqClassKey(key, data) {
  // The key looks like: "('30-39', '130**', 'Male')" or similar
  // We need to extract the QI values from an actual record in that class
  // Simpler approach: use the first record from the eq class records
  // But we don't have records in eqClasses summary, so parse the key
  try {
    const cleaned = key.replace(/[()'"]/g, "");
    const parts = cleaned.split(", ");
    return {
      age: parts[0],
      zipcode: parts[1],
      gender: parts[2],
    };
  } catch {
    return {};
  }
}

// ─── Attack Result Display ──────────────────────────────────────────────────
function AttackResultDisplay({ result }) {
  return (
    <div
      className={`attack-result ${result.success ? "success" : "failed"} slide-up`}
    >
      <div className="attack-result-header">
        <span className="attack-result-icon">
          {result.success ? "💀" : "🛡️"}
        </span>
        <div>
          <div className="attack-result-title">
            {result.success ? "Attack Successful!" : "Attack Mitigated"}
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            {result.attack_type === "homogeneity"
              ? "Homogeneity Attack"
              : "Background Knowledge Attack"}
          </div>
        </div>
      </div>

      <p style={{ fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 16 }}>
        {result.message}
      </p>

      <div className="grid-3 mb-2">
        <div className="stat-card">
          <div
            className={`stat-value ${result.confidence >= 80 ? "danger" : result.confidence >= 50 ? "warning" : "success"}`}
          >
            {result.confidence}%
          </div>
          <div className="stat-label">Confidence</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{result.matching_count || "—"}</div>
          <div className="stat-label">Matching Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {result.inferred_value || "Unknown"}
          </div>
          <div className="stat-label">Inferred Diagnosis</div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            marginBottom: 4,
          }}
        >
          Attack Confidence
        </div>
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{
              width: `${result.confidence}%`,
              background:
                result.confidence >= 80
                  ? "var(--gradient-danger)"
                  : result.confidence >= 50
                    ? "var(--gradient-warning)"
                    : "var(--gradient-success)",
            }}
          />
        </div>
      </div>

      {/* Show sensitive value distribution if available */}
      {result.sensitive_distribution && (
        <div className="mt-2">
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Diagnosis Distribution in Equivalence Class:
          </div>
          <DistributionBars
            distribution={result.sensitive_distribution || result.remaining_distribution}
            total={result.matching_count}
          />
        </div>
      )}
    </div>
  );
}

function DistributionBars({ distribution, total }) {
  const colors = [
    "#6366f1", "#8b5cf6", "#a855f7", "#06b6d4", "#10b981",
    "#f59e0b", "#f43f5e", "#3b82f6",
  ];
  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

  return (
    <div className="dist-bar-container">
      {sorted.map(([label, count], idx) => (
        <div key={label} className="dist-bar-row">
          <span className="dist-bar-label">{label}</span>
          <div className="dist-bar-track">
            <div
              className="dist-bar-fill"
              style={{
                width: `${(count / total) * 100}%`,
                background: colors[idx % colors.length],
              }}
            >
              {count}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
