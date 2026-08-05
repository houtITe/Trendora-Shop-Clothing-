// Vercel serverless entry point.
//
// Vercel treats every file under /api as its own serverless function. Your
// existing src/app.js already exports the plain Express app (it never calls
// app.listen() itself — that only happens in src/server.js, which is used
// for local `npm run dev` and is NOT used here), so this file just re-uses
// it as-is. Nothing in src/ needed to change.
module.exports = require('../src/app');