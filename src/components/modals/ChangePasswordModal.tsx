'use client';

import React, { useState, FormEvent } from 'react';
import { FaLock, FaTimes } from 'react-icons/fa';

interface Props {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ userId, onClose, onSuccess }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }
    if (newPassword.length < 4) {
      setError('パスワードは4文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'パスワード変更に失敗しました');
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
          <h2><FaLock style={{ marginRight: 8 }} />パスワード変更</h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>現在のパスワード</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="現在のパスワードを入力"
                required
                disabled={loading}
                autoFocus
              />
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
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
              {loading ? '変更中...' : '変更する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
