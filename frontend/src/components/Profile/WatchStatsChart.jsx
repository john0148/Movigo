/**
 * WatchStatsChart Component
 * 
 * Hiển thị biểu đồ thống kê thời lượng xem phim.
 * Sử dụng đồ thị cột để hiển thị dữ liệu theo thời gian (tuần, tháng, năm).
 */

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import '../../styles/WatchStatsChart.css';

function WatchStatsChart({ data, xKey, yKey, xLabel, yLabel }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    // Hủy biểu đồ cũ nếu đã tồn tại
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Tạo biểu đồ mới nếu có dữ liệu
    if (data && data.length > 0 && chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      // Chuẩn bị dữ liệu cho biểu đồ
      const labels = data.map(item => item[xKey]);
      const values = data.map(item => item[yKey]);
      
      // Lấy màu ngẫu nhiên cho các cột
      const colors = generateGradientColors(data.length, '#e50914', '#5b1218');
      
      // Tạo đối tượng biểu đồ
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: yLabel,
              data: values,
              backgroundColor: colors,
              borderColor: colors.map(color => color.replace('0.7', '1')),
              borderWidth: 1,
              borderRadius: 4,
              barThickness: 'flex',
              minBarLength: 5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: yLabel,
                color: '#e5e5e5',
                font: {
                  size: 12
                }
              },
              ticks: {
                color: '#b3b3b3'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            x: {
              title: {
                display: true,
                text: xLabel,
                color: '#e5e5e5',
                font: {
                  size: 12
                }
              },
              ticks: {
                color: '#b3b3b3'
              },
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#e5e5e5',
              bodyColor: '#e5e5e5',
              callbacks: {
                label: function(context) {
                  return `${yLabel}: ${context.raw}`;
                }
              }
            }
          }
        }
      });
    }
    
    // Cleanup khi component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, xKey, yKey, xLabel, yLabel]);
  
  // Hàm tạo gradient colors
  const generateGradientColors = (count, startColor, endColor) => {
    const colors = [];
    
    // Convert hex to RGB
    const startRGB = hexToRgb(startColor);
    const endRGB = hexToRgb(endColor);
    
    for (let i = 0; i < count; i++) {
      // Tính toán màu gradient dựa trên vị trí
      const ratio = i / (count - 1 || 1);
      const r = Math.round(startRGB.r + ratio * (endRGB.r - startRGB.r));
      const g = Math.round(startRGB.g + ratio * (endRGB.g - startRGB.g));
      const b = Math.round(startRGB.b + ratio * (endRGB.b - startRGB.b));
      
      colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
    }
    
    return colors;
  };
  
  // Hàm chuyển đổi hex color sang RGB
  const hexToRgb = (hex) => {
    // Xóa ký tự # nếu có
    hex = hex.replace('#', '');
    
    // Parse thành các thành phần RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  };
  
  return (
    <div className="chart-wrapper">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default WatchStatsChart;