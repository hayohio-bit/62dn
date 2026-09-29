import { Link } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";

const steps = [
  "카카오·구글 계정으로 가입하셨다면 해당 계정으로 로그인해 주세요.",
  "이메일로 가입하셨다면 지금은 비밀번호를 온라인으로 재설정할 수 없어요. 가입한 이메일이 기억나지 않으면 이메일 찾기를 이용해 주세요.",
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
      imageAlt="노란 배경 앞에 선 치즈 고양이"
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
        <Link to="/login" className="toss-auth-submit">
          로그인으로 돌아가기
        </Link>
      </div>
    </AuthLayout>
  );
}
