import { fileURLToPath } from 'node:url';
import { auditSource, auditSite } from './project.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
await auditSource(root);
const count = await auditSite(fileURLToPath(new URL('../docs/', import.meta.url)));
console.log(`Source and deployment audit passed: ${count} public files; local URLs work under a project path.`);
