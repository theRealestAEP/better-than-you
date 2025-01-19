'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface Props {
  params: Promise<{
    inviteCode: string;
  }>;
}

export default function JoinChallenge({ params }: Props) {
  const { inviteCode } = use(params);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join challenge');
      }

      if (!data.participant?.participant_key) {
        throw new Error('No participant key received');
      }

      // Store multiple participant keys
      const existingKeys = JSON.parse(localStorage.getItem('participantKeys') || '{}');
      existingKeys[inviteCode] = data.participant.participant_key;
      localStorage.setItem('participantKeys', JSON.stringify(existingKeys));
      
      // Set current participant key
      localStorage.setItem('currentParticipantKey', data.participant.participant_key);

      // Redirect to the challenge page
      router.push(`/challenges/${inviteCode}`);
    } catch (error) {
      console.error('Error joining challenge:', error);
      alert('Failed to join challenge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Join Challenge</h1>
          <p className="mt-2 text-gray-600">
            Invite Code: <span className="font-mono font-bold">{inviteCode}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your name"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Joining...' : 'Join Challenge'}
          </button>
        </form>
      </div>
    </div>
  );
}
