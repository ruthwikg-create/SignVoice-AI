// Prepare a standalone static folder for branch-based GitHub Pages publication.
import {cp,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('../dist/',import.meta.url));
const destination=fileURLToPath(new URL('../pages-site/',import.meta.url));
await mkdir(destination,{recursive:true});
await cp(source,destination,{recursive:true});
await writeFile(new URL('../pages-site/.nojekyll',import.meta.url),'');
console.log('Static files prepared in pages-site/. Publish this folder to a gh-pages branch, or upload dist/ to any static HTTPS host. No build or API key is required.');
