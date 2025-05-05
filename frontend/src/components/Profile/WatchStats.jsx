import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getWatchingStats } from '../../api/userApi';
import '../../styles/WatchStatsChart.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * WatchStats Component
 * Displays the user's watch statistics
 */
const WatchStats = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get statistics from API (real or mock)
        const data = await getWatchingStats(period);
        setStatsData(data);
      } catch (err) {
        setError('Không thể tải dữ liệu thống kê');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  if (loading) {
    return <div className="watch-stats-loading">Đang tải thống kê...</div>;
  }

  if (error) {
    return <div className="watch-stats-error">{error}</div>;
  }

  if (!statsData) {
    return <div className="watch-stats-error">Không có dữ liệu thống kê</div>;
  }

  const chartData = {
    labels: statsData.labels,
    datasets: [
      {
        label: 'Phút xem',
        data: statsData.watchMinutes,
        backgroundColor: 'rgba(229, 9, 20, 0.6)',
        borderColor: 'rgba(229, 9, 20, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Thời gian xem phim',
      },
    },
  };

  return (
    <div className="watch-stats">
      <div className="watch-stats-header">
        <h2>Thống kê xem phim</h2>
        <div className="period-selector">
          <button
            className={period === 'week' ? 'active' : ''}
            onClick={() => handlePeriodChange('week')}
          >
            Tuần
          </button>
          <button
            className={period === 'month' ? 'active' : ''}
            onClick={() => handlePeriodChange('month')}
          >
            Tháng
          </button>
          <button
            className={period === 'year' ? 'active' : ''}
            onClick={() => handlePeriodChange('year')}
          >
            Năm
          </button>
        </div>
      </div>

      <div className="watch-stats-summary">
        <div className="stats-card">
          <div className="stats-value">{statsData.totalMovies}</div>
          <div className="stats-label">Phim đã xem</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{statsData.totalMinutes}</div>
          <div className="stats-label">Phút xem</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{statsData.favoriteGenre}</div>
          <div className="stats-label">Thể loại ưa thích</div>
        </div>
      </div>

      <div className="watch-stats-chart">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default WatchStats; 