const mongoose = require('mongoose');


require('dotenv').config(); 

const connectDB = async () => {

  const uri = process.env.MONGO_URI;
  
  try {
    await mongoose.connect(uri);
    console.log('Успішно підключено до MongoDB!');
  } catch (err) {
    console.error('Помилка підключення:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;