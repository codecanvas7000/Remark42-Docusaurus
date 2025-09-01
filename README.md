# Docusaurus with Remark42 Comments

A modern blog platform built with [Docusaurus](https://docusaurus.io/) and integrated with [Remark42](https://remark42.com/) commenting system for interactive user engagement.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Navigate to the blog directory
cd my-blog

# Install dependencies

pnpm install

# Run the setup script (Windows)
start-remark42.bat

# Or for Linux/Mac
./start-remark42.sh


# Start the blog
pnpm start
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
cd my-blog
pnpm install

# 2. Start ngrok tunnel
ngrok http 8080

# 3. Update configuration with your ngrok URL
node update-ngrok.js https://your-ngrok-url.ngrok-free.app

# 4. Start the blog
pnpm start
```

## 📋 What You Get

- **Modern Blog Platform**: Built with Docusaurus v3 for fast, SEO-friendly blogs
- **Interactive Comments**: Remark42 commenting system with anonymous and authenticated comments
- **Docker Integration**: Containerized comment system for easy deployment
- **Auto Configuration**: Automated scripts to handle ngrok URL updates
- **Responsive Design**: Mobile-friendly interface out of the box

## 🛠️ Prerequisites

Before you start, make sure you have:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/) and Docker Compose
- [ngrok](https://ngrok.com/) account (free tier works)

## 📖 How It Works

1. **Docusaurus** serves your blog at `localhost:3000`
2. **Remark42** runs in Docker container at `localhost:8080`  
3. **ngrok** creates a public tunnel to Remark42 for comment functionality
4. **Auto-configuration** scripts keep everything synchronized

## 🎯 Features

### Blog Features
- Fast static site generation
- Built-in SEO optimization
- MDX support for interactive content
- Responsive design themes
- Search functionality

### Comment System Features
- Anonymous commenting enabled
- Social media authentication support
- Moderation capabilities
- Email notifications
- Comment threading
- Voting system

## 📁 Project Structure

```
my-blog/
├── blog/                    # Your blog posts
├── docs/                    # Documentation pages
├── src/
│   └── components/
│       └── Remark42.js     # Comment component
├── docker-compose.yml      # Remark42 container config
├── .env                    # Environment variables
├── start-remark42.sh       # Setup automation script
├── update-ngrok.js         # URL configuration script
└── package.json            # Dependencies
```

## 🚀 Development Workflow

1. **Write Content**: Add new blog posts to the `blog/` directory
2. **Start Development**: Run `npm start` to see changes live
3. **Test Comments**: Create test comments to verify functionality
4. **Update Config**: Run `update-ngrok.js` when ngrok URL changes

## 🔧 Configuration

### Environment Variables (.env)
```env
REMARK42_HOST=https://your-ngrok-url.ngrok-free.app
REMARK42_SITE_ID=remark
```

### Comment Settings
Comments are configured to allow:
- Anonymous users (no registration required)
- Social login (GitHub, Google, etc.)
- Moderation controls
- CORS for cross-origin requests

## 🚨 Troubleshooting

### Comments Not Loading?
1. Clear browser cache (`Ctrl+Shift+R`)
2. Check browser console for errors
3. Verify ngrok URL in configuration files
4. Restart development server

### Getting 500 Errors?
1. Check Docker container status: `docker ps`
2. View Remark42 logs: `docker logs remark42`
3. Re-run configuration script with fresh ngrok URL

### New ngrok URL?
Simply run the update script with your new URL:
```bash
node update-ngrok.js https://new-ngrok-url.ngrok-free.app
```

## 📚 Documentation

- **Blog Setup**: See `my-blog/README.md` for Docusaurus details
- **Comment Setup**: See `my-blog/README-REMARK42.md` for Remark42 details
- **Docusaurus Docs**: https://docusaurus.io/docs
- **Remark42 Docs**: https://remark42.com/docs

## 🚀 Production Deployment

For production use:

1. Replace ngrok with a permanent domain
2. Set up SSL certificates
3. Configure persistent storage for comments
4. Set up proper backup procedures
5. Configure email notifications

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console and Docker logs
3. Ensure all URLs are properly configured
4. Try clearing all browser data for localhost

## 📄 License

This project is built using open-source technologies:
- Docusaurus (MIT License)
- Remark42 (MIT License)

---

**Ready to start blogging?** Run the setup script and you'll be up and running in minutes! 🎉