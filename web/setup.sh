#!/bin/bash

# Create directories if they don't exist
mkdir -p src/components
mkdir -p src/contexts
mkdir -p src/pages
mkdir -p src/assets
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p public

# Install dependencies
echo "Installing dependencies..."
npm install react react-dom react-router-dom framer-motion @heroicons/react

# Install dev dependencies
echo "Installing dev dependencies..."
npm install -D typescript @types/react @types/react-dom @types/node vite @vitejs/plugin-react tailwindcss postcss autoprefixer eslint eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Initialize the project
echo "Initializing the project..."
npm init -y

# Update package.json scripts
echo "Updating package.json scripts..."
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="tsc && vite build"
npm pkg set scripts.preview="vite preview"
npm pkg set scripts.lint="eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"

echo "Setup complete! You can now run 'npm run dev' to start the development server."