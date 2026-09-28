import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "@/api/auth";

export default function FindEmailPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMaskedEmail(null);
    setLoading(true);
    try {
      const res = await authApi.findEmail({ name, phone });
      const data = res.data?.data ?? res.data;
      if (data && (data as { maskedEmail?: string }).maskedEmail) {
        setMaskedEmail((data as { maskedEmail: string }).maskedEmail);
      } else {
        setError("이메일을 찾을 수 없습니다.");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? "일치하는 회원 정보를 찾을 수 없습니다.");
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
          <h1 className="toss-auth-title">이메일 찾기</h1>
          <p className="toss-auth-desc">
            가입 시 입력한 이름과 전화번호로 이메일을 찾을 수 있습니다
          </p>
        </div>

        {maskedEmail ? (
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
                  fontSize: "1rem",
                  color: "var(--toss-gray-700)",
                  marginBottom: 8,
                }}
              >
                회원님의 이메일은
              </p>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--toss-black)",
                  marginBottom: 24,
                }}
              >
                {maskedEmail}
              </p>
              <Link to="/login" className="toss-auth-submit" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                로그인하기
              </Link>
            </motion.div>
            <p className="toss-auth-foot" style={{ marginTop: 16 }}>
              <Link to="/reset-password" className="toss-auth-link">
                비밀번호 찾기
              </Link>
            </p>
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
              <label htmlFor="find-name" className="toss-auth-label">
                이름
              </label>
              <input
                id="find-name"
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
              <label htmlFor="find-phone" className="toss-auth-label">
                전화번호
              </label>
              <input
                id="find-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="toss-auth-input"
                placeholder="010-1234-5678"
                autoComplete="tel"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="toss-auth-submit"
            >
              {loading ? "찾는 중..." : "이메일 찾기"}
            </button>

            <p className="toss-auth-foot">
              <Link to="/reset-password" className="toss-auth-link">
                비밀번호 찾기
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
