require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Inisialisasi Express
const app = express();

// Middleware
app.use(bodyParser.json());

// Koneksi MongoDB - Railway compatible
const mongoURI = process.env.MONGO_URL || // Railway's default variable
                 process.env.MONGODB_URI || // Common alternative
                 `mongodb://${process.env.MONGO_IP || 'localhost'}:${process.env.MONGO_PORT || 27017}/${process.env.DB_NAME || 'miaw'}`;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
})
  .then(() => console.log(`Connected to MongoDB: ${mongoURI.replace(/:([^\/]+)@/, ':****@')}`))
  .catch(err => console.error('MongoDB connection error:', err));

// Endpoint untuk cek koneksi
app.get('/ping', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.json({ 
      status: 'connected', 
      db: mongoose.connection.name,
      connection: 'Railway MongoDB' // Indicates cloud connection
    });
  } else {
    res.status(500).json({ status: 'disconnected' });
  }
});

// Endpoint /backup 
app.get('/backup', async (req, res) => {
  try {
    // Verify connection first
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    const backupData = {};

    for (const coll of collections) {
      const collectionName = coll.name;
      const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      backupData[collectionName] = data;
    }

    // Create backup directory if not exists
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `backup-${Date.now()}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    // Set appropriate headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.download(filepath, () => {
      // Optional: Delete file after sending if you don't want to keep backups on server
      // fs.unlinkSync(filepath);
    });
    
  } catch (err) {
    console.error('❌ Error during backup:', err);
    res.status(500).json({ error: 'Backup failed', details: err.message });
  }
});

// Basic route
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 
    `Connected to ${mongoose.connection.name}` : 
    'Database disconnected';
    
  res.send(`
    <h1>Server Status</h1>
    <p>${dbStatus}</p>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/ping">/ping</a> - Check DB connection</li>
      <li><a href="/backup">/backup</a> - Download DB backup</li>
    </ul>
  `);
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`MongoDB connection: ${mongoURI.replace(/:([^\/]+)@/, ':****@')}`);
});