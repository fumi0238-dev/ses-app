'use client';

import React, { useState, FormEvent } from 'react';
import { FaBolt, FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../lib/auth-context';

export default function Login() {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <FaBolt style={{ color: '#fbbf24', fontSize: 32 }} />
          <span className="login-title">ReForce SES</span>
        </div>
        <p className="login-subtitle">案件マッチング管理システム</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <FaUser className="login-field-icon" />
            <input
              type="text"
              placeholder="ユーザー名"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="login-field">
            <FaLock className="login-field-icon" />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading || !username || !password}
          >
            {loading ? 'ログイン中...' : (
              <>
                <FaSignInAlt />
                ログイン
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
