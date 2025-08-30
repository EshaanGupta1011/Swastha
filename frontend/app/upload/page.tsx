"use client";
import "./page.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClipLoader from "react-spinners/ClipLoader";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("General");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    if (!storedToken) {
      router.push("/login");
    }
  }, [router]);

  if (!isClient) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setExtractedData(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/upload/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setExtractedData(data.extracted_data);
      } else {
        setError(data.detail || data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Frontend fetch error:", err);
      setError("Network error or failed to parse response");
    } finally {
      setLoading(false);
    }
  };

  const renderMetadata = (metadata: any) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;
    return (
      <div className="upload-metadata-section">
        <h4 className="upload-section-title">Report Metadata</h4>
        <div className="upload-metadata-grid">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="upload-metadata-item">
              <span className="upload-metadata-key">
                {key.replace(/_/g, " ")}:
              </span>{" "}
              <span className="upload-metadata-value">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTestResults = (results: any[]) => {
    if (!results || results.length === 0) return null;
    return (
      <div className="upload-sections-container">
        <h4 className="upload-section-title">Test Results</h4>
        <div className="upload-sections-list">
          {results.map((resultSection: any, index: number) => (
            <div key={index} className="upload-section-card">
              <div className="upload-section-header">
                Section: {resultSection.section || "Unknown"}
              </div>
              {resultSection.tests && resultSection.tests.length > 0 ? (
                <div className="upload-table-container">
                  <table className="upload-data-table">
                    <thead>
                      <tr className="upload-table-header-row">
                        <th className="upload-table-header-cell">Test Name</th>
                        <th className="upload-table-header-cell">Result</th>
                        <th className="upload-table-header-cell">Unit</th>
                        <th className="upload-table-header-cell">
                          Reference Range
                        </th>
                        <th className="upload-table-header-cell">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultSection.tests.map(
                        (test: any, testIndex: number) => (
                          <tr key={testIndex} className="upload-table-row">
                            <td className="upload-table-cell">
                              {test.test_name || ""}
                            </td>
                            <td className="upload-table-cell upload-table-cell--result">
                              {test.result || ""}
                            </td>
                            <td className="upload-table-cell">
                              {test.unit || ""}
                            </td>
                            <td className="upload-table-cell">
                              {test.reference_range || ""}
                            </td>
                            <td className="upload-table-cell">
                              {test.remarks || ""}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="upload-no-data-message">
                  No test data found for this section.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="upload-page-wrapper">
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          Swastha
        </Link>
        <div className="navbar-links">
          <Link href="/dashboard" className="navbar-link">
            Dashboard
          </Link>
          <Link href="/vitals-history" className="navbar-link">
            History
          </Link>
          <Link href="/profile" className="navbar-link">
            Profile
          </Link>
          <button onClick={handleLogout} className="navbar-link">
            Logout
          </button>
        </div>
      </nav>
      <div className="upload-container">
        <div className="upload-card">
          <h2 className="upload-title">Upload Medical Report</h2>
          {error && <div className="upload-error-message">Error: {error}</div>}
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="upload-form-group">
              <label htmlFor="category" className="upload-label">
                Report Category:
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="upload-select upload-category-select"
                required
              >
                <option value="Neurologist">Neurologist</option>
                <option value="Urologist">Urologist</option>
                <option value="Psychologist">Psychologist</option>
                <option value="General">General</option>
                <option value="Dentist">Dentist</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="upload-file-input-wrapper">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="upload-file-input"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="upload-submit-button"
            >
              {loading ? (
                <span className="upload-button-content">
                  <ClipLoader color="#ffffff" size={20} />
                  <span className="upload-button-text">Processing...</span>
                </span>
              ) : (
                "Upload Report"
              )}
            </button>
          </form>

          {loading && (
            <div className="upload-loading-overlay">
              <div className="upload-loading-content">
                <ClipLoader color="#3182ce" size={60} />
                <p className="upload-loading-text">Analyzing your report...</p>
              </div>
            </div>
          )}

          {extractedData && (
            <div className="upload-results-container">
              <h3 className="upload-results-title">Extracted Report Data</h3>
              {extractedData.metadata && renderMetadata(extractedData.metadata)}
              {extractedData.results &&
                renderTestResults(extractedData.results)}
              {extractedData &&
                (!extractedData.metadata ||
                  Object.keys(extractedData.metadata).length === 0) &&
                (!extractedData.results ||
                  extractedData.results.length === 0) && (
                  <pre className="upload-fallback-data">
                    {JSON.stringify(extractedData, null, 2)}
                  </pre>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
