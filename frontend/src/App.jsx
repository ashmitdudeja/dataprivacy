import { useState } from "react";
import "./index.css";
import DataPanel from "./components/DataPanel";
import AnonymizePanel from "./components/AnonymizePanel";
import AttackPanel from "./components/AttackPanel";
import LearnPanel from "./components/LearnPanel";

const TABS = [
  { key: "learn", icon: "📖", label: "Learn" },
  { key: "data", icon: "🏥", label: "Data" },
  { key: "anonymize", icon: "🛡️", label: "Anonymize" },
  { key: "attack", icon: "⚔️", label: "Attacks" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("learn");
  const [data, setData] = useState(null);
  const [anonymizedData, setAnonymizedData] = useState(null);
  const [kAnonymityResult, setKAnonymityResult] = useState(null);
  const [lDiversityResult, setLDiversityResult] = useState(null);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">l-Diversity Attack Demonstration</h1>
        <p className="app-subtitle">
          Interactive privacy analysis on hospital discharge data
        </p>
      </header>

      <nav className="nav-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="nav-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main>
        {activeTab === "learn" && <LearnPanel />}

        {activeTab === "data" && (
          <DataPanel
            data={data}
            setData={setData}
            setAnonymizedData={setAnonymizedData}
          />
        )}

        {activeTab === "anonymize" && (
          <AnonymizePanel
            data={data}
            anonymizedData={anonymizedData}
            setAnonymizedData={setAnonymizedData}
            kAnonymityResult={kAnonymityResult}
            setKAnonymityResult={setKAnonymityResult}
            lDiversityResult={lDiversityResult}
            setLDiversityResult={setLDiversityResult}
          />
        )}

        {activeTab === "attack" && (
          <AttackPanel anonymizedData={anonymizedData} />
        )}
      </main>

      <footer
        style={{
          textAlign: "center",
          padding: "32px 0 16px",
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          borderTop: "1px solid var(--border-subtle)",
          marginTop: 40,
        }}
      >
        <p>
          l-Diversity Attack Demonstration — Data Privacy Research Tool
        </p>
        <p style={{ marginTop: 4 }}>
          Built with FastAPI + React • Hospital data is synthetic
        </p>
      </footer>
    </div>
  );
}
