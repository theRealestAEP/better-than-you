'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';

interface Props {
  params: Promise<{
    inviteCode: string;
    day: string;
  }>;
}

interface Goal {
  id: string;
  participant_id: string;
  description: string;
  points: number;
}

interface Log {
  id: string;
  goal_id: string;
  participant_id: string;
  date: string;
  achieved: boolean;
  points_earned: number;
}

interface Participant {
  id: string;
  name: string;
  participant_key: string;
}

export default function DayDetailPage({ params }: Props) {
  const { inviteCode, day } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const router = useRouter();

  const fetchDayData = useCallback(async () => {
    try {
      const response = await fetch(`/api/challenge/${inviteCode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch challenge data');
      }

      setGoals(data.goals);
      const dayLogs = data.logs.filter((log: Log) => log.date === day);
      setLogs(dayLogs);
      setParticipants(data.participants);
      setCurrentParticipant(data.participants.find((p: Participant) => p.participant_key === localStorage.getItem('currentParticipantKey')));
    } catch (error) {
      console.error('Error fetching day data:', error);
      alert('Failed to load day data');
    } finally {
      setLoading(false);
    }
  }, [inviteCode, day]);

  useEffect(() => {
    const participantKey = localStorage.getItem('currentParticipantKey');
    if (!participantKey) {
      router.push(`/challenges/${inviteCode}/join`);
      return;
    }
    fetchDayData();
  }, [inviteCode, day, router]);

  async function handleToggleAchievement(goalId: string, achieved: boolean) {
    const participantKey = localStorage.getItem('currentParticipantKey');
    
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const response = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantKey,
          goalId,
          date: day,
          achieved
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update achievement');
      }

      fetchDayData();
    } catch (error) {
      console.error('Error updating achievement:', error);
      alert('Failed to update achievement');
    }
  }

  function handleShareParticipantLink(participant: Participant) {
    const url = `${window.location.origin}/challenges/${inviteCode}?key=${participant.participant_key}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(`Magic link for ${participant.name} copied to clipboard!`);
    }).catch(() => {
      alert(`Magic link for ${participant.name}: ${url}`);
    });
  }

  // Only show share section if user is a participant
  function canShowShareSection() {
    const participantKeys = JSON.parse(localStorage.getItem('participantKeys') || '{}');
    return Object.values(participantKeys).some(key => 
      participants.some(p => p.participant_key === key)
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  // Format the date for display
  const formattedDate = new Date(day).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Header */}
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold hover:text-indigo-400 transition-colors">
              Better Than You
            </Link>
            <Link
              href={`/challenges/${inviteCode}`}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Back to Challenge
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">{formattedDate}</h1>
            </div>

            {/* Share Links - Only show if user is a participant */}
            {canShowShareSection() && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Share Challenge</h2>
                <div className="grid gap-3">
                  {participants.map(participant => (
                    <button
                      key={participant.id}
                      onClick={() => handleShareParticipantLink(participant)}
                      className="flex justify-between items-center bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <span className="font-medium">{participant.name}</span>
                      <span className="text-gray-400">Copy Magic Link →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Goals List */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Goals for {formattedDate}</h2>
              {goals.length === 0 ? (
                <p className="text-gray-400">No goals set for this challenge.</p>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => {
                    const log = logs.find(
                      l => l.goal_id === goal.id && 
                           l.participant_id === goal.participant_id &&
                           l.date === day
                    );
                    const goalOwner = participants.find(p => p.id === goal.participant_id);
                    const isOwnGoal = goal.participant_id === currentParticipant?.id;

                    return (
                      <div 
                        key={goal.id}
                        className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{goal.description}</div>
                          <div className="text-sm text-gray-400">
                            By {goalOwner?.name || 'Unknown'} • {goal.points} points
                          </div>
                        </div>
                        <div className="flex items-center">
                          {isOwnGoal ? (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={log?.achieved || false}
                                onChange={async (e) => {
                                  const participantKey = localStorage.getItem('currentParticipantKey');
                                  try {
                                    const response = await fetch('/api/daily-logs', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        participantKey,
                                        goalId: goal.id,
                                        date: day,
                                        achieved: e.target.checked
                                      }),
                                    });

                                    if (!response.ok) {
                                      throw new Error('Failed to update achievement');
                                    }

                                    fetchDayData(); // Refresh data to show updated points
                                  } catch (error) {
                                    console.error('Error updating achievement:', error);
                                    alert('Failed to update achievement');
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center">
                              {log?.achieved ? (
                                <span className="text-green-500">✓</span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
