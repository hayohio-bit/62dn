import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "@/api/auth";
import AuthLayout from "@/components/auth/AuthLayout";

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
    <AuthLayout
      eyebrow="Find account"
      title="이메일 찾기"
      description="가입할 때 입력한 이름과 전화번호로 이메일을 찾을 수 있어요."
      image="/images/landing/hero-cat.webp"
      imageAlt="앞발을 모으고 정면을 바라보는 고양이"
      quote="기억나지 않아도 괜찮아요. 천천히 함께 찾아요."
      quoteCaption="62댕냥 계정 찾기"
      footer={
        <p>
          <Link to="/reset-password" className="toss-auth-link toss-auth-link--muted">
            비밀번호 찾기
          </Link>
          <span className="mx-2 text-ink-faint" aria-hidden>
            ·
          </span>
          <Link to="/login" className="toss-auth-link">
            로그인으로 돌아가기
          </Link>
        </p>
      }
    >
      {maskedEmail ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="toss-auth-card text-center"
          role="status"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sage text-white" aria-hidden>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="mt-5 text-ink-soft">회원님의 이메일은</p>
          <p className="mt-2 break-all font-serif text-2xl text-ink">{maskedEmail}</p>
          <p className="mt-2 text-sm text-ink-muted">개인정보 보호를 위해 일부를 가려서 보여 드려요.</p>
          <Link to="/login" className="toss-auth-submit">
            로그인하기
          </Link>
        </motion.div>
      ) : (
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

          <button type="submit" disabled={loading} className="toss-auth-submit">
            {loading ? "찾는 중..." : "이메일 찾기"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
