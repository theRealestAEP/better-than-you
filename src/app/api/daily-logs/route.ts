import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

interface LogData {
  id?: string;
  challenge_id: string;
  participant_id: string;
  goal_id: string;
  date: string;
  achieved: boolean;
  points_earned: number;
}

export async function POST(request: Request) {
  console.log('POST /api/daily-logs - Start');
  try {
    const { participantKey, goalId, date, achieved } = await request.json();
    console.log('Request body:', { participantKey, goalId, date, achieved });

    // 1. Verify participant
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('participant_key', participantKey)
      .single();

    if (participantError || !participant) {
      console.error('Participant not found:', participantError);
      return NextResponse.json({ error: 'Participant not found.' }, { status: 400 });
    }

    // 2. Get the goal to know the points value
    const { data: goal, error: goalError } = await supabaseAdmin
      .from('daily_goals')
      .select('points')
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      console.error('Goal not found:', goalError);
      return NextResponse.json({ error: 'Goal not found.' }, { status: 400 });
    }

    const challengeId = participant.challenge_id;
    const participantId = participant.id;

    // 3. Check if a log already exists for this goal and date
    const { data: existingLog } = await supabaseAdmin
      .from('daily_logs')
      .select('*')
      .eq('goal_id', goalId)
      .eq('date', date)
      .eq('participant_id', participantId)
      .single();

    console.log('Existing log:', existingLog);

    // 4. Insert or update daily log
    const logData: LogData = {
      challenge_id: challengeId,
      participant_id: participantId,
      goal_id: goalId,
      date,
      achieved,
      points_earned: achieved ? goal.points : 0
    };

    if (existingLog?.id) {
      logData.id = existingLog.id;
    }

    console.log('Upserting log with data:', logData);

    const { data: dailyLog, error: logError } = await supabaseAdmin
      .from('daily_logs')
      .upsert(logData)
      .select()
      .single();

    if (logError) {
      console.error('Error upserting log:', logError);
      return NextResponse.json({ error: logError.message }, { status: 400 });
    }

    console.log('Successfully updated log:', dailyLog);
    return NextResponse.json({ dailyLog }, { status: 201 });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
