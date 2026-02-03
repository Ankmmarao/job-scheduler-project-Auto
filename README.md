# **Job Scheduler & Automation System** 🚀

A full-stack job scheduling and automation system with React frontend, Node.js backend, and webhook integration.

![Job Scheduler Dashboard](https://img.shields.io/badge/Job-Scheduler-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## **✨ Features**

### **📊 Dashboard**
- Real-time job monitoring with status tracking
- Filter jobs by status and priority
- Interactive statistics and charts
- Bulk actions for multiple jobs

### **🎯 Job Management**
- **Create Jobs**: Easy form with JSON payload support
- **Run Jobs**: One-click execution with progress tracking
- **Job Details**: Comprehensive view with webhook status
- **Delete Jobs**: Safe deletion with confirmation

### **🔗 Webhook Automation**
- Automatic webhook triggers on job completion
- Webhook status tracking (sent/failed)
- Manual webhook retry capability
- Test webhook endpoint

### **📈 Real-time Updates**
- Live status updates (Pending → Running → Completed)
- Auto-refresh on job execution
- Visual progress indicators
- Toast notifications

## **🛠️ Tech Stack**

### **Frontend**
- **React 18** - UI Library
- **React Router** - Navigation
- **React Hot Toast** - Notifications
- **Tailwind CSS** - Styling
- **Axios** - HTTP Client

### **Backend**
- **Node.js** - Runtime
- **Express** - Web Framework
- **MySQL** - Database
- **CORS** - Cross-Origin Resource Sharing
- **Axios** - HTTP Requests for webhooks

### **Database**
- **MySQL** with JSON support
- Optimized indexes for performance
- Automatic timestamps

## **🚀 Quick Start**

### **Prerequisites**
- Node.js 16+ and npm
- MySQL 8+
- Git

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/job-scheduler.git
cd job-scheduler
```

### **2. Backend Setup**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
# PORT=5000
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=yourpassword
# DB_NAME=job_scheduler
# WEBHOOK_URL=https://webhook.site/your-url

# Initialize database
mysql -u root -p < database/schema.sql

# Start backend
npm run dev
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
npm start
```

### **4. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

## **📁 Project Structure**

```
job-scheduler/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/jobController.js
│   │   ├── routes/jobs.js
│   │   └── server.js
│   ├── database/schema.sql
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js
│   │   │   ├── JobTable.js
│   │   │   └── StatsCards.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── JobDetails.js
│   │   │   └── CreateJob.js
│   │   ├── services/api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env
│
└── README.md
```

## **🔧 API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/jobs` | Get all jobs |
| GET | `/api/jobs/:id` | Get job by ID |
| POST | `/api/jobs` | Create new job |
| POST | `/api/jobs/:id/run` | Run a job |
| DELETE | `/api/jobs/:id` | Delete a job |
| GET | `/api/jobs/stats/dashboard` | Get dashboard statistics |
| POST | `/api/test-webhook` | Test webhook |

## **🎨 Job Status Flow**

```
[Create Job] → Pending → [Run Job] → Running → Completed → [Webhook Trigger]
     ↓                                          ↓
   View Details                              Webhook Sent
```

### **Status Definitions**
- **🟡 Pending**: Job created, waiting to run
- **🔵 Running**: Job currently executing
- **🟢 Completed**: Job finished successfully
- **🔴 Failed**: Job failed during execution

### **Priority Levels**
- **🔴 High**: Urgent tasks
- **🟡 Medium**: Standard priority
- **🟢 Low**: Background tasks

## **🔗 Webhook Configuration**

Webhooks are automatically triggered when jobs complete. Configure your webhook URL in `.env`:

```env
WEBHOOK_URL=https://webhook.site/your-unique-url
```

### **Webhook Payload Example**
```json
{
  "event": "job.completed",
  "timestamp": "2024-01-01T10:30:00Z",
  "job": {
    "id": 1,
    "taskName": "Send Email",
    "priority": "High",
    "status": "completed",
    "payload": {
      "email": "user@example.com"
    },
    "createdAt": "2024-01-01T10:25:00Z",
    "completedAt": "2024-01-01T10:30:00Z"
  }
}
```

## **📊 Database Schema**

```sql
CREATE TABLE jobs (
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
```

## **🚀 Deployment**

### **Backend (Render)**
```bash
1. Push code to GitHub
2. Go to render.com
3. Create Web Service
4. Connect GitHub repo
5. Configure: Node.js, Build: npm install, Start: node server.js
6. Add environment variables
7. Deploy
```

### **Frontend (Vercel)**
```bash
1. Update REACT_APP_API_URL in frontend/.env.production
2. Push to GitHub
3. Go to vercel.com
4. Import repository
5. Framework: Create React App
6. Add environment variables
7. Deploy
```

### **Environment Variables**
```env
# Backend (.env)
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=job_scheduler
WEBHOOK_URL=https://webhook.site/your-url

# Frontend (.env.production)
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

## **🧪 Testing**

### **1. Manual Testing**
```bash
# Test API endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/jobs

# Create a job
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"taskName":"Test Job","priority":"High"}'

