'use client';

import React, { useState, FormEvent } from 'react';
import { FaUserPlus, FaUserEdit, FaTimes } from 'react-icons/fa';
import type { UserAdmin } from '@/lib/types';

interface Props {
  user: UserAdmin | null; // null = 新規作成
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserFormModal({ user, currentUserId, onClose, onSuccess }: Props) {
  const isEdit = !!user;
  const [email, setEmail] = useState(user?.email ?? '');
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [role, setRole] = useState(user?.role ?? 'user');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEdit) {
        const res = await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUserId,
          },
          body: JSON.stringify({ display_name: displayName, email, role }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || '更新に失敗しました');
          return;
        }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUserId,
          },
          body: JSON.stringify({
            email,
            display_name: displayName,
            role,
            password,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || '作成に失敗しました');
          return;
        }
      }
      onSuccess();
    } catch {
      setError('サーバーに接続できません');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isEdit
              ? <><FaUserEdit style={{ marginRight: 8 }} />ユーザー編集</>
              : <><FaUserPlus style={{ marginRight: 8 }} />新規ユーザー作成</>
            }
          </h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>メールアドレス <span style={{ color: '#ef4444', fontSize: 12 }}>※必須</span></label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@company.com"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="画面に表示される名前"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>ロール</label>
              <select value={role} onChange={e => setRole(e.target.value)} disabled={loading}>
                <option value="admin">管理者</option>
                <option value="manager">マネージャー</option>
                <option value="user">メンバー</option>
              </select>
            </div>
            {!isEdit && (
              <div className="form-group">
                <label>初期パスワード</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="4文字以上"
                  required
                  disabled={loading}
                />
              </div>
            )}
            {error && <div className="login-error"><span>{error}</span></div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose} disabled={loading}>キャンセル</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !email || !displayName || (!isEdit && !password)}
            >
              {loading ? '処理中...' : isEdit ? '更新する' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
