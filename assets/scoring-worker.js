import { scoreMctq } from './scoring.js';
self.onmessage = ({ data }) => {
  try { self.postMessage({ id: data.id, result: scoreMctq(data.answers) }); }
  catch (error) { self.postMessage({ id: data.id, error: error.code || 'unknown' }); }
};
