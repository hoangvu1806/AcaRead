#!/bin/sh

# run.sh - Script to build and run Docker container for frontend

# Configuration
GITHUB_REPO="https://github.com/hoangvu1806/AcaRead.git"
BRANCH="main"
CONTAINER_NAME="acaread-frontend"
IMAGE_NAME="acaread-nextjs"
IMAGE_TAG="latest"
PROD_PORT=4040
DEV_PORT=4041

# Default to production mode
MODE=${1:-prod}

# Display usage instructions
show_usage() {
  echo "📋 Usage: ./run.sh [MODE]"
  echo ""
  echo "MODES:"
  echo "  prod       - Production mode (default)"
  echo "  dev        - Development mode"
  echo ""
  echo "Examples:"
  echo "  ./run.sh         - Build and run Docker in production mode"
  echo "  ./run.sh prod    - Build and run Docker in production mode"
  echo "  ./run.sh dev     - Build and run Docker in development mode"
}

# Check port availability
check_port() {
  PORT_TO_CHECK=$1
  if command -v lsof >/dev/null 2>&1; then
    if lsof -i :$PORT_TO_CHECK | grep LISTEN >/dev/null 2>&1; then
      echo "⚠️ WARNING: Port $PORT_TO_CHECK is already in use. Will attempt to stop conflicting containers."
      return 1
    fi
  elif command -v netstat >/dev/null 2>&1; then
    if netstat -tuln | grep :$PORT_TO_CHECK >/dev/null 2>&1; then
      echo "⚠️ WARNING: Port $PORT_TO_CHECK is already in use. Will attempt to stop conflicting containers."
      return 1
    fi
  fi
  return 0
}

# Handle signals to safely shut down
handle_sigterm() {
  echo "⚠️ Received SIGTERM, shutting down gracefully..."
  exit 0
}

# Register signal handler
trap handle_sigterm SIGTERM SIGINT

# Pull code from GitHub
pull_code() {
  echo "📥 Pulling latest code from $GITHUB_REPO branch $BRANCH..."
  
  # Check if current directory is a git repository
  if [ -d ".git" ]; then
    # Already a git repository, just pull
    git pull origin $BRANCH
  else
    # Not a git repository, need to clone
    # Save current files
    mkdir -p ../temp_backup
    cp -r ./* ../temp_backup/ 2>/dev/null
    cp -r ./.* ../temp_backup/ 2>/dev/null
    
    # Clone repository
    cd ..
    git clone $GITHUB_REPO temp_clone
    
    # Move frontend content to current directory
    cp -r temp_clone/frontend/* ./frontend/
    cp -r temp_clone/frontend/.* ./frontend/ 2>/dev/null
    
    # Clean up
    rm -rf temp_clone
    
    # Return to frontend directory
    cd frontend
  fi
  
  if [ $? -eq 0 ]; then
    echo "✅ Code pulled successfully!"
  else
    echo "❌ Failed to pull code from GitHub."
    exit 1
  fi
}

# Build Docker image
build_docker() {
  echo "🏗️ Building Docker image $IMAGE_NAME:$IMAGE_TAG..."
  
  # Use cache to speed up build process
  docker build --cache-from $IMAGE_NAME:$IMAGE_TAG -t $IMAGE_NAME:$IMAGE_TAG .
  
  if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
  else
    echo "❌ Failed to build Docker image."
    exit 1
  fi
}

# Stop and remove running container if exists
stop_running_container() {
  # Check if container already exists
  if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "🛑 Stopping and removing existing container $CONTAINER_NAME..."
    docker stop $CONTAINER_NAME >/dev/null 2>&1
    docker rm $CONTAINER_NAME >/dev/null 2>&1
  fi
  
  # Check and stop other containers using the same port
  PORT=$1
  CONTAINERS=$(docker ps --format "{{.ID}}" -f "publish=$PORT")
  
  if [ -n "$CONTAINERS" ]; then
    echo "🛑 Found other containers using port $PORT. Stopping them..."
    for CONTAINER in $CONTAINERS; do
      echo "🛑 Stopping container $CONTAINER..."
      docker stop $CONTAINER >/dev/null 2>&1
    done
  fi
}

# Run Docker container
run_docker() {
  # Determine port based on mode
  if [ "$MODE" = "dev" ]; then
    PORT=$DEV_PORT
  else
    PORT=$PROD_PORT
  fi
  
  # Stop running container if exists
  stop_running_container $PORT
  
  # Check port
  check_port $PORT
  
  echo "🚀 Starting Docker container in $MODE mode on port $PORT..."
  docker run --name $CONTAINER_NAME -p $PORT:$PORT -e MODE=$MODE -d $IMAGE_NAME:$IMAGE_TAG
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Docker container started successfully!"
    echo ""
    echo "🌐 Access your application at:"
    echo "   http://localhost:$PORT"
    echo ""
    echo "📊 Useful commands:"
    echo "   🔍 View logs:    docker logs $CONTAINER_NAME"
    echo "   🔍 Follow logs:  docker logs -f $CONTAINER_NAME"
    echo "   🛑 Stop app:     docker stop $CONTAINER_NAME"
    echo "   🗑️ Remove app:   docker rm $CONTAINER_NAME"
    echo "   🔄 Restart app:  docker restart $CONTAINER_NAME"
    echo ""
    echo "💡 For more Docker commands, visit: https://docs.docker.com/engine/reference/commandline/docker/"
  else
    echo "❌ Failed to start Docker container."
    exit 1
  fi
}

# Process parameters
case "$MODE" in
  prod|dev)
    # Execute steps in sequence
    pull_code
    build_docker
    run_docker
    ;;
  help|--help|-h)
    show_usage
    ;;
  *)
    echo "❌ Unknown mode: $MODE"
    show_usage
    exit 1
    ;;
esac
