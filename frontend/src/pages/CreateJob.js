import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobApi } from '../services/api';
import toast from 'react-hot-toast';

const CreateJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    taskName: '',
    priority: 'Medium',
    payload: '{}'
  });
  const [payloadError, setPayloadError] = useState('');

  const priorities = [
    { value: 'Low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'High', label: 'High', color: 'bg-red-100 text-red-800' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate JSON when payload changes
    if (name === 'payload') {
      try {
        if (value.trim()) {
          JSON.parse(value);
          setPayloadError('');
        } else {
          setPayloadError('');
        }
      } catch (error) {
        setPayloadError('Invalid JSON format: ' + error.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.taskName.trim()) {
      toast.error('Task name is required');
      return;
    }
    
    if (payloadError) {
      toast.error('Please fix JSON errors');
      return;
    }
    
    try {
      setLoading(true);
      
      let payloadData = {};
      if (formData.payload.trim()) {
        try {
          payloadData = JSON.parse(formData.payload);
        } catch (error) {
          toast.error('Invalid JSON in payload');
          return;
        }
      }
      
      const jobData = {
        taskName: formData.taskName,
        priority: formData.priority,
        payload: payloadData
      };
      
      console.log('Sending job data:', jobData);
      
      const result = await jobApi.createJob(jobData);
      console.log('Create job response:', result);
      
      toast.success('Job created successfully!');
      
      // Clear form
      setFormData({
        taskName: '',
        priority: 'Medium',
        payload: '{}'
      });
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(error.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Job</h1>
        <p className="text-gray-600 mt-2">Schedule a new background task</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Name *
            </label>
            <input
              type="text"
              name="taskName"
              value={formData.taskName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Send Email, Generate Report"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex space-x-4">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg border transition ${
                    formData.priority === priority.value
                      ? `${priority.color} border-transparent`
                      : 'border-gray-300 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Payload (JSON) - Optional
              </label>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      payload: JSON.stringify({ 
                        email: "user@example.com",
                        subject: "Test Email",
                        body: "This is a test email" 
                      }, null, 2) 
                    }));
                    setPayloadError('');
                  }}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Email Example
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      payload: JSON.stringify({ 
                        reportType: "monthly",
                        format: "pdf",
                        dateRange: "2024-01-01 to 2024-01-31"
                      }, null, 2) 
                    }));
                    setPayloadError('');
                  }}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Report Example
                </button>
              </div>
            </div>
            <textarea
              name="payload"
              value={formData.payload}
              onChange={handleChange}
              rows="6"
              disabled={loading}
              className={`w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                payloadError ? 'border-red-300' : 'border-gray-300'
              } ${loading ? 'bg-gray-50' : ''}`}
              placeholder='{"key": "value"} or leave empty for {}'
            />
            {payloadError && (
              <p className="mt-1 text-sm text-red-600">{payloadError}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Optional JSON data that will be passed to the job when it runs
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Tip</h3>
            <p className="text-sm text-blue-700">
              After creating a job, go to the dashboard and click "Run" to execute it.
              The job will process for 3 seconds and then complete automatically.
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!payloadError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;