const pool = require('../config/database');
const axios = require('axios');
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://webhook.site/your-unique-url';

class JobController {
  // Create a new job
  async createJob(req, res) {
    try {
      const { taskName, payload, priority = 'Medium' } = req.body;
      
      if (!taskName) {
        return res.status(400).json({ error: 'Task name is required' });
      }

      const validPriorities = ['Low', 'Medium', 'High'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }

      const [result] = await pool.execute(
        'INSERT INTO jobs (taskName, payload, priority, status) VALUES (?, ?, ?, ?)',
        [taskName, JSON.stringify(payload || {}), priority, 'pending']
      );

      const [job] = await pool.execute(
        'SELECT * FROM jobs WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(job[0]);
    } catch (error) {
      console.error('Create job error:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  }

  // Get all jobs with filtering
  async getAllJobs(req, res) {
    try {
      const { status, priority, page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = req.query;
      
      let query = 'SELECT * FROM jobs WHERE 1=1';
      const params = [];
      
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      
      if (priority) {
        query += ' AND priority = ?';
        params.push(priority);
      }
      
      // Validate sort column
      const validSortColumns = ['id', 'taskName', 'priority', 'status', 'createdAt', 'updatedAt'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      query += ` ORDER BY ${sortColumn} ${sortOrder}`;
      
      // Add pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const [jobs] = await pool.execute(query, params);
      
      // Get total count for pagination
      const countQuery = 'SELECT COUNT(*) as total FROM jobs WHERE 1=1';
      const countParams = [];
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      if (priority) {
        countQuery += ' AND priority = ?';
        countParams.push(priority);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      res.json({
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get jobs error:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }

  // Get single job by ID
  async getJobById(req, res) {
    try {
      const { id } = req.params;
      
      const [jobs] = await pool.execute(
        'SELECT * FROM jobs WHERE id = ?',
        [id]
      );
      
      if (jobs.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json(jobs[0]);
    } catch (error) {
      console.error('Get job error:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  }

  // Run a job
  async runJob(req, res) {
    try {
      const { id } = req.params;
      
      const [jobs] = await pool.execute(
        'SELECT * FROM jobs WHERE id = ?',
        [id]
      );
      
      if (jobs.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      const job = jobs[0];
      
      if (job.status !== 'pending') {
        return res.status(400).json({ error: 'Job can only be run from pending status' });
      }
      
      // Update status to running
      await pool.execute(
        'UPDATE jobs SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        ['running', id]
      );
      
      // Simulate background processing
      setTimeout(async () => {
        try {
          // Update status to completed
          await pool.execute(
            'UPDATE jobs SET status = ?, completedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            ['completed', id]
          );
          
          // Trigger webhook
          await this.triggerWebhook(id);
          
          console.log(`Job ${id} completed successfully`);
        } catch (error) {
          console.error('Job completion error:', error);
          // Update status to failed
          await pool.execute(
            'UPDATE jobs SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            ['failed', id]
          );
        }
      }, 3000); // Simulate 3 seconds of processing
      
      res.json({ 
        message: 'Job started successfully', 
        jobId: id,
        estimatedCompletion: '3 seconds'
      });
    } catch (error) {
      console.error('Run job error:', error);
      res.status(500).json({ error: 'Failed to run job' });
    }
  }

  // Trigger webhook
  async triggerWebhook(jobId) {
    try {
      const [jobs] = await pool.execute(
        'SELECT * FROM jobs WHERE id = ?',
        [jobId]
      );
      
      if (jobs.length === 0) return;
      
      const job = jobs[0];
      
      const webhookPayload = {
        event: 'job.completed',
        timestamp: new Date().toISOString(),
        job: {
          id: job.id,
          taskName: job.taskName,
          priority: job.priority,
          status: job.status,
          payload: job.payload ? JSON.parse(job.payload) : {},
          createdAt: job.createdAt,
          completedAt: job.completedAt
        }
      };
      
      const response = await axios.post(WEBHOOK_URL, webhookPayload, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Update webhook status
      await pool.execute(
        'UPDATE jobs SET webhookSent = TRUE WHERE id = ?',
        [jobId]
      );
      
      console.log(`Webhook sent for job ${jobId}:`, response.status);
    } catch (error) {
      console.error('Webhook error:', error.message);
      // Don't throw error, just log it
    }
  }

  // Update job status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['pending', 'running', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      
      const [result] = await pool.execute(
        'UPDATE jobs SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json({ message: 'Job status updated successfully' });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Failed to update job status' });
    }
  }

  // Delete a job
  async deleteJob(req, res) {
    try {
      const { id } = req.params;
      
      const [result] = await pool.execute(
        'DELETE FROM jobs WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      console.error('Delete job error:', error);
      res.status(500).json({ error: 'Failed to delete job' });
    }
  }

  // Get dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as totalJobs,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingJobs,
          SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as runningJobs,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedJobs,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedJobs,
          SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as highPriority,
          SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END) as mediumPriority,
          SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END) as lowPriority
        FROM jobs
      `);
      
      const [recentJobs] = await pool.execute(`
        SELECT * FROM jobs 
        ORDER BY updatedAt DESC 
        LIMIT 5
      `);
      
      const [activity] = await pool.execute(`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count,
          status
        FROM jobs 
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(createdAt), status
        ORDER BY date DESC
      `);
      
      res.json({
        overview: stats[0],
        recentJobs,
        activity
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  }
}

module.exports = new JobController();