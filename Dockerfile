FROM node:18

# Noninteractive mode untuk install
ENV DEBIAN_FRONTEND=noninteractive

# Install MongoDB, Node.js, npm, dan dependensi
RUN apt-get update && \
    apt-get install -y gnupg curl ca-certificates && \
    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg && \
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list && \
    apt-get update && \
    apt-get install -y mongodb-org && \
    apt-get clean

# Buat direktori database MongoDB
RUN mkdir -p /data/db

# Set working directory
WORKDIR /app

# Copy semua file dan install dependencies
COPY . .
RUN npm install

# Buka port aplikasi dan MongoDB
EXPOSE 3000 27017

# Start MongoDB + Express bersamaan
CMD mongod --fork --logpath /var/log/mongod.log && node index.js
