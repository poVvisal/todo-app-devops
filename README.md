
# Todo App DevOps

A full-stack todo list application with a Node.js/Express backend and React frontend.

## Project Structure

```
todo-app-devops/
├── backend/
│   ├── server.js          # Express server with API routes
│   ├── database.js        # SQLite database setup
│   ├── package.json       # Backend dependencies
│   └── todos.db           # SQLite database file (auto-generated)
├── frontend/
│   ├── public/
│   │   └── index.html     # HTML template
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styles
│   │   └── index.js       # React entry point
│   └── package.json       # Frontend dependencies
└── README.md
```

## Features

- Create, Read, Update, Delete (CRUD) todos
- Mark todos as complete/incomplete
- Persistent storage with SQLite
- RESTful API design
- Modern React UI

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Backend Setup

```bash
cd backend
npm install
npm start
```

The API server will run on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The React app will run on `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/todos | Get all todos |
| GET | /api/todos/:id | Get a single todo |
| POST | /api/todos | Create a new todo |
| PUT | /api/todos/:id | Update a todo |
| DELETE | /api/todos/:id | Delete a todo |

## Tech Stack

- **Backend**: Node.js, Express.js, SQLite3
- **Frontend**: React, CSS
- **Database**: SQLite
- **Cloud Platform**: Google Cloud Platform (GCP)
- **Secrets Management**: GCP Secret Manager

## GCP Secrets Management

### Overview

This guide provides detailed instructions on how to securely store and retrieve secrets (API keys, database credentials, service account keys, etc.) using Google Cloud Platform's Secret Manager.

### Prerequisites for GCP Integration

1. **GCP Account**: Active Google Cloud Platform account
2. **GCP Project**: A GCP project created
3. **Enable APIs**:
   ```bash
   gcloud services enable secretmanager.googleapis.com
   gcloud services enable iam.googleapis.com
   ```
4. **Install Google Cloud SDK**: [Download gcloud CLI](https://cloud.google.com/sdk/docs/install)
5. **Authentication**: Logged in to GCP via `gcloud auth login`

---

## 🔐 Storing Secrets in GCP Secret Manager

### Method 1: Using gcloud CLI

#### Step 1: Create a Secret with Value

```bash
# Create a secret with a direct value
gcloud secrets create DATABASE_URL --data-file=- <<EOF
sqlite://./todos.db
EOF

# Or create from a file
echo "your-secret-value" > secret.txt
gcloud secrets create API_KEY --data-file=secret.txt

# Create secret interactively
echo -n "my-secret-password" | gcloud secrets create DB_PASSWORD --data-file=-
```

#### Step 2: Create Multiple Secrets for Different Environments

```bash
# Development environment secrets
echo -n "dev-database-url" | gcloud secrets create DEV_DATABASE_URL --data-file=-
echo -n "dev-api-key" | gcloud secrets create DEV_API_KEY --data-file=-

# Production environment secrets
echo -n "prod-database-url" | gcloud secrets create PROD_DATABASE_URL --data-file=-
echo -n "prod-api-key" | gcloud secrets create PROD_API_KEY --data-file=-

# Staging environment secrets
echo -n "staging-database-url" | gcloud secrets create STAGING_DATABASE_URL --data-file=-
```

#### Step 3: Add Labels to Secrets (for Organization)

```bash
gcloud secrets create APP_SECRET \
  --data-file=- \
  --labels=app=todo-app,env=production,type=api-key <<EOF
your-secret-value
EOF
```

#### Step 4: Update Secret Versions

```bash
# Add a new version to an existing secret
echo -n "new-secret-value" | gcloud secrets versions add DATABASE_URL --data-file=-

# Disable old version
gcloud secrets versions disable 1 --secret=DATABASE_URL

# Destroy a version permanently
gcloud secrets versions destroy 1 --secret=DATABASE_URL
```

### Method 2: Using GCP Console (Web UI)

1. Navigate to [GCP Console](https://console.cloud.google.com/)
2. Go to **Security** → **Secret Manager**
3. Click **Create Secret**
4. Fill in details:
   - **Name**: `DATABASE_URL`
   - **Secret value**: Enter your secret value
   - **Regions**: Select regions for storage
5. Click **Create Secret**

### Method 3: Using Terraform (Infrastructure as Code)

```hcl
resource "google_secret_manager_secret" "database_url" {
  secret_id = "DATABASE_URL"
  
  replication {
    automatic = true
  }
  
  labels = {
    app = "todo-app"
    env = "production"
  }
}

