'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  FaBolt, FaChartPie, FaBriefcase, FaUsers, FaHandshake, FaUser, FaBars,
  FaClipboardList, FaSignOutAlt, FaLock, FaChevronUp,
} from 'react-icons/fa';
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb';

import { useAuth } from '../lib/auth-context';
import { StoreProvider, useStore } from '../lib/store';
import { Project, Member, Matching, PageName, MatchingStatus, MemberProcess } from '../lib/types';
import Login from '../components/Login';
import { formatDate, formatDateForFile, getDefaultTasksForStatus } from '../lib/helpers';

import Toast from '../components/Toast';
import Dashboard from '../components/Dashboard';
import Projects from '../components/Projects';
import Members from '../components/Members';
import MatchingPage from '../components/Matching';
import ProgressPage from '../components/Progress';

import ProjectFormModal from '../components/modals/ProjectFormModal';
import MemberFormModal from '../components/modals/MemberFormModal';
import MatchingFormModal, { MatchingFormData } from '../components/modals/MatchingFormModal';
import { ProjectDetailModal, MemberDetailModal } from '../components/modals/DetailModals';
import ImportModal from '../components/modals/ImportModal';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';

// ---- Auth gate ----
// initialized が false の間は何も描画しない（SSR=null, 初回hydration=null → 一致）。
// useEffect で localStorage 復元完了後に initialized=true → 描画開始。
function App() {
  const { user, initialized } = useAuth();

  if (!initialized) return null;

  return (
    <StoreProvider>
      <AuthenticatedApp />
      {!user && <Login />}
    </StoreProvider>
  );
}

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const store = useStore();
  const [currentPage, setCurrentPage] = useState<PageName>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Modal states
  const [projectDetailId, setProjectDetailId] = useState<string | null>(null);
  const [memberDetailId, setMemberDetailId] = useState<string | null>(null);
  const [projectFormData, setProjectFormData] = useState<Partial<Project> | null>(null);
  const [memberFormData, setMemberFormData] = useState<Partial<Member> | null>(null);
  const [matchingFormData, setMatchingFormData] = useState<MatchingFormData | null>(null);
  const [importTarget, setImportTarget] = useState<'projects' | 'members' | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ポップオーバーメニュー外クリックで閉じる
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const navigate = (page: PageName) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const pageTitle: Record<PageName, string> = {
    dashboard: 'ダッシュボード',
    projects: '案件管理',
    members: '要員管理',
    matching: 'マッチング',
    progress: '進捗管理',
  };

  // ---- Project handlers ----
  const handleAddProject = () => setProjectFormData({});
  const handleEditProject = (p: Project) => setProjectFormData(p);
  const handleDeleteProject = async (id: string) => {
    if (!confirm('この案件を削除しますか？')) return;
    await store.deleteProject(id);
    store.logActivity('案件削除', 'projects', id, '', '');
    showToast('案件を削除しました');
  };
  const handleSaveProject = async (data: Omit<Project, 'id'>, id?: string) => {
    if (id) {
      await store.updateProject(id, data);
      store.logActivity('案件更新', 'projects', id, data.project_name_rewrite || data.project_name_original, '');
      showToast('案件を更新しました');
    } else {
      const created = await store.addProject(data);
      store.logActivity('案件追加', 'projects', created.id, data.project_name_rewrite || data.project_name_original, '');
      showToast('案件を追加しました');
    }
    setProjectFormData(null);
  };
  const handleBulkUpdateProjects = async (ids: string[], updates: Partial<Project>) => {
    await store.bulkUpdateProjects(ids, updates);
    store.logActivity('一括更新', 'projects', '', `${ids.length}件`, '');
    showToast(`${ids.length}件を更新しました`);
  };
  const handleBulkDeleteProjects = async (ids: string[]) => {
    await store.bulkDeleteProjects(ids);
    store.logActivity('一括削除', 'projects', '', `${ids.length}件`, '');
    showToast(`${ids.length}件の案件を削除しました`);
  };

  // ---- Member handlers ----
  const handleAddMember = () => setMemberFormData({});
  const handleEditMember = (m: Member) => setMemberFormData(m);
  const handleDeleteMember = async (id: string) => {
    if (!confirm('この要員を削除しますか？')) return;
    await store.deleteMember(id);
    store.logActivity('要員削除', 'members', id, '', '');
    showToast('要員を削除しました');
  };
  const handleSaveMember = async (data: Omit<Member, 'id'>, id?: string) => {
    if (id) {
      await store.updateMember(id, data);
      store.logActivity('要員更新', 'members', id, data.full_name || data.initial, '');
      showToast('要員を更新しました');
    } else {
      const created = await store.addMember(data);
      store.logActivity('要員追加', 'members', created.id, data.full_name || data.initial, '');
      showToast('要員を追加しました');
    }
    setMemberFormData(null);
  };
  const handleBulkDeleteMembers = async (ids: string[]) => {
    await store.bulkDeleteMembers(ids);
    store.logActivity('一括削除', 'members', '', `${ids.length}件`, '');
    showToast(`${ids.length}件の要員を削除しました`);
  };
  const handleMemberProcessChange = async (id: string, process: MemberProcess) => {
    await store.updateMember(id, { process });
    const m = store.members.find(x => x.id === id);
    store.logActivity('プロセス変更', 'members', id, m?.full_name || m?.initial || '', process);
    showToast(`プロセスを「${process}」に変更しました`);
  };

  // ---- Matching handlers ----
  const handleOpenMatchingForm = (projectId: string, memberId: string) => {
    setMatchingFormData({ project_id: projectId, member_id: memberId, status: '候補', proposed_date: '', interview_date: '', note: '' });
  };
  const handleEditMatching = (mt: Matching) => {
    setMatchingFormData({ id: mt.id, project_id: mt.project_id, member_id: mt.member_id, status: mt.status, proposed_date: mt.proposed_date, interview_date: mt.interview_date, note: mt.note });
  };
  const handleDeleteMatching = async (id: string) => {
    if (!confirm('このマッチングを削除しますか？')) return;
    await store.deleteMatching(id);
    store.logActivity('マッチング削除', 'matchings', id, '', '');
    showToast('マッチングを削除しました');
  };
  const handleBulkDeleteMatchings = async (ids: string[]) => {
    await store.bulkDeleteMatchings(ids);
    store.logActivity('一括削除', 'matchings', '', `${ids.length}件`, '');
    showToast(`${ids.length}件のマッチングを削除しました`);
  };
  const handleSaveMatching = async (data: Omit<Matching, 'id'>, id?: string) => {
    if (id) {
      await store.updateMatching(id, data);
      store.logActivity('マッチング更新', 'matchings', id, '', data.status);
      showToast('マッチングを更新しました');
    } else {
      const created = await store.addMatching(data);
      store.logActivity('マッチング登録', 'matchings', created.id, '', data.status);
      showToast('マッチングを登録しました');
    }
    setMatchingFormData(null);
  };
  const handleUpdateMatchingField = async (id: string, data: Partial<Matching>) => {
    await store.updateMatching(id, data);
  };

  const handleQuickStatusUpdate = async (id: string, status: string) => {
    try {
      await store.updateMatching(id, { status: status as MatchingStatus });

      // Auto-add default tasks for the new status (skip duplicates)
      const defaults = getDefaultTasksForStatus(status as MatchingStatus);
      // Re-fetch current tasks from store to avoid stale closure
      const currentTasks = store.tasks;
      const existingContents = new Set(
        currentTasks.filter(t => t.matching_id === id).map(t => t.content)
      );
      const newTasks = defaults.filter(d => !existingContents.has(d));
      if (newTasks.length > 0) {
        await store.bulkAddTasks(id, newTasks);
      }

      store.logActivity('ステータス変更', 'matchings', id, '', status);
      showToast(`ステータスを「${status}」に変更しました`);
    } catch (e) {
      console.error('handleQuickStatusUpdate error:', e);
      showToast('ステータス変更中にエラーが発生しました');
    }
  };

  // ---- Export handler ----
  const handleExport = async (type: 'projects' | 'members') => {
    const { utils, writeFile } = await import('xlsx');
    const EXPORT_COLS = {
      projects: [
        { key: 'status', label: 'ステータス' }, { key: 'shareable', label: '共有可否' }, { key: 'added_date', label: '追加日' },
        { key: 'source', label: '案件元' }, { key: 'project_name_rewrite', label: '案件名' }, { key: 'role', label: '募集職種' },
        { key: 'client_price', label: '元単価' }, { key: 'purchase_price', label: '仕入単価' }, { key: 'location', label: '勤務地' },
        { key: 'work_style', label: '働き方' }, { key: 'period', label: '期間' }, { key: 'required_skill_tags', label: '必須スキルタグ' },
        { key: 'preferred_skill_tags', label: '尚可スキルタグ' }, { key: 'industry_tags', label: '業界タグ' },
        { key: 'required_skills', label: '必須スキル' }, { key: 'preferred_skills', label: '尚可スキル' },
        { key: 'age_limit', label: '年齢制限' }, { key: 'nationality', label: '外国籍' },
        { key: 'commercial_flow', label: '商流制限' }, { key: 'interview_count', label: '面談回数' },
      ],
      members: [
        { key: 'process', label: 'プロセス' }, { key: 'full_name', label: '要員名' }, { key: 'initial', label: 'イニシャル' },
        { key: 'affiliation', label: '所属先' }, { key: 'desired_price', label: '希望単価' }, { key: 'desired_position', label: '希望ポジション' },
        { key: 'skill_tags', label: 'スキルタグ' }, { key: 'industry_tags', label: '業界タグ' }, { key: 'experience_years', label: '経験年数' },
        { key: 'nearest_station', label: '最寄駅' }, { key: 'available_date', label: '稼働可能日' }, { key: 'work_preference', label: '勤務形態' },
        { key: 'skills_summary', label: 'スキル一覧' }, { key: 'experience_summary', label: '経験一覧' },
        { key: 'sales_comment', label: '営業コメント' }, { key: 'skill_sheet_url', label: 'スキルシートURL' },
      ],
    };
    const cols = EXPORT_COLS[type];
    const data = type === 'projects' ? store.projects : store.members;
    const rows = data.map((r) => {
      const row: Record<string, string> = {};
      cols.forEach(c => { row[c.label] = (r as unknown as Record<string, string>)[c.key] || ''; });
      return row;
    });
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, type === 'projects' ? '案件' : '要員');
    writeFile(wb, `${type === 'projects' ? '案件一覧' : '要員一覧'}_${formatDateForFile()}.xlsx`);
    showToast(`${rows.length}件をエクスポートしました`);
  };

  // ---- Import handler ----
  const handleImport = (table: 'projects' | 'members', records: Record<string, string>[], mode: 'append' | 'replace') => {
    store.importRecords(table, records, mode);
    store.logActivity('インポート', table, '', '', `${records.length}件`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(c => !c)}
            title={sidebarCollapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
          >
            {sidebarCollapsed ? <TbLayoutSidebarLeftExpand /> : <TbLayoutSidebarLeftCollapse />}
          </button>
          <div className="logo">
            <FaBolt style={{ color: '#fbbf24', fontSize: 24 }} />
            <span className="sidebar-label">ReForce SES</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {([
            { page: 'dashboard', Icon: FaChartPie, label: 'ダッシュボード' },
            { page: 'projects', Icon: FaBriefcase, label: '案件管理' },
            { page: 'members', Icon: FaUsers, label: '要員管理' },
            { page: 'matching', Icon: FaHandshake, label: 'マッチング' },
            { page: 'progress', Icon: FaClipboardList, label: '進捗管理' },
          ] as Array<{ page: PageName; Icon: React.ComponentType<{ style?: React.CSSProperties }>; label: string }>).map(({ page, Icon, label }) => (
            <button
              key={page}
              className={`nav-item${currentPage === page ? ' active' : ''}`}
              onClick={() => navigate(page)}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon style={{ fontSize: 16 }} />
              <span className="sidebar-label">{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer" ref={userMenuRef}>
          <button
            className="user-menu-trigger"
            onClick={() => setShowUserMenu(v => !v)}
          >
            <div className="user-avatar"><FaUser /></div>
            <div className="user-detail sidebar-label">
              <span className="user-name">{user?.display_name}</span>
              <span className="user-role">{user?.role === 'admin' ? '管理者' : user?.role === 'manager' ? 'マネージャー' : 'メンバー'}</span>
            </div>
            <FaChevronUp className={`sidebar-label user-menu-chevron${showUserMenu ? ' open' : ''}`} />
          </button>
          {showUserMenu && (
            <div className="user-menu">
              <button
                className="user-menu-item"
                onClick={() => { setShowUserMenu(false); setShowChangePassword(true); }}
              >
                <FaLock style={{ fontSize: 13 }} />
                <span>パスワード変更</span>
              </button>
              <div className="user-menu-divider" />
              <button
                className="user-menu-item user-menu-item-danger"
                onClick={() => {
                  if (confirm('ログアウトしますか？')) {
                    setShowUserMenu(false);
                    logout();
                  }
                }}
              >
                <FaSignOutAlt style={{ fontSize: 13 }} />
                <span>ログアウト</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`main-content${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        {/* Header */}
        <header className="header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)}>
            <FaBars />
          </button>
          <h1 className="page-title">{pageTitle[currentPage]}</h1>
          <div className="header-actions">
            <span className="current-date">{formatDate(new Date())}</span>
          </div>
        </header>

        {/* Loading skeleton */}
        {store.loading && (
          <div className="loading-page">
            <div className="stats-grid">
              {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-stat" />)}
            </div>
            <div className="dashboard-grid">
              <div className="skeleton" style={{ height: 240 }} />
              <div className="skeleton" style={{ height: 240 }} />
            </div>
          </div>
        )}

        {/* Pages */}
        {!store.loading && currentPage === 'dashboard' && (
          <Dashboard
            projects={store.projects}
            members={store.members}
            matchings={store.matchings}
            activityLogs={store.activityLogs}
            onShowProject={id => setProjectDetailId(id)}
            onShowMember={id => setMemberDetailId(id)}
          />
        )}
        {!store.loading && currentPage === 'projects' && (
          <Projects
            projects={store.projects}
            matchings={store.matchings}
            onAdd={handleAddProject}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            onDetail={id => setProjectDetailId(id)}
            onImport={() => setImportTarget('projects')}
            onExport={() => handleExport('projects')}
            onBulkUpdate={handleBulkUpdateProjects}
            onBulkDelete={handleBulkDeleteProjects}
          />
        )}
        {!store.loading && currentPage === 'members' && (
          <Members
            members={store.members}
            matchings={store.matchings}
            projects={store.projects}
            onAdd={handleAddMember}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
            onDetail={id => setMemberDetailId(id)}
            onProcessChange={handleMemberProcessChange}
            onImport={() => setImportTarget('members')}
            onExport={() => handleExport('members')}
            onBulkDelete={handleBulkDeleteMembers}
          />
        )}
        {!store.loading && currentPage === 'matching' && (
          <MatchingPage
            projects={store.projects}
            members={store.members}
            matchings={store.matchings}
            onOpenMatchingForm={handleOpenMatchingForm}
            onEditMatching={handleEditMatching}
            onDeleteMatching={handleDeleteMatching}
            onQuickStatusUpdate={handleQuickStatusUpdate}
            onUpdateMatchingField={handleUpdateMatchingField}
            onShowMember={id => setMemberDetailId(id)}
          />
        )}
        {!store.loading && currentPage === 'progress' && (
          <ProgressPage
            projects={store.projects}
            members={store.members}
            matchings={store.matchings}
            tasks={store.tasks}
            onQuickStatusUpdate={handleQuickStatusUpdate}
            onEditMatching={handleEditMatching}
            onDeleteMatching={handleDeleteMatching}
            onBulkDeleteMatchings={handleBulkDeleteMatchings}
            onUpdateMatchingField={handleUpdateMatchingField}
            onShowProject={id => setProjectDetailId(id)}
            onShowMember={id => setMemberDetailId(id)}
            onAddTask={store.addTask}
            onUpdateTask={store.updateTask}
            onDeleteTask={store.deleteTask}
            onBulkAddTasks={store.bulkAddTasks}
          />
        )}
      </main>

      {/* Modals */}
      {projectDetailId && (
        <ProjectDetailModal
          project={store.projects.find(p => p.id === projectDetailId) ?? null}
          members={store.members}
          matchings={store.matchings}
          notes={store.notes}
          onClose={() => setProjectDetailId(null)}
          onEdit={() => {
            const p = store.projects.find(x => x.id === projectDetailId);
            if (p) { setProjectDetailId(null); handleEditProject(p); }
          }}
          onAddNote={store.addNote}
          onDeleteNote={store.deleteNote}
          onOpenMatchingForm={handleOpenMatchingForm}
        />
      )}
      {memberDetailId && (
        <MemberDetailModal
          member={store.members.find(m => m.id === memberDetailId) ?? null}
          projects={store.projects}
          matchings={store.matchings}
          notes={store.notes}
          onClose={() => setMemberDetailId(null)}
          onEdit={() => {
            const m = store.members.find(x => x.id === memberDetailId);
            if (m) { setMemberDetailId(null); handleEditMember(m); }
          }}
          onAddNote={store.addNote}
          onDeleteNote={store.deleteNote}
          onOpenMatchingForm={handleOpenMatchingForm}
        />
      )}
      {projectFormData !== null && (
        <ProjectFormModal
          initial={projectFormData}
          onClose={() => setProjectFormData(null)}
          onSave={handleSaveProject}
        />
      )}
      {memberFormData !== null && (
        <MemberFormModal
          initial={memberFormData}
          onClose={() => setMemberFormData(null)}
          onSave={handleSaveMember}
        />
      )}
      {matchingFormData !== null && (
        <MatchingFormModal
          initial={matchingFormData}
          projects={store.projects}
          members={store.members}
          onClose={() => setMatchingFormData(null)}
          onSave={handleSaveMatching}
        />
      )}
      {importTarget && (
        <ImportModal
          target={importTarget}
          onClose={() => setImportTarget(null)}
          onImport={handleImport}
          onToast={showToast}
        />
      )}

      {showChangePassword && user && (
        <ChangePasswordModal
          userId={user.id}
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            setShowChangePassword(false);
            showToast('パスワードを変更しました');
          }}
        />
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ---- Root page ----
export default function Page() {
  return <App />;
}
