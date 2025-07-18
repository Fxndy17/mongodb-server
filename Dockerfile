# Gunakan image Node.js resmi
FROM node:18

# Set direktori kerja dalam container
WORKDIR /app

# Copy package.json dan install dependencies
COPY package*.json ./
RUN npm install

# Copy seluruh kode aplikasi
COPY . .

# Buka port 3000
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "app.js"]
