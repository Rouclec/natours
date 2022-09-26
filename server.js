const mongoose = require('mongoose');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express'),
  swaggerDocument = require('./swagger.json');

dotenv.config({ path: './config.env' });

const app = require('./app');
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose.connect(DB).then(() => {
  console.log('Connection successful');
});

const port = process.env.PORT || 3000;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.listen(port, () => {
  console.log('App running on port ', port);
});
