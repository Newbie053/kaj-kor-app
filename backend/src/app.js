const express = require('express');
const cors = require('cors');

const taskController = require('./controllers/task.controller');
const targetController = require('./controllers/target.controller');
const userController = require('./controllers/user.controller');
const progressController = require('./controllers/progress.controller');

const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

taskController(app);
targetController(app);
userController(app);
progressController(app);

app.use(errorMiddleware);

module.exports = app;
