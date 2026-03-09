const express = require('express');

function startExpressServer(port) {
  const app = express();

  app.use(express.static('public'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

  return app;
}

module.exports = startExpressServer;
