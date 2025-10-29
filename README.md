# Revision History - Multi-Chapter Story Writing Platform

A full-stack MERN application that enables writers to create multi-chapter stories with comprehensive revision tracking, modular content versioning, and advanced writing tools.

## Features (MVP - Phases 1-2)

### Implemented Features

- ✅ **User Authentication**: Secure registration and login with JWT
- ✅ **Story Management**: Create, edit, and delete stories with metadata
- ✅ **Chapter Management**: Multi-chapter stories with reordering capability
- ✅ **Rich Text Editor**: TipTap-powered editor with formatting options
  - 12 font families (Times New Roman, Georgia, Arial, Merriweather, etc.)
  - Font sizes from 10pt to 36pt
  - Line spacing options (Single, 1.15, 1.5, Double)
  - Bold, Italic, Headings, Lists
- ✅ **Auto-save**: Automatic content saving with debouncing
- ✅ **Revision History**: Automatic versioning on each edit
- ✅ **Manual Save Points**: Named checkpoints for important versions
- ✅ **Revision Comparison**: Side-by-side diff view between versions
- ✅ **Restore Functionality**: Revert to any previous revision
- ✅ **Modular Sections**: Mark sections with multiple variants (API ready, UI basic)

### Future Features (Phases 3-8)
- Character aliasing system (Elephant Aliasing)
- Overview ribbon visualization
- Advanced search & dialogue tools
- Timeline & date tagging
- Settings panel with feature toggles

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcrypt** for password hashing
- **Security**: helmet, express-rate-limit, mongo-sanitize, CORS

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **TipTap** for rich text editing
- **Axios** for API calls
- **Context API + useReducer** for state management

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd RevisionHistory
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/revision-history
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long
FRONTEND_URL=http://localhost:3000
```

**Important**: Generate strong random strings for JWT secrets in production!

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will open at `http://localhost:3000`

### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

## Project Structure

```
RevisionHistory/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Context providers
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API service
│   │   ├── styles/      # CSS files
│   │   └── utils/       # Utility functions
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Stories
- `GET /api/v1/stories` - List user's stories
- `POST /api/v1/stories` - Create new story
- `GET /api/v1/stories/:id` - Get single story
- `PUT /api/v1/stories/:id` - Update story
- `DELETE /api/v1/stories/:id` - Delete story
- `PUT /api/v1/stories/:id/reorder` - Reorder chapters

### Chapters
- `POST /api/v1/chapters/stories/:storyId/chapters` - Create chapter
- `GET /api/v1/chapters/:id` - Get chapter
- `PUT /api/v1/chapters/:id` - Update chapter
- `DELETE /api/v1/chapters/:id` - Delete chapter

### Revisions
- `GET /api/v1/chapters/:id/revisions` - List revisions
- `GET /api/v1/revisions/:id` - Get single revision
- `POST /api/v1/chapters/:id/restore/:revisionId` - Restore revision

### Modular Sections
- `POST /api/v1/chapters/:id/modules` - Create modular section
- `PUT /api/v1/chapters/:id/modules/:moduleId` - Update variants
- `PUT /api/v1/chapters/:id/modules/:moduleId/activate` - Activate variant
- `DELETE /api/v1/chapters/:id/modules/:moduleId` - Delete section

## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT with secure secrets and expiration
- ✅ Rate limiting on authentication endpoints
- ✅ Input validation with express-validator
- ✅ Authorization checks on all protected routes
- ✅ CORS configuration with whitelist
- ✅ Helmet security headers
- ✅ MongoDB injection prevention
- ✅ Request size limits (10MB)
- ✅ httpOnly cookies for refresh tokens
- ✅ Token blacklisting on logout

## Usage Guide

### Getting Started

1. **Register an account** at `/register`
2. **Login** with your credentials
3. **Create a story** from the stories page
4. **Add chapters** to your story
5. **Write content** in the rich text editor
6. **Auto-save** happens automatically every 2 seconds
7. **Create manual save points** when you reach important milestones
8. **View revision history** to see all versions
9. **Compare revisions** side-by-side
10. **Restore** any previous version

### Editor Features

- **Bold**: Ctrl/Cmd + B
- **Italic**: Ctrl/Cmd + I
- **Headings**: H1, H2, H3 buttons
- **Lists**: Bullet and numbered lists
- **Auto-save**: Content saves automatically
- **Word count**: Real-time word counting
- **Manual save**: Create named revision points

### Revision Management

- All edits create automatic revision points
- Manual saves allow custom descriptions
- Compare any two revisions side-by-side
- Restore creates backup before reverting
- Revisions include timestamps and word counts

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- For Atlas, whitelist your IP address

### Port Already in Use
- Change `PORT` in backend `.env`
- Update `REACT_APP_API_URL` in frontend `.env`

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env`
- Check browser console for specific errors

### Authentication Issues
- Clear browser cookies and localStorage
- Verify JWT secrets are set correctly
- Check token expiration times

## Development Notes

### Adding New Features

1. **Backend**: Create model → controller → routes → middleware
2. **Frontend**: Create component → integrate with context → connect to API
3. **Test**: Verify authentication, authorization, and error handling

### Code Quality

- Follow ES6+ JavaScript standards
- Use async/await for asynchronous operations
- Implement proper error handling
- Add comments for complex logic
- Keep components focused and reusable

## Deployment

### Backend (Railway/Render)

1. Set environment variables in platform
2. Ensure `NODE_ENV=production`
3. Use MongoDB Atlas for database
4. Configure CORS with production frontend URL

### Frontend (Vercel/Netlify)

1. Set `REACT_APP_API_URL` to production backend
2. Build command: `npm run build`
3. Publish directory: `build`

### Database (MongoDB Atlas)

1. Create cluster and database
2. Whitelist application IPs
3. Enable automated backups
4. Set up monitoring alerts

## License

MIT

## Contributing

This is an MVP implementation. Future phases will add:
- Character management with aliases
- Visual overview ribbon
- Advanced search capabilities
- Timeline tracking
- Settings panel

## Support

For issues or questions, please create an issue in the repository.

## Acknowledgments

- TipTap for the excellent rich text editor
- MongoDB for flexible data storage
- React team for the amazing framework
