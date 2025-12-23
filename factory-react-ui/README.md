# Factory Monitoring System - React Frontend

A modern, professional React frontend for the Factory Monitoring System with TypeScript, Vite, and a beautiful dark industrial theme.

## 🚀 Features

- ✅ **Modern UI**: Professional industrial design with dark theme
- ✅ **Real-time Updates**: Auto-refresh every 30 seconds
- ✅ **Version Management**: Filter PCs by model version (3.5, 4.0, etc.)
- ✅ **Model Library**: Upload, manage, and deploy models to factory PCs
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **TypeScript**: Full type safety
- ✅ **Fast**: Built with Vite for instant development

## 📦 Prerequisites

- Node.js 18+ 
- npm or yarn
- ASP.NET Core backend running on `http://localhost:5000`

## 🛠️ Installation

```bash
# Install dependencies
npm install

# or with yarn
yarn install
```

## 🏃 Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

The dev server automatically proxies `/api` requests to your ASP.NET backend at `http://localhost:5000`.

## 🏗️ Build for Production

```bash
# Build the app
npm run build

# The output will be in the `dist` folder
```

## 📁 Project Structure

```
factory-react-ui/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout wrapper
│   │   ├── Sidebar.tsx      # Left navigation sidebar
│   │   └── PCCard.tsx       # PC card component
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── PCDetails.tsx    # PC detail page
│   │   └── ModelLibrary.tsx # Model library page
│   ├── services/            # API integration
│   │   └── api.ts           # API service layer
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Type definitions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 Design System

### Colors
- **Primary**: Industrial Blue (#4f7ee0)
- **Background**: Dark (#0f1419, #1c2128)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Warning**: Orange (#f59e0b)

### Typography
- **Font Family**: Inter
- **Monospace**: For IPs and model names

### Components
- Modern cards with hover effects
- Gradient buttons with shadows
- Professional badges
- Smooth transitions

## 🔌 API Integration

The app connects to the ASP.NET Core backend API:

### Endpoints Used
- `GET /api/api/versions` - Get available versions
- `GET /api/api/lines` - Get production lines
- `GET /api/api/pcs` - Get all PCs (with filters)
- `GET /api/api/pc/:id` - Get PC details
- `GET /api/api/stats` - Get statistics
- `GET /api/modellibrary` - Get model library
- `POST /api/modellibrary/upload` - Upload model
- `POST /api/modellibrary/apply` - Deploy model
- `DELETE /api/modellibrary/:id` - Delete model
- `POST /api/pc/changemodel` - Change PC model
- `GET /api/pc/downloadconfig` - Download config

## 🌐 Environment Configuration

Update `vite.config.ts` to change the backend URL:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://your-backend-url:5000',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

## 📱 Pages

### Dashboard (`/dashboard` or `/dashboard/:version`)
- View all factory PCs organized by line
- Filter by version
- Switch between card and list view
- Real-time status updates

### PC Details (`/pc/:id`)
- Detailed PC information
- Available models
- Apply model changes
- Download configuration

### Model Library (`/models`)
- Upload model ZIPs
- Manage model library
- Deploy models to multiple PCs
- Filter by version, line, or both

## 🎯 Features in Detail

### Version Management
Click on a version in the sidebar to filter PCs by that version (3.5, 4.0, etc.)

### Model Library
1. Upload model ZIPs with description and category
2. Deploy to:
   - All PCs
   - Specific version
   - Specific line
   - Version + Line combination
   - Selected individual PCs
3. Choose to apply immediately or just upload

### PC Cards
- Show online/offline status with animated indicator
- Display current model
- Show IP address and version
- Click to view details

## 🚀 Deployment

### With ASP.NET Core

Build the React app and serve it from ASP.NET:

```bash
# Build React app
npm run build

# Copy dist folder to ASP.NET wwwroot
cp -r dist/* ../FactoryMonitoringWeb/wwwroot/
```

### Standalone

```bash
# Build
npm run build

# Serve with any static server
npx serve -s dist
```

## 🔧 Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:5000`
- Check CORS settings in ASP.NET Core
- Verify proxy configuration in `vite.config.ts`

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## 📝 License

© 2024 Factory Monitoring System

