import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * 비밀번호 재설정 안내.
 * 이메일 인증 없이 이름·전화번호만으로 재설정하던 방식은 계정 탈취 위험이 있어 중단했다.
 * 메일 인증 기반 재설정을 도입하기 전까지는 안내만 보여 준다.
 */
export default function ResetPasswordPage() {
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
            본인 확인 절차를 준비하는 동안 온라인 재설정을 제공하지 않습니다
          </p>
        </div>

        <div className="toss-auth-card">
          <p style={{ fontSize: "0.95rem", color: "var(--toss-gray-700)", lineHeight: 1.7, marginBottom: 24 }}>
            카카오·구글 계정으로 가입하셨다면 해당 계정으로 로그인해 주세요.
            <br />
            이메일로 가입하셨다면 가입한 이메일 주소로{" "}
            <a href="mailto:contact@dnplatform.com" className="toss-auth-link">
              contact@dnplatform.com
            </a>
            에 재설정을 요청해 주세요.
          </p>
          <Link to="/login" className="toss-auth-submit" style={{ display: "block", textAlign: "center" }}>
            로그인으로 돌아가기
          </Link>
          <p className="toss-auth-foot">
            <Link to="/find-email" className="toss-auth-link">
              이메일 찾기
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
