import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import type { LoginRequest } from "@/types/dto";

const STORAGE_EMAIL = "login_saved_email";
const STORAGE_PASSWORD = "login_saved_password";
const STORAGE_REMEMBER_EMAIL = "login_remember_email";
const STORAGE_REMEMBER_PASSWORD = "login_remember_password";
const STORAGE_KEEP_LOGGED_IN = "login_keep_logged_in";

function loadSavedCredentials() {
  try {
    const savedEmail = localStorage.getItem(STORAGE_EMAIL);
    const savedPassword = localStorage.getItem(STORAGE_PASSWORD);
    const rememberEmail = localStorage.getItem(STORAGE_REMEMBER_EMAIL) === "1";
    const rememberPassword =
      localStorage.getItem(STORAGE_REMEMBER_PASSWORD) === "1";
    const keepLoggedIn = localStorage.getItem(STORAGE_KEEP_LOGGED_IN) !== "0";
    return {
      email: savedEmail ?? "",
      password: savedPassword ?? "",
      rememberEmail,
      rememberPassword,
      keepLoggedIn,
    };
  } catch {
    return {
      email: "",
      password: "",
      rememberEmail: false,
      rememberPassword: false,
      keepLoggedIn: true,
    };
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = loadSavedCredentials();
    setEmail(saved.email);
    setPassword(saved.password);
    setRememberEmail(saved.rememberEmail);
    setRememberPassword(saved.rememberPassword);
    setKeepLoggedIn(saved.keepLoggedIn);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (rememberEmail) {
        localStorage.setItem(STORAGE_EMAIL, email);
        localStorage.setItem(STORAGE_REMEMBER_EMAIL, "1");
      } else {
        localStorage.removeItem(STORAGE_EMAIL);
        localStorage.removeItem(STORAGE_REMEMBER_EMAIL);
      }
      if (rememberPassword) {
        localStorage.setItem(STORAGE_PASSWORD, password);
        localStorage.setItem(STORAGE_REMEMBER_PASSWORD, "1");
      } else {
        localStorage.removeItem(STORAGE_PASSWORD);
        localStorage.removeItem(STORAGE_REMEMBER_PASSWORD);
      }
      localStorage.setItem(STORAGE_KEEP_LOGGED_IN, keepLoggedIn ? "1" : "0");

      const payload: LoginRequest = { email, password };
      const res = await authApi.login(payload);
      const data = res.data?.data ?? res.data;
      if (data?.accessToken && data?.user) {
        loginStore(
          {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? "",
            expiresIn: data.expiresIn ?? 3600,
            user: data.user,
          },
          { keepLoggedIn },
        );
        navigate("/", { replace: true });
      } else {
        setError("로그인 응답 형식이 올바르지 않습니다.");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
    const googleURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=email%20profile&prompt=select_account`;
    window.location.href = googleURL;
  };

  const handleKakaoLogin = () => {
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;
    const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code&prompt=login`;
    window.location.href = kakaoURL;
  };

  return (
    <div className="toss-auth-page">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="toss-auth-wrap"
      >
        <div className="toss-auth-head">
          <h1 className="toss-auth-title">로그인</h1>
          <p className="toss-auth-desc">
            62댕냥이와 함께 따뜻한 가족을 만나보세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="toss-auth-card">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="toss-auth-error"
            >
              {error}
            </motion.div>
          )}

          <div className="toss-auth-field">
            <label htmlFor="login-email" className="toss-auth-label">
              이메일
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="toss-auth-input"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="toss-auth-field">
            <label htmlFor="login-password" className="toss-auth-label">
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="toss-auth-input"
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </div>

          <div className="toss-auth-options">
            <label className="toss-auth-checkbox-row">
              <input
                type="checkbox"
                className="toss-auth-checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
              />
              <span className="toss-auth-checkbox-label">이메일 저장</span>
            </label>
            <label className="toss-auth-checkbox-row">
              <input
                type="checkbox"
                className="toss-auth-checkbox"
                checked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
              />
              <span className="toss-auth-checkbox-label">비밀번호 저장</span>
            </label>
            <label className="toss-auth-checkbox-row">
              <input
                type="checkbox"
                className="toss-auth-checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
              />
              <span className="toss-auth-checkbox-label">로그인 유지</span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="toss-auth-submit">
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
              marginTop: "32px",
            }}
          >
            {/* 구글 로그인 */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: "100%",
                maxWidth: "356px",
                height: "40px",
                backgroundColor: "#ffffff",
                borderRadius: "6px",
                border: "1px solid #dadce0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                color: "#3c4043",
                padding: "0 12px",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              구글 로그인
            </button>

            {/* 카카오 로그인 */}
            <button
              type="button"
              onClick={handleKakaoLogin}
              style={{
                width: "100%",
                maxWidth: "356px",
                height: "40px",
                backgroundColor: "#FEE500",
                borderRadius: "6px",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                color: "rgba(0, 0, 0, 0.85)",
                padding: "0 12px",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 3C5.13437 3 2 5.34375 2 8.25C2 10.0875 3.25 11.6625 5.125 12.6375L4.40625 15.1875C4.34375 15.4312 4.6125 15.6188 4.81875 15.4688L8.03125 13.35H9C12.8656 13.35 16 11.0062 16 8.1C16 5.19375 12.8656 2.85 9 2.85V3Z"
                  fill="black"
                />
              </svg>
              카카오 로그인
            </button>
          </div>

          <p className="toss-auth-foot">
            <Link to="/find-email" className="toss-auth-link">
              이메일 찾기
            </Link>
            {" | "}
            <Link to="/reset-password" className="toss-auth-link">
              비밀번호 찾기
            </Link>
          </p>
          <p className="toss-auth-foot" style={{ marginTop: 8 }}>
            계정이 없으신가요?{" "}
            <Link to="/signup" className="toss-auth-link">
              회원가입
            </Link>
          </p>
          <p className="toss-auth-foot" style={{ marginTop: 8 }}>
            <Link
              to="/admin/login"
              className="toss-auth-link"
              style={{ fontSize: "0.9rem", color: "var(--toss-gray-500)" }}
            >
              관리자 로그인 바로가기
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
