const express = require('express');
const cors = require('cors');

const controllers = require('./controllers');
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', controllers);

app.use(errorMiddleware);

module.exports = app;