resource "google_secret_manager_secret_version" "database_url_version" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = var.database_url
}
```

### Method 4: Using Google Cloud Client Libraries

```javascript
// Node.js example
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function createSecret() {
  const [secret] = await client.createSecret({
    parent: 'projects/YOUR_PROJECT_ID',
    secretId: 'DATABASE_URL',
    secret: {
      replication: {
        automatic: {},
      },
    },
  });
  
  // Add secret version
  const [version] = await client.addSecretVersion({
    parent: secret.name,
    payload: {
      data: Buffer.from('your-secret-value', 'utf8'),
    },
  });
  
  console.log(`Created secret: ${secret.name}`);
}
```

---

## 🔓 Retrieving Secrets from GCP

### Method 1: Using gcloud CLI

#### Basic Retrieval

```bash
# Access the latest version of a secret
gcloud secrets versions access latest --secret="DATABASE_URL"

# Access a specific version
gcloud secrets versions access 1 --secret="DATABASE_URL"

# Store secret in environment variable
export DATABASE_URL=$(gcloud secrets versions access latest --secret="DATABASE_URL")

# Use in commands directly
node server.js --db=$(gcloud secrets versions access latest --secret="DATABASE_URL")
```

#### Batch Retrieval Script

```bash
#!/bin/bash
# load-secrets.sh - Load all secrets into environment

export DATABASE_URL=$(gcloud secrets versions access latest --secret="DATABASE_URL")
export API_KEY=$(gcloud secrets versions access latest --secret="API_KEY")
export JWT_SECRET=$(gcloud secrets versions access latest --secret="JWT_SECRET")
export SMTP_PASSWORD=$(gcloud secrets versions access latest --secret="SMTP_PASSWORD")

echo "Secrets loaded successfully!"
```

### Method 2: Using Service Account (Recommended for Production)

#### Step 1: Create a Service Account

```bash
# Create service account
gcloud iam service-accounts create todo-app-sa \
  --display-name="Todo App Service Account" \
  --description="Service account for Todo App to access secrets"

# Set environment variable for service account email
SA_EMAIL="todo-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com"
```

#### Step 2: Grant Secret Access Permissions

```bash
# Grant access to specific secrets
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

# Grant access to all secrets (use cautiously)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

# Grant viewer role (to list secrets)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.viewer"
```

#### Step 3: Create and Download Service Account Key

```bash
# Create key file
gcloud iam service-accounts keys create ~/todo-app-key.json \
  --iam-account=${SA_EMAIL}

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/todo-app-key.json"
```

⚠️ **Security Warning**: Never commit service account keys to version control!

#### Step 4: Use Service Account in Your Application

```javascript
// backend/config/secrets.js
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

// Client will automatically use GOOGLE_APPLICATION_CREDENTIALS
const client = new SecretManagerServiceClient();

async function getSecret(secretName) {
  const projectId = process.env.GCP_PROJECT_ID;
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  
  try {
    const [version] = await client.accessSecretVersion({name});
    const payload = version.payload.data.toString('utf8');
    return payload;
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    throw error;
  }
}

async function loadSecrets() {
  return {
    databaseUrl: await getSecret('DATABASE_URL'),
    apiKey: await getSecret('API_KEY'),
    jwtSecret: await getSecret('JWT_SECRET'),
  };
}

module.exports = { getSecret, loadSecrets };
```

#### Step 5: Update Your Application Entry Point

```javascript
// backend/server.js (updated)
const { loadSecrets } = require('./config/secrets');

