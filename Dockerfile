FROM node:20-slim

# Install OpenSSL (Required for Prisma on Debian Slim)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies (including dev deps like prisma CLI if needed for generating client, but pruning later if desired)
# For simplicity and ensuring prisma CLI is available for 'npx prisma generate', we install everything.
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
