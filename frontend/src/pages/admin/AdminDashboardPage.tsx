import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAdminDashboard, AdminTab } from "@/hooks/useAdminDashboard";
import AdminUserTable from "@/components/admin/AdminUserTable";
import AdminBoardTable from "@/components/admin/AdminBoardTable";
import AdminSyncPanel from "@/components/admin/AdminSyncPanel";

const ADMIN_ROLES = ["SUPER_ADMIN"];

const ADMIN_TABS: { id: AdminTab; label: string }[] = [
  { id: "members", label: "회원관리" },
  { id: "boards", label: "게시판 관리" },
  { id: "sync", label: "API 수동 동기화" },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  const {
    activeTab, setActiveTab,
    usersState, usersActions,
    boardsState, boardsActions,
    syncState, syncActions
  } = useAdminDashboard();

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

  return (
    <div className="admin-dashboard toss-page-with-fixed-header">
      <Header />
      <main>
        <div className="admin-dashboard-inner">
          <div className="admin-dashboard-head">
            <h1 className="admin-dashboard-title">관리자 대시보드</h1>
            <p className="admin-dashboard-desc">
              {user.name}({user.email}) · 시스템 관리자
              {" · "}
              <Link to="/mypage/preferences" className="text-[var(--toss-blue)] hover:underline font-medium">선호도 설정</Link>
            </p>
          </div>

          <nav className="admin-tabs" aria-label="관리 메뉴">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            {activeTab === "members" && (
              <motion.section
                key="members"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="admin-card"
              >
                <div className="admin-card-head">
                  <h2 className="admin-card-title">회원관리</h2>
                  <p className="admin-card-desc">전체 회원 목록 조회·관리 (일반 회원, 시스템 관리자)</p>
                </div>
                <AdminUserTable state={usersState} actions={usersActions} />
              </motion.section>
            )}

            {activeTab === "boards" && (
              <motion.section
                key="boards"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="admin-card"
              >
                <div className="admin-card-head">
                  <h2 className="admin-card-title">게시판 관리</h2>
                  <p className="admin-card-desc">공지·FAQ·자유게시판 등 게시글 검토·고정·삭제</p>
                </div>
                <AdminBoardTable state={boardsState} actions={boardsActions} />
              </motion.section>
            )}

            {activeTab === "sync" && (
              <motion.section
                key="sync"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="admin-card"
              >
                <div className="admin-card-head">
                  <h2 className="admin-card-title">API 수동 동기화</h2>
                  <p className="admin-card-desc">공공데이터포털 유기동물 정보를 입양 게시판에 반영합니다.</p>
                </div>
                <AdminSyncPanel state={syncState} actions={syncActions} />
              </motion.section>
            )}
          </AnimatePresence>

          <p className="admin-foot mt-6">
            <Link to="/">← 메인</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
