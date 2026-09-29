import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useAuthStore } from "@/store/authStore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAdminDashboard, AdminTab } from "@/hooks/useAdminDashboard";
import { adminApi, animalApi } from "@/api";
import type { SyncHistoryItem } from "@/api/admin";
import AdminUserTable from "@/components/admin/AdminUserTable";
import AdminBoardTable from "@/components/admin/AdminBoardTable";
import AdminSyncPanel from "@/components/admin/AdminSyncPanel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const ADMIN_ROLES = ["SUPER_ADMIN"];

const ADMIN_TABS: { id: AdminTab; label: string; title: string; desc: string }[] = [
  {
    id: "members",
    label: "회원 관리",
    title: "회원 관리",
    desc: "전체 회원 목록을 조회하고 관리합니다. 시스템 관리자 계정은 탈퇴시킬 수 없습니다.",
  },
  {
    id: "boards",
    label: "게시판 관리",
    title: "게시판 관리",
    desc: "공지·FAQ·자유게시판 글을 검토하고 상단 고정하거나 삭제합니다.",
  },
  {
    id: "sync",
    label: "데이터 동기화",
    title: "공공데이터 동기화",
    desc: "공공데이터포털의 유기동물 공고를 입양 목록에 반영합니다.",
  },
];

interface DashboardStats {
  users: number | null;
  boards: number | null;
  animals: number | null;
  lastSync: SyncHistoryItem | null | undefined;
}

/** 기존 목록 API의 전체 건수로 요약 수치를 만든다 (실패한 항목은 null로 두고 "—"로 표시) */
function useDashboardStats(enabled: boolean) {
  const [stats, setStats] = useState<DashboardStats>({
    users: null,
    boards: null,
    animals: null,
    lastSync: undefined,
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    Promise.allSettled([
      adminApi.getUsers(0, 1),
      adminApi.getBoards(0, 1),
      animalApi.getAll({ page: 0, sizeParam: 1 }),
      adminApi.getSyncHistory(0, 1),
    ]).then(([users, boards, animals, sync]) => {
      if (cancelled) return;
      setStats({
        users: users.status === "fulfilled" ? (users.value.data?.data?.totalElements ?? null) : null,
        boards: boards.status === "fulfilled" ? (boards.value.data?.data?.totalElements ?? null) : null,
        animals: animals.status === "fulfilled" ? (animals.value?.totalElements ?? null) : null,
        lastSync: sync.status === "fulfilled" ? (sync.value.data?.data?.content?.[0] ?? null) : null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return stats;
}

function formatSyncTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${mi}`;
}

function StatCard({
  label,
  value,
  unit,
  sub,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={clsx("admin-stat", accent && "admin-stat--accent")}>
      <span className="admin-stat-label">{label}</span>
      <span className="admin-stat-value">
        {value}
        {unit && value !== "—" && <span className="admin-stat-unit">{unit}</span>}
      </span>
      <span className="admin-stat-sub">{sub}</span>
    </div>
  );
}

const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString());

export default function AdminDashboardPage() {
  useDocumentTitle("관리자 대시보드");
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = Boolean(isAuthenticated && user && ADMIN_ROLES.includes(user.role));

  const {
    activeTab,
    setActiveTab,
    usersState,
    usersActions,
    boardsState,
    boardsActions,
    syncState,
    syncActions,
  } = useAdminDashboard();
  const stats = useDashboardStats(isAdmin);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/admin/login", { replace: true });
      return;
    }
    if (!ADMIN_ROLES.includes(user.role)) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user) return null;

  const currentTab = ADMIN_TABS.find((t) => t.id === activeTab) ?? ADMIN_TABS[0];
  const lastSync = stats.lastSync;

  return (
    <div className="admin-dashboard">
      <Header />
      <main>
        <div className="admin-dashboard-inner">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="admin-dashboard-head"
          >
            <div>
              <p className="dn-eyebrow">Back office</p>
              <h1 className="admin-dashboard-title">관리자 대시보드</h1>
              <p className="admin-dashboard-desc">
                {user.name} · {user.email} · 시스템 관리자
              </p>
            </div>
            <Link to="/mypage/preferences" className="toss-btn toss-btn-ghost !px-3 text-sm">
              내 선호 조건 설정
            </Link>
          </motion.div>

          <section className="admin-stats" aria-label="운영 요약">
            <StatCard label="전체 회원" value={fmt(stats.users)} unit="명" sub="일반 회원과 관리자 포함" />
            <StatCard label="게시글" value={fmt(stats.boards)} unit="건" sub="공지·FAQ·자유 전체" />
            <StatCard
              label="보호 중인 아이"
              value={fmt(stats.animals)}
              unit="마리"
              sub="입양 목록에 공개된 공고"
              accent
            />
            <StatCard
              label="최근 동기화"
              value={lastSync === undefined ? "…" : lastSync ? formatSyncTime(lastSync.runAt) : "—"}
              sub={
                lastSync
                  ? `${lastSync.triggerType === "AUTO" ? "자동" : "수동"} · 추가 ${lastSync.addedCount} · 수정 ${lastSync.updatedCount}${lastSync.errorMessage ? " · 오류 있음" : ""}`
                  : lastSync === null
                    ? "동기화 이력이 없습니다"
                    : "불러오는 중"
              }
            />
          </section>

          <nav className="admin-tabs" aria-label="관리 메뉴">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            <motion.section
              key={currentTab.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="admin-card"
              aria-labelledby="admin-card-title"
            >
              <div className="admin-card-head">
                <h2 id="admin-card-title" className="admin-card-title">
                  {currentTab.title}
                </h2>
                <p className="admin-card-desc">{currentTab.desc}</p>
              </div>
              {currentTab.id === "members" && <AdminUserTable state={usersState} actions={usersActions} />}
              {currentTab.id === "boards" && <AdminBoardTable state={boardsState} actions={boardsActions} />}
              {currentTab.id === "sync" && <AdminSyncPanel state={syncState} actions={syncActions} />}
            </motion.section>
          </AnimatePresence>

          <p className="admin-foot">
            <Link to="/">← 사이트로 돌아가기</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
