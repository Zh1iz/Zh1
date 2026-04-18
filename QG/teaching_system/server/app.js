const express = require('express');
const path = require('path');
const config = require('./config');
const { verifyToken } = require('./auth');
const { handleLogin } = require('./routes/login');
const { handleUser } = require('./routes/user');
const {
  handleAddClass,
  handleBindTeacher,
  handleAddStudent,
  handleDeleteStudent,
  handleGetClasses,
  handleGetClassStudents
} = require('./routes/class');
const {
  handleAddScore, handleBatchAddScore, handleGetScores,
  handleUpdateScore, handleDeleteScore, handleGetStatistics, handleExportScores
} = require('./routes/score');
const {
  handleAddNotice, handleUpdateNotice, handleDeleteNotice,
  handleGetNotices, handleMarkRead, handleGetReadStatus
} = require('./routes/notice');
const { handleGetLogs } = require('./routes/log');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.static(path.join(__dirname, '../web')));
app.post('/api/login', handleLogin);
app.use('/api', (req, res, next) => {
  if (req.path === '/login' && req.method === 'POST') return next();
  verifyToken(req, res, next);
});
app.get('/api/user', handleUser);
app.post('/api/class', handleAddClass);
app.put('/api/class/teacher', handleBindTeacher);
app.post('/api/class/student', handleAddStudent);
app.delete('/api/class/student', handleDeleteStudent);
app.get('/api/classes', handleGetClasses);
app.post('/api/score', handleAddScore);
app.post('/api/score/batch', handleBatchAddScore);
app.get('/api/scores', handleGetScores);
app.put('/api/score', handleUpdateScore);
app.delete('/api/score', handleDeleteScore);
app.get('/api/score/statistics', handleGetStatistics);
app.get('/api/score/export', handleExportScores);
app.post('/api/notice', handleAddNotice);
app.put('/api/notice', handleUpdateNotice);
app.delete('/api/notice', handleDeleteNotice);
app.get('/api/notices', handleGetNotices);
app.post('/api/notice/read', handleMarkRead);
app.get('/api/notice/read/:noticeId', handleGetReadStatus);
app.get('/api/logs', handleGetLogs);
app.get('/api/class/:classId/students', handleGetClassStudents);
app.listen(config.PORT, () => console.log(`服务器启动成功！`));