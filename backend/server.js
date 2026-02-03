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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhookUrl: WEBHOOK_URL
  });
});

// GET all jobs
app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

// GET single job
app.get('/api/jobs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const job = jobs.find(j => j.id === id);
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

// POST create job
app.post('/api/jobs', (req, res) => {
  const { taskName, priority = 'Medium', payload = {} } = req.body;
  
  if (!taskName) {
    return res.status(400).json({ error: 'Task name is required' });
  }
  
  const newJob = {
    id: jobs.length > 0 ? Math.max(...jobs.map(j => j.id)) + 1 : 1,
    taskName,
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
  res.status(201).json(newJob);
});

// POST run job (with webhook trigger)
app.post('/api/jobs/:id/run', (req, res) => {
  const id = parseInt(req.params.id);
  const jobIndex = jobs.findIndex(j => j.id === id);
  
  if (jobIndex === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const job = jobs[jobIndex];
  
  if (job.status !== 'pending') {
    return res.status(400).json({ 
      error: `Job cannot be run. Current status: ${job.status}` 
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
    message: 'Job started successfully',
    jobId: id,
    taskName: job.taskName,
    estimatedCompletion: '3 seconds',
    note: 'Webhook will be triggered upon completion'
  });
});

// Test webhook endpoint
app.post('/api/test-webhook', async (req, res) => {
  try {
    const testData = {
      event: 'test',
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook from Job Scheduler',
      job: {
        id: 999,
        taskName: 'Test Job',
        status: 'completed'
      }
    };
    
    const response = await axios.post(WEBHOOK_URL, testData);
    res.json({ 
      success: true, 
      status: response.status,
      message: 'Test webhook sent successfully',
      webhookUrl: WEBHOOK_URL
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      webhookUrl: WEBHOOK_URL
    });
  }
});

// DELETE job
app.delete('/api/jobs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = jobs.length;
  jobs = jobs.filter(j => j.id !== id);
  
  if (jobs.length === initialLength) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  console.log(`🗑️  Deleted job ${id}`);
  res.json({ message: 'Job deleted successfully' });
});

// Dashboard stats
app.get('/api/jobs/stats/dashboard', (req, res) => {
  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const runningJobs = jobs.filter(j => j.status === 'running').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const webhooksSent = jobs.filter(j => j.webhookSent).length;
  
  res.json({
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
      testEndpoint: '/api/test-webhook'
    }
  });
});

// Get webhook logs
app.get('/api/webhook-logs', (req, res) => {
  const logs = jobs.map(job => ({
    id: job.id,
    taskName: job.taskName,
    status: job.status,
    webhookSent: job.webhookSent,
    completedAt: job.completedAt,
    lastUpdated: job.updatedAt
  }));
  
  res.json({
    totalJobs: jobs.length,
    webhooksSent: jobs.filter(j => j.webhookSent).length,
    logs
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=========================================');
  console.log('🚀 JOB SCHEDULER BACKEND STARTED');
  console.log('=========================================');
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📁 Jobs API: http://localhost:${PORT}/api/jobs`);
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`🧪 Test Webhook: http://localhost:${PORT}/api/test-webhook`);
  console.log('=========================================');
  console.log('✅ Webhook feature enabled');
  console.log('✅ Run Job functionality enabled');
  console.log('=========================================');
});