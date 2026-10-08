// Supply the same aggregate used by the browser to the Quarto notebook.
import reference from '../assets/reference-data.js';
import { referenceGeometry } from '../assets/charts.js';
referenceGeometry(reference);
console.log(JSON.stringify(reference));
