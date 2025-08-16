// fetchSuggestions.js
// Improved discovery: duration filter (40–120s), no Shorts/compilations/full matches,
// rotating queries/languages, pagination, embeddable-only, engagement prefilter,
// minimal Grok calls, DB insert via Lambda. No hard-coded classic exclusions.

const axios = require('axios');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

// ---------- CONFIG ----------
const MIN_SEC = 40;
const MAX_SEC = 120;
const MAX_CANDIDATES = 30;  // raw YouTube hits we'll consider (after hygiene)
const MAX_TO_SCORE = 8;     // only top N go to Grok to save tokens
const REGION = process.env.YT_REGION || 'US';
const LANGS = (process.env.YT_LANGS || 'en,es,pt').split(',').map(s => s.trim());

// ---------- HELPERS ----------
const addCors = (res) => ({
  ...res,
  headers: {
    'Access-Control-Allow-Origin': process.env.ACCESS_CONTROL_ALLOW_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
  },
});

// ISO 8601 PT#H#M#S -> seconds
function iso8601ToSeconds(iso) {
  const m = (iso || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = Number(m[1] || 0), mi = Number(m[2] || 0), s = Number(m[3] || 0);
  return h * 3600 + mi * 60 + s;
}

// Title hygiene (weed out junk)
function isBadTitle(t) {
  const x = (t || '').toLowerCase();
  return (
    x.includes('#shorts') ||
    x.includes('shorts') ||
    x.includes('compilation') ||
    x.includes('highlights') ||
    x.includes('extended highlights') ||
    x.includes('all goals') ||
    x.includes('full match') ||
    x.includes('skills') ||
    (x.includes('fifa') && x.includes('mobile')) // game clips
  );
}

// Simple engagement score to pre-rank (save tokens)
function engagementScore({ views, likes, comments }) {
  const v = Math.max(1, views);
  const lr = likes / v;
  const cr = comments / v;
  return (likes * 1.0) + (comments * 3.0) + (lr * 5000) + (cr * 10000);
}

// Rotating query pool (variety + multi-language)
const QUERY_POOL = [
  'best goal football -tutorial -compilation -highlights -skills -shorts',
  'iconic goal -compilation -highlights -full match -shorts',
  'bicycle kick goal -compilation -shorts -highlights',
  'volley best goal -compilation -shorts -highlights',
  'free kick unbelievable goal -compilation -shorts -highlights',
  'golazo -compilacion -resumen -shorts -highlights',
  'mejor gol -compilacion -resumen -shorts',
  'golaco -compilado -shorts',
  'melhor gol -compilacao -shorts',
  '"vs" best goal -compilation -highlights -shorts'
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Pull candidates with hygiene and duration checks
async function youtubeSearchBatch(youtubeKey) {
  const q = pick(QUERY_POOL);
  const hl = pick(LANGS);
  let pageToken;
  const found = [];

  for (let i = 0; i < 3 && found.length < MAX_CANDIDATES; i++) {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', q);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '25');
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('regionCode', REGION);
    url.searchParams.set('relevanceLanguage', hl);
    url.searchParams.set('order', i === 0 ? 'relevance' : (i === 1 ? 'viewCount' : 'rating'));
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', youtubeKey);

    const r = await axios.get(url.toString());
    const items = r.data.items || [];
    pageToken = r.data.nextPageToken;

    for (const it of items) {
      const videoId = it.id?.videoId;
      if (!videoId) continue;
      const title = it.snippet?.title || '';
      if (isBadTitle(title)) continue;
      found.push({
        videoId,
        title,
        description: it.snippet?.description || ''
      });
      if (found.length >= MAX_CANDIDATES) break;
    }
    if (!pageToken) break;
  }

  // Enrich with contentDetails + statistics (duration + engagement)
  const candidates = [];
  for (let i = 0; i < found.length; i += 50) {
    const ids = found.slice(i, i + 50).map(v => v.videoId).join(',');
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'contentDetails,statistics,snippet,status');
    url.searchParams.set('id', ids);
    url.searchParams.set('key', youtubeKey);

    const r = await axios.get(url.toString());
    for (const v of r.data.items || []) {
      const durSec = iso8601ToSeconds(v.contentDetails?.duration || 'PT0S');
      if (durSec < MIN_SEC || durSec > MAX_SEC) continue;       // 40–120s only
      if (v.status?.embeddable === false) continue;

      const title = v.snippet?.title || '';
      if (isBadTitle(title)) continue;

      const views = Number(v.statistics?.viewCount || 0);
      const likes = Number(v.statistics?.likeCount || 0);
      const comments = Number(v.statistics?.commentCount || 0);

      candidates.push({
        videoId: v.id,
        title,
        description: v.snippet?.description || '',
        thumbnail_url: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url || '',
        url: `https://www.youtube.com/watch?v=${v.id}`,
        views, likes, comment_count: comments,
        durSec
      });
    }
  }
  return candidates;
}

// ---------- LAMBDA CLIENT ----------
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });

