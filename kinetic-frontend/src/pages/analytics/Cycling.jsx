import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sportAnalyticsAPI } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUserStore } from '../../store/userStore';

const Cycling = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await sportAnalyticsAPI.getCycling(user.id);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching cycling analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cycling analytics...</div>
      </div>
    );
  }

  if (!analytics || analytics.overview.total_rides === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => navigate('/workouts')}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to Workouts
        </button>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🚴</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No Cycling Data Yet
          </h2>
          <p className="text-gray-600">
            Start logging rides to see your analytics here!
          </p>
        </div>
      </div>
    );
  }

  const { overview, personal_records, progress, recent_activities } = analytics;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <button
        onClick={() => navigate('/workouts')}
        className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
      >
        ← Back to Workouts
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">🚴</span>
        <h1 className="text-3xl font-bold text-gray-800">Cycling Analytics</h1>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm mb-1">Total Rides</div>
          <div className="text-3xl font-bold text-gray-800">
            {overview.total_rides}
          </div>
          <div className="text-gray-400 text-xs mt-1">All time</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm mb-1">Total Distance</div>
          <div className="text-3xl font-bold text-green-600">
            {overview.total_distance} km
          </div>
          <div className="text-gray-400 text-xs mt-1">
            This month: {overview.monthly_distance} km
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm mb-1">Average Speed</div>
          <div className="text-3xl font-bold text-blue-600">
            {overview.average_speed}
          </div>
          <div className="text-gray-400 text-xs mt-1">km/h</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm mb-1">Total Elevation</div>
          <div className="text-3xl font-bold text-orange-600">
            {overview.total_elevation} m
          </div>
          <div className="text-gray-400 text-xs mt-1">Climbed</div>
        </div>
      </div>

      {/* Personal Records */}
      {Object.keys(personal_records).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Personal Records</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personal_records.longest_ride && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Longest Ride</div>
                <div className="text-2xl font-bold text-green-600">
                  {personal_records.longest_ride.distance} km
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {personal_records.longest_ride.date}
                </div>
              </div>
            )}

            {personal_records.biggest_climb && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Biggest Climb</div>
                <div className="text-2xl font-bold text-orange-600">
                  {personal_records.biggest_climb.elevation} m
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {personal_records.biggest_climb.distance} km • {personal_records.biggest_climb.date}
                </div>
              </div>
            )}

            {personal_records.fastest_speed && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Fastest Average Speed</div>
                <div className="text-2xl font-bold text-blue-600">
                  {personal_records.fastest_speed.speed} km/h
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {personal_records.fastest_speed.distance} km • {personal_records.fastest_speed.date}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Chart */}
      {progress.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Distance & Elevation (Last 12 Weeks)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                yAxisId="left"
                label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'Elevation (m)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-gray-200 rounded p-3 shadow-lg">
                        <p className="text-sm text-gray-600">Week: {payload[0].payload.week}</p>
                        <p className="text-sm text-green-600 font-semibold">
                          Distance: {payload[0].value} km
                        </p>
                        <p className="text-sm text-orange-600 font-semibold">
                          Elevation: {payload[1].value} m
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="distance"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Distance"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="elevation"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 4 }}
                activeDot={{ r: 6 }}
                name="Elevation"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Recent Rides</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elevation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recent_activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {activity.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                    {activity.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {activity.distance} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {activity.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                    {activity.speed} km/h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {activity.elevation}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Cycling;