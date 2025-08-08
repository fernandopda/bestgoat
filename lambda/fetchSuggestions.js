const axios = require('axios');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda'); // AWS SDK for invoking the DB handler Lambda
require("dotenv").config();

// Helper function to add CORS headers to responses for cross-origin requests (e.g., from frontend)
const addCors = (res) => ({
  ...res,
  headers: {
    "Access-Control-Allow-Origin": process.env.ACCESS_CONTROL_ALLOW_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  },
});

// Initialize Lambda client with region from environment variable or default
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Main Lambda handler function
exports.handler = async (event) => {
  // Handle CORS preflight requests (OPTIONS method)
  if (event.httpMethod === "OPTIONS") {
    return addCors({ statusCode: 200, body: "" });
  }

  try {
    // Load environment variables for API keys
    const youtubeKey = process.env.YOUTUBE_API_KEY;
    const xaiKey = process.env.XAI_API_KEY;

    // Validate required environment variables
    if (!youtubeKey || !xaiKey) {
      throw new Error('Missing API keys: YOUTUBE_API_KEY or XAI_API_KEY');
    }

    // Define the YouTube search query for iconic football goals, excluding tutorials and compilations
    const query = '("amazing goal" OR "best goal" OR "iconic goal" OR "one of the best goals" OR "unbelievable goal") football -tutorial -compilation';
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=5&publishedAfter=2020-01-01T00:00:00Z&key=${youtubeKey}`;

    console.log('Starting YouTube search...');
    const searchResponse = await axios.get(searchUrl);
    const videos = searchResponse.data.items || [];
    console.log('YouTube search complete, found', videos.length, 'videos');

    let processed = 0;

    // Process videos in parallel for efficiency
    await Promise.all(videos.map(async (video) => {
      const videoId = video.id.videoId;
      console.log('Processing video:', videoId);

      // Fetch stats (views, likes, comments count)
      let stats = { viewCount: 0, likeCount: 0, commentCount: 0 };
      try {
        console.log('Fetching stats for', videoId);
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${youtubeKey}`;
        stats = (await axios.get(statsUrl)).data.items[0]?.statistics || stats;
        console.log('Stats fetched for', videoId, 'views:', stats.viewCount);
      } catch (statsErr) {
        console.error(`Stats error for ${videoId}:`, statsErr.message);
        return; // Skip this video on error
      }

      const views = parseInt(stats.viewCount || 0);
      const likes = parseInt(stats.likeCount || 0);
      const commentCount = parseInt(stats.commentCount || 0);

      // Fetch up to 20 relevant comments if available
      let commentsText = '';
      if (commentCount > 0) {
        try {
          console.log('Fetching comments for', videoId);
          const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${youtubeKey}`;
          commentsText = (await axios.get(commentsUrl)).data.items
            ?.map(thread => thread.snippet.topLevelComment.snippet.textDisplay)
            .join(' ').substring(0, 2000) || '';
          console.log('Comments fetched for', videoId);
        } catch (commErr) {
          console.error(`Comments error for ${videoId}:`, commErr.message);
        }
      }

      // Prepare prompt for Grok AI analysis
      const prompt = `You are an AI agent curating iconic football goals like Maradona's 1986 dribble, Zidane's 2002 volley, or Roberto Carlos' 1997 free-kick. Analyze: Title: "${video.snippet.title}", Desc: "${video.snippet.description.substring(0, 500)}", Views: ${views}, Likes: ${likes}, Comments: "${commentsText}". Assume the link is valid since data was successfully fetched; if any data is missing, it might indicate a broken link—score 0 in that case. Estimate if the video length is around 1 minute (30-120 seconds ideal for short clips) based on the title, description, and comments (e.g., mentions of "highlight," "clip," or specific timings); lower score if it seems like a long match replay or compilation. Check if this goal is a repeat of any existing curated goals; if the title or description matches or describes the same event, score 0 to avoid duplicates. Existing goals include: Roberto Carlos - Thunderbolt Strike vs Tenerife (1998), Zlatan Ibrahimovic - Ajax vs Breda (2004), Diego Maradona - Argentina vs England (1986), Zlatan Ibrahimovic - Sweden vs England (2012), Neymar - Santos vs Flamengo (2011), George Weah - AC Milan VS Verona (1996), Dennis Bergkamp - Arsenal vs New Castle (2002), Cantona - Manchester United vs Sunderland (1996), Van Basten - Netherlands vs Soviet Union (1988), Carlos Alberto - Brazil vs Italy (1970), Lionel Messi - Barcelona vs Getafe (2007), Cristiano Ronaldo - Real Madrid vs Juventus (2018), Ronaldinho - Barcelona vs Sevilla (2003), Zinedine Zidane's - Real Madrid vs Bayer Leverkusen (2002), Trevor Sinclair's - QPR vs Barnsley (1997), Roberto Carlos - Brazil vs France (1997), Tony Yeboah's - Leeds vs Liverpool (1995), Nayim's - Real Zaragoza vs Arsenal (1995), Cristiano Ronaldo - Manchester United vs FC Porto (2009), Wayne Rooney - Manchester United vs Manchester City (2011), James Rodriguez - Colombia vs Uruguay (2014), Olivier Giroud - Arsenal vs Crystal Palace (2017), Clarence Seedorf - Real Madrid vs Atletico Madrid (1997), Paolo Di Canios - West Ham vs Wimbledon (2000), Paul Pogba - Juventus vs Udinese (2015), Lionel Messi - Barcelona vs Real Madrid (2011), Son Heungmin - Spurs vs Burley (2019), Robin Van Persie - Arsenal vs Charlton Athletic (2006), Peter Crouch - Stoke City vs Manchester City (2012), Cristiano Ronaldo - Manchester United vs Portsmouth (2008), Quaresma - Portugal vs Iran (2018), Juninho - Lyon vs Ajaccio (2006), Pavard - France vs Argentina (2018), Ronaldinho - Brazil vs England (2002), Ronaldo - Manchester United vs Arsenal (2009), Van Persie - Netherlands vs Spain (2014), Messi - Barcelona vs Bayer, Wilshere - Arsenal vs Norwich city (2013), Ronaldinho - PSG vs Chelsea (2005), Bale - Real Madrid vs Liverpool (2018). Rate 0-10 for relevance to iconic goals (technique, impact, sentiment like "best ever"), factoring in the above checks. Explain briefly, mentioning any deductions for length, duplicates, or broken links. Output strict JSON: {"score": number, "reason": string}`;

      let score = 0;
      let reason = 'Analysis failed';
      try {
        console.log('Sending to Grok for analysis:', videoId);
        const grokRes = await axios.post('https://api.x.ai/v1/chat/completions', {
          model: 'grok-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
        }, { headers: { Authorization: `Bearer ${xaiKey}`, 'Content-Type': 'application/json' } });
        const output = JSON.parse(grokRes.data.choices[0].message.content || '{}');
        score = output.score || 0;
        reason = output.reason || 'No reason provided';
        console.log('Grok analysis complete for', videoId, 'score:', score, 'reason:', reason);
        // Validate Grok response
        if (typeof score !== 'number' || score < 0 || score > 10 || !reason) {
          console.error(`Invalid Grok response for ${videoId}: score=${score}, reason=${reason}`);
          return;
        }
      } catch (grokErr) {
        console.error(`Grok error for ${videoId}:`, grokErr.message);
        return;
      }

      // If score meets threshold (0 for testing), prepare data and invoke DB handler
      if (score >= 0) {
        const suggestionData = {
          videoId,
          title: video.snippet.title || 'Untitled',
          description: video.snippet.description || '',
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail_url: video.snippet.thumbnails.default?.url || '',
          views,
          likes,
          comment_count: commentCount,
          score,
          ai_reason: reason,
        };

        try {
          console.log('Invoking DB handler for', videoId, 'with data:', JSON.stringify(suggestionData));
          const invokeParams = {
            FunctionName: process.env.DB_FSHandler_ARN,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({ action: 'insertIfNotExists', data: suggestionData }),
          };
          const command = new InvokeCommand(invokeParams);
          const response = await lambdaClient.send(command);
          const payload = JSON.parse(Buffer.from(response.Payload).toString());
          const body = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
          if (payload.statusCode === 200 && body.inserted) {
            processed++;
            console.log(`Successfully inserted ${videoId}`);
          } else {
            console.error(`DB insert failed for ${videoId}:`, body.error || body.message || 'Unknown error');
          }
          console.log('DB invoke response for', videoId, ':', JSON.stringify(payload));
        } catch (invokeErr) {
          console.error(`Invoke error for ${videoId}:`, invokeErr.message);
        }
      }
    }));

    // Return success response with count of processed suggestions
    return addCors({
      statusCode: 200,
      body: JSON.stringify({ message: 'Suggestions generated', count: processed }),
    });
  } catch (err) {
    console.error('Error:', err.message, err.response?.data || {});
    return addCors({
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', details: err.message }),
    });
  }
};