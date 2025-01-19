'use client';

import { useState, useEffect } from 'react';
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
  description: string;
  points: number;
  participant_id: string;
  date: string;
}

interface Log {
  id: string;
  goal_id: string;
  achieved: boolean;
  points_earned: number;
  date: string;
}

interface Participant {
  id: string;
  name: string;
  participant_key: string;
}

export default function DayDetailPage({ params }: Props) {
  const { inviteCode, day } = use(params);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const participantKeys = JSON.parse(localStorage.getItem('participantKeys') || '{}');
    const participantKey = participantKeys[inviteCode];
    
    if (!participantKey) {
      router.push(`/challenges/${inviteCode}/join`);
      return;
    }

    localStorage.setItem('currentParticipantKey', participantKey);
    fetchDayData();
  }, [inviteCode, day]);

  async function fetchDayData() {
    try {
      const response = await fetch(`/api/challenge/${inviteCode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch challenge data');
      }

      // Get all goals for the challenge
      setGoals(data.goals);
      // Filter logs for this specific day
      const dayLogs = data.logs.filter((log: Log) => log.date === day);
      setLogs(dayLogs);
      setParticipants(data.participants);
    } catch (error) {
      console.error('Error fetching day data:', error);
      alert('Failed to load day data');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAchievement(goalId: string, achieved: boolean) {
    const participantKey = localStorage.getItem('currentParticipantKey');
    
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      // Find existing log for this day
      const existingLog = logs.find(l => 
        l.goal_id === goalId && 
        l.date === day
      );

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

      fetchDayData(); // Refresh data to show updated points
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
                  {goals.map(goal => {
                    const log = logs.find(l => 
                      l.goal_id === goal.id && 
                      l.date === day
                    );
                    const participant = participants.find(p => p.id === goal.participant_id);
                    
                    return (
                      <div 
                        key={goal.id}
                        className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{goal.description}</div>
                          <div className="text-sm text-gray-400">
                            By {participant?.name} • {goal.points} points
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={log?.achieved || false}
                            onChange={(e) => handleToggleAchievement(goal.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
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
