'use client';

import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle } from 'react-icons/fa';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

function getToastType(msg: string): 'success' | 'error' | 'warning' {
  if (/エラー|失敗|できません/.test(msg)) return 'error';
  if (/注意|警告/.test(msg)) return 'warning';
  return 'success';
}

export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const type = getToastType(message);
  const Icon = type === 'error' ? FaExclamationCircle : type === 'warning' ? FaExclamationTriangle : FaCheckCircle;

  return (
    <div className="toast">
      <div className="toast-body">
        <Icon className={`toast-icon toast-${type}`} />
        <span>{message}</span>
      </div>
      <div className="toast-progress">
        <div className="toast-progress-bar" />
      </div>
    </div>
  );
}
