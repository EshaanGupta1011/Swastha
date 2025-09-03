"use client";
import "./page.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HealthScoreData {
  score: number;
  explanation: string;
  tips: string[];
}

export default function HealthScoreDetail() {
  const [isClient, setIsClient] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    if (!storedToken) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!isClient || !token) {
      return;
    }

    const fetchHealthScoreDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/vitals/score`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          if (res.status === 404) {
            setError(
              "No reports found to calculate your health score. Please upload a report first."
            );
            return;
          }
          let errorMessage = `Failed to fetch health score details: ${res.status} ${res.statusText}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.detail || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }

        const scoreDataRaw = await res.json();
        const scoreData: HealthScoreData = scoreDataRaw as HealthScoreData;
        setHealthScore(scoreData);
      } catch (err: any) {
        const displayErrorMessage =
          err.message ||
          err.toString() ||
          "Unable to load your health score details right now. Please try again later.";
        setError(displayErrorMessage);
        setHealthScore(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthScoreDetail();
  }, [token, isClient, router]);

  // Set CSS variable for score percentage
  useEffect(() => {
    if (healthScore) {
      document.documentElement.style.setProperty(
        "--score-percentage",
        `${healthScore.score}%`
      );
    }
  }, [healthScore]);

  if (!isClient) {
    return null;
  }

  if (loading) {
    return (
      <div className="health-score-detail-page-wrapper">
        <nav className="navbar">
          <Link href="/" className="navbar-brand">
            Swastha
          </Link>
          <div className="navbar-links">
            <Link href="/upload" className="navbar-link">
              Upload
            </Link>
            <Link href="/vitals-history" className="navbar-link">
              History
            </Link>
            <Link href="/profile" className="navbar-link">
              Profile
            </Link>
            <Link href="/dashboard" className="navbar-link">
              Dashboard
            </Link>
          </div>
        </nav>
        <div className="health-score-detail-container">
          <div className="health-score-detail-loading">
            Loading your health insights...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="health-score-detail-page-wrapper">
        <nav className="navbar">
          <Link href="/" className="navbar-brand">
            Swastha
          </Link>
          <div className="navbar-links">
            <Link href="/upload" className="navbar-link">
              Upload
            </Link>
            <Link href="/vitals-history" className="navbar-link">
              History
            </Link>
            <Link href="/profile" className="navbar-link">
              Profile
            </Link>
            <Link href="/dashboard" className="navbar-link">
              Dashboard
            </Link>
          </div>
        </nav>
        <div className="health-score-detail-container">
          <div className="health-score-detail-error">
            Error loading health score: {error}
            <br />
            <Link href="/dashboard" className="health-score-detail-back-link">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="health-score-detail-page-wrapper">
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          Swastha
        </Link>
        <div className="navbar-links">
          <Link href="/upload" className="navbar-link">
            Upload
          </Link>
          <Link href="/vitals-history" className="navbar-link">
            History
          </Link>
          <Link href="/profile" className="navbar-link">
            Profile
          </Link>
          <Link href="/dashboard" className="navbar-link">
            Dashboard
          </Link>
        </div>
      </nav>
      <div className="health-score-detail-container">
        <main className="health-score-detail-main-content">
          <div className="health-score-detail-card">
            <header className="health-score-detail-header">
              <h1 className="health-score-detail-title">
                Your Health Insights
              </h1>
              <p className="health-score-detail-subtitle">
                Based on your latest report
              </p>
            </header>

            {healthScore && (
              <div className="health-score-detail-content">
                <div className="health-score-detail-score-section">
                  <div className="health-score-detail-score-circle">
                    <span className="health-score-detail-score-value">
                      {healthScore.score}
                    </span>
                    <span className="health-score-detail-score-max">/100</span>
                  </div>
                  <p className="health-score-detail-score-explanation">
                    {healthScore.explanation}
                  </p>
                </div>

                <div className="health-score-detail-tips-section">
                  <h2 className="health-score-detail-tips-title">
                    Personalized Tips for You
                  </h2>
                  <ul className="health-score-detail-tips-list">
                    {healthScore.tips.map((tip, index) => (
                      <li key={index} className="health-score-detail-tip-item">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="health-score-detail-actions">
                  <Link
                    href="/vitals-history"
                    className="health-score-detail-action-link"
                  >
                    View Your Reports
                  </Link>
                  <Link
                    href="/upload"
                    className="health-score-detail-action-link-secondary"
                  >
                    Upload New Report
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
