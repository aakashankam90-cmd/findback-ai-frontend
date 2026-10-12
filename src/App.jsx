
import {
  useEffect,
  useState
} from "react";
import {
  getItems,
  createItem,
  uploadItemImage,
  getMatches,
  submitClaim,
  requestClaimOtp,
  verifyClaimOtp,
  getPendingClaims,
  reviewClaim
} from "./api";import "./App.css";

function App() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  
const [form, setForm] = useState({
  type: "LOST",
  title: "",
  category: "Electronics",
  color: "",
  location: "",
  description: "",
  imageFile: null,
});

  const [notice, setNotice] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [matches, setMatches] = useState({});
  const [matchingId, setMatchingId] = useState(null);
  const [matchError, setMatchError] = useState("");

  const [claimTarget, setClaimTarget] = useState(null);

const [claimForm, setClaimForm] = useState({
  claimantUserId: "test-user-1",
  email: "",
  evidence: "",
  otp: "",
});

const [claimId, setClaimId] = useState("");
const [claimStep, setClaimStep] = useState("details");
const [claimBusy, setClaimBusy] = useState(false);
const [claimMessage, setClaimMessage] = useState("");
const [pendingClaims, setPendingClaims] = useState([]);
const [claimsLoading, setClaimsLoading] = useState(false);
const [claimsError, setClaimsError] = useState("");
const [reviewingClaimId, setReviewingClaimId] = useState(null);
const [adminEmail, setAdminEmail] = useState("");
const [adminPassword, setAdminPassword] = useState("");
const [adminAuthHeader, setAdminAuthHeader] = useState("");
const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  
async function loadPendingClaims(authHeader = adminAuthHeader) {
  if (!authHeader) {
    setClaimsError("Please log in as an administrator first.");
    return;
  }

  try {
    setClaimsLoading(true);
    setClaimsError("");

    const data = await getPendingClaims(authHeader);
    setPendingClaims(Array.isArray(data) ? data : []);
  } catch (err) {
    setClaimsError(err.message || "Could not load pending claims.");
  } finally {
    setClaimsLoading(false);
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();

  try {
    setClaimsLoading(true);
    setClaimsError("");

    const authHeader =
      "Basic " + btoa(`${adminEmail.trim().toLowerCase()}:${adminPassword}`);

    await getPendingClaims(authHeader);

    setAdminAuthHeader(authHeader);
    setAdminLoggedIn(true);
    setAdminPassword("");
    await loadPendingClaims(authHeader);
  } catch (err) {
    setAdminLoggedIn(false);
    setAdminAuthHeader("");
    setClaimsError(
      "Admin login failed. Check your credentials and confirm that the account has the ADMIN role."
    );
  } finally {
    setClaimsLoading(false);
  }
}

async function handleClaimReview(claimId, decision) {
  const action = decision === "APPROVED" ? "approve" : "reject";

  if (!window.confirm(`Are you sure you want to ${action} this claim?`)) {
    return;
  }

  try {
    setReviewingClaimId(claimId);
    setClaimsError("");

    await reviewClaim(claimId, decision, adminAuthHeader);
    await loadPendingClaims();
    setNotice(`Claim ${action}d successfully.`);
  } catch (err) {
    setClaimsError(err.message || "Could not review the claim.");
  } finally {
    setReviewingClaimId(null);
  }
}


  // Save the report and upload its image
  async function submitReport(event) {
    event.preventDefault();

    try {
      setNotice("");

      const payload = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.toUpperCase(),
        color: form.color.trim(),
        location: form.location.trim(),
        date: new Date().toISOString().split("T")[0],
        imageUrl: "",
        reportedBy: "",
        status: "ACTIVE",
      };

      // First save the report to MongoDB
      const savedItem = await createItem(payload);
      let finalItem = savedItem;

      // Then upload the optional image
      if (form.imageFile) {
        finalItem = await uploadItemImage(
          savedItem.id,
          form.imageFile
        );
      }

      // Add the saved report to the screen
      setItems((current) => [finalItem, ...current]);
      setFilter("ALL");
      setSearch("");
      setShowForm(false);
      setNotice("Report submitted successfully!");

      setForm({
        type: "LOST",
        title: "",
        category: "Electronics",
        color: "",
        location: "",
        description: "",
        imageFile: null,
      });
    } catch (err) {
      console.error("Report submission failed:", err);
      setNotice(
        err.message || "Failed to submit report."
      );
    }
  }

  // Find possible found-item matches for a lost item
  async function findMatches(itemId) {
    setMatchingId(itemId);
    setMatchError("");

    try {
      const results = await getMatches(itemId);
      console.log("Actual match API response:", results);

      setMatches((current) => ({
        ...current,
        [itemId]: results,
      }));
    } catch (err) {
      console.error("Matching failed:", err);
      setMatchError(
        err.message || "Could not load matches. Please try again."
      );
    } finally {
      setMatchingId(null);
    }
  }

  
