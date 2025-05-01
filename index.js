const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'src/html')));
app.use('/dist', express.static(path.join(__dirname, 'src/dist')));
app.use('/css', express.static(path.join(__dirname, 'src/css')));
app.use('/Database_API', express.static(path.join(__dirname, 'Database_API')));

app.listen(8080, () => console.log('Server running on http://localhost:8080'));