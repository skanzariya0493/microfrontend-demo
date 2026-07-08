const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: '*'
}));

app.use(express.static(path.join(__dirname, 'dist/product')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/product/index.html'));
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});