// frontend/app/dashboard/page.tsx
"use client";
import "./page.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  email: string;
  full_name: string;
  age: number;
  gender: string;
}

interface CategorySummary {
  category: string;
  count: number;
}

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [reportSummary, setReportSummary] = useState<CategorySummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isClient || !token) {
      return;
    }
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/user/profile`,
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
          let errorMessage = `Failed to fetch profile: ${res.status} ${res.statusText}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.detail || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }
        let profileDataRaw;
        try {
          profileDataRaw = await res.json();
        } catch {
          throw new Error("Received invalid data format from server.");
        }
        if (
          !profileDataRaw ||
          typeof profileDataRaw !== "object" ||
          Array.isArray(profileDataRaw)
        ) {
          throw new Error("Received unexpected data structure from server.");
        }
        const profileData: UserProfile = profileDataRaw as UserProfile;
        setUserProfile(profileData);
      } catch (err: any) {
        const displayErrorMessage =
          err.message ||
          err.toString() ||
          "Failed to load user profile. Please try again later.";
        setProfileError(displayErrorMessage);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchUserProfile();
  }, [token, isClient, router]);

  useEffect(() => {
    if (!isClient || !token) {
      return;
    }
    const fetchReportSummary = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/vitals/history`,
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
          let errorMessage = `Failed to fetch report summary: ${res.status} ${res.statusText}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.detail || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }
        let rawData;
        try {
          rawData = await res.json();
        } catch {
          throw new Error("Received invalid summary data format from server.");
        }
        let summaryData: CategorySummary[] = [];
        if (rawData.history && Array.isArray(rawData.history)) {
          const categoryCounts: Record<string, number> = {};
          rawData.history.forEach((report: any) => {
            const category = report.category || "Uncategorized";
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          });
          summaryData = Object.entries(categoryCounts).map(
            ([category, count]) => ({
              category,
              count,
            })
          );
          summaryData.sort((a, b) => a.category.localeCompare(b.category));
        } else {
          summaryData = [];
        }
        setReportSummary(summaryData);
      } catch (err: any) {
        const displayErrorMessage =
          err.message ||
          err.toString() ||
          "Failed to load report summary. Please try again later.";
        setSummaryError(displayErrorMessage);
        setReportSummary([]);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchReportSummary();
  }, [token, isClient, router]);

  if (!isClient) {
    return null;
  }

  if (profileLoading || summaryLoading) {
    return (
      <div className="dashboard-page-wrapper">
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
            <button onClick={handleLogout} className="navbar-link">
              Logout
            </button>
          </div>
        </nav>
        <div className="dashboard-container">
          <div className="dashboard-loading">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (profileError || summaryError) {
    return (
      <div className="dashboard-page-wrapper">
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
            <button onClick={handleLogout} className="navbar-link">
              Logout
            </button>
          </div>
        </nav>
        <div className="dashboard-container">
          <div className="dashboard-error">
            Error loading dashboard: {profileError || summaryError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-wrapper">
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
          <button onClick={handleLogout} className="logout-navbar-link">
            Logout
          </button>
        </div>
      </nav>
      <div className="dashboard-container">
        <main className="dashboard-main-content">
          <div className="dashboard-welcome-card">
            <header className="dashboard-header">
              <h1 className="dashboard-title">
                Welcome, {userProfile ? userProfile.full_name : "User"}!
              </h1>
            </header>
            <div className="dashboard-welcome-content">
              <p className="dashboard-welcome-text">
                Swastha helps you take control of your health journey.
              </p>
              <div className="dashboard-summary-section">
                <h2 className="dashboard-summary-title">
                  Your Reports Summary
                </h2>
                {reportSummary.length > 0 ? (
                  <div className="dashboard-summary-grid">
                    {reportSummary.map((item) => (
                      <div
                        key={item.category}
                        className="dashboard-summary-item"
                      >
                        <span className="dashboard-summary-count">
                          {item.count}
                        </span>
                        <Link
                          href={`/vitals-history?category=${encodeURIComponent(
                            item.category
                          )}`}
                          className="dashboard-summary-category-link"
                        >
                          {item.category} Reports
                        </Link>
                        <p className="dashboard-summary-description">
                          View and manage your {item.category.toLowerCase()}{" "}
                          reports.
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dashboard-summary-empty">
                    You haven't uploaded any reports yet.{" "}
                    <Link
                      href="/upload"
                      className="dashboard-summary-upload-link"
                    >
                      Upload your first report
                    </Link>
                  </p>
                )}
              </div>
            </div>
            <div className="dashboard-actions-grid">
              <div className="dashboard-action-card">
                <h3 className="dashboard-action-card-title">
                  Track Your Health Over Time
                </h3>
                <p className="dashboard-action-card-text">
                  View your uploaded reports, see historical data, and compare
                  results to monitor changes in key vitals.
                </p>
                <Link
                  href="/vitals-history"
                  className="dashboard-action-card-link"
                >
                  View & Compare
                </Link>
              </div>
              <div className="dashboard-action-card">
                <h3 className="dashboard-action-card-title">Add New Report</h3>
                <p className="dashboard-action-card-text">
                  Upload a new medical report to start tracking your health
                  data.
                </p>
                <Link href="/upload" className="dashboard-action-card-link">
                  Upload
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
  // --- End Main Render ---
}
