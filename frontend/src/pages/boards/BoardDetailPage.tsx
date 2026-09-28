import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { boardApi } from "@/api";
import type { Board, Comment } from "@/types/entities";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { BoardTypeBadge, NameAvatar, PinnedMark } from "@/components/boards/BoardTypeBadge";
import { boardTypeTitles, formatBoardDateTime } from "@/components/boards/boardFormat";

const textareaClass =
  "w-full resize-y rounded-2xl border border-ink/15 bg-white px-4 py-3 leading-relaxed text-ink placeholder:text-ink-faint transition focus:border-terracotta focus:outline-none focus:ring-4 focus:ring-terracotta/15";

const smallAction =
  "rounded-full px-3 py-1 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink";

function BackLink() {
  return (
    <Link
      to="/boards"
      className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
    >
      <span aria-hidden>←</span> 게시판 목록
    </Link>
  );
}

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [board, setBoard] = useState<Board | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 댓글 수정 상태
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // 조회수 증가를 요청한 게시글 id (같은 글에 대한 중복 요청 방지, 다른 글로 이동하면 다시 요청)
  const viewCountedId = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // 다른 글로 이동한 뒤 늦게 도착한 이전 글의 응답은 무시한다.
    let cancelled = false;
    const boardId = Number(id);

    const loadData = async () => {
      setLoading(true);
      // 1. 조회수 증가 요청 먼저 수행 (서버에서 중복 카운트 방지 쿠키 처리)
      if (viewCountedId.current !== id) {
        viewCountedId.current = id;
        await boardApi.increaseViewCount(boardId).catch(console.error);
      }

      // 2. 게시글 조회 (방금 증가된 조회수가 반영된 데이터 반환)
      let data: Board;
      try {
        data = await boardApi.getById(boardId);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        alert("게시글을 찾을 수 없습니다.");
        navigate("/boards");
        return;
      }
      if (cancelled) return;
      setBoard(data);

      // 3. 댓글 조회 (실패해도 게시글은 표시)
      try {
        const commentsData = await boardApi.getComments(boardId);
        if (!cancelled) setComments(commentsData);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setComments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const handleBoardDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await boardApi.delete(Number(id));
      alert("게시글이 삭제되었습니다.");
      navigate("/boards");
    } catch (err) {
      alert(getApiErrorMessage(err, "게시글 삭제에 실패했습니다."));
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      await boardApi.addComment(Number(id), { content: commentText });
      setCommentText("");
      const updatedComments = await boardApi.getComments(Number(id));
      setComments(updatedComments);
    } catch (err) {
      alert(getApiErrorMessage(err, "댓글 작성에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentUpdate = async (commentId: number) => {
    if (!editCommentText.trim()) return;
    try {
      await boardApi.updateComment(commentId, editCommentText);
      setEditingCommentId(null);
      setEditCommentText("");
      const updatedComments = await boardApi.getComments(Number(id));
      setComments(updatedComments);
    } catch (err) {
      alert(getApiErrorMessage(err, "댓글 수정에 실패했습니다."));
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await boardApi.deleteComment(commentId);
      const updatedComments = await boardApi.getComments(Number(id));
      setComments(updatedComments);
    } catch (err) {
      alert(getApiErrorMessage(err, "댓글 삭제에 실패했습니다."));
    }
  };

  if (loading || !board) {
    return (
      <div className="flex min-h-screen flex-col bg-cream">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-3xl animate-pulse px-6 pb-24 pt-[calc(var(--header-height)+3.5rem)]" aria-hidden>
            <div className="h-4 w-24 rounded bg-ink/10" />
            <div className="mt-12 h-6 w-16 rounded-full bg-ink/10" />
            <div className="mt-6 h-12 w-4/5 rounded bg-ink/10" />
            <div className="mt-8 space-y-3">
              <div className="h-4 w-full rounded bg-ink/5" />
              <div className="h-4 w-11/12 rounded bg-ink/5" />
              <div className="h-4 w-2/3 rounded bg-ink/5" />
            </div>
          </div>
          <p className="sr-only" role="status">
            게시글을 불러오는 중입니다.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = currentUser?.id === board.userId;
  const wasEdited = board.updatedAt && board.updatedAt.slice(0, 16) !== board.createdAt.slice(0, 16);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <motion.article
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="mx-auto max-w-3xl px-6 pt-[calc(var(--header-height)+3rem)]"
        >
          <BackLink />

          <header className="mt-10 md:mt-14">
            <div className="flex flex-wrap items-center gap-3">
              <BoardTypeBadge type={board.type} />
              <span className="text-sm text-ink-muted">{boardTypeTitles[board.type]}</span>
              {board.isPinned && <PinnedMark />}
            </div>
            <h1 className="mt-5 break-keep font-serif text-[2rem] leading-tight tracking-[-0.02em] text-ink md:text-[2.75rem]">
              {board.title}
            </h1>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-ink/10 py-5">
              <div className="flex items-center gap-3">
                <NameAvatar name={board.userName} />
                <div>
                  <p className="font-serif text-lg leading-tight text-ink">{board.userName || "익명"}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    <time dateTime={board.createdAt}>{formatBoardDateTime(board.createdAt)}</time>
                    {wasEdited && " · 수정됨"}
                    {" · "}조회 {board.views.toLocaleString()}
                  </p>
                </div>
              </div>
              {isOwner && (
                <div className="flex gap-1">
                  <button type="button" onClick={() => navigate(`/boards/${id}/edit`)} className={smallAction}>
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={handleBoardDelete}
                    className="rounded-full px-3 py-1 text-sm text-ink-muted transition-colors hover:bg-terracotta-50 hover:text-terracotta-700"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="whitespace-pre-wrap break-words py-10 text-[1.0625rem] leading-[1.9] text-ink-soft md:py-12 md:text-lg">
            {board.content}
          </div>
        </motion.article>

        {/* 댓글 */}
        <section aria-labelledby="comments-title" className="mx-auto max-w-3xl px-6 pb-24">
          <div className="rounded-[1.75rem] border border-ink/10 bg-cream-50 p-6 shadow-card md:p-10">
            <h2 id="comments-title" className="font-serif text-2xl text-ink">
              댓글 <span className="text-terracotta">{comments.length}</span>
            </h2>

            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="mt-6">
                <label htmlFor="comment-new" className="sr-only">
                  댓글 내용
                </label>
                <textarea
                  id="comment-new"
                  className={textareaClass}
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="따뜻한 한마디를 남겨 주세요"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="toss-btn toss-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? "등록 중..." : "댓글 등록"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-ink/20 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-ink-soft">댓글은 로그인한 뒤 남길 수 있어요.</p>
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="toss-btn toss-btn-outline !py-2.5"
                >
                  로그인하기
                </Link>
              </div>
            )}

            {comments.length === 0 ? (
              <p className="mt-10 text-center text-ink-muted">아직 댓글이 없어요. 첫 댓글을 남겨 보세요.</p>
            ) : (
              <ol className="mt-8 border-t border-ink/10">
                {comments.map((comment) => {
                  const mine = currentUser?.id === comment.userId;
                  const editing = editingCommentId === comment.id;
                  return (
                    <li key={comment.id} className="flex gap-4 border-b border-ink/10 py-6 last:border-b-0 last:pb-0">
                      <NameAvatar name={comment.userName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <p className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-serif text-[1.0625rem] text-ink">{comment.userName || "익명"}</span>
                            {comment.userId === board.userId && (
                              <span className="rounded-full bg-sage-50 px-2 py-0.5 text-xs font-semibold text-sage-600">
                                작성자
                              </span>
                            )}
                            <time dateTime={comment.createdAt} className="text-sm text-ink-muted">
                              {formatBoardDateTime(comment.createdAt)}
                            </time>
                          </p>
                          {mine && !editing && (
                            <div className="-mr-3 flex">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditCommentText(comment.content);
                                }}
                                className={smallAction}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCommentDelete(comment.id)}
                                className="rounded-full px-3 py-1 text-sm text-ink-muted transition-colors hover:bg-terracotta-50 hover:text-terracotta-700"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                        {editing ? (
                          <div className="mt-3">
                            <label htmlFor={`comment-edit-${comment.id}`} className="sr-only">
                              댓글 수정
                            </label>
                            <textarea
                              id={`comment-edit-${comment.id}`}
                              className={textareaClass}
                              rows={3}
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              autoFocus
                            />
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingCommentId(null)}
                                className="toss-btn toss-btn-ghost"
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCommentUpdate(comment.id)}
                                disabled={!editCommentText.trim()}
                                className="toss-btn toss-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                저장
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 whitespace-pre-wrap break-words leading-relaxed text-ink-soft">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="mt-10 flex justify-center">
            <Link to="/boards" className="toss-btn toss-btn-outline">
              목록으로
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
