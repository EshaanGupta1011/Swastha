"use client";
import "./page.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
interface Trend {
  test_name: string;
  trend: string;
  slope: number;
  data_points_count: number;
}
interface Alert {
  test_name: string;
  message: string;
  latest_report_date: string;
}
interface Correlation {
  test1: string;
  test2: string;
  correlation_coefficient: number;
  p_value: number;
  strength: string;
  direction: string;
  data_points: number;
}
interface AnalysisResult {
  message: string;
  analysis: {
    trends: Trend[];
    alerts: Alert[];
    correlations: Correlation[];
  };
}
interface Metadata {
  [key: string]: string | null | undefined;
  card_no?: string | null;
  name?: string | null;
  age_sex?: string | null;
  lab_no?: string | null;
  reg_no?: string | null;
  sample_collection_date?: string | null;
  report_date?: string | null;
  ref_dr?: string | null;
}
interface Test {
  test_name: string;
  result: string;
  unit: string;
  reference_range: string;
  remarks: string;
}
interface ResultsSection {
  section: string | null;
  tests: Test[];
}
interface ExtractedData {
  metadata: Metadata;
  results: ResultsSection[];
}
interface ReportHistoryItem {
  filename: string;
  extracted_data: ExtractedData;
  category: string;
}
interface ComparisonReading {
  value: string;
  unit: string;
  reference_range: string;
  remarks: string;
  date: string;
  filename: string;
}
interface ComparisonTestItem {
  test_name: string;
  readings: (ComparisonReading | null)[];
}
interface ComparisonResponse {
  comparison_data?: ComparisonTestItem[];
  reports?: { filename: string; date: string }[];
  message?: string;
}
export default function VitalsHistory() {
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResponse | null>(null);
  const [comparing, setComparing] = useState(false);
  const [detailReport, setDetailReport] = useState<string>("");
  const [detailData, setDetailData] = useState<ReportHistoryItem | null>(null);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [selectedVital, setSelectedVital] = useState<string>("");
  const [vitalData, setVitalData] = useState<{
    dates: string[];
    values: number[];
    unit: string;
  } | null>(null);
  const [vitalOptions, setVitalOptions] = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections] = useState({
    comparison: false,
    details: false,
    graph: false,
    analysis: true,
  });
  const [deletingReport, setDeletingReport] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [analyzing, setAnalyzing] = useState(false);
  useEffect(() => {
    setIsClient(true);
    const tok = localStorage.getItem("token");
    setToken(tok);
    if (!tok) router.push("/login");
  }, [router]);
  useEffect(() => {
    if (!isClient || !token) return;
    setLoading(true);
    setError(null);
    let url = `${process.env.NEXT_PUBLIC_API_URL}/vitals/history`;
    if (selectedCategory)
      url += `?category=${encodeURIComponent(selectedCategory)}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setHistory(data.history || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isClient, token, selectedCategory]);
  const handleCompare = async () => {
    setError(null);
    setComparisonResult(null);
    setComparing(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/vitals/compare`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let errMsg = `Error ${res.status}`;
        try {
          const errBody = await res.json();
          errMsg = errBody.detail || errBody.message || JSON.stringify(errBody);
        } catch (parseErr) {
          errMsg = `${res.status} ${res.statusText}`;
        }
        setError(errMsg);
        return;
      }
      const data: ComparisonResponse = await res.json();
      setComparisonResult(data);
      if (data.comparison_data) {
        const testNames = data.comparison_data.map((item) => item.test_name);
        setVitalOptions(testNames);
      }
    } catch (e: any) {
      setError(e?.message || "Comparison failed.");
    } finally {
      setComparing(false);
    }
  };
  const handleViewDetail = () => {
    if (!detailReport) {
      setDetailData(null);
      return;
    }
    const rpt = history.find((r) => r.filename === detailReport) || null;
    setDetailData(rpt);
    setComparisonResult(null);
    setCollapsedSections((prev) => ({ ...prev, details: false }));
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };
  const toggleSection = (
    section: "comparison" | "details" | "graph" | "analysis"
  ) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  const handleDelete = async (filename: string) => {
    const target = history.find((r) => r.filename === filename);
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the report "${
        target ? getDisplayDate(target) : filename
      }"? This action cannot be undone.`
    );
    if (!confirmDelete) return;
    setDeletingReport(filename);
    setDeleteError(null);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vitals/${encodeURIComponent(
          filename
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        let errorMessage = `Failed to delete report: ${res.status} ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (jsonError) {
          console.error("Could not parse delete error JSON:", jsonError);
        }
        throw new Error(errorMessage);
      }
      setHistory((prevHistory) =>
        prevHistory.filter((report) => report.filename !== filename)
      );
      if (detailReport === filename) {
        setDetailReport("");
        setDetailData(null);
      }
      if (
        comparisonResult &&
        comparisonResult.reports?.some((rep) => rep.filename === filename)
      ) {
        setComparisonResult(null);
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError(err?.message || "Failed to delete report. Try again.");
    } finally {
      setDeletingReport(null);
    }
  };
  const handleAnalyze = async () => {
    if (!token) return;
    setError(null);
    setAnalysisResult(null);
    setAnalyzing(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/vitals/analyze`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let errMsg = `Error ${res.status}`;
        try {
          const errBody = await res.json();
          errMsg = errBody.detail || errBody.message || JSON.stringify(errBody);
        } catch (parseErr) {
          errMsg = `${res.status} ${res.statusText}`;
        }
        setError(errMsg);
        return;
      }
      const data: AnalysisResult = await res.json();
      setAnalysisResult(data);
      setCollapsedSections((prev) => ({ ...prev, analysis: false }));
    } catch (e: any) {
      setError(e?.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };
  const getDisplayDate = (r: ReportHistoryItem) => {
    const metadata = r.extracted_data.metadata;
    const dateStr = metadata.report_date || metadata.sample_collection_date;
    if (dateStr) {
      const formatsToTry = [
        "%Y/%m/%d %H:%M",
        "%Y-%m-%d %H:%M",
        "%d/%m/%Y %H:%M",
        "%d-%m-%Y %H:%M",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%Y-%m-%d",
        "%d %b %Y %H:%M",
        "%d %B %Y %H:%M",
        "%d %b %Y",
        "%d %B %Y",
      ];
      for (const fmtStr of formatsToTry) {
        try {
          let dateObj: Date | null = null;
          if (fmtStr === "%Y/%m/%d %H:%M") {
            const [datePart, timePart] = dateStr.split(" ");
            const [year, month, day] = datePart.split("/").map(Number);
            const [hour, minute] = timePart.split(":").map(Number);
            dateObj = new Date(year, month - 1, day, hour, minute);
          } else if (fmtStr === "%Y-%m-%d %H:%M") {
            const [datePart, timePart] = dateStr.split(" ");
            const [year, month, day] = datePart.split("-").map(Number);
            const [hour, minute] = timePart.split(":").map(Number);
            dateObj = new Date(year, month - 1, day, hour, minute);
          } else if (fmtStr === "%d/%m/%Y %H:%M") {
            const [datePart, timePart] = dateStr.split(" ");
            const [day, month, year] = datePart.split("/").map(Number);
            const [hour, minute] = timePart.split(":").map(Number);
            dateObj = new Date(year, month - 1, day, hour, minute);
          } else if (fmtStr === "%d-%m-%Y %H:%M") {
            const [datePart, timePart] = dateStr.split(" ");
            const [day, month, year] = datePart.split("-").map(Number);
            const [hour, minute] = timePart.split(":").map(Number);
            dateObj = new Date(year, month - 1, day, hour, minute);
          } else if (fmtStr === "%d/%m/%Y") {
            const [day, month, year] = dateStr.split("/").map(Number);
            dateObj = new Date(year, month - 1, day);
          } else if (fmtStr === "%d-%m-%Y") {
            const [day, month, year] = dateStr.split("-").map(Number);
            dateObj = new Date(year, month - 1, day);
          } else if (fmtStr === "%Y/%m/%d") {
            const [year, month, day] = dateStr.split("/").map(Number);
            dateObj = new Date(year, month - 1, day);
          } else if (fmtStr === "%Y-%m-%d") {
            const [year, month, day] = dateStr.split("-").map(Number);
            dateObj = new Date(year, month - 1, day);
          } else if (fmtStr === "%d %b %Y %H:%M") {
            dateObj = new Date(dateStr);
          } else if (fmtStr === "%d %B %Y %H:%M") {
            dateObj = new Date(dateStr);
          } else if (fmtStr === "%d %b %Y") {
            dateObj = new Date(dateStr);
          } else if (fmtStr === "%d %B %Y") {
            dateObj = new Date(dateStr);
          }
          if (dateObj && !isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString("en-GB");
          }
        } catch (e) {
          continue;
        }
      }
      try {
        const fallbackDate = new Date(dateStr);
        if (!isNaN(fallbackDate.getTime())) {
          return fallbackDate.toLocaleDateString("en-GB");
        }
      } catch (e) {}
      return dateStr;
    }
    return "Not Available";
  };
  const getReportDate = (report: { filename: string; date: string }) => {
    return report.date;
  };
  const processVitalData = () => {
    if (!selectedVital || !comparisonResult?.comparison_data) return;
    const vital = comparisonResult.comparison_data.find(
      (item) => item.test_name === selectedVital
    );
    if (!vital) return;
    const dates: string[] = [];
    const values: number[] = [];
    let unit = "";
    vital.readings.forEach((reading) => {
      if (reading && reading.value !== "Not Available") {
        dates.push(reading.date);
        const numericValue = parseFloat(reading.value.replace(/[^\d.-]/g, ""));
        if (!isNaN(numericValue)) {
          values.push(numericValue);
          if (!unit && reading.unit) unit = reading.unit;
        }
      }
    });
    setVitalData({ dates, values, unit });
  };
  useEffect(() => {
    processVitalData();
  }, [selectedVital, comparisonResult]);
  const chartData = {
    labels: vitalData?.dates || [],
    datasets: [
      {
        label: selectedVital,
        data: vitalData?.values || [],
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
        fill: false,
        pointBackgroundColor: "rgb(54, 162, 235)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(54, 162, 235)",
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: selectedVital
          ? `${selectedVital} Trend Over Time`
          : "Select a Vital to View Trend",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y} ${
              vitalData?.unit || ""
            }`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: vitalData?.unit || "",
          font: {
            size: 13,
            weight: "bold" as const,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
          font: {
            size: 13,
            weight: "bold" as const,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };
  if (!isClient) return null;
  return (
    <div className="vitals-history-page-wrapper">
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          Swastha
        </Link>
        <div className="navbar-links">
          <Link href="/dashboard" className="navbar-link">
            Dashboard
          </Link>
          <Link href="/upload" className="navbar-link">
            Upload
          </Link>
          <button onClick={handleLogout} className="navbar-link">
            Logout
          </button>
        </div>
      </nav>
      <div className="vitals-history-container">
        <div className="vitals-history-card">
          <h1 className="vitals-history-title">Vitals History & Comparison</h1>
          {loading && <div className="loading">Loading vitals history...</div>}
          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
              <button onClick={() => setError(null)} className="dismiss-btn">
                Dismiss
              </button>
            </div>
          )}
          {deleteError && (
            <div className="alert alert-error">
              <strong>Delete failed:</strong> {deleteError}
              <button
                onClick={() => setDeleteError(null)}
                className="dismiss-btn"
              >
                Dismiss
              </button>
            </div>
          )}
          {history.length === 0 && !loading ? (
            <div className="empty-state">
              <p>No reports found.</p>
              <Link href="/upload">Upload a new report</Link>
            </div>
          ) : (
            <>
              <div className="controls">
                <div>
                  <label>Category:</label>
                  <select
                    value={selectedCategory || ""}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value || null)
                    }
                  >
                    <option value="">All</option>
                    <option value="General">General</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Urologist">Urologist</option>
                    <option value="Psychologist">Psychologist</option>
                    <option value="Dentist">Dentist</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button onClick={handleCompare} disabled={comparing}>
                  {comparing ? "Processing..." : "Compare All Reports"}
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="analyze-button"
                >
                  {analyzing ? "Analyzing..." : "Analyze Trends"}
                </button>
              </div>
              {analysisResult && (
                <div className="collapsible-section analysis-section">
                  <div className="collapsible-header analysis-header">
                    <h2>AI Health Analysis</h2>
                    <button
                      className="toggle-button analysis-toggle-button"
                      onClick={() => toggleSection("analysis")}
                    >
                      {collapsedSections.analysis ? "Show" : "Hide"}
                    </button>
                  </div>
                  <div
                    className={`collapsible-content analysis-content ${
                      collapsedSections.analysis ? "collapsed" : ""
                    }`}
                  >
                    <div className="analysis-alerts-section">
                      <h3 className="analysis-subtitle">
                        Potential Health Alerts
                      </h3>
                      {analysisResult.analysis.alerts &&
                      analysisResult.analysis.alerts.length > 0 ? (
                        <ul className="analysis-list analysis-alerts-list">
                          {analysisResult.analysis.alerts.map(
                            (alert, index) => (
                              <li
                                key={index}
                                className="analysis-list-item analysis-alert-item"
                              >
                                <span className="analysis-item-icon">⚠️</span>
                                <div>
                                  <strong>{alert.test_name}:</strong>{" "}
                                  {alert.message}
                                </div>
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="analysis-no-data">
                          No significant alerts detected based on recent trends.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {comparisonResult && (
                <div className="collapsible-section">
                  <div className="collapsible-header">
                    <h2>{comparisonResult.message || "Comparison Result"}</h2>
                    <button
                      className="toggle-button"
                      onClick={() => toggleSection("comparison")}
                    >
                      {collapsedSections.comparison ? "Show" : "Hide"}
                    </button>
                  </div>
                  <div
                    className={`collapsible-content ${
                      collapsedSections.comparison ? "collapsed" : ""
                    }`}
                  >
                    {comparisonResult.comparison_data &&
                    comparisonResult.comparison_data.length > 0 &&
                    comparisonResult.reports ? (
                      <div className="comparison-table-container">
                        <table className="comparison-table">
                          <thead>
                            <tr>
                              <th>Test Name</th>
                              {comparisonResult.reports.map((rep, i) => (
                                <th key={i}>{getReportDate(rep)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonResult.comparison_data.map(
                              (item, idx) => (
                                <tr key={idx}>
                                  <td>{item.test_name}</td>
                                  {item.readings.map((r, j) => (
                                    <td key={j}>
                                      {r ? (
                                        <>
                                          <strong>{r.value}</strong> {r.unit}
                                          {r.remarks && (
                                            <div className="remarks">
                                              {r.remarks}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <em>Not Available</em>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>No data available.</p>
                    )}
                  </div>
                </div>
              )}
              <div className="collapsible-section">
                <div className="collapsible-header">
                  <h2>Vital Trends</h2>
                  <button
                    className="toggle-button"
                    onClick={() => toggleSection("graph")}
                  >
                    {collapsedSections.graph ? "Show" : "Hide"}
                  </button>
                </div>
                <div
                  className={`collapsible-content ${
                    collapsedSections.graph ? "collapsed" : ""
                  }`}
                >
                  <div className="graph-controls">
                    <label htmlFor="vital-selector">Select Vital:</label>
                    <select
                      id="vital-selector"
                      value={selectedVital}
                      onChange={(e) => setSelectedVital(e.target.value)}
                    >
                      <option value="">Select a vital</option>
                      {vitalOptions.map((vital, index) => (
                        <option key={index} value={vital}>
                          {vital}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="chart-container">
                    {selectedVital && vitalData ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <div className="chart-placeholder">
                        <p>
                          Select a vital parameter to visualize its trend over
                          time
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="detail-controls">
                <label>View Report Details:</label>
                <select
                  value={detailReport}
                  onChange={(e) => setDetailReport(e.target.value)}
                >
                  <option value="">Select</option>
                  {history.map((r) => (
                    <option key={r.filename} value={r.filename}>
                      {getDisplayDate(r)}
                    </option>
                  ))}
                </select>
                <button onClick={handleViewDetail}>View Details</button>
              </div>
              {detailData && (
                <div className="collapsible-section">
                  <div className="collapsible-header">
                    <h2>Report Details</h2>
                    <button
                      className="toggle-button"
                      onClick={() => toggleSection("details")}
                    >
                      {collapsedSections.details ? "Show" : "Hide"}
                    </button>
                  </div>
                  <div
                    className={`collapsible-content ${
                      collapsedSections.details ? "collapsed" : ""
                    }`}
                  >
                    <h3>{getDisplayDate(detailData)}</h3>
                    <div className="metadata">
                      {Object.entries(detailData.extracted_data.metadata).map(
                        ([k, v]) => (
                          <p key={k}>
                            <strong>{k.replace(/_/g, " ")}:</strong>{" "}
                            {v || "N/A"}
                          </p>
                        )
                      )}
                    </div>
                    {detailData.extracted_data.results.map((sec, sidx) => (
                      <div key={sidx} className="section">
                        {sec.section && <h3>{sec.section}</h3>}
                        <table className="detail-view-table">
                          <thead>
                            <tr>
                              <th>Test</th>
                              <th>Result</th>
                              <th>Unit</th>
                              <th>Range</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sec.tests.map((t, tidx) => (
                              <tr key={tidx}>
                                <td>{t.test_name}</td>
                                <td>{t.result}</td>
                                <td>{t.unit}</td>
                                <td>{t.reference_range}</td>
                                <td>{t.remarks || "–"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="manage-reports-section">
                <h2 className="manage-reports-title">Manage Your Reports</h2>
                <p className="manage-reports-description">
                  Select a report category to view and delete individual
                  reports.
                  <br />
                  <strong>Warning:</strong> Deleting a report is permanent.
                </p>
                <div className="manage-reports-filter">
                  <label
                    htmlFor="manage-category-filter"
                    className="manage-reports-label"
                  >
                    Filter by Category:
                  </label>
                  <select
                    id="manage-category-filter"
                    value={selectedCategory || ""}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value || null)
                    }
                    className="manage-reports-select"
                  >
                    <option value="">All Categories</option>
                    <option value="General">General</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Urologist">Urologist</option>
                    <option value="Psychologist">Psychologist</option>
                    <option value="Dentist">Dentist</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="manage-reports-list">
                  {history
                    .filter(
                      (report) =>
                        !selectedCategory ||
                        report.category === selectedCategory
                    )
                    .map((report) => (
                      <div key={report.filename} className="manage-report-item">
                        <span className="manage-report-info">
                          {getDisplayDate(report)} ({report.category})
                        </span>
                        <button
                          onClick={() => handleDelete(report.filename)}
                          disabled={deletingReport === report.filename}
                          className="manage-report-delete-button"
                        >
                          {deletingReport === report.filename
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    ))}
                  {history.filter(
                    (report) =>
                      !selectedCategory || report.category === selectedCategory
                  ).length === 0 && (
                    <p className="manage-reports-empty">
                      No reports found in this category.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
