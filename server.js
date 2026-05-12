const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const APIFY_TOKEN = 'apify_api_G1YSGB9DgxkeWOwexd50KZUYCtRFEi2yxIkU';

app.post('/buscar', async (req, res) => {
  const { query, limite } = req.body;
  try {
    const runResp = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchStringsArray: [query],
          maxCrawledPlacesPerSearch: limite,
          language: 'pt',
          countryCode: 'br',
          maxImages: 0,
        })
      }
    );
    const runData = await runResp.json();
    const runId = runData.data.id;

    // Aguarda conclusão
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const statusResp = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
      );
      const statusData = await statusResp.json();
      if (statusData.data.status === 'SUCCEEDED') break;
      if (['FAILED','ABORTED'].includes(statusData.data.status)) {
        return res.status(500).json({ error: 'Busca falhou no servidor.' });
      }
    }

    // Busca resultados
    const itemsResp = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&limit=${limite}`
    );
    const items = await itemsResp.json();
    res.json(items);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
