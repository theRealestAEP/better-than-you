import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export async function POST(request: Request) {
  console.log('POST /api/participants - Start');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);

    const { inviteCode, name } = body;

    if (!inviteCode || !name) {
      console.error('Missing required fields:', { inviteCode, name });
      return NextResponse.json(
        { error: 'Invite code and name are required' },
        { status: 400 }
      );
    }

    console.log('Finding challenge by invite code:', inviteCode);
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('id')
      .eq('invite_code', inviteCode)
      .single();

    if (challengeError) {
      console.error('Challenge lookup error:', challengeError);
      return NextResponse.json(
        { error: 'Failed to find challenge' },
        { status: 400 }
      );
    }

    if (!challenge) {
      console.error('No challenge found for invite code:', inviteCode);
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    console.log('Found challenge:', challenge);

    // Generate a unique participantKey
    const participantKey = Math.random().toString(36).substring(2) + Date.now().toString(36);
    console.log('Generated participant key');

    // Insert participant
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .insert([
        {
          challenge_id: challenge.id,
          name,
          participant_key: participantKey
        }
      ])
      .select()
      .single();

    if (participantError) {
      console.error('Participant creation error:', participantError);
      return NextResponse.json(
        { error: 'Failed to create participant' },
        { status: 500 }
      );
    }

    if (!participant) {
      console.error('No participant data returned after insert');
      return NextResponse.json(
        { error: 'Failed to create participant' },
        { status: 500 }
      );
    }

    console.log('Successfully created participant');
    return NextResponse.json({ participant }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
