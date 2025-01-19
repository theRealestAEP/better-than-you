import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';


export async function POST(request: Request) {
  try {
    const { participantKey, description, points } = await request.json();

    // 1. Find the participant by participantKey
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('participant_key', participantKey)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Participant not found.' }, { status: 400 });
    }

    const challengeId = participant.challenge_id;
    const participantId = participant.id;

    // 2. Insert daily goal
    const { data: dailyGoal, error: goalError } = await supabaseAdmin
      .from('daily_goals')
      .insert([
        {
          challenge_id: challengeId,
          participant_id: participantId,
          description,
          points
        }
      ])
      .single();

    if (goalError) {
      console.error(goalError);
      return NextResponse.json({ error: goalError.message }, { status: 400 });
    }

    return NextResponse.json({ dailyGoal }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
