// fetchSuggestions.js
// Bestgoat - cost-aware, verbose-logging, higher-yield suggestions.
// Strategy:
//  - Search multiple archetype queries (YouTube is cheap).
//  - Strong hygiene (no shorts/compilations/full-match/etc).
//  - Heuristic pre-score to pick the BEST small set for Grok (expensive).
//  - Loop Grok scoring until TARGET_ACCEPTED or guardrails hit.
//  - Compact Grok prompt + optional comments enrichment only when confident.
//  - VERY VERBOSE LOGGING for CloudWatch debugging.

const axios = require('axios');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

// ================== CONFIG (override by env) ==================
const REGION                = process.env.YT_REGION || 'US';
const LANGS                 = (process.env.YT_LANGS || 'en').split(',').map(s => s.trim());
const YT_API                = 'https://www.googleapis.com/youtube/v3';

const MIN_SEC               = Number(process.env.MIN_SEC || 40);
const MAX_SEC               = Number(process.env.MAX_SEC || 120);
const FALLBACK_MIN_SEC      = Number(process.env.FALLBACK_MIN_SEC || 35);
const FALLBACK_MAX_SEC      = Number(process.env.FALLBACK_MAX_SEC || 140);

const SEARCH_ROUNDS         = Number(process.env.SEARCH_ROUNDS || 6);   // how many archetype queries per run
const MAX_CANDIDATES_TOTAL  = Number(process.env.MAX_CANDIDATES_TOTAL || 180); // cap all raw candidates
const MAX_RESULTS_PER_PAGE  = Number(process.env.MAX_RESULTS_PER_PAGE || 25);
const SEARCH_PAGES_PER_ROUND= Number(process.env.SEARCH_PAGES_PER_ROUND || 3);

const MAX_GROK_CALLS        = Number(process.env.MAX_GROK_CALLS || 12); // hard cap for spend
const MAX_TO_SCORE_PER_PASS = Number(process.env.MAX_TO_SCORE_PER_PASS || 6);  // per loop batch
const TARGET_ACCEPTED       = Number(process.env.TARGET_ACCEPTED || 10); // aim for this many inserts

const COMMENTS_TO_SCAN      = Number(process.env.COMMENTS_TO_SCAN || 2);
const ENRICH_MIN_CONF       = Number(process.env.ENRICH_MIN_CONF || 0.8);
const MAX_RUNTIME_MS        = Number(process.env.MAX_RUNTIME_MS || 35000); // safety against timeouts

// ================== HELPERS ==================
const addCors = (res) => ({
  ...res,
  headers: {
    'Access-Control-Allow-Origin': process.env.ACCESS_CONTROL_ALLOW_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
  },
});

