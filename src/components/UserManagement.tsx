'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUserPlus, FaEdit, FaKey, FaToggleOn, FaToggleOff,
  FaUserShield, FaUserTie, FaUser,
} from 'react-icons/fa';
import type { UserAdmin } from '@/lib/types';
import UserFormModal from './modals/UserFormModal';
import ResetPasswordModal from './modals/ResetPasswordModal';

interface Props {
  currentUserId: string;
  onToast: (msg: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: '管理者',
  manager: 'マネージャー',
  user: 'メンバー',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <FaUserShield style={{ marginRight: 4 }} />,
  manager: <FaUserTie style={{ marginRight: 4 }} />,
  user: <FaUser style={{ marginRight: 4 }} />,
};

export default function UserManagement({ currentUserId, onToast }: Props) {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<UserAdmin | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserAdmin | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'X-User-Id': currentUserId },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (user: UserAdmin) => {
    if (user.id === currentUserId) return;
    const action = user.is_active ? '無効化' : '有効化';
    if (!confirm(`${user.display_name} を${action}しますか？`)) return;

    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'X-User-Id': currentUserId },
      });
      if (res.ok) {
        onToast(`${user.display_name} を${action}しました`);
        fetchUsers();
      } else {
        const data = await res.json();
        onToast(data.error || `${action}に失敗しました`);
      }
    } catch {
      onToast('サーバーに接続できません');
    } finally {
      setTogglingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setEditUser(null);
    onToast(editUser ? 'ユーザーを更新しました' : 'ユーザーを作成しました');
    fetchUsers();
  };

  const handleResetSuccess = () => {
    setResetTarget(null);
    onToast('パスワードをリセットしました');
  };

  const formatDate = (ts: string) => {
    const n = Number(ts);
    if (!n) return '-';
    const d = new Date(n);
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
  };

  return (
    <div className="page">
      <div className="page-actions">
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <FaUserPlus /> 新規ユーザー
        </button>
      </div>

      <div className="count-bar">
        <span className="count-bar-label">{users.length}件</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>メールアドレス</th>
              <th>表示名</th>
              <th>ロール</th>
              <th>状態</th>
              <th>作成日</th>
              <th style={{ width: 200 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>読み込み中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>ユーザーが見つかりません</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                <td style={{ fontSize: 13 }}>{u.email}</td>
                <td>{u.display_name}</td>
                <td>
                  <span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'manager' ? 'warning' : 'info'}`} style={{ whiteSpace: 'nowrap' }}>
                    {ROLE_ICONS[u.role]}{ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-success' : 'badge-secondary'}`}>
                    {u.is_active ? '有効' : '無効'}
                  </span>
                </td>
                <td>{formatDate(u.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-sm"
                      title="編集"
                      onClick={() => setEditUser(u)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn btn-sm"
                      title="パスワードリセット"
                      onClick={() => setResetTarget(u)}
                    >
                      <FaKey />
                    </button>
                    {u.id !== currentUserId && (
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-warning' : 'btn-success'}`}
                        title={u.is_active ? '無効化' : '有効化'}
                        onClick={() => handleToggleActive(u)}
                        disabled={togglingId === u.id}
                      >
                        {u.is_active ? <FaToggleOff /> : <FaToggleOn />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showCreateModal || editUser) && (
        <UserFormModal
          user={editUser}
          currentUserId={currentUserId}
          onClose={() => { setShowCreateModal(false); setEditUser(null); }}
          onSuccess={handleFormSuccess}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          targetUserId={resetTarget.id}
          targetDisplayName={resetTarget.display_name}
          currentUserId={currentUserId}
          onClose={() => setResetTarget(null)}
          onSuccess={handleResetSuccess}
        />
      )}
    </div>
  );
}
