
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de CORS dinámica
const allowedOrigins = [
  'http://localhost:5173',
  /\.web\.app$/,
  /\.firebaseapp\.com$/
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(pattern => 
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

/**
 * Endpoint de Exportación a Google Sheets
 * Este endpoint actúa como un proxy seguro o disparador para procesos de Sheets.
 */
app.post('/api/export/sheets', async (req: Request, res: Response) => {
  const data = req.body;
  
  console.log(`[Export] Recibida solicitud de exportación tipo: ${data.syncType}`);
  
  // Aquí se integraría la lógica de 'google-auth-library' para escribir directamente
  // o se redirige al Google Apps Script configurado.
  
  res.json({ success: true, message: 'Datos recibidos en el servidor de Cloud Run' });
});

/**
 * Endpoint Maestro de Sincronización
 */
app.post('/api/v1/:entity/sync', async (req: Request, res: Response) => {
  const { entity } = req.params;
  const records = req.body;

  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'Body must be an array of records' });
  }

  const table = (prisma as any)[entity];
  if (!table) {
    return res.status(404).json({ error: `Entity ${entity} not found` });
  }

  try {
    const results = await prisma.$transaction(
      records.map((record: any) => {
        const { serverId, syncStatus, ...data } = record;
        
        if (data.date) data.date = new Date(data.date);
        if (data.lastUpdated) data.lastUpdated = BigInt(data.lastUpdated);

        return table.upsert({
          where: { id: record.id },
          update: data,
          create: data,
        });
      })
    );

    const confirmation = results.map((r: any) => ({
      id: r.id,
      serverId: r.serverId,
      lastUpdated: Number(r.lastUpdated)
    }));

    res.json({ success: true, synced: confirmation });

  } catch (error: any) {
    console.error(`[Sync Error] ${entity}:`, error);
    res.status(500).json({ 
      error: 'Failed to sync records', 
      details: error.message 
    });
  }
});

app.get('/health', (req, res) => res.send('AgroBodega Cloud Engine Online'));

app.listen(PORT, () => {
  console.log(`🚀 Backend desplegado en puerto ${PORT}`);
});
