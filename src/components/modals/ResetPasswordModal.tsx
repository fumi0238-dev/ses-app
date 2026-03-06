'use client';

import React, { useState, FormEvent } from 'react';
import { FaKey, FaTimes } from 'react-icons/fa';

interface Props {
  targetUserId: string;
  targetDisplayName: string;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResetPasswordModal({ targetUserId, targetDisplayName, currentUserId, onClose, onSuccess }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    if (newPassword.length < 4) {
      setError('パスワードは4文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId,
        },
        body: JSON.stringify({ new_password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'パスワードリセットに失敗しました');
        return;
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
          <h2><FaKey style={{ marginRight: 8 }} />パスワードリセット</h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>対象ユーザー</label>
              <input type="text" value={targetDisplayName} disabled />
            </div>
            <div className="form-group">
              <label>新しいパスワード</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="4文字以上"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>新しいパスワード（確認）</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="もう一度入力"
                required
                disabled={loading}
              />
            </div>
            {error && <div className="login-error"><span>{error}</span></div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose} disabled={loading}>キャンセル</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? 'リセット中...' : 'リセットする'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
