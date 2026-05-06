import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initServer} from './configs/apps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

process.on('uncaughtException', (err) =>{
    console.error('Uncought Exception in Admin Server', err);
    process.exit(1);
})
process.on('unhandledRejection', (err, promise) =>{
    console.error('Unhandled Rejection at:', promise, 'reason:', err);
    process.exit(1);
})

console.log('Strating Sistema Bancario Admin Server...');
initServer();
