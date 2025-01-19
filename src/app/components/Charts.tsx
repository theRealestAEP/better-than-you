'use client';

interface ChartProps {
  timeSeriesData: Array<{
    date: string;
    [key: string]: string | number;
  }>;
  barChartData: Array<{
    id: string;
    name: string;
    total: number;
  }>;
  participants: Array<{
    id: string;
    name: string;
  }>;
}

export default function Charts({ timeSeriesData, barChartData, participants }: ChartProps) {
  // Sort time series data by date
  const sortedTimeSeriesData = [...timeSeriesData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Sort bar chart data by total points descending
  const sortedBarData = [...barChartData].sort((a, b) => b.total - a.total);

  return (
    <div className="mb-8 space-y-6">
      <h2 className="text-xl font-semibold">Progress Analytics</h2>
      
      {/* Time Series Table */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg mb-4">Daily Points Progress</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800">
                <th className="px-4 py-2 text-left">Date</th>
                {participants.map(participant => (
                  <th key={participant.id} className="px-4 py-2 text-right">{participant.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTimeSeriesData.map((day, index) => (
                <tr key={day.date} className={index % 2 === 0 ? 'bg-gray-800/50' : ''}>
                  <td className="px-4 py-2">{day.date}</td>
                  {participants.map(participant => (
                    <td key={`${day.date}-${participant.id}`} className="px-4 py-2 text-right">
                      {(day[`participant_${participant.id}`] as number || 0).toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total Points Table */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg mb-4">Total Points</h3>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800">
              <th className="px-4 py-2 text-left">Participant</th>
              <th className="px-4 py-2 text-right">Total Points</th>
              <th className="px-4 py-2 text-left">Progress Bar</th>
            </tr>
          </thead>
          <tbody>
            {sortedBarData.map((data, index) => {
              const maxPoints = sortedBarData[0].total;
              const percentage = (data.total / maxPoints) * 100;
              
              return (
                <tr key={data.id} className={index % 2 === 0 ? 'bg-gray-800/50' : ''}>
                  <td className="px-4 py-2">{data.name}</td>
                  <td className="px-4 py-2 text-right">{data.total.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 