import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { participantKey, goalId, points } = await request.json();

    // Verify participant
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id, challenge_id')
      .eq('participant_key', participantKey)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the goal to verify it's not the participant's own goal
    const { data: goal, error: goalError } = await supabaseAdmin
      .from('daily_goals')
      .select('participant_id')
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Don't allow participants to modify their own goals' points
    if (goal.participant_id === participant.id) {
      return NextResponse.json(
        { error: 'Cannot modify points for your own goals' },
        { status: 403 }
      );
    }

    // Update the goal points
    const { error: updateError } = await supabaseAdmin
      .from('daily_goals')
      .update({ points })
      .eq('id', goalId);

    if (updateError) {
      console.error('Error updating goal points:', updateError);
      return NextResponse.json(
        { error: 'Failed to update goal points' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/daily-goals/points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 