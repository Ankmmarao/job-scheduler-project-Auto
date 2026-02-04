const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample jobs data with webhook tracking
let jobs = [
  { 
    id: 1, 
    taskName: 'Send Email', 
    priority: 'High', 
    status: 'pending', 
    payload: { email: "test@example.com", subject: "Welcome" },
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    webhookSent: false
  },
  { 
    id: 2, 
    taskName: 'Generate Report', 
    priority: 'Medium', 
    status: 'completed', 
    payload: { reportType: "monthly", format: "pdf" },
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000),
    completedAt: new Date(Date.now() - 86400000),
    webhookSent: true
  },
  { 
    id: 3, 
    taskName: 'Data Backup', 
    priority: 'Low', 
    status: 'pending', 
    payload: { database: "users", type: "incremental" },
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    webhookSent: false
  }
];

// Webhook URL from environment or default
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://webhook.site/292a3c06-12d1-4af7-ac92-14084ff2a5a7';

// Function to trigger webhook
async function triggerWebhook(job) {
  try {
    const webhookData = {
      event: 'job.completed',
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

    console.log(`📤 Sending webhook for job ${job.id}...`);
    const response = await axios.post(WEBHOOK_URL, webhookData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`✅ Webhook sent successfully for job ${job.id}:`, response.status);
    return true;
  } catch (error) {
    console.error(`❌ Webhook failed for job ${job.id}:`, error.message);
    return false;
  }
}

// ==================== ROUTES ====================

// 1. ROOT ROUTE - Welcome page
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Job Scheduler API',
    version: '1.0.0',
    status: 'running',
    deployed: true,
    timestamp: new Date().toISOString(),
    liveUrl: 'https://job-scheduler-project-auto.onrender.com',
    endpoints: {
      health: 'GET /api/health',
      allJobs: 'GET /api/jobs',
      singleJob: 'GET /api/jobs/:id',
      createJob: 'POST /api/jobs',
      runJob: 'POST /api/jobs/:id/run',
      deleteJob: 'DELETE /api/jobs/:id',
      dashboardStats: 'GET /api/jobs/stats/dashboard',
      testWebhook: 'POST /api/test-webhook',
      webhookLogs: 'GET /api/webhook-logs'
    },
    quickLinks: {
      healthCheck: 'https://job-scheduler-project-auto.onrender.com/api/health',
      jobsAPI: 'https://job-scheduler-project-auto.onrender.com/api/jobs',
      testWebhook: 'https://job-scheduler-project-auto.onrender.com/api/test-webhook'
    },
    features: [
      'Job creation with priority levels',
      'Job execution with status tracking',
      'Automatic webhook triggers',
      'Real-time dashboard statistics',
      'JSON payload support'
    ],
    sampleJobs: jobs.slice(0, 2).map(job => ({
      id: job.id,
      taskName: job.taskName,
      status: job.status,
      priority: job.priority
    }))
  });
});

// 2. Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Job Scheduler API',
    version: '1.0.0',
    uptime: process.uptime(),
    webhookUrl: WEBHOOK_URL,
    totalJobs: jobs.length,
    memoryUsage: process.memoryUsage()
  });
});

// 3. GET all jobs
app.get('/api/jobs', (req, res) => {
  // Optional filtering
  const { status, priority } = req.query;
  let filteredJobs = [...jobs];
  
  if (status) {
    filteredJobs = filteredJobs.filter(job => job.status === status);
  }
  
  if (priority) {
    filteredJobs = filteredJobs.filter(job => job.priority === priority);
  }
  
  res.json({
    success: true,
    count: filteredJobs.length,
    total: jobs.length,
    jobs: filteredJobs
  });
});

// 4. GET single job
app.get('/api/jobs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const job = jobs.find(j => j.id === id);
  
  if (job) {
    res.json({
      success: true,
      job
    });
  } else {
    res.status(404).json({ 
      success: false,
      error: 'Job not found',
      message: `Job with ID ${id} does not exist`
    });
  }
});

