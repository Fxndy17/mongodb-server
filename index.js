require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const fs = require('fs');
const path = require('path');

// Koneksi ke MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

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

app.listen(PORT, () => {
  console.log(`🚀 MongoDB Server running at http://localhost:${PORT}`);
});
