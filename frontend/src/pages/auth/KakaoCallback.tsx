import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/apiError";
import AuthPending from "@/components/auth/AuthPending";

export default function KakaoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isProcessing = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      console.error("카카오 인가 코드가 없습니다.");
      navigate("/login");
      return;
    }

    if (isProcessing.current) return;
    isProcessing.current = true;

    const handleKakaoLogin = async () => {
      try {
        const response = await authApi.kakaoLogin(code);
        const data = response.data.data;

        login(data, { keepLoggedIn: true });

        navigate("/");
      } catch (error: unknown) {
        console.error("카카오 로그인 실패:", error);
        const errorMessage = getApiErrorMessage(
          error,
          "카카오 로그인에 실패했습니다.",
        );
        alert(errorMessage);
        navigate("/login");
      }
    };

    handleKakaoLogin();
  }, [searchParams, navigate, login]);

  return <AuthPending message="카카오 계정으로 로그인하고 있어요" />;
}
