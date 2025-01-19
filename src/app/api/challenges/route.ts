import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export async function POST(request: Request) {
  console.log('POST /api/challenges - Start');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);

    const { title } = body;

    if (!title) {
      console.log('Title is missing');
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    console.log('Generating invite code...');
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log('Generated invite code:', inviteCode);

    console.log('Inserting into Supabase...');
    const { data, error } = await supabaseAdmin
      .from('challenges')
      .insert([
        { 
          title, 
          invite_code: inviteCode 
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      console.error('No data returned from insert');
      return NextResponse.json(
        { error: 'Failed to create challenge' },
        { status: 500 }
      );
    }

    console.log('Successfully created challenge:', data);
    return NextResponse.json({ challenge: data }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
