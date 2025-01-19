import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

interface ApiError extends Error {
  message: string;
  status?: number;
}

export async function POST(request: Request) {
  try {
    const { participantKey, description, points } = await request.json();

    // Get participant info
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id, challenge_id')
      .eq('participant_key', participantKey)
      .single();

    if (participantError || !participant) {
      throw new Error('Participant not found');
    }

    // Create the goal
    const { data: goal, error: goalError } = await supabaseAdmin
      .from('daily_goals')
      .insert({
        challenge_id: participant.challenge_id,
        participant_id: participant.id,
        description,
        points: points || 1
      })
      .select()
      .single();

    if (goalError || !goal) {
      throw new Error('Failed to create goal');
    }

    return NextResponse.json(goal);
  } catch (err) {
    const error = err as ApiError;
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: error.status || 500 }
    );
  }
}
