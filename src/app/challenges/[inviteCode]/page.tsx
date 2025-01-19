'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const Charts = dynamic(() => import('../../components/Charts'), { ssr: false });

interface Participant {
  id: string;
  name: string;
  challenge_id: string;
  participant_key: string;
}

interface DailyLog {
  id: string;
  challenge_id: string;
  participant_id: string;
  participant_name: string;
  goal_id: string;
  date: string;
  achieved: boolean;
  points_earned: number;
}

interface DailyGoal {
  id: string;
  challenge_id: string;
  participant_id: string;
  description: string;
  points: number;
  date: string | null;
  created_at: string;
}

interface TimeSeriesDataPoint {
  date: string;
  [key: string]: string | number;
}

interface Props {
  params: Promise<{
    inviteCode: string;
  }>;
}

export default function ChallengePage({ params }: Props) {
  const { inviteCode } = use(params);
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({ description: '' });
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingPoints, setEditingPoints] = useState<{[key: string]: number}>({});

  useEffect(() => {
    // Check for magic link parameter
    const urlParams = new URLSearchParams(window.location.search);
    const magicKey = urlParams.get('key');
    
    if (magicKey) {
      const existingKeys = JSON.parse(localStorage.getItem('participantKeys') || '{}');
      existingKeys[inviteCode] = magicKey;
      localStorage.setItem('participantKeys', JSON.stringify(existingKeys));
      localStorage.setItem('currentParticipantKey', magicKey);
      // Remove the key from URL without refreshing
      window.history.replaceState({}, '', window.location.pathname);
    }

    const participantKeys = JSON.parse(localStorage.getItem('participantKeys') || '{}');
    const participantKey = participantKeys[inviteCode];
    
    if (!participantKey) {
      router.push(`/challenges/${inviteCode}/join`);
      return;
    }

    localStorage.setItem('currentParticipantKey', participantKey);
    fetchData();
  }, [inviteCode]);

  async function fetchData() {
    try {
      const response = await fetch(`/api/challenge/${inviteCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch challenge data');
      }
      const data = await response.json();
      setParticipants(data.participants);
      setDailyGoals(data.goals);
      setDailyLogs(data.logs);

      // Find current participant
      const participantKey = localStorage.getItem('currentParticipantKey');
      const current = data.participants.find(
        (p: Participant) => p.participant_key === participantKey
      );
      setCurrentParticipant(current || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    const participantKey = localStorage.getItem('currentParticipantKey');
    
    try {
      const response = await fetch('/api/daily-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantKey,
          description: newGoal.description,
          points: 1  // Default to 1 point
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add goal');
      }

      setNewGoal({ description: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Failed to add goal');
    }
  }

  async function handleUpdatePoints(goalId: string) {
    const newPoints = editingPoints[goalId];
    if (!newPoints) return;

    const participantKey = localStorage.getItem('currentParticipantKey');
    try {
      const response = await fetch('/api/daily-goals/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantKey,
          goalId,
          points: newPoints
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update points');
      }

      // Clear the editing state for this goal
      setEditingPoints(prev => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
      fetchData();
    } catch (error) {
      console.error('Error updating points:', error);
      alert('Failed to update points');
    }
  }

  const timeSeriesData = dailyLogs.reduce((acc: TimeSeriesDataPoint[], log) => {
    const date = new Date(log.date).toLocaleDateString();
    const existingDay = acc.find(d => d.date === date);
    
    if (existingDay) {
      existingDay[`participant_${log.participant_id}`] = (existingDay[`participant_${log.participant_id}`] as number || 0) + log.points_earned;
    } else {
      const newDay: TimeSeriesDataPoint = { date };
      newDay[`participant_${log.participant_id}`] = log.points_earned;
      acc.push(newDay);
    }
    
    return acc;
  }, []);

  const barChartData = participants.map(participant => {
    const totalPoints = dailyLogs
      .filter(log => log.participant_id === participant.id)
      .reduce((sum, log) => sum + log.points_earned, 0);
    
    return {
      id: participant.id,
      name: participant.name,
      total: totalPoints
    };
  });

  // Update calendar generation to use selectedDate instead of today
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Function to navigate months
  function navigateMonth(direction: 'prev' | 'next') {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  }

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentYear, currentMonth, i + 1);
    const dateString = date.toISOString().split('T')[0];
    const hasGoals = dailyGoals.length > 0;
    const isToday = dateString === selectedDate.toISOString().split('T')[0];
    
    return {
      date,
      dateString,
      hasGoals,
      isToday,
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-2xl font-bold mb-8">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Header */}
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link 
              href="/" 
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <button
              onClick={() => {
                const code = prompt('Enter invite code to join a challenge:');
                if (code) {
                  router.push(`/challenges/${code}/join`);
                }
              }}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Join Challenge
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Challenge Progress</h1>

        {/* Scoreboard */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Scoreboard</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-6 py-3 text-left">Participant</th>
                  <th className="px-6 py-3 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => {
                  const totalPoints = dailyLogs
                    .filter(log => log.participant_id === participant.id)
                    .reduce((sum, log) => sum + log.points_earned, 0);

                  return (
                    <tr key={participant.id} className="border-t border-gray-700">
                      <td className="px-6 py-4">{participant.name}</td>
                      <td className="px-6 py-4 text-right">{totalPoints}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <Charts 
          timeSeriesData={timeSeriesData}
          barChartData={barChartData}
          participants={participants}
        />

        {/* Calendar View */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Calendar</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="text-lg">
                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-gray-400 font-medium p-2">
                  {day}
                </div>
              ))}
              {Array(firstDayOfMonth).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              {calendarDays.map(({ date, dateString, hasGoals, isToday }) => (
                <Link
                  key={dateString}
                  href={`/challenges/${inviteCode}/day/${dateString}`}
                  className={`
                    p-2 text-center rounded-lg cursor-pointer transition-colors
                    ${isToday ? 'bg-indigo-600 text-white' : ''}
                    ${hasGoals ? 'bg-gray-700' : 'hover:bg-gray-700'}
                  `}
                >
                  {date.getDate()}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Add Goal Form */}
        {currentParticipant && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Goal</h2>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Description
                </label>
                <input
                  type="text"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2"
                  required
                />
              </div>
              <p className="text-sm text-gray-400">New goals start with 1 point. Other participants can adjust the points.</p>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add Goal
              </button>
            </form>
          </div>
        )}

        {/* Daily Goals */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Daily Goals</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-700 border-b border-gray-600">
              <p className="text-gray-300">
                Showing goals for: <span className="font-medium text-white">{new Date().toLocaleDateString()}</span>
                <br />
                <span className="text-sm text-gray-400">
                  (Toggle switches reflect today's achievements only. Visit specific dates in the calendar to view or update past achievements.)
                </span>
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-6 py-3 text-left">Participant</th>
                  <th className="px-6 py-3 text-left">Goal</th>
                  <th className="px-6 py-3 text-right">Points</th>
                  <th className="px-6 py-3 text-center">Today's Status</th>
                </tr>
              </thead>
              <tbody>
                {dailyGoals.map((goal) => {
                  const today = new Date().toISOString().split('T')[0];
                  const log = dailyLogs.find(
                    l => l.goal_id === goal.id && 
                         l.participant_id === goal.participant_id &&
                         l.date === today
                  );
                  const goalOwner = participants.find(p => p.id === goal.participant_id);
                  const isOwnGoal = goal.participant_id === currentParticipant?.id;

                  return (
                    <tr key={goal.id} className="border-t border-gray-700">
                      <td className="px-6 py-4">
                        <span className={isOwnGoal ? 'text-indigo-400' : ''}>
                          {goalOwner?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{goal.description}</td>
                      <td className="px-6 py-4 text-right">
                        {isOwnGoal ? (
                          // If it's your own goal, just show the points
                          goal.points
                        ) : (
                          // If it's someone else's goal, show input and save button
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              value={editingPoints[goal.id] === undefined ? goal.points : editingPoints[goal.id] || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                if (!isNaN(value)) {
                                  setEditingPoints(prev => ({
                                    ...prev,
                                    [goal.id]: value
                                  }));
                                }
                              }}
                              className="w-20 px-2 py-1 text-right rounded bg-gray-700 border border-gray-600"
                              min="1"
                            />
                            {editingPoints[goal.id] !== undefined && 
                             editingPoints[goal.id] !== goal.points && 
                             editingPoints[goal.id] > 0 && (
                              <button
                                onClick={() => handleUpdatePoints(goal.id)}
                                className="px-2 py-1 text-sm bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                              >
                                Save
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isOwnGoal && (
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
                                      date: today,
                                      achieved: e.target.checked
                                    }),
                                  });

                                  if (!response.ok) {
                                    throw new Error('Failed to update achievement');
                                  }

                                  fetchData(); // Refresh data to show updated points
                                } catch (error) {
                                  console.error('Error updating achievement:', error);
                                  alert('Failed to update achievement');
                                }
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        )}
                        {!isOwnGoal && log?.achieved && (
                          <span className="text-green-500">✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}