// 5. POST create job
app.post('/api/jobs', (req, res) => {
  const { taskName, priority = 'Medium', payload = {} } = req.body;
  
  if (!taskName || taskName.trim() === '') {
    return res.status(400).json({ 
      success: false,
      error: 'Validation error',
      message: 'Task name is required'
    });
  }
  
  const validPriorities = ['Low', 'Medium', 'High'];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'Priority must be Low, Medium, or High'
    });
  }
  
  const newJob = {
    id: jobs.length > 0 ? Math.max(...jobs.map(j => j.id)) + 1 : 1,
    taskName: taskName.trim(),
    priority,
    status: 'pending',
    payload,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    webhookSent: false
  };
  
  jobs.push(newJob);
  console.log(`✅ Created new job: ${newJob.taskName} (ID: ${newJob.id})`);
  
  res.status(201).json({
    success: true,
    message: 'Job created successfully',
    job: newJob
  });
});

// 6. POST run job (with webhook trigger)
app.post('/api/jobs/:id/run', (req, res) => {
  const id = parseInt(req.params.id);
  const jobIndex = jobs.findIndex(j => j.id === id);
  
  if (jobIndex === -1) {
    return res.status(404).json({ 
      success: false,
      error: 'Job not found',
      message: `Job with ID ${id} does not exist`
    });
  }
  
  const job = jobs[jobIndex];
  
  if (job.status !== 'pending') {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid operation',
      message: `Job cannot be run. Current status: ${job.status}`
    });
  }
  
  // Update job status to running
  jobs[jobIndex].status = 'running';
  jobs[jobIndex].updatedAt = new Date();
  
  console.log(`▶️  Starting job ${id}: ${job.taskName}`);
  
  // Simulate background processing (3 seconds)
  setTimeout(async () => {
    try {
      // Update job status to completed
      jobs[jobIndex].status = 'completed';
      jobs[jobIndex].completedAt = new Date();
      jobs[jobIndex].updatedAt = new Date();
      
      console.log(`✅ Job ${id} completed successfully`);
      
      // Trigger webhook
      const webhookSuccess = await triggerWebhook(jobs[jobIndex]);
      jobs[jobIndex].webhookSent = webhookSuccess;
      
      console.log(`📊 Job ${id} stats:`);
      console.log(`   Status: ${jobs[jobIndex].status}`);
      console.log(`   Webhook sent: ${webhookSuccess ? 'Yes' : 'No'}`);
      console.log(`   Completion time: ${jobs[jobIndex].completedAt.toISOString()}`);
      
    } catch (error) {
      console.error(`❌ Job ${id} completion error:`, error);
      jobs[jobIndex].status = 'failed';
      jobs[jobIndex].updatedAt = new Date();
    }
  }, 3000);
  
  res.json({ 
    success: true,
    message: 'Job started successfully',
    data: {
      jobId: id,
      taskName: job.taskName,
      estimatedCompletion: '3 seconds',
      note: 'Webhook will be triggered upon completion'
    }
  });
});

// 7. DELETE job
app.delete('/api/jobs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = jobs.length;
  jobs = jobs.filter(j => j.id !== id);
  
  if (jobs.length === initialLength) {
    return res.status(404).json({ 
      success: false,
      error: 'Job not found',
      message: `Job with ID ${id} does not exist`
    });
  }
  
  console.log(`🗑️  Deleted job ${id}`);
  res.json({ 
    success: true,
    message: 'Job deleted successfully',
    deletedJobId: id
  });
});

