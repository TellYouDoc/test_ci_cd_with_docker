
const express = require('express');
// require('./mongo-connection');
const app = express();
const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.send('Hello from Dockerized Node.js app!');
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
