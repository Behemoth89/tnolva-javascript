require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/swagger-ui', express.static(path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist')));

app.get('/swagger-ui-check', (req, res) => {
  const distPath = path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist');
  fs.readdir(distPath, (err, files) => {
    if (err) return res.json({ error: err.message, path: distPath });
    res.json({ path: distPath, files: files });
  });
});

const swaggerSpec = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'existing-api.json'), 'utf8'));

const swaggerHtml = `<!DOCTYPE html>
<html>
<head>
  <title>API Documentation</title>
  <link rel="stylesheet" href="/swagger-ui/swagger-ui.min.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/swagger-ui/swagger-ui-bundle.min.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerSpec)},
        dom_id: '#swagger-ui'
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