// 8. Dashboard stats
app.get('/api/jobs/stats/dashboard', (req, res) => {
  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const runningJobs = jobs.filter(j => j.status === 'running').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const webhooksSent = jobs.filter(j => j.webhookSent).length;
  
  res.json({
    success: true,
    overview: {
      totalJobs,
      pendingJobs,
      runningJobs,
      completedJobs,
      failedJobs,
      webhooksSent,
      highPriority: jobs.filter(j => j.priority === 'High').length,
      mediumPriority: jobs.filter(j => j.priority === 'Medium').length,
      lowPriority: jobs.filter(j => j.priority === 'Low').length
    },
    recentJobs: jobs.slice(-5).reverse(),
    webhookInfo: {
      url: WEBHOOK_URL,
      testEndpoint: '/api/test-webhook',
      totalWebhooksSent: webhooksSent
    },
    systemInfo: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

// 9. Test webhook endpoint
app.post('/api/test-webhook', async (req, res) => {
  try {
    const testData = {
      event: 'test',
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook from Job Scheduler',
      job: {
        id: 999,
        taskName: 'Test Job',
        status: 'completed',
        priority: 'High',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      },
      system: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    const response = await axios.post(WEBHOOK_URL, testData);
    res.json({ 
      success: true, 
      message: 'Test webhook sent successfully',
      data: {
        status: response.status,
        webhookUrl: WEBHOOK_URL,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Webhook test failed',
      message: error.message,
      webhookUrl: WEBHOOK_URL
    });
  }
});

// 10. Get webhook logs
app.get('/api/webhook-logs', (req, res) => {
  const logs = jobs.map(job => ({
    id: job.id,
    taskName: job.taskName,
    status: job.status,
    webhookSent: job.webhookSent,
    completedAt: job.completedAt,
    lastUpdated: job.updatedAt,
    priority: job.priority
  }));
  
  res.json({
    success: true,
    totalJobs: jobs.length,
    webhooksSent: jobs.filter(j => j.webhookSent).length,
    logs: logs,
    summary: {
      jobsWithWebhooks: jobs.filter(j => j.webhookSent).length,
      jobsWithoutWebhooks: jobs.filter(j => !j.webhookSent && j.status === 'completed').length
    }
  });
});

// 11. Reset jobs (for testing)
app.post('/api/jobs/reset', (req, res) => {
  jobs = [
    { 
      id: 1, 
      taskName: 'Send Email', 
      priority: 'High', 
      status: 'pending', 
      payload: { email: "test@example.com", subject: "Welcome" },
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      webhookSent: false
    },
    { 
      id: 2, 
      taskName: 'Generate Report', 
      priority: 'Medium', 
      status: 'completed', 
      payload: { reportType: "monthly", format: "pdf" },
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(Date.now() - 86400000),
      webhookSent: true
    },
    { 
      id: 3, 
      taskName: 'Data Backup', 
      priority: 'Low', 
      status: 'pending', 
      payload: { database: "users", type: "incremental" },
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      webhookSent: false
    }
  ];
  
  res.json({
    success: true,
    message: 'Jobs reset to default',
    totalJobs: jobs.length
  });
});

// 12. 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/jobs',
      'GET /api/jobs/:id',
      'POST /api/jobs',
      'POST /api/jobs/:id/run',
      'DELETE /api/jobs/:id',
      'GET /api/jobs/stats/dashboard',
      'POST /api/test-webhook',
      'GET /api/webhook-logs',
      'POST /api/jobs/reset'
    ],
    documentation: 'Check the root route (GET /) for detailed API documentation'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=========================================');
  console.log('🚀 JOB SCHEDULER BACKEND STARTED');
  console.log('=========================================');
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Root Route: http://localhost:${PORT}/`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Jobs API: http://localhost:${PORT}/api/jobs`);
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`🧪 Test Webhook: http://localhost:${PORT}/api/test-webhook`);
  console.log('=========================================');
  console.log('✅ Root route enabled');
  console.log('✅ Webhook feature enabled');
  console.log('✅ Run Job functionality enabled');
  console.log('✅ 404 error handling enabled');
  console.log('=========================================');
});