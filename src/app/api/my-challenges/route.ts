import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export async function GET(request: Request) {
  console.log('GET /api/my-challenges - Start');

  try {
    const participantKey = request.headers.get('participant-key');

    if (!participantKey) {
      return NextResponse.json(
        { error: 'Participant key is required' },
        { status: 401 }
      );
    }

    // First get the participant's challenges
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('challenge_id')
      .eq('participant_key', participantKey)
      .single();

    if (participantError) {
      console.error('Participant lookup error:', participantError);
      return NextResponse.json(
        { error: 'Failed to find participant' },
        { status: 404 }
      );
    }

    // Then get the challenge details
    const { data: challenges, error: challengesError } = await supabaseAdmin
      .from('challenges')
      .select('id, title, invite_code')
      .eq('id', participant.challenge_id);

    if (challengesError) {
      console.error('Challenges lookup error:', challengesError);
      return NextResponse.json(
        { error: 'Failed to fetch challenges' },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenges });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 