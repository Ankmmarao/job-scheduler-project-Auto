import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState(null);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setJob(data);
      
      // Try to fetch webhook info
      try {
        const webhookResponse = await fetch('/api/jobs/stats/dashboard');
        if (webhookResponse.ok) {
          const webhookData = await webhookResponse.json();
          setWebhookInfo(webhookData.webhookInfo);
        }
      } catch (webhookError) {
        console.log('Webhook info not available');
      }
      
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleRunJob = async () => {
    if (!window.confirm(`Run job "${job?.taskName}"? It will process for 3 seconds and trigger a webhook.`)) return;
    
    try {
      toast.loading(`Starting job: ${job.taskName}...`);
      
      const response = await fetch(`/api/jobs/${id}/run`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to run job');
      }
      
      const result = await response.json();
      
      toast.dismiss();
      toast.success(`Job started! Will complete in 3 seconds with webhook.`);
      
      // Update job status immediately
      setJob(prev => prev ? { ...prev, status: 'running', updatedAt: new Date().toISOString() } : null);
      setRefreshing(true);
      
      // Refresh after 1 second to show running status
      setTimeout(() => {
        fetchJob();
      }, 1000);
      
      // Refresh again after completion (3 seconds + buffer)
      setTimeout(() => {
        fetchJob();
        setRefreshing(false);
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

  const handleDeleteJob = async () => {
    if (!window.confirm(`Are you sure you want to delete "${job?.taskName}"? This action cannot be undone.`)) return;
    
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
      
      toast.success(`Job "${job?.taskName}" deleted successfully`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to delete job');
    }
  };

  const handleTestWebhook = async () => {
    try {
      toast.loading('Sending test webhook...');
      
      const response = await fetch('/api/test-webhook', {
        method: 'POST'
      });
      
      const data = await response.json();
      toast.dismiss();
      
      if (data.success) {
        toast.success('✅ Test webhook sent successfully!');
      } else {
        toast.error(`Webhook test failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to send test webhook');
    }
  };

  const handleResendWebhook = async () => {
    if (!job) return;
    
    try {
      toast.loading('Resending webhook...');
      
      const webhookData = {
        event: 'job.completed.retry',
        timestamp: new Date().toISOString(),
        job: {
          id: job.id,
          taskName: job.taskName,
          priority: job.priority,
          status: job.status,
          payload: job.payload,
          createdAt: job.createdAt,
          completedAt: job.completedAt
        }
      };
      
      const response = await fetch(webhookInfo?.url || 'https://webhook.site/your-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });
      
      toast.dismiss();
      if (response.ok) {
        toast.success('✅ Webhook resent successfully!');
        // Update job to show webhook was sent
        setJob(prev => prev ? { ...prev, webhookSent: true } : null);
      } else {
        toast.error('Failed to resend webhook');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Error resending webhook');
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-800 mb-8 flex items-center"
        >
          ← Back to Dashboard
        </button>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Navigation */}
      <button
        onClick={() => navigate('/dashboard')}
        className="text-blue-600 hover:text-blue-800 mb-6 flex items-center"
      >
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getStatusIcon(job.status)}</span>
            <h1 className="text-3xl font-bold text-gray-900">{job.taskName}</h1>
          </div>
          <p className="text-gray-600 mt-2">Job ID: #{job.id}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRunJob}
            disabled={job.status !== 'pending' || refreshing}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
              job.status === 'pending' && !refreshing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {refreshing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <span className="mr-2">▶️</span>
                Run Job
              </>
            )}
          </button>
          <button
            onClick={handleDeleteJob}
            className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center"
          >
            <span className="mr-2">🗑️</span>
            Delete
          </button>
          <button
            onClick={handleTestWebhook}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
          >
            <span className="mr-2">🔗</span>
            Test Webhook
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Status</h3>
            {refreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            )}
          </div>
          <div className="flex items-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
              {getStatusIcon(job.status)} {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Current State</p>
              {job.status === 'pending' && (
                <p className="text-xs text-yellow-600 mt-1">Ready to run</p>
              )}
              {job.status === 'running' && (
                <p className="text-xs text-blue-600 mt-1">Processing... (3 seconds)</p>
              )}
              {job.status === 'completed' && (
                <p className="text-xs text-green-600 mt-1">✓ Successfully completed</p>
              )}
              {job.status === 'failed' && (
                <p className="text-xs text-red-600 mt-1">❌ Failed to complete</p>
              )}
            </div>
          </div>
        </div>

        {/* Priority Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Priority</h3>
          <div className="flex items-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getPriorityColor(job.priority)}`}>
              {job.priority === 'High' ? '🔥 ' : ''}
              {job.priority}
            </span>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Importance Level</p>
              {job.priority === 'High' && (
                <p className="text-xs text-red-600 mt-1">Urgent - Process first</p>
              )}
              {job.priority === 'Medium' && (
                <p className="text-xs text-yellow-600 mt-1">Standard priority</p>
              )}
              {job.priority === 'Low' && (
                <p className="text-xs text-green-600 mt-1">Low priority</p>
              )}
            </div>
          </div>
        </div>

        {/* Timestamps Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Timeline</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium">{formatDate(job.createdAt)}</p>
              <p className="text-xs text-gray-400">{formatRelativeTime(job.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-sm font-medium">{formatDate(job.updatedAt)}</p>
              <p className="text-xs text-gray-400">{formatRelativeTime(job.updatedAt)}</p>
            </div>
            {job.completedAt && (
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-sm font-medium text-green-600">{formatDate(job.completedAt)}</p>
                <p className="text-xs text-gray-400">{formatRelativeTime(job.completedAt)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webhook Status Card */}
      {job.status === 'completed' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <span className="mr-2">🔗</span>
              Webhook Status
            </h3>
            {!job.webhookSent && (
              <button
                onClick={handleResendWebhook}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
              >
                Resend Webhook
              </button>
            )}
          </div>
          
          <div className={`p-4 rounded-lg ${job.webhookSent ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-full mr-3 ${job.webhookSent ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <span className={`text-lg ${job.webhookSent ? 'text-green-600' : 'text-yellow-600'}`}>
                  {job.webhookSent ? '✅' : '⏳'}
                </span>
              </div>
              <div>
                <p className={`font-medium ${job.webhookSent ? 'text-green-800' : 'text-yellow-800'}`}>
                  {job.webhookSent ? 'Webhook sent successfully' : 'Webhook pending'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {job.webhookSent 
                    ? 'Notification was sent to the webhook endpoint upon job completion.'
                    : 'Webhook will be sent when this job completes.'
                  }
                </p>
              </div>
            </div>
          </div>

          {webhookInfo && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Webhook URL:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{webhookInfo.url}</code>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This URL receives a POST request with job data when the job completes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payload Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Payload Data</h3>
          {job.payload && Object.keys(job.payload).length > 0 && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(job.payload, null, 2));
                toast.success('Payload copied to clipboard!');
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition flex items-center"
            >
              <span className="mr-1">📋</span>
              Copy JSON
            </button>
          )}
        </div>
        
        {job.payload && Object.keys(job.payload).length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-800 font-mono">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-3xl mb-3">📄</div>
            <p className="text-gray-500">No payload data provided</p>
            <p className="text-sm text-gray-400 mt-2">
              This job doesn't require any additional data. Payload will be sent to webhook.
            </p>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">ℹ️ Note:</span> This JSON data is passed to the job when it runs 
            and sent to the webhook endpoint upon completion.
          </p>
        </div>
      </div>

      {/* Action Instructions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">🚀 Available Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <span className="text-blue-600">▶️</span>
              </div>
              <h4 className="font-medium text-gray-800">Run Job</h4>
            </div>
            <p className="text-sm text-gray-600">
              Execute this job. It will process for 3 seconds, then:
              <ul className="mt-2 space-y-1 text-xs text-gray-500">
                <li>• Status changes to "completed"</li>
                <li>• Webhook is automatically triggered</li>
                <li>• Job details are updated</li>
              </ul>
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <span className="text-purple-600">🔗</span>
              </div>
              <h4 className="font-medium text-gray-800">Webhook</h4>
            </div>
            <p className="text-sm text-gray-600">
              When job completes, a POST request is sent to:
              <code className="block mt-1 bg-gray-100 px-2 py-1 rounded text-xs truncate">
                {webhookInfo?.url || 'Configured webhook URL'}
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-3 flex items-center">
          <span className="mr-2">🔧</span>
          Debug Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div>
              <span className="text-gray-500">Job ID:</span>
              <span className="ml-2 font-mono font-medium">{job.id}</span>
            </div>
            <div>
              <span className="text-gray-500">API Endpoint:</span>
              <span className="ml-2 font-mono">/api/jobs/{job.id}</span>
            </div>
            <div>
              <span className="text-gray-500">Backend Status:</span>
              <span className="ml-2 text-green-600 font-medium">✓ Connected</span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-gray-500">Payload Size:</span>
              <span className="ml-2">
                {job.payload ? JSON.stringify(job.payload).length : 0} characters
              </span>
            </div>
            <div>
              <span className="text-gray-500">Webhook Status:</span>
              <span className={`ml-2 font-medium ${job.webhookSent ? 'text-green-600' : 'text-yellow-600'}`}>
                {job.webhookSent ? 'Sent' : 'Pending'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Last Fetched:</span>
              <span className="ml-2">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;