import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  // In your fetchData function, update:
const fetchData = async () => {
  try {
    setLoading(true);
    
    // Fetch jobs
    const response = await fetch('/api/jobs');
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle new response structure
    if (data.success && data.jobs) {
      setJobs(data.jobs);  // <-- Access data.jobs
    } else if (Array.isArray(data)) {
      setJobs(data);  // Fallback for old structure
    } else {
      console.warn('Unexpected API response:', data);
      setJobs([]);
    }
    
    // Try to fetch stats
    try {
      const statsResponse = await fetch('/api/jobs/stats/dashboard');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (statsError) {
      console.log('Stats endpoint not available');
    }
    
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Failed to load data. Check if backend is running');
    setJobs([]);
  } finally {
    setLoading(false);
  }
};

  const handleCreateJob = () => {
    navigate('/jobs/create');
  };

  const handleRunJob = async (jobId, taskName) => {
    try {
      toast.loading(`Starting job: ${taskName}...`);
      
      const response = await fetch(`/api/jobs/${jobId}/run`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to run job');
      }
      
      const result = await response.json();
      
      toast.dismiss();
      toast.success(`Job "${taskName}" started! Will complete in 3 seconds with webhook.`);
      
      // Refresh after 1 second to show running status
      setTimeout(() => {
        fetchData();
      }, 1000);
      
      // Refresh again after completion
      setTimeout(() => {
        fetchData();
        toast('✅ Job completed! Webhook sent.', {
          icon: '🔗',
          duration: 4000,
        });
      }, 4000);
      
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Failed to run job');
    }
  };

  const handleDeleteJob = async (jobId, taskName) => {
    if (!window.confirm(`Are you sure you want to delete job "${taskName}"?`)) return;
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
      
      toast.success(`Job "${taskName}" deleted successfully`);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete job');
    }
  };

  const handleViewDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleTestWebhook = async () => {
    try {
      toast.loading('Testing webhook connection...');
      
      const response = await fetch('/api/test-webhook', {
        method: 'POST'
      });
      
      const data = await response.json();
      toast.dismiss();
      
      if (data.success) {
        toast.success('✅ Webhook test successful! Check webhook.site');
      } else {
        toast.error(`Webhook test failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to test webhook. Check backend connection.');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value === 'all' ? '' : value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '📄';
    }
  };

  // Filter jobs based on selected filters
  const filteredJobs = jobs.filter(job => {
    if (filters.status && job.status !== filters.status) return false;
    if (filters.priority && job.priority !== filters.priority) return false;
    return true;
  });

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your automated jobs with webhooks</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestWebhook}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
          >
            <span className="mr-2">🔗</span>
            Test Webhook
          </button>
          <button
            onClick={handleCreateJob}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <span className="mr-2">+</span>
            Create New Job
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <span className="text-blue-600 text-lg">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Jobs</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {stats?.overview?.totalJobs || jobs.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <span className="text-yellow-600 text-lg">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl md:text-2xl font-bold text-yellow-600">
                {stats?.overview?.pendingJobs || 
                 jobs.filter(job => job.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <span className="text-blue-600 text-lg">⚙️</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Running</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">
                {stats?.overview?.runningJobs || 
                 jobs.filter(job => job.status === 'running').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <span className="text-green-600 text-lg">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                {stats?.overview?.completedJobs || 
                 jobs.filter(job => job.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <span className="text-purple-600 text-lg">🔗</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Webhooks</p>
              <p className="text-xl md:text-2xl font-bold text-purple-600">
                {stats?.overview?.webhooksSent || 
                 jobs.filter(job => job.webhookSent).length}
              </p>
              <p className="text-xs text-gray-400">Sent successfully</p>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Info */}
      {stats?.webhookInfo && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h3 className="font-medium text-purple-800 flex items-center">
                <span className="mr-2">🔗</span>
                Webhook Configuration
              </h3>
              <p className="text-sm text-purple-600 mt-1">
                URL: <code className="bg-purple-100 px-2 py-1 rounded">{stats.webhookInfo.url}</code>
              </p>
            </div>
            <div className="mt-3 md:mt-0">
              <button
                onClick={handleTestWebhook}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              >
                Test Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-gray-700">Filter Jobs</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="running">⚙️ Running</option>
                <option value="completed">✅ Completed</option>
                <option value="failed">❌ Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="High">🔥 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', priority: '' })}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        {(filters.status || filters.priority) && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </div>
        )}
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800">All Jobs</h2>
            <div className="flex space-x-3">
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center"
              >
                <span className="mr-2">🔄</span>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No jobs found</p>
            {jobs.length === 0 ? (
              <p className="text-gray-400 text-sm mt-2">
                Create your first job to get started
              </p>
            ) : (
              <p className="text-gray-400 text-sm mt-2">
                No jobs match your filters
              </p>
            )}
            <button
              onClick={handleCreateJob}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mt-4"
            >
              Create Your First Job
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Webhook
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="text-lg mr-3">{getStatusIcon(job.status)}</div>
                        <div>
                          <div className="font-medium text-gray-900">{job.taskName}</div>
                          <div className="text-sm text-gray-500">ID: {job.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {job.status === 'completed' ? (
                        <span className={`flex items-center ${job.webhookSent ? 'text-green-600' : 'text-yellow-600'}`}>
                          {job.webhookSent ? '✅ Sent' : '⏳ Pending'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRunJob(job.id, job.taskName)}
                          disabled={job.status !== 'pending'}
                          title={job.status === 'pending' ? 'Run this job' : `Job is ${job.status}`}
                          className={`px-3 py-1 text-sm rounded transition ${
                            job.status === 'pending'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Run
                        </button>
                        <button
                          onClick={() => handleViewDetails(job.id)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                          title="View job details"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id, job.taskName)}
                          className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                          title="Delete job"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Backend Status:</span>
            <span className={`ml-2 font-medium ${jobs.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {jobs.length > 0 ? '✅ Connected' : '❌ Disconnected'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">API URL:</span>
            <span className="ml-2 font-mono">http://localhost:5000</span>
          </div>
          <div>
            <span className="text-gray-500">Total Jobs Loaded:</span>
            <span className="ml-2 font-medium">{jobs.length}</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          <p>💡 Tip: Create a job, then click "Run" to see webhook functionality in action.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;