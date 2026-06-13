// server/server.js
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path'); // ДОДАНО: модуль для роботи зі шляхами
const connectDB = require('./db');
const itemRoutes = require('./routes/itemRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/data/img_sprites', express.static(path.join(__dirname, 'dataset/img_sprites')));



app.use('/api', itemRoutes);
app.use('/data', itemRoutes);

app.use(express.static(path.join(__dirname, '../client'))); 


app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 MVC Сервер успішно запущено на порту ${PORT}`);
});