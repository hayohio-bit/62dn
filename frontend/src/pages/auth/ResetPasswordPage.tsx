import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "@/api/auth";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ email, name, phone, newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? "비밀번호 재설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
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
          <h1 className="toss-auth-title">비밀번호 재설정</h1>
          <p className="toss-auth-desc">
            가입 정보를 확인한 후 새 비밀번호를 설정합니다
          </p>
        </div>

        {success ? (
          <div className="toss-auth-card">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ textAlign: "center", padding: "24px 0" }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--toss-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "var(--toss-black)",
                  marginBottom: 8,
                }}
              >
                비밀번호가 재설정되었습니다
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--toss-gray-500)",
                  marginBottom: 24,
                }}
              >
                새 비밀번호로 로그인해 주세요
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="toss-auth-submit"
              >
                로그인하기
              </button>
            </motion.div>
          </div>
        ) : (
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
              <label htmlFor="reset-email" className="toss-auth-label">
                이메일
              </label>
              <input
                id="reset-email"
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
              <label htmlFor="reset-name" className="toss-auth-label">
                이름
              </label>
              <input
                id="reset-name"
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
              <label htmlFor="reset-phone" className="toss-auth-label">
                전화번호
              </label>
              <input
                id="reset-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="toss-auth-input"
                placeholder="010-1234-5678"
                autoComplete="tel"
              />
            </div>
            <div className="toss-auth-field">
              <label htmlFor="reset-new-password" className="toss-auth-label">
                새 비밀번호
              </label>
              <input
                id="reset-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="toss-auth-input"
                placeholder="8자 이상"
                autoComplete="new-password"
              />
            </div>
            <div className="toss-auth-field">
              <label
                htmlFor="reset-confirm-password"
                className="toss-auth-label"
              >
                새 비밀번호 확인
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="toss-auth-input"
                placeholder="비밀번호 확인"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="toss-auth-submit"
            >
              {loading ? "재설정 중..." : "비밀번호 재설정"}
            </button>

            <p className="toss-auth-foot">
              <Link to="/find-email" className="toss-auth-link">
                이메일 찾기
              </Link>
              {" | "}
              <Link to="/login" className="toss-auth-link">
                로그인으로 돌아가기
              </Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
