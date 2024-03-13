const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;


let tasks = [];
const users = [
  { username: 'user1', password: 'password1' },
  { username: 'user2', password: 'password2' }
];

app.get('/', (req, res) => {
  res.send('Welcome to the Task Management System');
});

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header required' });
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  req.user = user;
  next();
}

app.use(bodyParser.json());

app.post('/tasks', authenticateUser, (req, res) => {
  const { title, description, dueDate, category, priority } = req.body;
  const task = { title, description, dueDate, category, priority, completed: false };
  tasks.push(task);
  res.status(201).json(task);
});


app.put('/tasks/:taskId/complete', authenticateUser, (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const task = tasks.find(task => task.id === taskId);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  task.completed = true;
  res.status(200).json({ message: 'Task marked as completed' });
});


app.get('/tasks', authenticateUser, (req, res) => {
  const { sortBy } = req.query;
  let sortedTasks = [...tasks];

  if (sortBy === 'dueDate') {
    sortedTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  } else if (sortBy === 'category') {
    sortedTasks.sort((a, b) => a.category.localeCompare(b.category));
  } else if (sortBy === 'priority') {
    sortedTasks.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  } else if (sortBy === 'completed') {
    sortedTasks = sortedTasks.filter(task => task.completed);
  }

  res.status(200).json(sortedTasks);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
