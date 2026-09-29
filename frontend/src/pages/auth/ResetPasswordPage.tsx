import { Link } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";

const steps = [
  "카카오·구글 계정으로 가입하셨다면 해당 계정으로 로그인해 주세요.",
  "이메일로 가입하셨다면 가입한 이메일 주소로 아래 주소에 재설정을 요청해 주세요.",
];

/**
 * 비밀번호 재설정 안내.
 * 이메일 인증 없이 이름·전화번호만으로 재설정하던 방식은 계정 탈취 위험이 있어 중단했다.
 * 메일 인증 기반 재설정을 도입하기 전까지는 안내만 보여 준다.
 */
export default function ResetPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Password"
      title="비밀번호 재설정"
      description="본인 확인 절차를 준비하는 동안 온라인 재설정을 제공하지 않습니다."
      image="/success-story-3.webp"
      imageAlt="새 가족 곁에서 쉬고 있는 반려동물"
      quote="잠시 멈춰도 괜찮아요. 아이들은 여기서 기다리고 있어요."
      quoteCaption="62댕냥 계정 찾기"
      footer={
        <p>
          <Link to="/find-email" className="toss-auth-link toss-auth-link--muted">
            이메일 찾기
          </Link>
        </p>
      }
    >
      <div className="toss-auth-card">
        <ol className="space-y-5">
          {steps.map((text, i) => (
            <li key={text} className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-terracotta-50 font-display text-terracotta-700">
                {i + 1}
              </span>
              <p className="pt-1 leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
        <a
          href="mailto:contact@dnplatform.com"
          className="mt-5 block rounded-2xl border border-ink/10 bg-white px-5 py-4 text-center font-display text-lg text-ink transition-colors hover:border-terracotta hover:text-terracotta"
        >
          contact@dnplatform.com
        </a>
        <Link to="/login" className="toss-auth-submit">
          로그인으로 돌아가기
        </Link>
      </div>
    </AuthLayout>
  );
}