async function startServer() {
  // Load secrets from GCP
  const secrets = await loadSecrets();
  
  // Use secrets in your app
  process.env.DATABASE_URL = secrets.databaseUrl;
  process.env.API_KEY = secrets.apiKey;
  
  // Start your Express app
  const app = require('./app');
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
```

### Method 3: Using Workload Identity (For GKE/Cloud Run)

#### For Google Kubernetes Engine (GKE)

```bash
# Enable Workload Identity on cluster
gcloud container clusters update CLUSTER_NAME \
  --workload-pool=YOUR_PROJECT_ID.svc.id.goog

# Create Kubernetes service account
kubectl create serviceaccount todo-app-ksa

# Bind Kubernetes SA to Google SA
gcloud iam service-accounts add-iam-policy-binding ${SA_EMAIL} \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:YOUR_PROJECT_ID.svc.id.goog[default/todo-app-ksa]"

# Annotate Kubernetes service account
kubectl annotate serviceaccount todo-app-ksa \
  iam.gke.io/gcp-service-account=${SA_EMAIL}
```

#### For Cloud Run

```bash
# Deploy with service account
gcloud run deploy todo-app \
  --image=gcr.io/YOUR_PROJECT_ID/todo-app \
  --service-account=${SA_EMAIL} \
  --set-env-vars=GCP_PROJECT_ID=YOUR_PROJECT_ID
```

### Method 4: Using Environment Variables with Secret Manager Integration

#### In Cloud Build

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/npm'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        npm install
        npm test
    secretEnv: ['DATABASE_URL', 'API_KEY']

availableSecrets:
  secretManager:
    - versionName: projects/YOUR_PROJECT_ID/secrets/DATABASE_URL/versions/latest
      env: 'DATABASE_URL'
    - versionName: projects/YOUR_PROJECT_ID/secrets/API_KEY/versions/latest
      env: 'API_KEY'
```

#### In GitHub Actions with GCP

```yaml
# .github/workflows/deploy.yml
name: Deploy to GCP
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Authenticate to GCP
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Access Secret
        run: |
          DATABASE_URL=$(gcloud secrets versions access latest --secret="DATABASE_URL")
          echo "::add-mask::$DATABASE_URL"
          echo "DATABASE_URL=$DATABASE_URL" >> $GITHUB_ENV
      
      - name: Deploy Application
        run: |
          # Use $DATABASE_URL in deployment
          ./deploy.sh
```

### Method 5: Using Secret Manager API Directly

```javascript
// Using REST API with axios
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

async function getSecretViaAPI(secretName) {
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });
  
  const client = await auth.getClient();
  const projectId = await auth.getProjectId();
  const url = `https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/${secretName}/versions/latest:access`;
  
  const res = await client.request({ url });
  const secretPayload = Buffer.from(res.data.payload.data, 'base64').toString();
  
  return secretPayload;
}
```

---

## 🔒 Best Practices for Secret Management

### 1. **Never Commit Secrets to Git**

Add to `.gitignore`:
```
# .gitignore
*.env
*-key.json
secrets.txt
.env.local
.env.production
credentials/
```

### 2. **Use Different Secrets per Environment**

```bash
# Naming convention
DEV_DATABASE_URL
STAGING_DATABASE_URL
PROD_DATABASE_URL
```

### 3. **Implement Secret Rotation**

```bash
# Rotate secret script
#!/bin/bash
NEW_SECRET=$(openssl rand -base64 32)
echo -n "$NEW_SECRET" | gcloud secrets versions add API_KEY --data-file=-
echo "Secret rotated successfully"
```

### 4. **Audit Secret Access**

```bash
# View access logs
gcloud logging read "resource.type=secretmanager.googleapis.com/Secret" \
  --limit 50 \
  --format json

# Set up audit alerts
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Secret Access Alert"
```

### 5. **Use IAM Conditions for Time-Based Access**

```bash
# Grant temporary access
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:temp-sa@project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --condition='expression=request.time < timestamp("2026-12-31T23:59:59Z"),title=temporary-access'
```

### 6. **Encrypt Secrets at Rest with Customer-Managed Keys**

```bash
# Create KMS key
gcloud kms keyrings create my-keyring --location=global

gcloud kms keys create my-key \
  --location=global \
  --keyring=my-keyring \
  --purpose=encryption

# Create secret with CMEK
gcloud secrets create ENCRYPTED_SECRET \
  --replication-policy=automatic \
  --kms-key-name=projects/PROJECT_ID/locations/global/keyRings/my-keyring/cryptoKeys/my-key
```

### 7. **Implement Least Privilege Access**

```bash
# Grant minimal required permissions
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:app@project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" # Read-only
```

---

## 📦 Installation for GCP Secret Manager Integration

### Install Required Dependencies

```bash
# Backend dependencies
cd backend
npm install @google-cloud/secret-manager google-auth-library

# Create secrets config file
cat > config/secrets.js << 'EOF'
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function getSecret(secretName) {
  const projectId = process.env.GCP_PROJECT_ID || 'your-project-id';
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  const [version] = await client.accessSecretVersion({name});
  return version.payload.data.toString('utf8');
}

module.exports = { getSecret };
EOF
```

### Update package.json

```json
{
  "dependencies": {
    "@google-cloud/secret-manager": "^5.0.0",
    "google-auth-library": "^9.0.0"
  }
}
```

---

## 🚀 Quick Start with GCP Secrets

```bash
# 1. Set up GCP project
export GCP_PROJECT_ID="your-project-id"
gcloud config set project $GCP_PROJECT_ID

# 2. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 3. Create secrets
echo -n "sqlite://./todos.db" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-api-key-here" | gcloud secrets create API_KEY --data-file=-

# 4. Create service account
gcloud iam service-accounts create todo-app-sa
SA_EMAIL="todo-app-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# 5. Grant permissions
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

# 6. Create key
gcloud iam service-accounts keys create ./gcp-key.json --iam-account=${SA_EMAIL}

# 7. Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="./gcp-key.json"

# 8. Run application
npm start
```

---

## 📚 Additional Resources

- [GCP Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Secret Manager Best Practices](https://cloud.google.com/secret-manager/docs/best-practices)
- [IAM Permissions for Secret Manager](https://cloud.google.com/secret-manager/docs/access-control)
- [Secret Manager Pricing](https://cloud.google.com/secret-manager/pricing)

## License

MIT
