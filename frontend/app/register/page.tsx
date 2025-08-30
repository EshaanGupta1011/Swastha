"use client";
import "./page.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !email ||
      !password ||
      !confirmPassword ||
      !fullName ||
      !age ||
      !gender
    ) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    const ageNumber = parseInt(age, 10);
    if (isNaN(ageNumber) || ageNumber <= 0 || ageNumber > 120) {
      setError("Please enter a valid age between 1 and 120.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.register(
        email,
        password,
        fullName,
        ageNumber,
        gender
      );
      if (res.ok) {
        router.push("/login?registered=true");
      } else {
        const data = await res.json();
        setError(data.detail || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    if (error) setError("");
  };

  const EyeIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="20"
      height="20"
    >
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );

  const EyeSlashIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="20"
      height="20"
    >
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
    </svg>
  );

  return (
    <div className="register-page-container">
      <div className="register-hero">
        <div className="register-hero-content">
          <h1 className="register-hero-title">Swastha</h1>
          <p className="register-hero-subtitle">
            Your Personal Health Companion
          </p>
          <p className="register-hero-description">
            Join our community and take control of your health journey.
          </p>
        </div>
      </div>
      <div className="register-main-content">
        <div className="register-info-sections">
          <div className="register-info-card">
            <h2 className="register-info-title">Why Join Swastha?</h2>
            <p className="register-info-text">
              Managing health information can be overwhelming. Swastha
              simplifies this by providing a secure, intelligent platform where
              you can store, understand, and track your medical data over time.
              Join our growing family of users who are taking proactive steps
              towards better health management.
            </p>
          </div>
          <div className="register-info-card">
            <h2 className="register-info-title">Benefits of Registering</h2>
            <ul className="register-info-list">
              <li className="register-info-list-item">
                <strong>Complete Health Timeline:</strong> Build a comprehensive
                digital record of all your medical reports in one secure place.
              </li>
              <li className="register-info-list-item">
                <strong>Clarity & Understanding:</strong> Get clear, summarized
                views of complex reports, making it easier to understand your
                health status.
              </li>
              <li className="register-info-list-item">
                <strong>Trend Analysis:</strong> Easily compare results across
                different reports and time periods to spot trends and changes.
              </li>
              <li className="register-info-list-item">
                <strong>Proactive Health Management:</strong> Use your data to
                make informed decisions and have more productive discussions
                with healthcare providers.
              </li>
              <li className="register-info-list-item">
                <strong>Peace of Mind:</strong> Know your important health
                information is safely stored and always accessible to you.
              </li>
            </ul>
          </div>
          <div className="register-info-card">
            <h2 className="register-info-title">What Makes Us Different?</h2>
            <p className="register-info-text">
              Swastha isn't just another file storage app. We use advanced
              technology to understand your medical reports, not just store
              them. Our focus is on transforming raw data into actionable
              insights, empowering you to be the CEO of your own health. Your
              privacy and data security are our top priorities.
            </p>
          </div>
        </div>
        <div className="register-card">
          <div className="register-header">
            <h2 className="register-title">Create Your Account</h2>
            <p className="register-subtitle">
              Join Swastha to manage your health data
            </p>
          </div>
          {error && <div className="register-error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-form-group">
              <label htmlFor="fullName" className="register-label">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearError();
                }}
                placeholder="Enter your full name"
                className="register-input"
                required
              />
            </div>
            <div className="register-form-group">
              <label htmlFor="age" className="register-label">
                Age
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  clearError();
                }}
                placeholder="Enter your age"
                className="register-input"
                min="1"
                max="120"
                required
              />
            </div>
            <div className="register-form-group">
              <label htmlFor="gender" className="register-label">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  clearError();
                }}
                className="register-input"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="register-form-group">
              <label htmlFor="email" className="register-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
                placeholder="you@example.com"
                className="register-input"
                required
              />
            </div>
            <div className="register-form-group">
              <label htmlFor="password" className="register-label">
                Password
              </label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="Create a strong password"
                  className="register-input password-input"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
                </button>
              </div>
              <p className="register-hint">
                Must be at least 6 characters long.
              </p>
            </div>
            <div className="register-form-group">
              <label htmlFor="confirmPassword" className="register-label">
                Confirm Password
              </label>
              <div className="password-input-container">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="Re-enter your password"
                  className="register-input password-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? <EyeIcon /> : <EyeSlashIcon />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="register-submit-button"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          <div className="register-footer">
            <p>
              Already have an account?{" "}
              <a href="/login" className="register-link">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
