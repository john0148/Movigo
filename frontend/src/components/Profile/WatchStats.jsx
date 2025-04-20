import { useState, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getWatchingStats } from '../../api/userApi';
import '../styles/Profile.css';

// Register Chart.js components
Chart.register(...registerables);

/**
 * WatchStats Component
 * Hiển thị biểu đồ thời lượng xem phim theo tuần/tháng/năm
 */
const WatchStats = () => {
  const [period, setPeriod] = useState('week');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getWatchingStats(period);
        setStats(data);
      } catch (err) {
        setError('Không thể tải dữ liệu thống kê');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  const getChartData = () => {
    if (!stats) return null;

    let labels, dataset;

    switch (period) {
      case 'week':
        labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        dataset = stats.daily_minutes || Array(7).fill(0);
        break;
      case 'month':
        // Tạo mảng ngày trong tháng (1-31)
        labels = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
        dataset = stats.monthly_minutes || Array(31).fill(0);
        break;
      case 'year':
        labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        dataset = stats.yearly_minutes || Array(12).fill(0);
        break;
      default:
        labels = [];
        dataset = [];
    }

    return {
      labels,
      datasets: [
        {
          label: 'Thời lượng xem (phút)',
          data: dataset,
          backgroundColor: 'rgba(229, 9, 20, 0.7)', // Netflix red
          borderColor: 'rgba(229, 9, 20, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Thời lượng (phút)',
          },
        },
        x: {
          title: {
            display: true,
            text: getPeriodTitle(),
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        title: {
          display: true,
          text: `Thời lượng xem phim ${getPeriodTitle().toLowerCase()}`,
          font: {
            size: 16,
          },
        },
      },
    };
  };

  const getPeriodTitle = () => {
    switch (period) {
      case 'week': return 'Theo ngày trong tuần';
      case 'month': return 'Theo ngày trong tháng';
      case 'year': return 'Theo tháng trong năm';
      default: return '';
    }
  };

  const getTotalWatchTime = () => {
    if (!stats) return '0 phút';
    
    let totalMinutes = 0;
    
    switch (period) {
      case 'week':
        totalMinutes = stats.daily_minutes ? stats.daily_minutes.reduce((a, b) => a + b, 0) : 0;
        break;
      case 'month':
        totalMinutes = stats.monthly_minutes ? stats.monthly_minutes.reduce((a, b) => a + b, 0) : 0;
        break;
      case 'year':
        totalMinutes = stats.yearly_minutes ? stats.yearly_minutes.reduce((a, b) => a + b, 0) : 0;
        break;
      default:
        totalMinutes = 0;
    }
    
    if (totalMinutes < 60) {
      return `${totalMinutes} phút`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours} giờ ${mins > 0 ? `${mins} phút` : ''}`;
    }
  };

  if (loading && !stats) return <div className="stats-loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="stats-error">{error}</div>;

  const chartData = getChartData();

  return (
    <div className="watch-stats">
      <div className="stats-header">
        <h2>Thống kê xem phim</h2>
        <div className="period-selector">
          <button 
            className={`period-button ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            Tuần
          </button>
          <button 
            className={`period-button ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Tháng
          </button>
          <button 
            className={`period-button ${period === 'year' ? 'active' : ''}`}
            onClick={() => setPeriod('year')}
          >
            Năm
          </button>
        </div>
      </div>
      
      <div className="stats-summary">
        <div className="summary-item">
          <span className="summary-label">Tổng thời gian xem:</span>
          <span className="summary-value">{getTotalWatchTime()}</span>
        </div>
      </div>
      
      <div className="chart-container">
        {chartData ? (
          <Bar data={chartData} options={getChartOptions()} height={300} />
        ) : (
          <div className="no-data">Không có dữ liệu thống kê</div>
        )}
      </div>
    </div>
  );
};

export default WatchStats; 