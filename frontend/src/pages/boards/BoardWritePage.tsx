import { useState, useEffect } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import clsx from "clsx";
import { boardApi } from "@/api";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { BoardCreateRequest } from "@/types/dto";
import type { BoardType } from "@/types/entities";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/motion/Reveal";
import { BoardTypeBadge } from "@/components/boards/BoardTypeBadge";
import { boardTypeTitles } from "@/components/boards/boardFormat";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** 공지/FAQ/자유만 게시판 글쓰기에서 선택 가능 (봉사·물품 제외). 공지·FAQ는 시스템 관리자만 선택 가능 */
const WRITABLE_TYPES_FOR_ADMIN: BoardType[] = ["NOTICE", "FAQ", "FREE"];
const WRITABLE_TYPES_FOR_USER: BoardType[] = ["FREE"];

// 서버 board.title 컬럼 길이(200)와 맞춘다
const TITLE_MAX = 200;

export default function BoardWritePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>(); // 수정 모드일 경우 id 존재
  const isEditMode = Boolean(id);
  useDocumentTitle(isEditMode ? "글 수정하기" : "새 글 쓰기");

  const { user, isAuthenticated } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const allowedTypes = isSuperAdmin ? WRITABLE_TYPES_FOR_ADMIN : WRITABLE_TYPES_FOR_USER;

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<BoardCreateRequest>({
    type: "FREE",
    title: "",
    content: "",
  });

  // 로그인하지 않은 채 주소로 들어오면 작성 후에야 실패하므로 먼저 로그인으로 보낸다
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // 수정 모드일 경우 데이터 불러오기
  useEffect(() => {
    if (isEditMode && id) {
      boardApi
        .getById(Number(id))
        .then((data) => {
          setFormData({
            type: data.type,
            title: data.title,
            content: data.content,
          });
        })
        .catch((err) => {
          console.error(err);
          alert("게시글 정보를 불러오는데 실패했습니다.");
          navigate("/boards");
        });
    }
  }, [isEditMode, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditMode && id) {
        await boardApi.update(Number(id), formData);
        alert("게시글이 수정되었습니다!");
        navigate(`/boards/${id}`);
      } else {
        const result = await boardApi.create(formData);
        alert("게시글이 작성되었습니다!");
        navigate(`/boards/${result.id}`);
      }
    } catch (err) {
      alert(getApiErrorMessage(err, `게시글 ${isEditMode ? "수정" : "작성"}에 실패했습니다.`));
    } finally {
      setSubmitting(false);
    }
  };

  // 수정 중 취소하면 목록이 아니라 보던 글로 돌아간다
  const cancelTo = isEditMode ? `/boards/${id}` : "/boards";
  const selectedType = allowedTypes.includes(formData.type) ? formData.type : "FREE";
  const canChooseType = !isEditMode && allowedTypes.length > 1;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-[calc(var(--header-height)+3rem)]">
          <Link
            to={cancelTo}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <span aria-hidden>←</span> {isEditMode ? "글로 돌아가기" : "게시판 목록"}
          </Link>

          <Reveal className="mt-10">
            <p className="dn-eyebrow">{isEditMode ? "Edit" : "Write"}</p>
            <h1 className="dn-page-title">{isEditMode ? "글 수정하기" : "새 글 쓰기"}</h1>
            <p className="dn-page-desc">
              입양 후기, 보호소 방문기, 궁금한 점을 자유롭게 나눠 주세요. 서로를 존중하는 말로 적어 주세요.
            </p>
          </Reveal>

          <form
            onSubmit={handleSubmit}
            className="mt-10 rounded-[1.75rem] border border-ink/10 bg-cream-50 p-6 shadow-card md:p-10"
          >
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-ink">게시판</legend>
              {canChooseType ? (
                <div className="flex flex-wrap gap-2">
                  {allowedTypes.map((t) => {
                    const active = selectedType === t;
                    return (
                      <label
                        key={t}
                        className={clsx(
                          "cursor-pointer rounded-full border px-4 py-2 text-[0.9375rem] font-medium transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-terracotta/20",
                          active
                            ? "border-ink bg-ink text-cream"
                            : "border-ink/15 bg-white text-ink-soft hover:border-ink/40",
                        )}
                      >
                        <input
                          type="radio"
                          name="board-type"
                          value={t}
                          checked={active}
                          onChange={() => setFormData({ ...formData, type: t })}
                          className="sr-only"
                        />
                        {boardTypeTitles[t]}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <BoardTypeBadge type={isEditMode ? formData.type : selectedType} />
                  <span className="text-ink-soft">{boardTypeTitles[isEditMode ? formData.type : selectedType]}</span>
                </div>
              )}
              {!isSuperAdmin && !isEditMode && (
                <p className="mt-2 text-sm text-ink-muted">공지사항·FAQ는 시스템 관리자만 작성할 수 있습니다.</p>
              )}
              {isEditMode && <p className="mt-2 text-sm text-ink-muted">작성한 글의 게시판은 바꿀 수 없습니다.</p>}
            </fieldset>

            <div className="mt-8">
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor="board-title" className="text-sm font-semibold text-ink">
                  제목
                </label>
                <span className="text-xs text-ink-faint">
                  {formData.title.length}/{TITLE_MAX}
                </span>
              </div>
              <input
                id="board-title"
                type="text"
                className="w-full border-0 border-b border-ink/20 bg-transparent px-0 pb-3 pt-1 font-serif text-2xl text-ink placeholder:text-ink-faint focus:border-terracotta focus:outline-none focus:ring-0 md:text-[1.75rem]"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="제목을 입력하세요"
                maxLength={TITLE_MAX}
                required
              />
            </div>

            <div className="mt-8">
              <label htmlFor="board-content" className="mb-2 block text-sm font-semibold text-ink">
                내용
              </label>
              <textarea
                id="board-content"
                className="min-h-[18rem] w-full resize-y rounded-2xl border border-ink/15 bg-white px-5 py-4 text-[1.0625rem] leading-[1.85] text-ink placeholder:text-ink-faint transition focus:border-terracotta focus:outline-none focus:ring-4 focus:ring-terracotta/15"
                rows={12}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="내용을 입력하세요"
                required
              />
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link to={cancelTo} className="toss-btn toss-btn-outline">
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="toss-btn toss-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? isEditMode
                    ? "수정 중..."
                    : "등록 중..."
                  : isEditMode
                    ? "수정 완료"
                    : "글 등록하기"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
