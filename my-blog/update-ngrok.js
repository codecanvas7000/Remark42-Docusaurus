#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script to update ngrok URL across all Remark42 configuration files
 * Usage: node update-ngrok.js <new-ngrok-url>
 */

function updateNgrokUrl(newUrl) {
  if (!newUrl) {
    console.error('❌ Please provide a new ngrok URL');
    console.log(
      'Usage: node update-ngrok.js https://your-new-url.ngrok-free.app'
    );
    process.exit(1);
  }

  // Validate URL format
  if (!newUrl.match(/^https:\/\/[a-f0-9]+\.ngrok-free\.app$/)) {
    console.error(
      '❌ Invalid ngrok URL format. Expected: https://xxxxx.ngrok-free.app'
    );
    process.exit(1);
  }

  console.log(`🔄 Updating ngrok URL to: ${newUrl}`);

  const files = [
    {
      path: '.env',
      replacements: [
        {
          search: /REMARK42_HOST=https:\/\/[a-f0-9]+\.ngrok-free\.app/,
          replace: `REMARK42_HOST=${newUrl}`,
        },
      ],
    },
    {
      path: 'docker-compose.yml',
      replacements: [
        // Update REMARK_URL
        {
          search: /REMARK_URL=https:\/\/[a-f0-9]+\.ngrok-free\.app/,
          replace: `REMARK_URL=${newUrl}`,
        },
        // Update ALLOWED_HOSTS (fixed regex)
        {
          search:
            /ALLOWED_HOSTS=localhost,127\.0\.0\.1,localhost:3000,[a-f0-9]+\.ngrok-free\.app/,
          replace: `ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000,${newUrl.replace(
            'https://',
            ''
          )}`,
        },
        // Update ALLOWED_ORIGINS - more flexible regex
        {
          search: /ALLOWED_ORIGINS=([^,]*localhost[^,]*,)*[^,]*ngrok[^,\s]*/,
          replace: `ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000,http://127.0.0.1:3000,https://127.0.0.1:3000,${newUrl}`,
        },
        // Backup pattern for ALLOWED_ORIGINS
        {
          search: /ALLOWED_ORIGINS=.*https:\/\/[a-f0-9]+\.ngrok-free\.app.*/,
          replace: `ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000,http://127.0.0.1:3000,https://127.0.0.1:3000,${newUrl}`,
        },
        // Update FRAME_ANCESTORS (new addition)
        {
          search:
            /FRAME_ANCESTORS=http:\/\/localhost:3000,https:\/\/localhost:3000,http:\/\/127\.0\.0\.1:3000,https:\/\/127\.0\.0\.1:3000/,
          replace: `FRAME_ANCESTORS=http://localhost:3000,https://localhost:3000,http://127.0.0.1:3000,https://127.0.0.1:3000`,
        },
      ],
    },
    {
      path: 'src/clientModules/remark42-csp.js',
      replacements: [
        {
          search:
            /window\.remark_config\?\.host \|\| 'https:\/\/[a-f0-9]+\.ngrok-free\.app'/,
          replace: `window.remark_config?.host || '${newUrl}'`,
        },
      ],
    },
    // Add docusaurus.config.js if it exists
    {
      path: 'docusaurus.config.js',
      replacements: [
        {
          search: /REMARK42_HOST:\s*'https:\/\/[a-f0-9]+\.ngrok-free\.app'/,
          replace: `REMARK42_HOST: '${newUrl}'`,
        },
      ],
    },
  ];

  let updatedFiles = 0;

  // Update files
  files.forEach((file) => {
    const filePath = path.join(__dirname, file.path);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${file.path}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changesCount = 0;

    file.replacements.forEach((replacement) => {
      // Check condition if it exists
      if (replacement.condition && !replacement.condition(content)) {
        return;
      }

      const matches = content.match(replacement.search);
      if (matches) {
        content = content.replace(replacement.search, replacement.replace);
        modified = true;
        changesCount++;
        console.log(`   ✓ Updated pattern in ${file.path}`);
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${file.path} (${changesCount} changes)`);
      updatedFiles++;
    } else {
      console.log(`⏭️  No changes needed in ${file.path}`);
    }
  });

  if (updatedFiles === 0) {
    console.warn(
      '⚠️  No files were updated. Check if the configuration files exist and have the expected format.'
    );
    return;
  }

  // Restart Docker containers
  console.log('🐳 Restarting Docker containers...');
  try {
    // Check if Docker Compose is running
    try {
      execSync('docker compose ps', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Docker Compose not running yet, starting fresh...');
    }

    // Stop existing containers
    execSync('docker compose down', { stdio: 'inherit' });

    // Clear old Remark42 data for fresh start
    console.log('🗑️  Clearing old Remark42 data...');
    try {
      if (process.platform === 'win32') {
        // Windows command
        execSync(
          'rmdir /s /q remark42-data 2>nul || echo Data directory cleaned',
          { stdio: 'inherit' }
        );
      } else {
        // Unix/Linux/macOS command
        execSync('rm -rf remark42-data', { stdio: 'inherit' });
      }
    } catch (error) {
      console.log(
        'ℹ️  No existing data to clear (this is normal for first run)'
      );
    }

    // Start containers
    execSync('docker compose up -d', { stdio: 'inherit' });
    console.log('✅ Docker containers restarted with fresh data');

    // Show container logs briefly
    setTimeout(() => {
      try {
        console.log('📋 Container status:');
        execSync('docker compose ps', { stdio: 'inherit' });
      } catch (error) {
        // Ignore errors
      }
    }, 2000);
  } catch (error) {
    console.error('❌ Error restarting Docker:', error.message);
    console.log('💡 Try running the following commands manually:');
    console.log('   docker compose down');
    console.log('   docker compose up -d');
  }

  console.log('\n🎉 Update complete!');
  console.log('📝 Next steps:');
  console.log('   1. Wait about 30 seconds for Remark42 to fully start');
  console.log('   2. Restart your Docusaurus dev server (npm start)');
  console.log('   3. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)');
  console.log('   4. Visit a blog post to test the Remark42 widget');
  console.log(`   5. Check ngrok dashboard: http://localhost:4040`);
  console.log(`   6. Direct Remark42 URL: ${newUrl}/web/`);
}

// Get URL from command line arguments
const newUrl = process.argv[2];
updateNgrokUrl(newUrl);