// ---------- HANDLER ----------
exports.handler = async (event) => {
  if (event?.httpMethod === 'OPTIONS') {
    return addCors({ statusCode: 200, body: '' });
  }

  try {
    const youtubeKey = process.env.YOUTUBE_API_KEY;
    const xaiKey = process.env.XAI_API_KEY;
    const dbHandlerArn = process.env.DB_FSHandler_ARN;

    if (!youtubeKey || !xaiKey || !dbHandlerArn) {
      throw new Error('Missing env vars: YOUTUBE_API_KEY, XAI_API_KEY, or DB_FSHandler_ARN');
    }

    console.log('Searching YouTube with improved filters…');
    const rawCandidates = await youtubeSearchBatch(youtubeKey);

    // Pre-rank by engagement and cap to keep Grok cost sane
    const ranked = rawCandidates
      .map(c => ({ ...c, _e: engagementScore({ views: c.views, likes: c.likes, comments: c.comment_count }) }))
      .sort((a, b) => b._e - a._e)
      .slice(0, MAX_TO_SCORE);

    let processed = 0;

    await Promise.all(ranked.map(async (vid) => {
      // (Future) Optional: check DB for duplicates here before calling Grok.

      // Call Grok with strict JSON request
      const prompt = `Score this football goal (0-10) for iconic potential. Penalize duplicates, compilations, long replays, or bad quality. Duration is ${vid.durSec}s (ideal 40–120s). Title: "${vid.title}". Desc: "${vid.description.slice(0, 400)}". Views: ${vid.views}, Likes: ${vid.likes}, Comments: ${vid.comment_count}. Output JSON ONLY: {"score": number, "reason": string}`;
      let score = 0, reason = 'Analysis failed';
      try {
        const grokRes = await axios.post(
          'https://api.x.ai/v1/chat/completions',
          { model: 'grok-4', messages: [{ role: 'user', content: prompt }], temperature: 0.1 },
          { headers: { Authorization: `Bearer ${xaiKey}`, 'Content-Type': 'application/json' } }
        );
        const content = grokRes.data?.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        if (typeof parsed.score === 'number' && parsed.reason) {
          score = parsed.score;
          reason = parsed.reason.slice(0, 1000);
        } else {
          console.warn('Invalid Grok JSON:', content);
          return;
        }
      } catch (e) {
        console.error('Grok error:', e?.message);
        return;
      }

      // Keep a modest threshold to allow variety
      if (score < 6) return;

      const suggestionData = {
        videoId: vid.videoId,
        title: vid.title,
        description: vid.description,
        url: vid.url,
        thumbnail_url: vid.thumbnail_url,
        views: vid.views,
        likes: vid.likes,
        comment_count: vid.comment_count,
        score,
        ai_reason: reason
      };

      try {
        const invokeParams = {
          FunctionName: dbHandlerArn,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({ action: 'insertIfNotExists', data: suggestionData }),
        };
        const command = new InvokeCommand(invokeParams);
        const response = await lambdaClient.send(command);
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        const body = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;

        if (payload.statusCode === 200 && (body?.inserted || body?.message === 'Suggestion added')) {
          processed++;
          console.log(`Inserted ${vid.videoId}`);
        } else {
          console.warn(`Skipped/duplicate ${vid.videoId}:`, body?.message || body);
        }
      } catch (e) {
        console.error('DB invoke error:', e?.message);
      }
    }));

    return addCors({ statusCode: 200, body: JSON.stringify({ message: 'Suggestions generated', count: processed }) });
  } catch (err) {
    console.error('Error:', err.message, err.response?.data || {});
    return addCors({ statusCode: 500, body: JSON.stringify({ error: 'Server error', details: err.message }) });
  }
};
