// StatsCards.js
import React from 'react';

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Jobs',
      value: stats.totalJobs,
      color: 'bg-blue-500',
      icon: '📊'
    },
    {
      title: 'Pending',
      value: stats.pendingJobs,
      color: 'bg-yellow-500',
      icon: '⏳'
    },
    {
      title: 'Running',
      value: stats.runningJobs,
      color: 'bg-blue-500',
      icon: '⚙️'
    },
    {
      title: 'Completed',
      value: stats.completedJobs,
      color: 'bg-green-500',
      icon: '✅'
    },
    {
      title: 'High Priority',
      value: stats.highPriority,
      color: 'bg-red-500',
      icon: '🔥'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${card.color} h-2 rounded-full`}
                style={{ width: `${(card.value / stats.totalJobs) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;