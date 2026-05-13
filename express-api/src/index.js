require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const YAML = require('yaml');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

const apiSpecPath = path.join(__dirname, '..', 'existing-api.json');
let openApiSpec;

if (fs.existsSync(apiSpecPath)) {
  openApiSpec = JSON.parse(fs.readFileSync(apiSpecPath, 'utf8'));
} else {
  console.error('API spec file not found!');
  process.exit(1);
}

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    ...openApiSpec
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

app.use('/api-docs', (req, res, next) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>API 1.0</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>.swagger-ui .topbar { display: none }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/swagger.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        persistAuthorization: true,
        displayRequestDuration: true,
      });
    };
  </script>
</body>
</html>
`;
  res.send(html);
});

app.get('/swagger.json', (req, res) => {
  res.json(specs);
});

const authRoutes = require('./routes/auth');
const todoCategoriesRoutes = require('./routes/todoCategories');
const todoPrioritiesRoutes = require('./routes/todoPriorities');
const todoTasksRoutes = require('./routes/todoTasks');

app.use('/api/v1/Account', authRoutes);
app.use('/api/v1/TodoCategories', todoCategoriesRoutes);
app.use('/api/v1/TodoPriorities', todoPrioritiesRoutes);
app.use('/api/v1/TodoTasks', todoTasksRoutes);

app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

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
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;