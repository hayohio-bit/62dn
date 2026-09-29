import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import type { LoginRequest } from "@/types/dto";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";

const ADMIN_ROLES = ["SUPER_ADMIN"];

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginStore = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const msg = (location.state as { message?: string })?.message;
    if (msg) {
      setSuccess(msg);
      setError("");
      window.history.replaceState({}, "", location.pathname);
    }
  }, [location.state, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload: LoginRequest = { email, password };
      const res = await authApi.login(payload);
      const data = res.data?.data ?? res.data;
      if (data?.accessToken && data?.user) {
        const role = data.user?.role ?? "";
        if (!ADMIN_ROLES.includes(role)) {
          setError(
            "관리자 전용 로그인입니다. 일반 회원은 메인에서 로그인해 주세요.",
          );
          setLoading(false);
          return;
        }
        loginStore(
          {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? "",
            expiresIn: data.expiresIn ?? 3600,
            user: data.user,
          },
          { keepLoggedIn: true },
        );
        navigate("/admin", { replace: true });
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

  return (
    <AuthLayout
      eyebrow="Back office"
      title="관리자 로그인"
      description="시스템 관리자 전용 로그인입니다."
      image="/success-story-3.webp"
      imageAlt="노란 배경 앞에 선 치즈 고양이"
      quote="보이지 않는 곳에서 공고 하나하나를 지키는 일."
      quoteCaption="62댕냥 관리자"
      footer={
        <p>
          <Link to="/login" className="toss-auth-link toss-auth-link--muted">
            ← 일반 회원 로그인
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="toss-auth-card">
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="toss-auth-notice"
            role="status"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="toss-auth-error"
            role="alert"
          >
            {error}
          </motion.div>
        )}

        <div className="toss-auth-field">
          <label htmlFor="admin-login-email" className="toss-auth-label">
            이메일
          </label>
          <input
            id="admin-login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="toss-auth-input"
            placeholder="admin@example.com"
            autoComplete="email"
          />
        </div>
        <div className="toss-auth-field">
          <label htmlFor="admin-login-password" className="toss-auth-label">
            비밀번호
          </label>
          <PasswordInput
            id="admin-login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="비밀번호"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={loading} className="toss-auth-submit">
          {loading ? "로그인 중..." : "관리자 로그인"}
        </button>
      </form>
    </AuthLayout>
  );
}
