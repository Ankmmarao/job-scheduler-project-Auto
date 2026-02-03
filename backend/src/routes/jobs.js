const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Create a new job
router.post('/', jobController.createJob);

// Get all jobs with optional filtering
router.get('/', jobController.getAllJobs);

// Get single job by ID
router.get('/:id', jobController.getJobById);

// Run a job
router.post('/:id/run', jobController.runJob);

// Update job status
router.patch('/:id/status', jobController.updateStatus);

// Delete a job
router.delete('/:id', jobController.deleteJob);

// Get job statistics
router.get('/stats/dashboard', jobController.getDashboardStats);

module.exports = router;