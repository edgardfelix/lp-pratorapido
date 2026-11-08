/**
 * Vercel Function: every /api/* request lands here (rewrite in vercel.json)
 * and is answered by the Express app, compiled to server/dist by the build.
 */
import handler from '../server/dist/vercel.js';

export default handler;
