require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const fillData = async () => {
  try {
    const schemaPath = path.join(__dirname, '../../db/data.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('rellenando datos de prueba...');
    await pool.query(schema);
    console.log('datos cargados correctamente...');
  } catch (error) {
    console.error('Error ejecutando el script SQL:', error.message);
  } finally {
    await pool.end();
  }
};

fillData();