# Run a job
curl -X POST http://localhost:5000/api/jobs/1/run
```

### **2. Test Webhook**
1. Go to [webhook.site](https://webhook.site)
2. Copy your unique URL
3. Update `.env` file
4. Create and run a job
5. Check webhook.site for incoming data

## **📱 Screenshots**

| Dashboard | Create Job | Job Details |
|-----------|------------|-------------|
| ![Dashboard](screenshots/dashboard.png) | ![Create Job](screenshots/create-job.png) | ![Job Details](screenshots/job-details.png) |

## **🔍 Troubleshooting**

### **Common Issues**

1. **Backend not starting**
   ```bash
   # Check if port 5000 is in use
   netstat -ano | findstr :5000
   
   # Check Node.js version
   node --version
   
   # Check dependencies
   npm install
   ```

2. **Database connection error**
   ```bash
   # Check MySQL is running
   sudo systemctl status mysql
   
   # Check credentials in .env
   # Test connection
   mysql -u root -p
   ```

3. **CORS errors in browser**
   ```javascript
   // In backend/server.js
   app.use(cors({
     origin: 'http://localhost:3000'
   }));
   ```

4. **Webhook not working**
   - Check webhook URL in `.env`
   - Verify internet connectivity
   - Check browser console for errors

### **Development Logs**
```bash
# Backend logs
cd backend
npm run dev

# Frontend logs
cd frontend
npm start
```

## **📈 Performance**

- **Backend Response Time**: < 100ms
- **Frontend Load Time**: < 2s
- **Database Queries**: Optimized with indexes
- **Concurrent Jobs**: Up to 10 simultaneous jobs

## **🔒 Security**

- **CORS Configuration**: Whitelisted origins
- **Input Validation**: All API endpoints
- **SQL Injection Prevention**: Parameterized queries
- **Environment Variables**: Sensitive data protection

## **🤝 Contributing**

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open Pull Request

### **Development Guidelines**
- Follow existing code style
- Add comments for complex logic
- Update documentation
- Test thoroughly

## **📄 License**

MIT License - see [LICENSE](LICENSE) file

## **👥 Authors**

- **Your Name** - [[GitHub](https://github.com/Ankmmarao](https://github.com/Ankmmarao))
- **Contributors** - Thank you!

## **🙏 Acknowledgments**

- React team for amazing frontend library
- Express.js for robust backend framework
- Tailwind CSS for utility-first styling
- All open-source contributors

## **📞 Support**

For support, email: your.email@example.com or create an issue on GitHub.

---

<div align="center">
  
**Made with ❤️ by [Manimela Ankammarao]**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/yourusername/job-scheduler)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green?style=for-the-badge)](https://job-scheduler.vercel.app)
[![Report Bug](https://img.shields.io/badge/Report-Bug-red?style=for-the-badge)](https://github.com/yourusername/job-scheduler/issues)

</div>

## **🎯 Quick Links**

- [Live Demo](https://job-scheduler.vercel.app)
- [API Documentation](https://job-scheduler.onrender.com/api/health)
- [GitHub Issues](https://github.com/yourusername/job-scheduler/issues)
- [Changelog](CHANGELOG.md)
- [Contributing Guide](CONTRIBUTING.md)

---

**⭐ Star this repo if you found it useful!**
