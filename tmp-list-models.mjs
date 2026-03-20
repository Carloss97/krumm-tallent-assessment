import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();
const client = new GoogleGenerativeAI(process.env.VITE_GOOGLE_API_KEY);

(async () => {
  try {
    const list = await client.listModels();
    console.log('models:');
    list.forEach(m => console.log('-', m.name, m.supportedMethods));
  } catch (e) {
    console.error('Error listModels:', e);
  }
})();