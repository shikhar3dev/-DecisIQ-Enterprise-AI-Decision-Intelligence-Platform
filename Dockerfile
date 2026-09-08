# Stage 1: Build the Vite Executive Dashboard
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Analytical Backend
FROM python:3.11-slim
WORKDIR /app

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, schema, and root proxy
COPY backend/ ./backend/
COPY sql_analytics/ ./sql_analytics/
COPY powerbi_export_pack/ ./powerbi_export_pack/
COPY db.py ./

# Create data directory and pre-seed the analytical warehouse
RUN mkdir -p /app/backend/data && python backend/warehouse/seed_data.py

# Copy compiled frontend from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose cloud port (Render uses 10000)
ENV PORT=10000
EXPOSE 10000 8000

# Start unified server (FastAPI serves both API and Executive UI)
CMD ["python", "backend/app.py"]
