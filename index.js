require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Inisialisasi Express
const app = express();

// Middleware
app.use(bodyParser.json());

// Koneksi MongoDB dengan IP
const mongoIP = process.env.MONGO_IP || 'localhost'; // Default localhost
const mongoPort = process.env.MONGO_PORT || 27017; // Default port
const dbName = process.env.DB_NAME || 'miaw';

const mongoURI = `mongodb://${mongoIP}:${mongoPort}/${dbName}`;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 5000
})
  .then(() => console.log(`Connected to MongoDB at ${mongoIP}:${mongoPort}`))
  .catch(err => console.error('MongoDB connection error:', err));

// Endpoint untuk cek koneksi
app.get('/ping', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.json({ status: 'connected', db: mongoose.connection.name });
  } else {
    res.status(500).json({ status: 'disconnected' });
  }
});

// Endpoint /backup untuk download semua data database dalam file JSON
app.get('/backup', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backupData = {};

    for (const coll of collections) {
      const collectionName = coll.name;
      const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      backupData[collectionName] = data;
    }

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    const filename = `backup-${Date.now()}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    res.download(filepath); // Kirim file ke user
  } catch (err) {
    console.error('❌ Error during backup:', err);
    res.status(500).json({ error: 'Backup failed', details: err.message });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send(`
    FUCK UR SELFFFF !!!
  `);
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`MongoDB connection: ${mongoURI}`);
});