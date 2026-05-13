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
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

app.get('/api.json', (req, res) => {
  res.json(swaggerSpec);
});

app.get('/', (req, res) => {
  res.send(swaggerHtml);
});

app.get('/swagger-docs', (req, res) => {
  res.send(swaggerHtml);
});

app.get('/test', (req, res) => {
  res.json({ message: 'test route works' });
});

app.get('/api-docs/', (req, res) => {
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