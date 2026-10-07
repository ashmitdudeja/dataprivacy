import { useState, useCallback } from "react";
import { api } from "../api";

const SENSITIVE_DIAGNOSES = [
  "HIV", "Cancer", "Tuberculosis", "Hepatitis B", "Depression",
];

export default function DataPanel({ data, setData, setAnonymizedData }) {
  const [nRecords, setNRecords] = useState(50);
  const [seed, setSeed] = useState(42);
  const [loading, setLoading] = useState(false);

  const generateData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.generateData(nRecords, seed);
      setData(res.records);
      setAnonymizedData(null);
    } catch (e) {
      alert("Error generating data: " + e.message);
    }
    setLoading(false);
  }, [nRecords, seed, setData, setAnonymizedData]);

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span className="card-title-icon">🏥</span>
            Generate Hospital Discharge Data
          </h2>
        </div>
        <p className="card-description">
          Generate synthetic hospital discharge records with quasi-identifiers
          (age, zipcode, gender) and a sensitive attribute (diagnosis). This
          simulates a real-world hospital dataset that needs privacy protection.
        </p>

        <div className="controls-row">
          <div className="form-group">
            <label className="form-label">Number of Records</label>
            <input
              type="number"
              className="form-input"
              value={nRecords}
              onChange={(e) =>
                setNRecords(Math.max(10, Math.min(500, +e.target.value)))
              }
              min={10}
              max={500}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Random Seed</label>
            <input
              type="number"
              className="form-input"
              value={seed}
              onChange={(e) => setSeed(+e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={generateData}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Generating...
              </>
            ) : (
              <>⚡ Generate Data</>
            )}
          </button>
        </div>
      </div>

      {data && data.length > 0 && (
        <div className="card slide-up">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">📋</span>
              Original Dataset
            </h2>
            <span className="badge badge-info">{data.length} records</span>
          </div>

          <div className="grid-4 mb-3">
            <div className="stat-card">
              <div className="stat-value">{data.length}</div>
              <div className="stat-label">Total Records</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {new Set(data.map((r) => r.age)).size}
              </div>
              <div className="stat-label">Unique Ages</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {new Set(data.map((r) => r.zipcode)).size}
              </div>
              <div className="stat-label">Unique Zipcodes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {new Set(data.map((r) => r.diagnosis)).size}
              </div>
              <div className="stat-label">Unique Diagnoses</div>
            </div>
          </div>

          <div className="table-container table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Age</th>
                  <th>Zipcode</th>
                  <th>Gender</th>
                  <th>Diagnosis (Sensitive)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.age}</td>
                    <td>{row.zipcode}</td>
                    <td>{row.gender}</td>
                    <td>
                      <span
                        className={`diagnosis-tag ${
                          SENSITIVE_DIAGNOSES.includes(row.diagnosis)
                            ? "diagnosis-sensitive"
                            : "diagnosis-normal"
                        }`}
                      >
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
    </div>
  );
}