useEffect(() => {
  async function loadItems() {
    try {
      setLoading(true);
      setError("");

      const data = await getItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load items:", err);
      setError(err.message || "Could not load items.");
    } finally {
      setLoading(false);
    }
  }

  loadItems();
}, []);


  function openReport(type = "LOST") {
    setForm((current) => ({
      ...current,
      type,
    }));
    setShowForm(true);
  }

  
function updateForm(event) {
  const { name, value } = event.target;

  setForm((current) => ({
    ...current,
    [name]: value,
  }));
}


  function getItemIcon(item) {
    if (item.category === "ELECTRONICS") return "ðŸ“±";
    if (item.category === "BAGS") return "ðŸŽ’";
    if (item.category === "CLOTHING") return "ðŸ‘•";
    if (item.category === "DOCUMENTS") return "ðŸ“„";
    if (item.category === "KEYS") return "ðŸ”‘";
    return "ðŸ“¦";
  }

  function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function startClaim(lostItem, match) {
  setClaimTarget({
    lostItem,
    foundItem: match.foundItem,
  });

  setClaimForm({
    claimantUserId: "test-user-1",
    email: "",
    evidence: "",
    otp: "",
  });

  setClaimId("");
  setClaimStep("details");
  setClaimMessage("");
}

async function sendClaimOtp(event) {
  event.preventDefault();

  if (!claimTarget) return;

  setClaimBusy(true);
  setClaimMessage("");

  try {
    const claim = await submitClaim({
      lostItemId: claimTarget.lostItem.id,
      foundItemId: claimTarget.foundItem.id,
      claimantUserId: claimForm.claimantUserId.trim(),
      contactType: "EMAIL",
      contactValue: claimForm.email.trim().toLowerCase(),
      ownershipEvidence: claimForm.evidence.trim(),
    });

    if (!claim.id) {
      throw new Error("Claim created, but no claim ID was returned.");
    }

    setClaimId(claim.id);

    await requestClaimOtp(
      claim.id,
      claimForm.email.trim().toLowerCase()
    );

    setClaimStep("otp");
    setClaimMessage("Verification code sent. Check your email.");
  } catch (error) {
    setClaimMessage(error.message || "Unable to send verification code.");
  } finally {
    setClaimBusy(false);
  }
}

async function verifyClaim(event) {
  event.preventDefault();

  setClaimBusy(true);
  setClaimMessage("");

  try {
    await verifyClaimOtp(
      claimId,
      claimForm.email.trim().toLowerCase(),
      claimForm.otp.trim()
    );

    setClaimStep("done");
    setClaimMessage(
      "Email verified successfully. Your claim is pending review."
    );
  } catch (error) {
    setClaimMessage(error.message || "OTP verification failed.");
  } finally {
    setClaimBusy(false);
  }
}
  
  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#dashboard">
          <span className="brand-icon">F</span>
          FindBack<span className="brand-ai">AI</span>
        </a>

        <nav>
          <a className="active" href="#dashboard">
            Dashboard
          </a>
          <a href="#items">Browse items</a>
          <a href="#how-it-works">How it works</a>
        </nav>

        <button
          type="button"
          className="primary-btn nav-btn"
          onClick={() => openReport()}
        >
          + Report item
        </button>
      </header>

      <main>
        <section className="hero" id="dashboard">
          <div className="hero-copy">
            <span className="eyebrow">
              SMART LOST &amp; FOUND PLATFORM
            </span>

            <h1>
              Lost something?
              <br />
              <span>Let's bring it back.</span>
            </h1>

            <p>
              Report lost and found belongings and discover
              potential matches through intelligent item comparison.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() => openReport("LOST")}
              >
                Report lost item <span>â†—</span>
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => openReport("FOUND")}
              >
                I found something
              </button>
            </div>

            <div className="trust-note">
              <span className="status-dot" />
              Similarity scores are suggestions, not proof of ownership.
            </div>
          </div>

          <div className="hero-visual">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />

            <div className="phone-card">
              <div className="phone-top">
                <span />
                <span>â€¢â€¢â€¢</span>
              </div>

              <div className="phone-image">ðŸ“±</div>
              <span className="match-tag">POTENTIAL MATCH</span>
              <h3>Black iPhone 15</h3>
              <p>Anurag University</p>

              <div className="match-bar">
                <span />
              </div>

              <div className="match-footer">
                <strong>80% similarity</strong>
                <span>Review match â†’</span>
              </div>
            </div>

            <div className="floating-chip chip-top">
              âœ¦ Smart matching
            </div>
            <div className="floating-chip chip-bottom">
              âœ“ Reports organized
            </div>
          </div>
        </section>

        <section className="stats">
          <div>
            <span>01</span>
            <strong>Report an item</strong>
            <p>Share its details</p>
          </div>
          <div>
            <span>02</span>
            <strong>Find similarities</strong>
            <p>Compare item reports</p>
          </div>
          <div>
            <span>03</span>
            <strong>Verify ownership</strong>
            <p>Review evidence safely</p>
          </div>
        </section>

        
        
