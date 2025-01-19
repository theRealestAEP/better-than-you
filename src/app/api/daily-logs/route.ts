import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

interface ApiError extends Error {
  message: string;
  status?: number;
}

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
      .select('id, challenge_id')
      .eq('participant_key', participantKey)
      .single();

    if (participantError || !participant) {
      throw new Error('Participant not found');
    }

    // 2. Get the goal to know the points value
    const { data: goal, error: goalError } = await supabaseAdmin
      .from('daily_goals')
      .select('id, points')
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      throw new Error('Goal not found');
    }

    // 3. Check if a log already exists for this goal and date
    const { data: existingLog } = await supabaseAdmin
      .from('daily_logs')
      .select('id')
      .eq('goal_id', goalId)
      .eq('date', date)
      .single();

    // 4. Insert or update daily log
    const logData: LogData = {
      challenge_id: participant.challenge_id,
      participant_id: participant.id,
      goal_id: goalId,
      date,
      achieved,
      points_earned: achieved ? goal.points : 0
    };

    if (existingLog?.id) {
      logData.id = existingLog.id;
    }

    const { data: dailyLog, error: upsertError } = await supabaseAdmin
      .from('daily_logs')
      .upsert(logData)
      .select()
      .single();

    if (upsertError || !dailyLog) {
      throw new Error('Failed to update log');
    }

    return NextResponse.json(dailyLog);
  } catch (err) {
    const error = err as ApiError;
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: error.status || 500 }
    );
  }
}
