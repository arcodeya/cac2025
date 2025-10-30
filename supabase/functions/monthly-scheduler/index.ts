const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { schedulerKey } = await req.json();
    
    // Simple authentication check
    const expectedKey = Deno.env.get('SCHEDULER_SECRET_KEY') || 'default-scheduler-key';
    
    if (schedulerKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we should run (first day of month)
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    // Allow manual trigger or automatic on day 1
    const shouldRun = dayOfMonth === 1 || req.headers.get('X-Force-Run') === 'true';

    if (!shouldRun) {
      return new Response(
        JSON.stringify({ 
          message: 'Not scheduled to run today',
          nextRun: getNextRunDate(),
          currentDate: today.toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trigger the data collector
    const collectorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/data-collector`;
    const collectorResponse = await fetch(collectorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
    });

    const collectorResult = await collectorResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        triggered: true,
        collectionResult: collectorResult,
        timestamp: today.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getNextRunDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}