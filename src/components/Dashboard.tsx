'use client';

import React, { useEffect, useRef } from 'react';
import { FaBriefcase, FaUsers, FaHandshake, FaCheckCircle, FaClock, FaChartBar, FaChartPie, FaStream, FaInbox } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Project, Member, Matching, ActivityLog } from '../lib/types';
import { truncate, getActionIcon, formatStructuredPrice, formatDateStr } from '../lib/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface Props {
  projects: Project[];
  members: Member[];
  matchings: Matching[];
  activityLogs: ActivityLog[];
  onShowProject: (id: string) => void;
  onShowMember: (id: string) => void;
}

export default function Dashboard({ projects, members, matchings, activityLogs, onShowProject, onShowMember }: Props) {
  const openProjects = projects.filter(p => p.status === 'Open');
  const searchingMembers = members.filter(m => m.process === '案件検索中');
  const recentProjects = [...projects]
    .sort((a, b) => (b.added_date || '').localeCompare(a.added_date || ''))
    .slice(0, 8);

  // Chart data
  const statusCounts = { Open: 0, Closed: 0, Hold: 0 };
  projects.forEach(p => {
    if (p.status === 'Open' || p.status === 'Closed' || p.status === 'Hold') {
      statusCounts[p.status]++;
    }
  });

  const matchStatusCounts: Record<string, number> = {};
  matchings.forEach(mt => {
    matchStatusCounts[mt.status] = (matchStatusCounts[mt.status] || 0) + 1;
  });

  const barData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      label: '件数',
      data: Object.values(statusCounts),
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
      borderRadius: 6,
      maxBarThickness: 60,
    }],
  };

  const doughnutData = {
    labels: Object.keys(matchStatusCounts),
    datasets: [{
      data: Object.values(matchStatusCounts),
      backgroundColor: ['#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#10b981', '#065f46', '#ef4444'],
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  return (
    <div className="page">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FaBriefcase /></div>
          <div className="stat-info">
            <span className="stat-value">{openProjects.length}</span>
            <span className="stat-label">Open案件</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaUsers /></div>
          <div className="stat-info">
            <span className="stat-value">{members.length}</span>
            <span className="stat-label">要員数</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FaHandshake /></div>
          <div className="stat-info">
            <span className="stat-value">{matchings.length}</span>
            <span className="stat-label">マッチング</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FaCheckCircle /></div>
          <div className="stat-info">
            <span className="stat-value">{openProjects.filter(p => p.shareable === 'OK').length}</span>
            <span className="stat-label">共有可能案件</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3><FaClock /> 最近追加された案件</h3>
          </div>
          <div className="card-body">
            <div className="recent-list">
              {recentProjects.length === 0
                ? <div className="empty-state"><div className="empty-state-icon"><FaInbox /></div><p>案件データがありません</p></div>
                : recentProjects.map(p => (
                  <div key={p.id} className="recent-item" onClick={() => onShowProject(p.id)}>
                    <span className="recent-item-name">{truncate(p.project_name_rewrite || p.project_name_original, 40)}</span>
                    <span className="recent-item-meta">{formatDateStr(p.added_date)}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3><FaUsers /> 案件検索中の要員</h3>
          </div>
          <div className="card-body">
            <div className="recent-list">
              {searchingMembers.length === 0
                ? <div className="empty-state"><div className="empty-state-icon"><FaUsers /></div><p>検索中の要員がいません</p></div>
                : searchingMembers.map(m => (
                  <div key={m.id} className="recent-item" onClick={() => onShowMember(m.id)}>
                    <span className="recent-item-name">{m.full_name || m.initial} - {m.desired_position || '-'}</span>
                    <span className="recent-item-meta">{formatStructuredPrice(m.desired_price_min, m.desired_price_max) || m.desired_price || '-'}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid mt-20">
        <div className="card">
          <div className="card-header"><h3><FaChartBar /> 案件ステータス分布</h3></div>
          <div className="card-body">
            <div style={{ height: 250 }}>
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3><FaChartPie /> マッチング状況</h3></div>
          <div className="card-body">
            <div style={{ height: 250 }}>
              {Object.keys(matchStatusCounts).length > 0
                ? <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 12 } } } } }} />
                : <div className="empty-state"><div className="empty-state-icon"><FaHandshake /></div><p>マッチングデータがありません</p></div>
              }
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-20">
        <div className="card-header"><h3><FaStream /> アクティビティログ</h3></div>
        <div className="card-body">
          <div className="recent-list">
            {activityLogs.length === 0
              ? <div className="empty-state"><div className="empty-state-icon"><FaStream /></div><p>アクティビティがありません</p></div>
              : activityLogs.slice(0, 20).map(log => (
                <div key={log.id} className="recent-item" style={{ cursor: 'default' }}>
                  <span className="recent-item-name" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {log.user_name && (
                      <span className="activity-user-badge">{log.user_name}</span>
                    )}
                    <span>
                      {getActionIcon(log.action)} <strong>{log.action}</strong> {log.target_name || ''}
                      {log.detail ? <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}> - {log.detail}</span> : ''}
                    </span>
                  </span>
                  <span className="recent-item-meta">{log.timestamp}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
