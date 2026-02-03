-- Create database
CREATE DATABASE IF NOT EXISTS job_scheduler;
USE job_scheduler;

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  taskName VARCHAR(255) NOT NULL,
  payload JSON,
  priority ENUM('Low', 'Medium', 'High') NOT NULL,
  status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completedAt TIMESTAMP NULL,
  webhookSent BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX idx_status ON jobs(status);
CREATE INDEX idx_priority ON jobs(priority);
CREATE INDEX idx_createdAt ON jobs(createdAt);

-- Insert sample data
INSERT INTO jobs (taskName, payload, priority, status) VALUES
('Send Email', '{"email": "user@example.com", "subject": "Welcome"}', 'High', 'pending'),
('Generate Report', '{"reportType": "monthly", "format": "pdf"}', 'Medium', 'completed'),
('Data Sync', '{"source": "API", "target": "Database"}', 'Low', 'pending'),
('Backup Database', '{"database": "production", "type": "full"}', 'High', 'running');