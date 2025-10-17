# React App on AWS EKS with ArgoCD (GitOps + CI/CD)

## Project Overview

This project demonstrates how to **deploy a React web application on AWS EKS (Elastic Kubernetes Service)** using **ArgoCD for GitOps-based deployment** and **GitHub Actions for CI/CD**.

Key highlights:

- **Frontend:** React app containerized with Docker and served via **NGINX.**
- **Infrastructure:** AWS EKS cluster with managed node groups.
- **GitOps Workflow:** ArgoCD continuously syncs Kubernetes manifest from GitHub.
- **CI/CD Pipeline:** GitHub Actions builds & pushes the Docker image to Docker Hub, and ArgoCD deploys the latest version automatically.

How the pipeline works:

1. Builds and pushes a Docker image of the React app to **Docker Hub** via **GitHub Actions**.
2. Deploys the application to **EKS** through **ArgoCD**.
3. Exposes the app using **NGINX Ingress** for external access.

This project highlights my DevOps skills across **AWS, Kubernetes, Docker, CI/CD automation, and GitOps**.

---

## Infrastructure Setup

### 1. EKS Cluster Creation

- Created an **EKS cluster** with `eksctl`:
- Two managed nodegroups:
  - **t3.micro** for general workloads.
  - **t3.medium** dedicated for ArgoCD.

```bash
eksctl create cluster --name portfolio-eks --region us-east-1 --nodegroup-name demo-nodes --node-type t3.micro --nodes 1 --nodes-min 1 --nodes-max 1 --managed
```

```bash
eksctl create nodegroup --cluster portfolio-eks --region us-east-1 --name argocd-nodes --node-type t3.medium --nodes 1 --nodes-min 1 --nodes-max 1 --managed
```

### 2. NGINX Ingress Controller

Installed to handle external traffic and expose the React app:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/aws/deploy.yaml
```

### 3. ArgoCD Installation

Installed ArgoCD in the `argocd` namespace:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Expose ArgoCD UI using port-forward:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then open http://localhost:8080 in your browser.

#### Default Login Credentials

- **Username:** `admin`
- **Password:** auto-generated, stored in a Kubernetes secret:

```bash
kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d
```

## Deployment

### 1. React App Dockerization

#### Build the React app Docker image

1. Inside the React app folder, create a Dockerfile:

```dockerfile
# Stage 1: build React app
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Stage 2: serve app with nginx
FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy the dist folder
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

2. Build the Docker image locally:

```bash
docker build -t react-portfolio:latest .
```

3. Push the Docker image to Docker Hub

- **Login to Docker Hub:**

```bash
docker login
```

- **Tag the image** for Docker Hub:

```bash
docker tag react-portfolio:latest <YOUR_DOCKERHUB_USERNAME>/react-portfolio:latest
```

- **Push the image:**

```bash
docker push <YOUR_DOCKERHUB_USERNAME>/react-portfolio:latest
```

Replace <YOUR_DOCKERHUB_USERNAME> with your actual Docker Hub username.

### 2. Kubernetes Manifests (`k8s/`)

1. **Create a new folder** in your React app repository to store Kubernetes manifests.

```bash
cd react-app/ # or wherever your repo is
mkdir -p k8s
cd k8s
```

2. **Create a Deployment YAML** for your React app:

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: react-portfolio
  labels:
    app: react-portfolio
spec:
  replicas: 2
  selector:
    matchLabels:
      app: react-portfolio
  template:
    metadata:
      labels:
        app: react-portfolio
    spec:
      containers:
        - name: react-portfolio
          image: <YOUR_DOCKERHUB_USERNAME>/react-portfolio:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 80
```

Replace `YOUR_DOCKERHUB_USERNAME` with your actual Docker Hub username where the image of your React app is pushed.

3. **Create a Service YAML** so the app is reachable inside the cluster:

```bash
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: react-portfolio-svc
spec:
  type: LoadBalancer
  selector:
    app: react-portfolio
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
```

4. **Commit and push** these files to your GitHub repo:

```bash
git add k8s/deployment.yaml k8s/service.yaml
git commit -m "Add Kubernetes manifests for React app"
git push origin main
```

### 3. ArgoCD application

Deployed ArgoCD application manifests:

```bash
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: react-portfolio
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/<your-username>/<repo>.git
    targetRevision: main
    path: k8s
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

This ensures ArgoCD syncs the `k8s/` directory automatically.

### 4. CI/CD Pipeline

#### GitHub Actions -> Docker Hub -> ArgoCD -> Kubernetes

- **Workflow** (`.github/Workflows/docker-build-push.yaml`)
  - Triggere: push to `main` branch.
  - Builds React app Docker image.
  - Pushes to Docker Hub with `latest` tag.

```yaml
name: CI - Build and Push Docker Image

on:
  push:
    branches:
      - main  # runs when you push to main branch

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build Docker image
        run: |
          docker build -t your-dockerhub-username/your-image-name:latest .

      - name: Push Docker image
        run: |
          docker push your-dockerhub-username/your-image-name:latest
```

Make sure to replace `your-dockerhub-username` and `your-image-name` with your actual docker username and image name.

- **ArgoCD** wateches GitHub repo -> auto-syncs -> updates app in Kubernetes.
- **imagePullPolicy:** **Always** ensures the latest image is always pulled.
- **Manual restart (if needed)**:

```bash
kubectl rollout restart deployment react-portfolio -n default
```

## Cleaning up

When finished with the project make sure to clean up and destroy all resources to avoid extra charges:

1. Delete the Nodegroup:

```bash
eksctl delete nodegroup --cluster portfolio-eks --region us-east-1 --name demo-nodes --drain=false
```

```bash
eksctl delete nodegroup --cluster portfolio-eks --region us-east-1 --name argocd-nodes --drain=false
```

Check deletion status:

```bash
eksctl get nodegroup --cluster $CLUSTER_NAME --region $AWS_REGION
```

You should see **no nodegroups listed.**

2. Delete the EKS Cluster

Once the nodegroups are gone, delete the cluster:

```bash
eksctl delete cluster --name portfolio-eks --region us-east-1
```

This will also delete the VPC, subnets, security groups, and other associated resources created by `eksctl`.

Check cluster status:

```bash
eksctl get cluster --region us-east-1
```

No clusters should appear.

3. Verify AWS Console

Log in to the **AWS Console**, go to **EC2** -> **Instances** and **VPC** -> **VPC/Subnets** to confirm everything has been removed.

## Screenshots

- React app running via AWS LoadBalancer.
- ArgoCD UI showing healthy + synced application.

![React app running via AWS LoadBalancer](/screenshots/React_app.png)
![ArgoCD UI 01](/screenshots/ArgoCD_01.png)
![ArgoCD UI 02](/screenshots/ArgoCD_02.png)

## Lessons Learned

- **Node Scaling:** Running on `t3.micro` was too limited (pods stuck Pending). Scaling to `t3.medium` fixed scheduling issues.
- **Cluster Upgrades:** Control plane upgrade requires careful node group upgrade/replacement.
- **GitOps Flow:** ArgoCD simplifies deployment, no manual `kubectl apply` once manifests are defined.
- **CI/CD Simplicity:** Using `latest` tag with `imagePullPolicy: Always` provides an easy workflow, but production systems should use versioned tags.