function nowMs() { return Date.now(); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

// ISO 8601 PT#H#M#S -> seconds
function iso8601ToSeconds(iso) {
  const m = (iso || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = Number(m[1] || 0), mi = Number(m[2] || 0), s = Number(m[3] || 0);
  return h * 3600 + mi * 60 + s;
}

// Strong hygiene checks (title/desc)
function isBadText(t) {
  const x = (t || '').toLowerCase();
  return (
    x.includes('#shorts') ||
    x.includes('shorts') ||
    x.includes('compilation') ||
    x.includes('highlights') ||
    x.includes('extended highlights') ||
    x.includes('all goals') ||
    x.includes('full match') ||
    x.includes('full game') ||
    x.includes('skills') ||
    x.includes('tutorial') ||
    x.includes('how to') ||
    x.includes('reaction') ||
    x.includes('edit') ||
    x.includes('remix') ||
    x.includes('parody') ||
    x.includes('animation') ||
    x.includes('status') ||
    x.includes('whatsapp status') ||
    x.includes('gameplay') ||
    x.includes('efootball') ||
    x.includes('pes') ||
    x.includes('fifa')
  );
}

// Orientation + shortform + compilation flags from video object
function detectPreflags(v) {
  const title = (v.snippet?.title || '');
  const desc = (v.snippet?.description || '');
  const t = (title + ' ' + desc).toLowerCase();

  const looksCompilation = /compilation|highlights|all goals|best of|extended/i.test(t);
  const looksGaming = /fifa|efootball|pes|gameplay|mobile/i.test(t);
  const looksFullMatch = /full match|full game|90 minutes|extended match/i.test(t);
  const looksReupload = /reupload|original by|credit to/i.test(t);

  const th = v.snippet?.thumbnails?.high || v.snippet?.thumbnails?.standard || v.snippet?.thumbnails?.default || {};
  const orientationHint = (th.width && th.height) ? (th.height > th.width ? 'vertical' : 'horizontal') : 'unknown';
  const shortform_vertical = orientationHint === 'vertical' || /#shorts|shorts|vertical/i.test(t);

  const lowVisualQuality = (v.contentDetails?.definition || '').toLowerCase() === 'sd';

  return {
    compilation: !!looksCompilation,
    gaming: !!looksGaming,
    full_match: !!looksFullMatch,
    shortform_vertical: !!shortform_vertical,
    reupload_suspected: !!looksReupload,
    low_visual_quality: !!lowVisualQuality,
    orientation_hint: orientationHint
  };
}

// Engagement pre-rank
function engagementScore({ views, likes, comments }) {
  const v = Math.max(1, views);
  const lr = likes / v;
  const cr = comments / v;
  return (likes * 1.0) + (comments * 3.0) + (lr * 5000) + (cr * 10000);
}

function likeCommentRatios(stats) {
  const views = Math.max(1, Number(stats?.viewCount || 0));
  const likes = Number(stats?.likeCount || 0);
  const comments = Number(stats?.commentCount || 0);
  return {
    views, likes, comments,
    like_ratio: likes / views,
    comment_ratio: comments / views
  };
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Archetype queries (English-only)
const ARCHETYPE_QUERIES = [
  { key: 'bicycle_kick', queries: [
    'bicycle kick goal -compilation -highlights -shorts -skills -tutorial',
    'overhead kick goal -compilation -highlights -shorts -skills -tutorial',
    'scissor kick goal -compilation -highlights -shorts -skills -tutorial'
  ]},
  { key: 'volley', queries: [
    'volley goal -compilation -highlights -shorts -skills -tutorial',
    'half volley goal -compilation -highlights -shorts -skills -tutorial',
    'flying volley goal -compilation -highlights -shorts -skills -tutorial'
  ]},
  { key: 'free_kick', queries: [
    'free kick goal -compilation -highlights -shorts -skills -tutorial',
    'knuckleball free kick goal -compilation -highlights -shorts -tutorial',
    'curved free kick goal -compilation -highlights -shorts -tutorial'
  ]},
  { key: 'long_range', queries: [
    'long range goal -compilation -highlights -shorts -skills -tutorial',
    'from distance goal -compilation -highlights -shorts -skills -tutorial',
    'from midfield goal -compilation -highlights -shorts -skills -tutorial'
  ]},
  { key: 'team_goal', queries: [
    'team goal one touch -compilation -highlights -shorts -skills -tutorial',
    'counter attack goal -compilation -highlights -shorts -skills -tutorial',
    'tiki taka goal -compilation -highlights -shorts -skills -tutorial'
  ]},
  { key: 'solo_run', queries: [
    'solo run goal -compilation -highlights -shorts -skills -tutorial',
    'slalom dribble goal -compilation -highlights -shorts -skills -tutorial',
    'dribbled past defenders goal -compilation -highlights -shorts -skills -tutorial'
  ]},
  { key: 'chip', queries: [
    'chip goal -compilation -highlights -shorts -skills -tutorial',
    'scoop goal -compilation -highlights -shorts -skills -tutorial',
    'lob goal -compilation -highlights -shorts -skills -tutorial'
  ]},
  { key: 'backheel_rabona', queries: [
    'backheel goal -compilation -highlights -shorts -skills -tutorial',
    'rabona goal -compilation -highlights -shorts -skills -tutorial',
    'no look backheel goal -compilation -highlights -shorts -skills -tutorial'
  ]}
];

function pickArchetypeQuery() {
  const archetype = pick(ARCHETYPE_QUERIES);
  return { archetype: archetype.key, q: pick(archetype.queries) };
}

// ================== YOUTUBE ==================
async function youtubeSearchRound(youtubeKey, roundIdx) {
  const { archetype, q } = pickArchetypeQuery();
  const hl = pick(LANGS);
  let pageToken;
  const found = [];

  console.log(JSON.stringify({ phase: 'search_round.start', round: roundIdx, archetype, q, hl }));

  for (let i = 0; i < SEARCH_PAGES_PER_ROUND; i++) {
    const url = new URL(`${YT_API}/search`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', q);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', String(MAX_RESULTS_PER_PAGE));
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('regionCode', REGION);
    url.searchParams.set('relevanceLanguage', hl);
    url.searchParams.set('order', i === 0 ? 'relevance' : (i === 1 ? 'viewCount' : 'rating'));
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', youtubeKey);

    const r = await axios.get(url.toString());
    const items = r.data.items || [];
    pageToken = r.data.nextPageToken;

    const kept = [];
    for (const it of items) {
      const videoId = it.id?.videoId;
      if (!videoId) continue;
      const title = it.snippet?.title || '';
      const desc = it.snippet?.description || '';
      if (isBadText(title) || isBadText(desc)) continue;
      kept.push({ videoId, title, description: desc, archetype_hint: archetype });
    }
    found.push(...kept);

    console.log(JSON.stringify({ phase: 'search_page', round: roundIdx, page: i+1, items: items.length, kept: kept.length, pageToken: !!pageToken }));

    if (!pageToken) break;
  }

  console.log(JSON.stringify({ phase: 'search_round.end', round: roundIdx, totalFound: found.length }));
  return found;
}

async function hydrateVideos(youtubeKey, ids) {
  if (!ids.length) return [];
  const url = new URL(`${YT_API}/videos`);
  url.searchParams.set('part', 'contentDetails,statistics,snippet,status');
  url.searchParams.set('id', ids.join(','));
  url.searchParams.set('key', youtubeKey);
  const r = await axios.get(url.toString());
  return r.data.items || [];
}

function applyHygieneAndMap(rawItem, meta) {
  const durSec = iso8601ToSeconds(rawItem.contentDetails?.duration || 'PT0S');
  const emb = rawItem.status?.embeddable !== false;
  const title = rawItem.snippet?.title || '';
  const desc  = rawItem.snippet?.description || '';

  const pre = detectPreflags(rawItem);
  const stats = likeCommentRatios(rawItem.statistics);

  // Filter reasons (for logging)
  const reasons = [];
  if (!emb) reasons.push('not_embeddable');
  if (pre.compilation) reasons.push('compilation');
  if (pre.gaming) reasons.push('gaming');
  if (pre.full_match) reasons.push('full_match');
  if (pre.shortform_vertical) reasons.push('shortform');
  if (isBadText(title) || isBadText(desc)) reasons.push('bad_text');

  return {
    videoId: rawItem.id,
    title,
    description: desc,
    url: `https://www.youtube.com/watch?v=${rawItem.id}`,
    thumbnail_url: rawItem.snippet?.thumbnails?.high?.url || rawItem.snippet?.thumbnails?.default?.url || '',
    channel_name: rawItem.snippet?.channelTitle || '',
    upload_date: rawItem.snippet?.publishedAt || null,
    definition: rawItem.contentDetails?.definition || 'sd',
    orientation_hint: pre.orientation_hint,
    durSec,
    views: stats.views, likes: stats.likes, comment_count: stats.comments,
    like_ratio: stats.like_ratio, comment_ratio: stats.comment_ratio,
    preflags: {
      compilation: pre.compilation,
      gaming: pre.gaming,
      full_match: pre.full_match,
      shortform_vertical: pre.shortform_vertical,
      reupload_suspected: pre.reupload_suspected,
      low_visual_quality: pre.low_visual_quality
    },
    archetype_hint: meta?.archetype_hint || null,
    _filter_reasons: reasons
  };
}

// Heuristic pre-score (0..1) to pick best for Grok cheaply
function heuristicScore(c) {
  let s = 0;

  // Duration sweet spot (60–90)
  if (c.durSec >= 60 && c.durSec <= 90) s += 0.15;
  else if (c.durSec >= MIN_SEC && c.durSec <= MAX_SEC) s += 0.08;

  // Technique cues in title
  const t = c.title.toLowerCase();
  if (/(bicycle|overhead|scissor)/.test(t)) s += 0.18;
  if (/(volley|half[- ]?volley)/.test(t)) s += 0.15;
  if (/free kick|freekick|knuckle|curved/.test(t)) s += 0.15;
  if (/long range|from distance|from midfield|30 yards|40 yards/.test(t)) s += 0.12;
  if (/solo|dribble|slalom/.test(t)) s += 0.12;
  if (/chip|lob|dink|scoop/.test(t)) s += 0.10;
  if (/backheel|rabona/.test(t)) s += 0.10;
  if (/team goal|one[- ]?touch|tiki taka|counter attack/.test(t)) s += 0.12;

  // Context cues
  if (/final|semi[- ]?final|derby|clasico|world cup|champions league|ucl/.test(t)) s += 0.18;
  if (/\b19\d{2}\b|\b20\d{2}\b/.test(t)) s += 0.05; // year present
  if (/vs\.?| v /.test(t)) s += 0.04; // teams present

  // Engagement quality (not raw views)
  if (c.like_ratio >= 0.02) s += 0.08;
  else if (c.like_ratio >= 0.01) s += 0.04;

  if (c.comment_ratio >= 0.002) s += 0.05;

  // Penalize borderline quality
  if (c.preflags.low_visual_quality) s -= 0.04;

  return clamp(s, 0, 1);
}

// Entity recognition from title
function recognizeEntityFromTitle(title) {
  const t = title || '';
  let player = null, teamA = null, teamB = null, year = null;

  const p1 = t.match(/^(.+?)\s*[-–]\s*(.+?)\s+vs\.?\s+(.+?)\s*\((\d{4})\)/i);
  const p2 = t.match(/^(.+?)\s+vs\.?\s+(.+?)\s+(\d{4}).*[-–]\s*(.+)$/i);
  if (p1) { player = p1[1].trim(); teamA = p1[2].trim(); teamB = p1[3].trim(); year = p1[4]; }
  else if (p2) { teamA = p2[1].trim(); teamB = p2[2].trim(); year = p2[3]; player = p2[4].trim(); }

  let conf = 0;
  if (player) conf += 0.35;
  if (teamA && teamB) conf += 0.35;
  if (year) conf += 0.2;
  return { player, teamA, teamB, year, confidence: conf };
}

async function fetchTopComments(youtubeKey, videoId, max = COMMENTS_TO_SCAN) {
  try {
    const url = new URL(`${YT_API}/commentThreads`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('videoId', videoId);
    url.searchParams.set('maxResults', String(max));
    url.searchParams.set('order', 'relevance');
    url.searchParams.set('key', youtubeKey);
    const r = await axios.get(url.toString());
    const items = r.data?.items || [];
    return items.map(it => it.snippet?.topLevelComment?.snippet?.textDisplay || '').filter(Boolean);
  } catch {
    return [];
  }
}

function extractContextFromComments(comments) {
  const text = comments.join(' \n ').toLowerCase();
  const competition = /world cup|champions league|ucl|euro|copa america|la liga|premier league|serie a|bundesliga/.exec(text)?.[0] || null;
  const stage = /final|semi[-\s]?final|quarter[-\s]?final|derby|clasico|el clasico/.exec(text)?.[0] || null;
  const matchState = /(90\+|stoppage|last minute|equaliser|equalizer|winner)/.exec(text)?.[0] || null;
  const nickname = /banana free kick|scorpion|impossible goal|volley/.exec(text)?.[0] || null;
  const awards = /pusk[aá]s|goal of the (season|month|year)/.exec(text)?.[0] || null;

  let conf = 0;
  if (competition) conf += 0.2;
  if (stage) conf += 0.2;
  if (matchState) conf += 0.2;
  if (nickname) conf += 0.1;
  if (awards) conf += 0.1;

  return { competition, stage, matchState, nickname, awards, comments_evidence: comments.slice(0, 3), confidence: conf };
}

async function buildEnrichment(youtubeKey, vid) {
  const rec = recognizeEntityFromTitle(vid.title);
  let confidence = rec.confidence;

  if (confidence < (ENRICH_MIN_CONF - 0.15)) {
    // Title is weak—skip comments entirely to save quota
    return { entity_confidence: clamp(confidence, 0, 1), enrichment: null };
  }

  const comments = await fetchTopComments(youtubeKey, vid.videoId, COMMENTS_TO_SCAN);
  const ctx = extractContextFromComments(comments);
  confidence += ctx.confidence;

  const entity_confidence = clamp(confidence, 0, 1);
  if (entity_confidence < ENRICH_MIN_CONF) {
    return { entity_confidence, enrichment: null };
  }

  const enrichment = {
    recognized: true,
    player: rec.player || null,
    teams: [rec.teamA, rec.teamB].filter(Boolean),
    date_hint: rec.year || null,
    competition: ctx.competition || null,
    stage: ctx.stage || null,
    match_state: ctx.matchState || null,
    nickname: ctx.nickname || null,
    awards_hint: ctx.awards || null,
    comment_evidence: ctx.comments_evidence
  };

  return { entity_confidence, enrichment };
}

// ================== GROK ==================
function buildGrokPrompt(vid, ec, enr) {
  // Compact input to cut tokens (short keys)
  const inp = {
    dur: vid.durSec,
    ttl: vid.title,
    desc: (vid.description || '').slice(0, 400).replace(/\s+/g, ' ').trim(),
    v: vid.views, l: vid.likes, c: vid.comment_count,
    ch: vid.channel_name, up: vid.upload_date,
    arch: vid.archetype_hint || null,
    pf: { ...vid.preflags }, // compilation/gaming/full_match/shortform/reupload/low_visual_quality
    rat: { lr: vid.like_ratio, cr: vid.comment_ratio },
    or: vid.orientation_hint,
    ec: ec,
    enr: enr
  };

  // Super-compact rubric + schema
  const rules = `Judge SINGLE football goals for ICONIC potential (embed-friendly). Disqualify => score=0: compilation|gaming|full-match|shortform/vertical|tutorial/reaction|blatant reupload.
Base (10): tech(0-2), drama(0-1.5), clarity(0-1.5), unique(0-2), iconic_name(0-1), embed(0-1).
Fan mods sum clamp [-2.5, +2.5]: match_import(+1.5), opp_quality(+0.5), pressure(+0.5/-0.3), shot_micro(+0.5), xg(+0.8/-0.5), buildup(+0.5), culture(+0.5), era(+0.3), fairplay(0/-1).
Do NOT punish older footage if reasonably clear. If ec>=0.7 and enr present, trust enr for competition/stage/date/opp_quality/match_state/awards.
Return STRICT JSON ONLY:
{"score":n,"reason":"<=220 chars","tags":[...],
"flags":{"compilation":b,"gaming":b,"full_match":b,"shortform_vertical":b,"reupload_suspected":b,"low_visual_quality":b,"keeper_error_likely":b},
"sub_scores":{"technique_quality":n,"drama_context":n,"visual_clarity":n,"uniqueness_originality":n,"iconic_name_bonus":n,"embed_friendliness":n},
"modifiers":{"match_importance_game_state":n,"opponent_quality":n,"under_pressure":n,"shot_difficulty_micro":n,"xg_signal":n,"buildup_quality":n,"cultural_imprint":n,"era_pitch_weather":n,"fairplay_not_luck":n},
"confidence":n}`;

  return `INPUT:${JSON.stringify(inp)}\n\n${rules}`;
}

// ================== LAMBDA CLIENT ==================
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });

// ================== MAIN HANDLER ==================
exports.handler = async (event) => {
  if (event?.httpMethod === 'OPTIONS') return addCors({ statusCode: 200, body: '' });

  const started = nowMs();

  try {
    const youtubeKey  = process.env.YOUTUBE_API_KEY;
    const xaiKey      = process.env.XAI_API_KEY;
    const dbHandlerArn= process.env.DB_FSHandler_ARN;

    if (!youtubeKey || !xaiKey || !dbHandlerArn) {
      throw new Error('Missing env vars: YOUTUBE_API_KEY, XAI_API_KEY, or DB_FSHandler_ARN');
    }

    console.log(JSON.stringify({
      phase: 'init',
      REGION, LANGS, MIN_SEC, MAX_SEC, FALLBACK_MIN_SEC, FALLBACK_MAX_SEC,
      SEARCH_ROUNDS, MAX_CANDIDATES_TOTAL, MAX_GROK_CALLS, TARGET_ACCEPTED,
      COMMENTS_TO_SCAN, ENRICH_MIN_CONF, MAX_RUNTIME_MS
    }));

    // -------- Gather candidates across multiple rounds (cheap) --------
    const dedup = new Set();
    let shallow = []; // from search
    for (let r = 0; r < SEARCH_ROUNDS; r++) {
      if (nowMs() - started > MAX_RUNTIME_MS * 0.6) { // leave time for Grok + DB
        console.log(JSON.stringify({ phase: 'search_stop', reason: 'runtime_guard' }));
        break;
      }
      const roundFound = await youtubeSearchRound(youtubeKey, r);
      for (const f of roundFound) {
        if (!dedup.has(f.videoId)) {
          dedup.add(f.videoId);
          shallow.push(f);
        }
      }
      if (shallow.length >= MAX_CANDIDATES_TOTAL) break;
    }
    console.log(JSON.stringify({ phase: 'search_summary', uniqueFound: shallow.length }));

    // -------- Hydrate in chunks (contentDetails + stats) --------
    let hydrated = [];
    for (let i = 0; i < shallow.length; i += 50) {
      const batch = shallow.slice(i, i + 50);
      const ids = batch.map(b => b.videoId);
      const vids = await hydrateVideos(youtubeKey, ids);
      const mapped = vids.map(v => {
        const meta = batch.find(b => b.videoId === v.id);
        return applyHygieneAndMap(v, meta);
      });

      // Log filtering reasons
      const reasonsCount = {};
      for (const m of mapped) {
        if (m._filter_reasons.length) {
          m._filter_reasons.forEach(r => { reasonsCount[r] = (reasonsCount[r] || 0) + 1; });
        }
      }
      console.log(JSON.stringify({ phase: 'hydrate_batch', idx: i/50+1, size: batch.length, mapped: mapped.length, reasonsCount }));

      hydrated.push(...mapped.filter(m => m._filter_reasons.length === 0));
    }
    console.log(JSON.stringify({ phase: 'hydrate_summary', afterHygiene: hydrated.length }));

    // -------- Duration window with fallback --------
    let inWindow = hydrated.filter(c => c.durSec >= MIN_SEC && c.durSec <= MAX_SEC);
    if (inWindow.length < Math.min(12, MAX_CANDIDATES_TOTAL / 10)) {
      const widened = hydrated.filter(c => c.durSec >= FALLBACK_MIN_SEC && c.durSec <= FALLBACK_MAX_SEC);
      console.log(JSON.stringify({ phase: 'duration_fallback', prev: inWindow.length, widened: widened.length }));
      inWindow = widened;
    }
    console.log(JSON.stringify({ phase: 'duration_summary', kept: inWindow.length }));

    // -------- Heuristic pre-score & sort (cheap) --------
    inWindow.forEach(c => { c._eng = engagementScore({ views: c.views, likes: c.likes, comments: c.comment_count }); c._heur = heuristicScore(c); });
    inWindow.sort((a, b) => (b._heur - a._heur) || (b._eng - a._eng));

    console.log(JSON.stringify({
      phase: 'heuristic_summary',
      topPreview: inWindow.slice(0, 5).map(v => ({ id: v.videoId, ttl: v.title.slice(0,80), heur: v._heur.toFixed(3), lr: v.like_ratio.toFixed(4), cr: v.comment_ratio.toFixed(4) }))
    }));

    // -------- Grok loop (expensive) --------
    const xaiHeaders = { Authorization: `Bearer ${process.env.XAI_API_KEY}`, 'Content-Type': 'application/json' };

    let accepted = 0, grokCalls = 0, processed = 0;
    let cursor = 0;

    while (accepted < TARGET_ACCEPTED && grokCalls < MAX_GROK_CALLS && cursor < inWindow.length) {
      if (nowMs() - started > MAX_RUNTIME_MS * 0.95) {
        console.log(JSON.stringify({ phase: 'grok_stop', reason: 'runtime_guard' }));
        break;
      }

      const slice = inWindow.slice(cursor, cursor + MAX_TO_SCORE_PER_PASS);
      cursor += MAX_TO_SCORE_PER_PASS;

      console.log(JSON.stringify({ phase: 'grok_batch.start', batchSize: slice.length, cursor, grokCalls }));

      // Enrichment only when confident from title; comments called only if near threshold
      const enriched = [];
      for (const vid of slice) {
        const rec = recognizeEntityFromTitle(vid.title);
        const baseConf = rec.confidence;
        if (baseConf >= (ENRICH_MIN_CONF - 0.15)) {
          const { entity_confidence, enrichment } = await buildEnrichment(youtubeKey, vid);
          enriched.push({ vid, ec: entity_confidence, enr: enrichment });
        } else {
          enriched.push({ vid, ec: baseConf, enr: null });
        }
      }

      // Score with Grok
      for (const { vid, ec, enr } of enriched) {
        if (grokCalls >= MAX_GROK_CALLS) break;

        const prompt = buildGrokPrompt(vid, ec, enr);
        let grokJSON = null;
        try {
          const res = await axios.post(
            'https://api.x.ai/v1/chat/completions',
            { model: 'grok-4', messages: [{ role: 'user', content: prompt }], temperature: 0.05 },
            { headers: xaiHeaders }
          );
          const content = res.data?.choices?.[0]?.message?.content || '{}';
          grokJSON = JSON.parse(content);
        } catch (e) {
          console.log(JSON.stringify({ phase: 'grok_error', id: vid.videoId, msg: e?.message || 'parse_fail' }));
          grokCalls++;
          continue;
        }
        grokCalls++;

        const flags = grokJSON.flags || {};
        const score = typeof grokJSON.score === 'number' ? grokJSON.score : 0;
        const acceptedThis =
          score >= 6.5 &&
          flags.compilation !== true &&
          flags.gaming !== true &&
          flags.full_match !== true &&
          flags.shortform_vertical !== true;

        console.log(JSON.stringify({
          phase: 'grok_result',
          id: vid.videoId, score, accepted: acceptedThis,
          flags: { comp: !!flags.compilation, game: !!flags.gaming, full: !!flags.full_match, short: !!flags.shortform_vertical }
        }));

        if (!acceptedThis) continue;

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
          ai_reason: String(grokJSON.reason || '').slice(0, 1000),
          tags: grokJSON.tags || [],
          flags,
          sub_scores: grokJSON.sub_scores || {},
          modifiers: grokJSON.modifiers || {},
          confidence: grokJSON.confidence ?? null,
          enrichment: enr
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

          const inserted = payload.statusCode === 200 && (body?.inserted || body?.message === 'Suggestion added');
          console.log(JSON.stringify({ phase: 'db_write', id: vid.videoId, inserted, dbStatus: payload.statusCode, dbMsg: body?.message || null }));
          if (inserted) { accepted++; processed++; }
        } catch (e) {
          console.log(JSON.stringify({ phase: 'db_error', id: vid.videoId, msg: e?.message }));
        }
        if (accepted >= TARGET_ACCEPTED) break;
      }

      console.log(JSON.stringify({ phase: 'grok_batch.end', acceptedSoFar: accepted, grokCalls }));
    }

    const elapsed = nowMs() - started;
    console.log(JSON.stringify({ phase: 'done', accepted, grokCalls, elapsed_ms: elapsed }));

    return addCors({ statusCode: 200, body: JSON.stringify({ message: 'Suggestions generated', accepted, grokCalls, elapsed_ms: elapsed }) });
  } catch (err) {
    console.error('Fatal error:', err.message, err.response?.data || {});
    return addCors({ statusCode: 500, body: JSON.stringify({ error: 'Server error', details: err.message }) });
  }
};
