import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

interface ApiError extends Error {
  message: string;
  status?: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await context.params;
  console.log('GET /api/challenge/[inviteCode]', { inviteCode });

  try {
    // 1. Get challenge by inviteCode
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('id, title, invite_code, created_at')
      .eq('invite_code', inviteCode)
      .single();

    if (challengeError) {
      console.error('Challenge error:', challengeError);
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (!challenge) {
      console.error('No challenge found for invite code:', inviteCode);
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // 2. Get participants in this challenge
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('participants')
      .select('id, name, participant_key, created_at')
      .eq('challenge_id', challenge.id);

    if (participantsError) {
      console.error('Participants error:', participantsError);
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }

    // 3. Get daily goals for this challenge
    const { data: goals, error: goalsError } = await supabaseAdmin
      .from('daily_goals')
      .select('*')
      .eq('challenge_id', challenge.id);

    if (goalsError) {
      console.error('Goals error:', goalsError);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    // 4. Get daily logs for this challenge
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('daily_logs')
      .select('*')
      .eq('challenge_id', challenge.id);

    if (logsError) {
      console.error('Logs error:', logsError);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // 5. Return all data
    return NextResponse.json({
      challenge,
      participants,
      goals: goals || [],
      logs: logs || []
    });
  } catch (err) {
    const error = err as ApiError;
    console.error(error);
    return NextResponse.json({ error: error.message || 'Something went wrong.' }, { status: error.status || 500 });
  }
}
