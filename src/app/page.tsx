'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Challenge {
  id: string;
  title: string;
  invite_code: string;
}

export default function Home() {
  const [joinedChallenges, setJoinedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchJoinedChallenges = async () => {
      const participantKeys = JSON.parse(localStorage.getItem('participantKeys') || '{}');
      if (Object.keys(participantKeys).length > 0) {
        try {
          const allChallenges = [];
          for (const [, participantKey] of Object.entries(participantKeys)) {
            const response = await fetch('/api/my-challenges', {
              headers: {
                'participant-key': participantKey as string
              }
            });
            const data = await response.json();
            if (response.ok && data.challenges) {
              allChallenges.push(...data.challenges);
            }
          }
          // Remove duplicates based on challenge ID
          const uniqueChallenges = Array.from(
            new Map(allChallenges.map(c => [c.id, c])).values()
          );
          setJoinedChallenges(uniqueChallenges);
        } catch (error) {
          console.error('Error fetching challenges:', error);
        }
      }
      setLoading(false);
    };

    fetchJoinedChallenges();
  }, []);

  const handleJoinChallenge = () => {
    const code = prompt('Enter invite code to join a challenge:');
    if (code) {
      router.push(`/challenges/${code}/join`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center py-12 space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold">
            Welcome to Better Than You!
          </h1>
          <p className="text-xl text-gray-300">
            Challenge your friends and track your daily goals together.
          </p>
          
          {/* Main Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/create-challenge"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold"
            >
              Create a Challenge
            </Link>
            
            <button
              onClick={handleJoinChallenge}
              className="px-8 py-3 bg-gray-800 text-white border-2 border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-lg font-semibold"
            >
              Join with Code
            </button>
          </div>

          {/* Joined Challenges */}
          {loading ? (
            <div className="text-center text-gray-400">Loading your challenges...</div>
          ) : joinedChallenges.length > 0 ? (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Your Challenges</h2>
              <div className="grid gap-4 max-w-2xl mx-auto">
                {joinedChallenges.map(challenge => (
                  <Link
                    key={challenge.id}
                    href={`/challenges/${challenge.invite_code}`}
                    className="block bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{challenge.title}</span>
                      <span className="text-gray-400 text-sm">View Challenge →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-8">
              You havent joined any challenges yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
