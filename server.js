const app = require('./src/app'); 
const connectDB = require('./src/config/db');
require('dotenv').config();



const PORT = process.env.PORT || 5000;

// Connect DB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("❌ DB connection failed:", err));
