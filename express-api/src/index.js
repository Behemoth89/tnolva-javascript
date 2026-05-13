require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerSpec = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'existing-api.json'), 'utf8'));

const swaggerHtml = `<!DOCTYPE html>
<html>
<head>
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui@5.11.0/dist/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui@5.11.0/dist/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

app.get('/', (req, res) => {
  res.send(swaggerHtml);
});

app.get('/swagger-docs', (req, res) => {
  res.send(swaggerHtml);
});

const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/auth');
const todoCategoriesRoutes = require('./routes/todoCategories');
const todoPrioritiesRoutes = require('./routes/todoPriorities');
const todoTasksRoutes = require('./routes/todoTasks');

app.use('/api/v1/Account', authRoutes);
app.use('/api/v1/TodoCategories', todoCategoriesRoutes);
app.use('/api/v1/TodoPriorities', todoPrioritiesRoutes);
app.use('/api/v1/TodoTasks', todoTasksRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    detail: err.message,
    instance: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;