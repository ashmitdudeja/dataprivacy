import { useState, useCallback } from "react";
import { api } from "../api";

const AGE_LABELS = [
  "Exact (35)",
  "5-year (35-39)",
  "10-year (30-39)",
  "20-year (20-39)",
  "Suppressed (*)",
];
const ZIP_LABELS = [
  "Full (13053)",
  "4-digit (1305*)",
  "3-digit (130**)",
  "2-digit (13***)",
  "Suppressed (*****)",
];
const GENDER_LABELS = ["Exact (Male/Female)", "Suppressed (*)"];

export default function AnonymizePanel({
  data,
  anonymizedData,
  setAnonymizedData,
  kAnonymityResult,
  setKAnonymityResult,
  lDiversityResult,
  setLDiversityResult,
}) {
  const [ageLevel, setAgeLevel] = useState(2);
  const [zipLevel, setZipLevel] = useState(2);
  const [genderLevel, setGenderLevel] = useState(0);
  const [kValue, setKValue] = useState(3);
  const [lValue, setLValue] = useState(2);
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);

  const anonymize = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.anonymize(ageLevel, zipLevel, genderLevel);
      setAnonymizedData(res.records);
      setKAnonymityResult(null);
      setLDiversityResult(null);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  }, [ageLevel, zipLevel, genderLevel, setAnonymizedData, setKAnonymityResult, setLDiversityResult]);

  const autoAnonymize = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.autoAnonymize(kValue);
      setAnonymizedData(res.records);
      setKAnonymityResult(null);
      setLDiversityResult(null);
      // Update slider values to match auto-selected levels
      setAgeLevel(res.generalization_levels.age_level);
      setZipLevel(res.generalization_levels.zip_level);
      setGenderLevel(res.generalization_levels.gender_level);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  }, [kValue, setAnonymizedData, setKAnonymityResult, setLDiversityResult]);

  const checkKAnonymity = useCallback(async () => {
    try {
      const res = await api.checkKAnonymity(kValue);
      setKAnonymityResult(res);
    } catch (e) {
      alert("Error: " + e.message);
    }
  }, [kValue, setKAnonymityResult]);

  const checkLDiversity = useCallback(async () => {
    try {
      const res = await api.checkLDiversity(lValue);
      setLDiversityResult(res);
    } catch (e) {
      alert("Error: " + e.message);
    }
  }, [lValue, setLDiversityResult]);

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <div className="empty-state-text">No data to anonymize</div>
        <div className="empty-state-hint">
          Generate hospital data first in the Data tab.
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Step Indicator */}
      <div className="step-indicator">
        <div className={`step-dot ${data ? "completed" : ""}`}>1</div>
        <div className={`step-line ${data ? "completed" : ""}`} />
        <div className={`step-dot ${anonymizedData ? "completed" : "active"}`}>
          2
        </div>
        <div className={`step-line ${kAnonymityResult ? "completed" : ""}`} />
        <div className={`step-dot ${kAnonymityResult ? "completed" : ""}`}>
          3
        </div>
        <div className={`step-line ${lDiversityResult ? "completed" : ""}`} />
        <div className={`step-dot ${lDiversityResult ? "completed" : ""}`}>
          4
        </div>
      </div>

      {/* Generalization Controls */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span className="card-title-icon">🛡️</span>
            Anonymization Controls
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`btn btn-sm ${!autoMode ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setAutoMode(false)}
            >
              Manual
            </button>
            <button
              className={`btn btn-sm ${autoMode ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setAutoMode(true)}
            >
              Auto k-Anonymity
            </button>
          </div>
        </div>

        {!autoMode ? (
          <>
            <div className="grid-3 mb-2">
              <div className="form-group">
                <label className="form-label">
                  Age Generalization{" "}
                  <span className="range-value">{ageLevel}</span>
                </label>
                <input
                  type="range"
                  className="range-slider"
                  min={0}
                  max={4}
                  value={ageLevel}
                  onChange={(e) => setAgeLevel(+e.target.value)}
                />
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  {AGE_LABELS[ageLevel]}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Zipcode Generalization{" "}
                  <span className="range-value">{zipLevel}</span>
                </label>
                <input
                  type="range"
                  className="range-slider"
                  min={0}
                  max={4}
                  value={zipLevel}
                  onChange={(e) => setZipLevel(+e.target.value)}
                />
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  {ZIP_LABELS[zipLevel]}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Gender Generalization{" "}
                  <span className="range-value">{genderLevel}</span>
                </label>
                <input
                  type="range"
                  className="range-slider"
                  min={0}
                  max={1}
                  value={genderLevel}
                  onChange={(e) => setGenderLevel(+e.target.value)}
                />
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  {GENDER_LABELS[genderLevel]}
                </div>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={anonymize}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Anonymizing...
                </>
              ) : (
                <>🔐 Apply Generalization</>
              )}
            </button>
          </>
        ) : (
          <div className="controls-row">
            <div className="form-group">
              <label className="form-label">
                Target k value <span className="range-value">{kValue}</span>
              </label>
              <input
                type="range"
                className="range-slider"
                min={2}
                max={10}
                value={kValue}
                onChange={(e) => setKValue(+e.target.value)}
              />
            </div>
            <button
              className="btn btn-success"
              onClick={autoAnonymize}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Finding...
                </>
              ) : (
                <>⚙️ Auto-Anonymize for k={kValue}</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Anonymized Data Display */}
      {anonymizedData && (
        <div className="card slide-up">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">📊</span>
              Anonymized Dataset
            </h2>
            <span className="badge badge-success">
              {anonymizedData.length} records
            </span>
          </div>

          <div className="table-container table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Age (Generalized)</th>
                  <th>Zipcode (Generalized)</th>
                  <th>Gender (Generalized)</th>
                  <th>Diagnosis (Sensitive)</th>
                </tr>
              </thead>
              <tbody>
                {anonymizedData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.age}</td>
                    <td>{row.zipcode}</td>
                    <td>{row.gender}</td>
                    <td>
                      <span className="diagnosis-tag diagnosis-normal">
                        {row.diagnosis}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Privacy Checks */}
      {anonymizedData && (
        <div className="grid-2 slide-up">
          {/* K-Anonymity Check */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-title-icon">🔍</span>
                k-Anonymity Check
              </h2>
            </div>
            <div className="controls-row">
              <div className="form-group">
                <label className="form-label">
                  k = <span className="range-value">{kValue}</span>
                </label>
                <input
                  type="range"
                  className="range-slider"
                  min={2}
                  max={10}
                  value={kValue}
                  onChange={(e) => setKValue(+e.target.value)}
                />
              </div>
              <button className="btn btn-secondary" onClick={checkKAnonymity}>
                Check
              </button>
            </div>

            {kAnonymityResult && (
              <div className="mt-2 fade-in">
                <div
                  className={`alert ${kAnonymityResult.satisfied ? "alert-success" : "alert-danger"}`}
                >
                  <span className="alert-icon">
                    {kAnonymityResult.satisfied ? "✅" : "❌"}
                  </span>
                  <div>
                    <strong>
                      {kAnonymityResult.satisfied
                        ? `${kAnonymityResult.k}-Anonymity SATISFIED`
                        : `${kAnonymityResult.k}-Anonymity VIOLATED`}
                    </strong>
                    <br />
                    {kAnonymityResult.total_classes} equivalence classes |
                    Min size: {kAnonymityResult.min_class_size} | Max size:{" "}
                    {kAnonymityResult.max_class_size}
                    {kAnonymityResult.violations_count > 0 && (
                      <>
                        <br />
                        {kAnonymityResult.violations_count} classes violate k=
                        {kAnonymityResult.k}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* L-Diversity Check */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-title-icon">🎯</span>
                l-Diversity Check
              </h2>
            </div>
            <div className="controls-row">
              <div className="form-group">
                <label className="form-label">
                  l = <span className="range-value">{lValue}</span>
                </label>
                <input
                  type="range"
                  className="range-slider"
                  min={2}
                  max={8}
                  value={lValue}
                  onChange={(e) => setLValue(+e.target.value)}
                />
              </div>
              <button className="btn btn-secondary" onClick={checkLDiversity}>
                Check
              </button>
            </div>

            {lDiversityResult && (
              <div className="mt-2 fade-in">
                <div
                  className={`alert ${lDiversityResult.satisfied ? "alert-success" : "alert-danger"}`}
                >
                  <span className="alert-icon">
                    {lDiversityResult.satisfied ? "✅" : "❌"}
                  </span>
                  <div>
                    <strong>
                      {lDiversityResult.satisfied
                        ? `${lDiversityResult.l}-Diversity SATISFIED`
                        : `${lDiversityResult.l}-Diversity VIOLATED`}
                    </strong>
                    <br />
                    {lDiversityResult.total_classes} equivalence classes
                    {lDiversityResult.violations_count > 0 && (
                      <>
                        <br />
                        {lDiversityResult.violations_count} classes violate l=
                        {lDiversityResult.l}
                      </>
                    )}
                  </div>
                </div>

                {lDiversityResult.violations &&
                  lDiversityResult.violations.length > 0 && (
                    <div className="mt-2">
                      <h4
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--accent-rose)",
                          marginBottom: 8,
                        }}
                      >
                        ⚠️ Vulnerable Equivalence Classes:
                      </h4>
                      {lDiversityResult.violations.slice(0, 5).map((v, i) => (
                        <div key={i} className="eq-class-card vulnerable">
                          <div className="eq-class-header">
                            <span className="eq-class-key">
                              {v.equivalence_class}
                            </span>
                            <div className="eq-class-meta">
                              <span className="badge badge-danger">
                                {v.distinct_sensitive_values} distinct
                              </span>
                              <span className="badge badge-neutral">
                                {v.size} records
                              </span>
                            </div>
                          </div>
                          <DistributionBars
                            distribution={v.sensitive_distribution}
                            total={v.size}
                          />
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DistributionBars({ distribution, total }) {
  const colors = [
    "#6366f1", "#8b5cf6", "#a855f7", "#06b6d4", "#10b981",
    "#f59e0b", "#f43f5e", "#3b82f6", "#ec4899", "#14b8a6",
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
