const API_BASE_URL = 'http://localhost:5000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const jobApi = {
  // Create a new job
  createJob: async (jobData) => {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  // Get all jobs
  getJobs: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${API_BASE_URL}/jobs?${queryParams}` : `${API_BASE_URL}/jobs`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get single job
  getJob: async (id) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`);
    return handleResponse(response);
  },

  // Run a job
  runJob: async (id) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}/run`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  // Delete a job
  deleteJob: async (id) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/jobs/stats/dashboard`);
    return handleResponse(response);
  },
};