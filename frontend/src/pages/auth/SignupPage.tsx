import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import type { SignupRequest } from "@/types/dto";
import clsx from "clsx";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";

export default function SignupPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload: SignupRequest = { email, password, name, phone };
      const res = await authApi.signup(payload);
      const data = res.data?.data ?? res.data;
      const signupOk = data && data.id !== undefined && data.id !== null;
      if (!signupOk) {
        setError("가입 후 로그인해 주세요.");
        return;
      }
      // 회원가입 성공 후 자동 로그인
      try {
        const loginRes = await authApi.login({ email, password });
        const loginPayload = loginRes.data?.data ?? loginRes.data;
        const accessToken = loginPayload?.accessToken;
        const user = loginPayload?.user;
        if (accessToken && user) {
          loginStore({
            accessToken,
            refreshToken: loginPayload?.refreshToken ?? "",
            expiresIn: loginPayload?.expiresIn ?? 3600,
            user,
          });
          navigate("/", { replace: true });
          return;
        }
      } catch (loginErr: unknown) {
        const loginMsg = (
          loginErr as { response?: { data?: { message?: string } } }
        )?.response?.data?.message;
        setError(
          loginMsg ??
            "로그인에 실패했습니다. 위 이메일/비밀번호로 로그인 페이지에서 다시 시도해 주세요.",
        );
        return;
      }
      setError(
        "로그인 응답 형식이 올바르지 않습니다. 로그인 페이지에서 다시 시도해 주세요.",
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const passwordTooShort = password.length > 0 && password.length < 8;

  return (
    <AuthLayout
      eyebrow="Join us"
      title="회원가입"
      description="가입하면 마음에 드는 아이를 찜하고, 선호 조건을 저장해 둘 수 있어요."
      image="/success-story-1.webp"
      imageAlt="바닷가에서 웃고 있는 개"
      quote="숫자로 불리던 아이가, 누군가의 이름이 되는 순간."
      quoteCaption="62댕냥"
      footer={
        <p>
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="toss-auth-link">
            로그인
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="toss-auth-card">
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
          <label htmlFor="signup-email" className="toss-auth-label">
            이메일
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="toss-auth-label">
            비밀번호
          </label>
          <PasswordInput
            id="signup-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="8자 이상"
            autoComplete="new-password"
            aria-describedby="signup-password-hint"
          />
          <p
            id="signup-password-hint"
            className={clsx("mt-2 pl-1 text-xs", passwordTooShort ? "text-terracotta-600" : "text-ink-muted")}
          >
            {passwordTooShort ? `8자 이상 입력해 주세요 (${password.length}/8)` : "8자 이상으로 입력해 주세요."}
          </p>
        </div>
        <div className="toss-auth-field">
          <label htmlFor="signup-name" className="toss-auth-label">
            이름
          </label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="toss-auth-input"
            placeholder="홍길동"
            autoComplete="name"
          />
        </div>
        <div className="toss-auth-field">
            <label htmlFor="signup-phone" className="toss-auth-label">
              전화번호 <span className="toss-auth-label-optional">(선택)</span>
            </label>
            <input
              id="signup-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="toss-auth-input"
              placeholder="010-1234-5678"
              autoComplete="tel"
            />
        </div>
        <p className="-mt-1 pl-1 text-xs leading-relaxed text-ink-muted">
          전화번호를 남기면 이메일을 잊었을 때 이름과 전화번호로 찾을 수 있어요.
        </p>

        <button type="submit" disabled={loading} className="toss-auth-submit">
          {loading ? "가입 중..." : "가입하고 시작하기"}
        </button>
      </form>
    </AuthLayout>
  );
}
