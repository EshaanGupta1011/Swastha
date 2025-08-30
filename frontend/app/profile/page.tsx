// frontend/app/profile/page.tsx
"use client";
import "./page.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  email: string;
  full_name: string;
  age: number;
  gender: string;
}

export default function Profile() {
  const [isClient, setIsClient] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    gender: "",
    email: "",
  });
  const [isEditing, setIsEditing] = useState(false);

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
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
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
            console.warn(
              "Unauthorized access in profile, redirecting to login."
            );
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          let errorMessage = `Failed to fetch profile: ${res.status} ${res.statusText}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.detail || errorMessage;
          } catch (jsonError) {
            console.error("Failed to parse error response:", jsonError);
          }
          throw new Error(errorMessage);
        }
        let profileDataRaw;
        try {
          profileDataRaw = await res.json();
        } catch (parseError) {
          console.error("Failed to parse profile JSON:", parseError);
          throw new Error("Received invalid data format from server.");
        }
        if (
          !profileDataRaw ||
          typeof profileDataRaw !== "object" ||
          Array.isArray(profileDataRaw)
        ) {
          console.error("Unexpected profile data format:", profileDataRaw);
          throw new Error("Received unexpected data structure from server.");
        }
        const profileData: UserProfile = profileDataRaw as UserProfile;
        setUserProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          age: profileData.age?.toString() || "",
          gender: profileData.gender || "",
          email: profileData.email || "",
        });
      } catch (err: any) {
        console.error("Fetch user profile error in profile page:", err);
        const displayErrorMessage =
          err.message ||
          err.toString() ||
          "Failed to load user profile. Please try again later.";
        setError(displayErrorMessage);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [token, isClient, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const ageNumber = parseInt(formData.age, 10);
      if (isNaN(ageNumber) || ageNumber <= 0 || ageNumber > 120) {
        throw new Error("Please enter a valid age between 1 and 120.");
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/user/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: formData.full_name,
            age: ageNumber,
            gender: formData.gender,
          }),
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        let errorMessage = `Failed to update profile: ${res.status} ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError);
        }
        throw new Error(errorMessage);
      }

      const updatedProfile = await res.json();
      setUserProfile(updatedProfile);
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setFormData({
        full_name: updatedProfile.full_name || "",
        age: updatedProfile.age?.toString() || "",
        gender: updatedProfile.gender || "",
        email: updatedProfile.email || "",
      });
    } catch (err: any) {
      console.error("Update profile error:", err);
      const displayErrorMessage =
        err.message ||
        err.toString() ||
        "Failed to update profile. Please try again later.";
      setError(displayErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || "",
        age: userProfile.age?.toString() || "",
        gender: userProfile.gender || "",
        email: userProfile.email || "",
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
  };

  if (!isClient) {
    return null;
  }

  if (loading && !userProfile) {
    return (
      <div className="profile-page-wrapper">
        <nav className="navbar">
          <a href="/" className="navbar-brand">
            Swastha
          </a>
          <div className="navbar-links">
            <a href="/dashboard" className="navbar-link">
              Dashboard
            </a>
            <a href="/upload" className="navbar-link">
              Upload
            </a>
            <a href="/vitals-history" className="navbar-link">
              History
            </a>
            <a href="/profile" className="navbar-link active">
              Profile
            </a>
            <button onClick={handleLogout} className="navbar-link">
              Logout
            </button>
          </div>
        </nav>
        <div className="profile-container">
          <div className="profile-loading">Loading your profile...</div>
        </div>
      </div>
    );
  }

  if (error && !userProfile) {
    return (
      <div className="profile-page-wrapper">
        <nav className="navbar">
          <a href="/" className="navbar-brand">
            Swastha
          </a>
          <div className="navbar-links">
            <a href="/dashboard" className="navbar-link">
              Dashboard
            </a>
            <a href="/upload" className="navbar-link">
              Upload
            </a>
            <a href="/vitals-history" className="navbar-link">
              History
            </a>
            <button onClick={handleLogout} className="navbar-link">
              Logout
            </button>
          </div>
        </nav>
        <div className="profile-container">
          <div className="profile-error">Error loading profile: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-wrapper">
      <nav className="navbar">
        <a href="/" className="navbar-brand">
          Swastha
        </a>
        <div className="navbar-links">
          <a href="/dashboard" className="navbar-link">
            Dashboard
          </a>
          <a href="/upload" className="navbar-link">
            Upload
          </a>
          <a href="/vitals-history" className="navbar-link">
            History
          </a>
          <a href="/profile" className="navbar-link active">
            Profile
          </a>
          <button onClick={handleLogout} className="navbar-link">
            Logout
          </button>
        </div>
      </nav>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <h1 className="profile-title">Your Profile</h1>
          </div>

          {error && <div className="profile-error-message">{error}</div>}
          {successMessage && (
            <div className="profile-success-message">{successMessage}</div>
          )}

          <div className="profile-content">
            <div className="profile-picture-section">
              <div className="profile-picture-placeholder">
                <div className="profile-picture-icon">👤</div>
                <p className="profile-picture-text">Profile Photo</p>
              </div>
            </div>

            <div className="profile-info-section">
              {!isEditing ? (
                <div className="profile-view">
                  <div className="profile-info-group">
                    <label className="profile-info-label">Full Name</label>
                    <p className="profile-info-value">
                      {userProfile?.full_name || "N/A"}
                    </p>
                  </div>

                  <div className="profile-info-group">
                    <label className="profile-info-label">Email</label>
                    <p className="profile-info-value">
                      {userProfile?.email || "N/A"}
                    </p>
                  </div>

                  <div className="profile-info-group">
                    <label className="profile-info-label">Age</label>
                    <p className="profile-info-value">
                      {userProfile?.age || "N/A"}
                    </p>
                  </div>

                  <div className="profile-info-group">
                    <label className="profile-info-label">Gender</label>
                    <p className="profile-info-value">
                      {userProfile?.gender || "N/A"}
                    </p>
                  </div>

                  <button
                    className="profile-edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form className="profile-edit-form" onSubmit={handleSubmit}>
                  <div className="profile-form-group">
                    <label htmlFor="full_name" className="profile-form-label">
                      Full Name
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="profile-form-input"
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="email" className="profile-form-label">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="profile-form-input"
                      disabled
                    />
                    <p className="profile-form-hint">Email cannot be changed</p>
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="age" className="profile-form-label">
                      Age
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="profile-form-input"
                      min="1"
                      max="120"
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="gender" className="profile-form-label">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="profile-form-select"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>

                  <div className="profile-form-actions">
                    <button
                      type="submit"
                      className="profile-save-button"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={handleCancelEdit}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
