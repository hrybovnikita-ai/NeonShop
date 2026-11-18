
import { useEffect, useState } from "react";

import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from "../api/client";
import "./Navbar.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
};

export default function Navbar({
  cartCount = 0,
  onBagClick,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const data = await getCurrentUser();

        if (active) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const isSignup = authMode === "signup";

  function openAuth(mode) {
    setAuthMode(mode);
    setForm({ ...initialForm });
    setError("");
    setShowPassword(false);
    setShowConfirm(false);
    setMenuOpen(false);
  }

  function closeAuth() {
    setAuthMode(null);
    setForm({ ...initialForm });
    setError("");
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  }

  function getPasswordStrength(password) {
    if (!password) return 0;

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password)
    ) score++;
    if (
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    ) score++;

    return score;
  }

  const strength = getPasswordStrength(form.password);

  const strengthLabels = [
    "Enter a password",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");

    if (isSignup) {
      if (form.name.trim().length < 2) {
        setError("Enter your full name.");
        return;
      }

      if (
        form.password.length < 8 ||
        new TextEncoder().encode(form.password).length > 72
      ) {
        setError(
          "Password must be at least 8 characters and no more than 72 UTF-8 bytes."
        );
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (!form.acceptedTerms) {
        setError(
          "Please accept the Terms and Privacy Policy."
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const data = isSignup
        ? await registerUser({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
          })
        : await loginUser({
            email: form.email.trim(),
            password: form.password,
          });

      setUser(data.user);
      closeAuth();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to connect. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    setError(
      "Google Sign-In is not configured yet. Connect Firebase Authentication to enable it."
    );
  }

  async function handleLogout() {
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      await logoutUser();
      setUser(null);
      setMenuOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Logout failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="ns-navbar">
        <a className="ns-logo" href="#home">
          NEON<span>SHOP</span>
        </a>

        <nav className={`ns-links ${menuOpen ? "open" : ""}`}>
          {[
            ["Home", "#home"],
            ["Shop", "#shop"],
            ["About", "#about"],
            ["Contact", "#contact"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ns-actions">
          {authLoading ? (
            <span className="ns-user-name">
              Loading...
            </span>
          ) : user ? (
            <>
              <span className="ns-user-name">
                {user.name}
              </span>

              <button
                className="ns-signin"
                type="button"
                disabled={submitting}
                onClick={handleLogout}
              >
                {submitting ? "Please wait..." : "Log Out"}
              </button>
            </>
          ) : (
            <>
              <button
                className="ns-signin"
                type="button"
                onClick={() => openAuth("signin")}
              >
                Sign In
              </button>

              <button
                className="ns-signup"
                type="button"
                onClick={() => openAuth("signup")}
              >
                Sign Up
              </button>
            </>
          )}

          <button
            className="ns-bag"
            type="button"
            onClick={onBagClick}
          >
            Bag ({cartCount})
          </button>

          <button
            className="ns-menu"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>
      </header>

      {!authMode && error && user && (
        <p className="ns-form-error" role="alert">
          {error}
        </p>
      )}

      {authMode && (
        <div
          className="ns-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAuth();
            }
          }}
        >
          <div
            className="ns-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ns-auth-title"
          >
            <button
              className="ns-close"
              onClick={closeAuth}
              aria-label="Close dialog"
            >
              ×
            </button>

            <div className="ns-auth-brand">
              <span className="ns-auth-icon">
                ✦
              </span>
            </div>

            <div className="ns-auth-heading">
              <span className="ns-auth-eyebrow">
                NEONSHOP MEMBERSHIP
              </span>

              <h2 id="ns-auth-title">
                {isSignup
                  ? "Create your account"
                  : "Welcome back"}
              </h2>

              <p>
                {isSignup
                  ? "Join NeonShop. Your style starts here."
                  : "Sign in and continue your shopping experience."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {isSignup && (
                <div className="ns-field">
                  <label htmlFor="ns-name">
                    Full name
                  </label>

                  <input
                    id="ns-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={updateField}
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </div>
              )}

              <div className="ns-field">
                <label htmlFor="ns-email">
                  Email address
                </label>

                <input
                  id="ns-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={updateField}
                  required
                />
              </div>

              <div className="ns-field">
                <label htmlFor="ns-password">
                  Password
                </label>

                <div className="ns-input-wrap">
                  <input
                    id="ns-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isSignup
                        ? "new-password"
                        : "current-password"
                    }
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={updateField}
                    minLength={isSignup ? 8 : undefined}
                    required
                  />

                  <button
                    className="ns-visibility"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {isSignup && (
                  <div className="ns-password-strength">
                    <div className="ns-strength-bars">
                      {[1, 2, 3, 4].map((level) => (
                        <span
                          key={level}
                          className={
                            level <= strength
                              ? `filled strength-${strength}`
                              : ""
                          }
                        />
                      ))}
                    </div>

                    <span>
                      {strengthLabels[strength]}
                    </span>
                  </div>
                )}
              </div>

              {isSignup && (
                <>
                  <div className="ns-field">
                    <label htmlFor="ns-confirm">
                      Confirm password
                    </label>

                    <div className="ns-input-wrap">
                      <input
                        id="ns-confirm"
                        name="confirmPassword"
                        type={
                          showConfirm
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        value={form.confirmPassword}
                        onChange={updateField}
                        required
                      />

                      <button
                        type="button"
                        className="ns-visibility"
                        onClick={() =>
                          setShowConfirm(!showConfirm)
                        }
                        aria-label={
                          showConfirm
                            ? "Hide confirmation"
                            : "Show confirmation"
                        }
                      >
                        {showConfirm ? "Hide" : "Show"}
                      </button>
                    </div>

                    {form.confirmPassword && (
                      <small
                        className={
                          form.password ===
                          form.confirmPassword
                            ? "ns-match"
                            : "ns-mismatch"
                        }
                      >
                        {form.password ===
                        form.confirmPassword
                          ? "✓ Passwords match"
                          : "Passwords do not match"}
                      </small>
                    )}
                  </div>

                  <label className="ns-terms">
                    <input
                      type="checkbox"
                      name="acceptedTerms"
                      checked={form.acceptedTerms}
                      onChange={updateField}
                      required
                    />

                    <span>
                      I agree to the Terms of Service
                      and Privacy Policy.
                    </span>
                  </label>
                </>
              )}

              {error && (
                <p
                  className="ns-form-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                className="ns-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Please wait..."
                  : isSignup
                    ? "Create Account →"
                    : "Sign In →"}
              </button>
            </form>

            <div className="ns-google-section">
              <div className="ns-google-divider">
                <span>OR CONTINUE WITH</span>
              </div>

              <button
                type="button"
                className="ns-google-btn"
                onClick={handleGoogleLogin}
                disabled={submitting}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.22c0-.75-.06-1.3-.2-1.88H12v3.56h5.37a4.6 4.6 0 0 1-2 3.02v2.47h3.2c1.87-1.73 2.78-4.28 2.78-7.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.75c2.67 0 4.92-.88 6.56-2.36l-3.2-2.47c-.88.59-2.01.94-3.36.94-2.58 0-4.77-1.74-5.55-4.08H3.16v2.54A9.9 9.9 0 0 0 12 21.75Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.45 13.78a5.95 5.95 0 0 1 0-3.56V7.68H3.16a9.9 9.9 0 0 0 0 8.64l3.29-2.54Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.14c1.45 0 2.75.5 3.78 1.47l2.84-2.84A9.58 9.58 0 0 0 12 2.25a9.9 9.9 0 0 0-8.84 5.43l3.29 2.54C7.23 7.88 9.42 6.14 12 6.14Z"
                  />
                </svg>

                Continue with Google
              </button>
            </div>

            <div className="ns-auth-divider">
              <span>NEONSHOP ACCOUNT</span>
            </div>

            <div className="ns-switch">
              {isSignup
                ? "Already have an account?"
                : "Don't have an account?"}

              <button
                type="button"
                onClick={() =>
                  openAuth(
                    isSignup ? "signin" : "signup"
                  )
                }
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </div>

            <p className="ns-auth-footer">
              Secure shopping experience • NeonShop
            </p>
          </div>
        </div>
      )}
    </>
  );
}
