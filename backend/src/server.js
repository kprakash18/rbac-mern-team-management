import app from './app.js';
import { DB_connection } from "./config/db.js";
import dotenv from 'dotenv';
dotenv.config();
DB_connection();
const PORT = 3000 
app.listen(PORT,()=>{
    console.log(`your server is up and running...\n http://localhost:${PORT}`);
    
});