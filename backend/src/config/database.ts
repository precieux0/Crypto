import { Pool } from 'pg';
import { config } from 'dotenv';

config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Important pour Neon
  },
  max: 10, // Réduit pour Neon (limites gratuites)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test de connexion au démarrage
pool.on('connect', () => {
  console.log('✅ Connecté à Neon.tech PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erreur base de données:', err);
});

export async function initializeDatabase() {
  try {
    // Vérifier si les tables essentielles existent
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!result.rows[0].exists) {
      console.log('⚠️  Tables non trouvées, exécution du script d\'initialisation...');
      await runInitializationScript();
    } else {
      console.log('✅ Tables déjà initialisées');
    }
    
    // Créer l'admin user
    await createAdminUser();
    
  } catch (error) {
    console.error('❌ Erreur initialisation DB:', error);
  }
}

async function runInitializationScript() {
  // Votre script SQL d'initialisation
  const initSQL = `
    -- Mettez ici le contenu de votre init_database.sql
    CREATE TABLE IF NOT EXISTS users (...);
    -- etc...
  `;
  
  await pool.query(initSQL);
  console.log('✅ Script d\'initialisation exécuté');
}

async function createAdminUser() {
  // Votre code existant pour créer l'admin
}