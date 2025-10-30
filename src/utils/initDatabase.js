require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const initDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, '../../db/shema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Ejecutando script SQL...');
    await pool.query(schema);
    console.log('Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('Error ejecutando el script SQL:', error.message);
  } finally {
    await pool.end();
  }
};

initDatabase();