<section className="items-section" id="items">
  <div className="section-heading">
    <span className="eyebrow">COMMUNITY REPORTS</span>
    <h2>Browse Lost &amp; Found Items</h2>
    <p>Explore reports and discover possible matches.</p>
  </div>

  <div className="toolbar">
    <div className="filters">
      <button
        type="button"
        className={filter === "ALL" ? "selected" : ""}
        onClick={() => setFilter("ALL")}
      >
        All items
      </button>
      <button
        type="button"
        className={filter === "LOST" ? "selected" : ""}
        onClick={() => setFilter("LOST")}
      >
        Lost items
      </button>
      <button
        type="button"
        className={filter === "FOUND" ? "selected" : ""}
        onClick={() => setFilter("FOUND")}
      >
        Found items
      </button>
    </div>

    <input
      className="search"
      type="search"
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder="Search items..."
      aria-label="Search items"
    />
  </div>

  {loading && <p>Loading items...</p>}
  {error && <p role="alert">{error}</p>}
  {matchError && <p role="alert">{matchError}</p>}

  {!loading && !error && (
    <div className="item-grid">
      {items
        .filter((item) => {
          const matchesType =
            filter === "ALL" ||
            String(item.type || "").toUpperCase() === filter;

          const query = search.trim().toLowerCase();
          const matchesSearch =
            !query ||
            [
              item.title,
              item.category,
              item.location,
              item.description,
            ].some((value) =>
              String(value || "").toLowerCase().includes(query)
            );

          return matchesType && matchesSearch;
        })
        .map((item) => (
          <article className="item-card" key={item.id}>
            <div className="item-art">
              {item.imageUrl ? (
                <img
                  className="item-image"
                  src={`http://localhost:8080${item.imageUrl}`}
                  alt={item.title}
                />
              ) : (
                <span className="item-emoji">{getItemIcon(item)}</span>
              )}

              <span
                className={`type-pill ${
                  String(item.type).toUpperCase() === "LOST"
                    ? "lost"
                    : "found"
                }`}
              >
                {item.type}
              </span>
            </div>

            <div className="item-content">
              <p className="item-meta">
                {item.category || "OTHER"} · {formatDate(item.date)}
              </p>

              <h3>{item.title}</h3>
              <p>{item.description || "No description provided."}</p>
              <p className="item-location">
                {item.location || "Location not specified"}
              </p>

              <div className="item-details">
                <span>{item.color || "Color not specified"}</span>
                <span>
                  {String(item.type).toUpperCase() === "LOST"
                    ? "Lost item"
                    : "Found item"}
                </span>
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={() => findMatches(item.id)}
                disabled={matchingId === item.id}
              >
                {matchingId === item.id
                  ? "Finding matches..."
                  : "Find Matches"}
              </button>

              {matches[item.id] && (
                <div className="match-results">
                  <h4>Possible Matches</h4>

                  {matches[item.id].length === 0 ? (
                    <p>No matches found yet.</p>
                  ) : (
                    matches[item.id].map((match) => {
                      const score = Number(
                        match.similarity ?? match.score ?? 0
                      );

                      const percentage = Math.max(
                        0,
                        Math.min(100, score <= 1 ? score * 100 : score)
                      );

                      return (
                        <div className="match-card" key={match.id}>
                          <div className="match-card-heading">
                            <strong>{match.title || "Potential match"}</strong>
                            <span>
                              {Number.isFinite(percentage)
                                ? `${Math.round(percentage)}% match`
                                : "Potential match"}
                            </span>
                          </div>

                          <div className="match-progress">
                            <span
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <p>{match.location || "Location unavailable"}</p>
                          <p>
                            {match.description || "No description provided."}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
    </div>
  )}

  {!loading && !error && items.length === 0 && (
    <p>No reports have been submitted yet.</p>
  )}
</section>


      

        <section className="how-section" id="how-it-works">
          <span className="eyebrow">SIMPLE. SECURE. SMART.</span>
          <h2>Every lost item deserves a way home.</h2>
          <p>
            Matching can help people find leads. Owners should
            verify private details before an item is returned.
          </p>
        </section>
      </main>

      <footer>
        <a className="brand" href="#dashboard">
          <span className="brand-icon">F</span>
          FindBack<span className="brand-ai">AI</span>
        </a>
        <span>Helping belongings find their way back.</span>
      </footer>

      {showForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowForm(false)}
        >
          <form
            className="report-modal"
            onSubmit={submitReport}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="close-btn"
              onClick={() => setShowForm(false)}
            >
              Ã—
            </button>

            <span className="eyebrow">COMMUNITY REPORT</span>
            <h2>Report an item</h2>
            <p className="modal-intro">
              Enter the details so others can identify the item.
            </p>

            <label>Report type</label>
            <div className="type-switch">
              <button
                type="button"
                className={form.type === "LOST" ? "selected" : ""}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    type: "LOST",
                  }))
                }
              >
                I lost an item
              </button>

              <button
                type="button"
                className={form.type === "FOUND" ? "selected" : ""}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    type: "FOUND",
                  }))
                }
              >
                I found an item
              </button>
            </div>

            <label>Item name *</label>
            <input
              name="title"
              required
              value={form.title}
              onChange={updateForm}
              placeholder="e.g. Black iPhone 15"
            />

            <label>Item image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setForm((current) => ({
                  ...current,
                  imageFile: file,
                }));
              }}
            />

            <label>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={updateForm}
            >
              <option>Electronics</option>
              <option>Bags</option>
              <option>Clothing</option>
              <option>Documents</option>
              <option>Keys</option>
              <option>Other</option>
            </select>

            <label>Color</label>
            <input
              name="color"
              value={form.color}
              onChange={updateForm}
              placeholder="e.g. Black"
            />

            <label>Location *</label>
            <input
              name="location"
              required
              value={form.location}
              onChange={updateForm}
              placeholder="Where was it lost or found?"
            />

            <label>Description *</label>
            <textarea
              name="description"
              required
              value={form.description}
              onChange={updateForm}
              placeholder="Describe visible features..."
              rows="3"
            />

            <button
              type="submit"
              className="primary-btn submit-btn"
            >
              Save report
            </button>

            <p className="form-disclaimer">
              Your report will be saved to FindBack AI.
            </p>
          </form>
        </div>
      )}

      {claimTarget && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="claim-heading">
            <h2 id="claim-heading">Claim Details</h2>
            <p>
              Found item: <strong>{claimTarget.foundItem.title}</strong>
            </p>

            {claimStep === "details" && (
              <form onSubmit={sendClaimOtp}>
                <label htmlFor="claim-email">Email</label>
                <input
                  id="claim-email"
                  type="email"
                  value={claimForm.email}
                  onChange={(event) => setClaimForm({ ...claimForm, email: event.target.value })}
                  placeholder="Enter your email"
                  required
                />

                <label htmlFor="claim-evidence">Proof of Ownership</label>
                <textarea
                  id="claim-evidence"
                  value={claimForm.evidence}
                  onChange={(event) => setClaimForm({ ...claimForm, evidence: event.target.value })}
                  placeholder="Describe identifying details that prove ownership"
                  required
                  rows={4}
                />

                <button type="submit" className="primary-btn" disabled={claimBusy}>
                  {claimBusy ? "Sending..." : "Submit Claim & Send OTP"}
                </button>
              </form>
            )}

            {claimStep === "otp" && (
              <form onSubmit={verifyClaim}>
                <label htmlFor="claim-otp">Email verification code</label>
                <input
                  id="claim-otp"
                  value={claimForm.otp}
                  onChange={(event) => setClaimForm({ ...claimForm, otp: event.target.value })}
                  placeholder="Enter OTP"
                  required
                />
                <button type="submit" className="primary-btn" disabled={claimBusy}>
                  {claimBusy ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            )}

            {claimStep === "done" && (
              <p role="status">Your email is verified. Your claim is pending review.</p>
            )}

            {claimMessage && <p role="status">{claimMessage}</p>}

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setClaimTarget(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
          >
            Ã—
          </button>
        </div>
      )}
    </div>
  );
}

export default App;







