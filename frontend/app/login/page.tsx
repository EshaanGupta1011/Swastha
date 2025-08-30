// frontend/app/login/page.tsx
"use client";
import "./page.css";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        router.push("/dashboard");
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(
          errorData.detail || "Invalid login credentials. Please try again."
        );
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    if (error) setError("");
  };

  return (
    <div className="login-page-container">
      {/* Hero Banner Section */}
      <div className="login-hero">
        <div className="login-hero-content">
          <h1 className="login-hero-title">Swastha</h1>
          <p className="login-hero-subtitle">Your Personal Health Companion</p>
          <p className="login-hero-description">
            Securely store, analyze, and understand your medical reports.
          </p>
        </div>
      </div>

      {/* Main Content Area with Login Card and Info Sections */}
      <div className="login-main-content">
        {/* Info Sections - What, Why, Unique */}
        <div className="login-info-sections">
          {/* What is HealthTrack? */}
          <div className="login-info-card">
            <h2 className="login-info-title">What is Swastha?</h2>
            <p className="login-info-text">
              Swastha is a secure and intelligent platform designed to empower
              you with control over your health data. It simplifies the
              management of your medical reports by storing them digitally and
              extracting key information automatically.
            </p>
          </div>

          {/* What Does It Do? */}
          <div className="login-info-card">
            <h2 className="login-info-title">What Does It Do?</h2>
            <ul className="login-info-list">
              <li className="login-info-list-item">
                <strong>Centralized Storage:</strong> Keep all your PDF medical
                reports in one secure, easily accessible place.
              </li>
              <li className="login-info-list-item">
                <strong>Smart Data Extraction:</strong> Automatically pulls out
                vital test results, measurements, and findings using advanced
                AI.
              </li>
              <li className="login-info-list-item">
                <strong>Historical Tracking:</strong> View how your health
                metrics change over time with intuitive charts and comparisons.
              </li>
              <li className="login-info-list-item">
                <strong>Easy Sharing:</strong> Quickly share relevant data with
                doctors or family members when needed.
              </li>
            </ul>
          </div>

          {/* Why is it Unique? */}
          <div className="login-info-card">
            <h2 className="login-info-title">Why is it Unique?</h2>
            <p className="login-info-text">
              Unlike generic file storage, Swastha understands your medical
              data. It goes beyond simple storage by providing actionable
              insights, making complex reports easy to understand, and helping
              you identify trends in your health journey. It's not just about
              keeping records; it's about making them work for you.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Sign in to your Swastha account</p>
          </div>

          {error && <div className="login-error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
              <label htmlFor="email" className="login-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
                className="login-input"
                required
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  className="login-input password-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="20"
                      height="20"
                    >
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="20"
                      height="20"
                    >
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <a href="/register" className="login-link">
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
