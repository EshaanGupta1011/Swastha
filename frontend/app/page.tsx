"use client";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import "./page.css";

const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add heartbeat functionality to ping backend every 10 minutes
  useEffect(() => {
    const pingBackend = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ping`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          console.log("Backend ping successful");
        } else {
          console.error("Backend ping failed with status:", response.status);
        }
      } catch (error) {
        console.error("Network error during backend ping:", error);
      }
    };

    // Ping immediately when component mounts
    pingBackend();

    // Set up interval to ping every 10 minutes (600,000 milliseconds)
    const intervalId = setInterval(pingBackend, 600000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // ... rest of the component remains the same
  return (
    <div className="landing-page-wrapper">
      {/* Navigation Bar */}
      <nav
        ref={menuRef}
        className={`landing-navbar ${isScrolled ? "scrolled" : ""}`}
      >
        <div className="landing-navbar-container">
          <Link href="/" className="landing-navbar-brand">
            Swastha
          </Link>
          {/* Hamburger Menu Button (Visible on small screens) */}
          <button
            className={`landing-hamburger ${isMenuOpen ? "active" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          {/* Navigation Links (Hidden on small screens, shown in sidebar) */}
          <div className={`landing-navbar-links ${isMenuOpen ? "active" : ""}`}>
            <Link
              href="#about"
              className="landing-navbar-link"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="#how-it-works"
              className="landing-navbar-link"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#contact"
              className="landing-navbar-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="landing-navbar-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="landing-navbar-button"
              onClick={() => setIsMenuOpen(false)}
            >
              Join
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            <span className="landing-hero-title-main">Swastha</span>
            <span className="landing-hero-title-sub">
              Your Health, Simplified.
            </span>
          </h1>
          <p className="landing-hero-tagline">
            Effortlessly track, understand, and manage your health reports.
          </p>
          <div className="landing-hero-actions">
            <Link href="/register" className="landing-hero-primary-button">
              Get Started
            </Link>
            <Link href="#about" className="landing-hero-secondary-button">
              Learn More
            </Link>
          </div>
        </div>
        <div className="landing-hero-image-container">
          {/* Placeholder image - replace with your actual image path */}
          <div className="landing-hero-placeholder-image">
            <Image
              src="/hero.png" // <-- CHANGE THIS PATH
              alt="Illustration representing health data management"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="landing-hero-image"
              priority
            />
          </div>
          {/* Animated elements */}
          <div className="landing-hero-animation-element element-1"></div>
          <div className="landing-hero-animation-element element-2"></div>
          <div className="landing-hero-animation-element element-3"></div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="landing-about-section">
        <div className="landing-section-container">
          <div className="landing-about-header">
            <h2 className="landing-section-title">About Swastha</h2>
            <div className="landing-section-divider"></div>
          </div>
          <div className="landing-about-content">
            <div className="landing-about-text">
              <p>
                Swastha is your personal health companion designed to empower
                you with control over your medical data. We understand the
                importance of accessible and understandable health information.
              </p>
              <p>
                Our platform securely stores your medical reports and utilizes
                advanced AI to automatically extract and organize key vitals,
                making it easier than ever to track your health journey over
                time.
              </p>
              <p>
                Gone are the days of sifting through complex PDFs. Swastha
                transforms your reports into clear, actionable insights,
                enabling you to make informed decisions about your well-being.
              </p>
            </div>
            <div className="landing-about-features">
              <div className="landing-feature-card">
                <div className="landing-feature-icon">🔒</div>
                <h3 className="landing-feature-title">Secure Storage</h3>
                <p className="landing-feature-description">
                  Your data is encrypted and stored safely in the cloud.
                </p>
              </div>
              <div className="landing-feature-card">
                <div className="landing-feature-icon">🤖</div>
                <h3 className="landing-feature-title">AI-Powered Analysis</h3>
                <p className="landing-feature-description">
                  Automatic extraction of key health metrics from reports.
                </p>
              </div>
              <div className="landing-feature-card">
                <div className="landing-feature-icon">📈</div>
                <h3 className="landing-feature-title">Trend Visualization</h3>
                <p className="landing-feature-description">
                  Compare results over time to monitor your health.
                </p>
              </div>
              <div className="landing-feature-card">
                <div className="landing-feature-icon">🔄</div>
                <h3 className="landing-feature-title">Seamless Access</h3>
                <p className="landing-feature-description">
                  Access your health data anytime, anywhere, on any device.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works / Steps Section */}
      <section id="how-it-works" className="landing-steps-section">
        <div className="landing-section-container">
          <div className="landing-steps-header">
            <h2 className="landing-section-title">How It Works</h2>
            <div className="landing-section-divider"></div>
            <p className="landing-steps-subtitle">
              Get started in just a few simple steps
            </p>
          </div>
          <div className="landing-steps-container">
            <div className="landing-step-card step-1">
              <div className="landing-step-icon-container">
                <div className="landing-step-icon">1</div>
              </div>
              <h3 className="landing-step-title">Register</h3>
              <p className="landing-step-description">
                Create your free Swastha account in under a minute.
              </p>
            </div>
            <div className="landing-step-card step-2">
              <div className="landing-step-icon-container">
                <div className="landing-step-icon">2</div>
              </div>
              <h3 className="landing-step-title">Upload</h3>
              <p className="landing-step-description">
                Securely upload your medical reports (PDF, JPEG, PNG).
              </p>
            </div>
            <div className="landing-step-card step-3">
              <div className="landing-step-icon-container">
                <div className="landing-step-icon">3</div>
              </div>
              <h3 className="landing-step-title">Compare & Analyze</h3>
              <p className="landing-step-description">
                View extracted data, track trends, and gain insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="landing-contact-section">
        <div className="landing-section-container">
          <div className="landing-contact-header">
            <h2 className="landing-section-title">Contact Us</h2>
            <div className="landing-section-divider"></div>
            <p className="landing-contact-subtitle">
              Have questions? Get in touch with our team.
            </p>
          </div>
          <div className="landing-contact-content">
            <form className="landing-contact-form">
              <div className="landing-form-group">
                <label htmlFor="name" className="landing-form-label">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="landing-form-input"
                  required
                />
              </div>
              <div className="landing-form-group">
                <label htmlFor="email" className="landing-form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="landing-form-input"
                  required
                />
              </div>
              <div className="landing-form-group">
                <label htmlFor="subject" className="landing-form-label">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="landing-form-input"
                  required
                />
              </div>
              <div className="landing-form-group">
                <label htmlFor="message" className="landing-form-label">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="landing-form-textarea"
                  required
                ></textarea>
              </div>
              <button type="submit" className="landing-contact-submit-button">
                Send Message
              </button>
            </form>
            <div className="landing-contact-info">
              <h3 className="landing-contact-info-title">Get In Touch</h3>
              <p className="landing-contact-info-text">
                We'd love to hear from you. Reach out for support, feedback, or
                partnership inquiries.
              </p>
              <div className="landing-contact-detail">
                <span className="landing-contact-icon">📧</span>
                <span className="landing-contact-text">
                  support@swastha.example.com
                </span>
              </div>
              <div className="landing-contact-detail">
                <span className="landing-contact-icon">📍</span>
                <span className="landing-contact-text">
                  A Block, 123 Main Street
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="landing-footer-content">
            <div className="landing-footer-info">
              <h3 className="landing-footer-brand">Swastha</h3>
              <p className="landing-footer-description">
                Empowering individuals to take control of their health through
                simplified medical data management.
              </p>
            </div>
            <div className="landing-footer-links">
              <div className="landing-footer-column">
                <h4 className="landing-footer-column-title">Quick Links</h4>
                <ul className="landing-footer-list">
                  <li>
                    <Link href="/" className="landing-footer-link">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="#about" className="landing-footer-link">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#how-it-works" className="landing-footer-link">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="landing-footer-link">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="landing-footer-link">
                      Register
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="landing-footer-column">
                <h4 className="landing-footer-column-title">Legal</h4>
                <ul className="landing-footer-list">
                  <li>
                    <a href="#" className="landing-footer-link">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="landing-footer-link">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="landing-footer-link">
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p className="landing-footer-copyright">
              &copy; {new Date().getFullYear()} Swastha. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
