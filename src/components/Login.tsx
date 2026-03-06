'use client';

import React, { useState, FormEvent } from 'react';
import { FaBolt, FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../lib/auth-context';

export default function Login() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(email, password);
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
            <FaEnvelope className="login-field-icon" />
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
            disabled={loading || !email || !password}
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
