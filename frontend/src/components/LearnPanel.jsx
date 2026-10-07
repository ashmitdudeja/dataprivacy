export default function LearnPanel() {
  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="card" style={{ textAlign: "center", padding: "40px 32px" }}>
        <h2
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            background: "var(--gradient-primary)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 12,
          }}
        >
          Understanding l-Diversity
        </h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: 700, margin: "0 auto", lineHeight: 1.8 }}>
          l-Diversity is a privacy model that addresses the limitations of
          k-anonymity by requiring diversity in the sensitive attributes within
          each equivalence class. This prevents attackers from inferring
          sensitive information even when they know the quasi-identifiers of a
          target individual.
        </p>
      </div>

      {/* Concepts Grid */}
      <div className="grid-2">
        {/* K-Anonymity */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            <span className="card-title-icon">🔒</span>
            k-Anonymity
          </h3>
          <p className="card-description">
            A dataset satisfies <strong>k-anonymity</strong> if every record is
            indistinguishable from at least <em>k-1</em> other records with
            respect to quasi-identifiers (e.g., age, zipcode, gender).
          </p>
          <div className="alert alert-info">
            <span className="alert-icon">📌</span>
            <div>
              <strong>Goal:</strong> Ensure that each individual cannot be uniquely
              identified from a combination of quasi-identifier attributes.
              <br />
              <strong>Method:</strong> Generalization and suppression of
              quasi-identifiers.
            </div>
          </div>
          <div className="alert alert-warning">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Limitation:</strong> k-Anonymity does NOT protect against
              attribute disclosure. If all records in an equivalence class share
              the same sensitive value, the value is revealed!
            </div>
          </div>
        </div>

        {/* L-Diversity */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            <span className="card-title-icon">🎯</span>
            l-Diversity
          </h3>
          <p className="card-description">
            An equivalence class satisfies <strong>l-diversity</strong> if it
            contains at least <em>l</em> &quot;well-represented&quot; values for the
            sensitive attribute. A table satisfies l-diversity if every
            equivalence class satisfies l-diversity.
          </p>
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <div>
              <strong>Distinct l-Diversity:</strong> Each equivalence class must
              have at least <em>l</em> distinct values for the sensitive
              attribute.
            </div>
          </div>
          <div className="alert alert-info">
            <span className="alert-icon">📐</span>
            <div>
              <strong>Entropy l-Diversity:</strong> The entropy of the sensitive
              attribute in each equivalence class must be at least{" "}
              <code className="code">log(l)</code>. This is a stronger guarantee
              that considers the distribution, not just distinct counts.
            </div>
          </div>
        </div>
      </div>

      {/* Attack Types */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 20 }}>
          <span className="card-title-icon">⚔️</span>
          Privacy Attack Types
        </h3>

        <div className="grid-3">
          <div className="stat-card" style={{ padding: 24, textAlign: "left" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>🎯</div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8, color: "var(--accent-rose)" }}>
              Homogeneity Attack
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Exploits equivalence classes where all records have the{" "}
              <strong>same sensitive value</strong>. If an attacker knows that a
              victim belongs to such a group, they learn the sensitive attribute
              with certainty — regardless of k-anonymity.
            </p>
            <div className="badge badge-danger mt-2">Defeats k-Anonymity</div>
          </div>

          <div className="stat-card" style={{ padding: 24, textAlign: "left" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>🧠</div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8, color: "var(--accent-amber)" }}>
              Background Knowledge Attack
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Uses external information to <strong>eliminate candidates</strong>.
              If an attacker knows a victim doesn&apos;t have certain diseases
              (e.g., from their appearance or lifestyle), they can narrow down
              possibilities even in a diverse equivalence class.
            </p>
            <div className="badge badge-warning mt-2">
              Can Defeat l-Diversity
            </div>
          </div>

          <div className="stat-card" style={{ padding: 24, textAlign: "left" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>📊</div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8, color: "var(--accent-violet)" }}>
              Skewness Attack
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Targets classes with <strong>skewed distributions</strong>. Even
              with l distinct values, if one value appears 90% of the time, the
              attacker can make a high-probability inference. Entropy l-diversity
              helps mitigate this.
            </p>
            <div className="badge badge-info mt-2">
              Mitigated by Entropy l-Diversity
            </div>
          </div>
        </div>
      </div>

      {/* Example Walkthrough */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>
          <span className="card-title-icon">📖</span>
          Step-by-Step Example
        </h3>

        <div className="step-indicator" style={{ marginBottom: 24 }}>
          <div className="step-dot completed">1</div>
          <div className="step-line completed" />
          <div className="step-dot completed">2</div>
          <div className="step-line completed" />
          <div className="step-dot completed">3</div>
          <div className="step-line completed" />
          <div className="step-dot completed">4</div>
        </div>

        <div className="grid-2">
          <div>
            <h4 style={{ color: "var(--accent-cyan)", marginBottom: 8, fontSize: "0.95rem" }}>
              Step 1: Original Data
            </h4>
            <div className="table-container" style={{ marginBottom: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Age</th>
                    <th>Zip</th>
                    <th>Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>28</td><td>13053</td><td>Flu</td></tr>
                  <tr><td>29</td><td>13068</td><td>HIV</td></tr>
                  <tr><td>31</td><td>13053</td><td>HIV</td></tr>
                  <tr><td>35</td><td>13068</td><td>HIV</td></tr>
                </tbody>
              </table>
            </div>

            <h4 style={{ color: "var(--accent-cyan)", marginBottom: 8, fontSize: "0.95rem" }}>
              Step 2: After 2-Anonymity
            </h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Age</th>
                    <th>Zip</th>
                    <th>Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>2*</td><td>130**</td><td>Flu</td></tr>
                  <tr><td>2*</td><td>130**</td><td>HIV</td></tr>
                  <tr className="highlight-row"><td>3*</td><td>130**</td><td>HIV</td></tr>
                  <tr className="highlight-row"><td>3*</td><td>130**</td><td>HIV</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 style={{ color: "var(--accent-rose)", marginBottom: 8, fontSize: "0.95rem" }}>
              Step 3: Homogeneity Attack!
            </h4>
            <div className="alert alert-danger">
              <span className="alert-icon">💀</span>
              <div>
                The group <code className="code">(3*, 130**)</code> has only &quot;HIV&quot;
                diagnoses. If an attacker knows someone aged 31-35 from zipcode
                130**, they know with certainty the victim has HIV — despite
                2-anonymity being satisfied!
              </div>
            </div>

            <h4 style={{ color: "var(--accent-emerald)", marginBottom: 8, fontSize: "0.95rem", marginTop: 24 }}>
              Step 4: l-Diversity to the Rescue
            </h4>
            <div className="alert alert-success">
              <span className="alert-icon">🛡️</span>
              <div>
                With <strong>2-diversity</strong>, each equivalence class must
                have at least 2 distinct diagnosis values. The group{" "}
                <code className="code">(3*, 130**)</code> would need to include
                at least one non-HIV diagnosis, making it impossible to conclude
                the victim has HIV with certainty.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Use */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>
          <span className="card-title-icon">🚀</span>
          How to Use This Demo
        </h3>
        <div className="grid-2">
          <div>
            <ol style={{ listStyle: "none", padding: 0 }}>
              {[
                { step: "1", text: "Generate synthetic hospital data in the Data tab", icon: "🏥" },
                { step: "2", text: "Apply generalization to anonymize quasi-identifiers", icon: "🛡️" },
                { step: "3", text: "Check k-anonymity and l-diversity properties", icon: "🔍" },
                { step: "4", text: "Run attacks to see vulnerabilities in action", icon: "⚔️" },
              ].map((item) => (
                <li
                  key={item.step}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--gradient-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </span>
                  <span>{item.icon} {item.text}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <div className="alert alert-info" style={{ marginBottom: 12 }}>
              <span className="alert-icon">💡</span>
              <div>
                <strong>Tip:</strong> Try generating data, then applying minimal
                generalization (age level 2, zipcode level 2). Check k-anonymity
                — it may pass. Then check l-diversity — you&apos;ll likely find
                violations! Run the homogeneity attack on vulnerable classes to
                see the attack succeed.
              </div>
            </div>
            <div className="alert alert-warning">
              <span className="alert-icon">🔬</span>
              <div>
                <strong>Experiment:</strong> Increase generalization levels and
                observe how it affects both privacy (more violations fixed) and
                utility (more information loss). This is the classic
                privacy-utility tradeoff!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
