# TELUVANE — AI Agent Flight Recorder & Compliance Tribunal
# Build: docker build -t teluvane .
# Run:   docker run -p 8900:8900 teluvane
#
# ANTHROPIC_API_KEY is optional — only the live Claude tribunal needs it.
# The ingest service, dashboard, chain verifier, and offline replay all work without it.
# Pass it at runtime: docker run -e ANTHROPIC_API_KEY=sk-ant-... -p 8900:8900 teluvane

FROM python:3.11-slim

# Avoid .pyc files and enable unbuffered stdout so logs stream immediately
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# WeasyPrint (PDF evidence export) needs Cairo/Pango's native libs; nothing else in the
# app requires them, so this is the only reason this image isn't pure python:3.11-slim.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 libpangocairo-1.0-0 libcairo2 libgdk-pixbuf-2.0-0 \
    libffi8 shared-mime-info fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Copy only the dependency manifests first so Docker can cache this layer
COPY pyproject.toml ./
COPY requirements.txt* ./

# Copy the rest of the project
COPY . .

# Install the package (pip install -e . picks up pyproject.toml extras)
RUN pip install --no-cache-dir -e .

# The ingest service listens on 8900 by default.
# On platforms that inject $PORT (e.g. Render), the shell-form CMD below picks it up.
EXPOSE 8900

# Shell-form so ${PORT:-8900} is expanded at container start time
CMD uvicorn teluvane.ingest:app --host 0.0.0.0 --port ${PORT:-8900}
