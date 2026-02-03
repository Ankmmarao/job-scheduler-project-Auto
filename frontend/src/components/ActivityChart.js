import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ActivityChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Job Activity (Last 7 Days)</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No activity data available</p>
        </div>
      </div>
    );
  }

  // Transform data for chart
  const chartData = data.reduce((acc, item) => {
    const existingDay = acc.find(d => d.date === item.date);
    if (existingDay) {
      existingDay[item.status] = (existingDay[item.status] || 0) + item.count;
    } else {
      const newDay = { date: item.date };
      newDay[item.status] = item.count;
      acc.push(newDay);
    }
    return acc;
  }, []);

  // Sort by date
  chartData.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Format dates
  chartData.forEach(item => {
    const date = new Date(item.date);
    item.formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const colors = {
    pending: '#f59e0b',
    running: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Job Activity (Last 7 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="formattedDate" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="pending" 
              name="Pending" 
              stroke={colors.pending}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="running" 
              name="Running" 
              stroke={colors.running}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              name="Completed" 
              stroke={colors.completed}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="failed" 
              name="Failed" 
              stroke={colors.failed}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityChart;