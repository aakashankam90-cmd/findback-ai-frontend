
import { useState } from "react";
import { getPendingClaims, reviewClaim } from "./api";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authHeader, setAuthHeader] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const header =
      "Basic " + btoa(`${email.trim().toLowerCase()}:${password}`);

    try {
      const data = await getPendingClaims(header);
      setAuthHeader(header);
      setClaims(Array.isArray(data) ? data : []);
      setLoggedIn(true);
      setPassword("");
    } catch {
      setError("Login failed. Check your credentials and ADMIN role.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshClaims() {
    setLoading(true);
    setError("");

    try {
      const data = await getPendingClaims(authHeader);
      setClaims(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load claims. Please log in again.");
    } finally {
      setLoading(false);
    }
  }

  async function review(id, decision) {
    const action = decision === "APPROVED" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this claim?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await reviewClaim(id, decision, authHeader);
      await refreshClaims();
      setMessage(`Claim ${action}d successfully.`);
    } catch (err) {
      setError(err.message || "Could not review the claim.");
    }
  }

  function logout() {
    setLoggedIn(false);
    setAuthHeader("");
    setClaims([]);
    setPassword("");
    setMessage("");
    setError("");
  }

  return (
    <main className="admin-page">
      <section className="items-section">
        <div className="section-heading">
          <span className="eyebrow">FINDBACK AI</span>
          <h2>Administrator Dashboard</h2>
          <p>Review ownership claims securely.</p>
        </div>

        {!loggedIn ? (
          <form className="report-modal" onSubmit={login}>
            <h3>Admin Login</h3>

            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            <button className="primary-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <>
            <div className="hero-actions">
              <button
                className="secondary-btn"
                type="button"
                onClick={refreshClaims}
                disabled={loading}
              >
                Refresh Claims
              </button>

              <button
                className="secondary-btn"
                type="button"
                onClick={logout}
              >
                Log Out
              </button>
            </div>

            {loading && <p>Loading claims...</p>}

            {!loading && claims.length === 0 && (
              <p>No pending claims found.</p>
            )}

            <div className="items-grid">
              {claims.map((claim) => (
                <article className="item-card" key={claim.id}>
                  <div className="item-card-content">
                    <h3>Claim for item: {claim.foundItemId || "Found item"}</h3>
                    <p><strong>Claim ID:</strong> {claim.id}</p>
                    <p><strong>Claimant:</strong> {claim.claimantUserId || "Not provided"}</p>
                    <p><strong>Contact:</strong> {claim.contactValue || "Not provided"}</p>
                    <p><strong>Evidence:</strong> {claim.ownershipEvidence || "Not provided"}</p>
                    <p><strong>Status:</strong> {claim.status}</p>

                    <div className="hero-actions">
                      <button
                        className="primary-btn"
                        type="button"
                        onClick={() => review(claim.id, "APPROVED")}
                        disabled={loading}
                      >
                        Approve
                      </button>

                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => review(claim.id, "REJECTED")}
                        disabled={loading}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
      </section>
    </main>
  );
}
