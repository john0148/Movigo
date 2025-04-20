/**
 * LoadingSpinner Component
 * 
 * Hiển thị trạng thái đang tải dữ liệu với animation spinner.
 * Sử dụng khi cần báo cho người dùng biết đang có tác vụ đang chạy.
 */

import '../styles/LoadingSpinner.css';

function LoadingSpinner({ size = 'medium', text = 'Đang tải...' }) {
  // Size classes cho các kích thước khác nhau
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  }[size] || 'spinner-medium';
  
  return (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClass}`}></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
}

export default LoadingSpinner; 