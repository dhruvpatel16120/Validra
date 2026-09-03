const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Validra Frontend Environment Setup & Installation');
console.log('==================================================');

const frontendDir = path.resolve(__dirname, '..');
const envPath = path.join(frontendDir, '.env');
const envExamplePath = path.join(frontendDir, '.env.example');

// 1. Environment file setup
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Creating .env file from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file.');
  } else {
    console.log('📋 Creating default .env file...');
    const defaultEnvContent = `# Validra Frontend Environment Variables\nNEXT_PUBLIC_API_BASE_URL=http://localhost:8000\nNEXT_PUBLIC_APP_ENV=development\n`;
    fs.writeFileSync(envPath, defaultEnvContent, 'utf-8');
    console.log('✅ Created default .env file.');
  }
} else {
  console.log('ℹ️  .env file already exists. Skipping creation.');
}

// 2. Install dependencies
console.log('\n📦 Installing dependencies via npm...');
try {
  execSync('npm install', {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true
  });
  console.log('\n🎉 Dependencies installed successfully!');
} catch (error) {
  console.error('\n❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('\n✨ Validra Frontend setup complete!');
console.log('▶️  Run "npm run dev" to start the Next.js development server.\n');
