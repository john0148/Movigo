/**
 * Error Handler Utility
 * 
 * Cung cấp các hàm xử lý lỗi thống nhất trong ứng dụng:
 * - Xử lý lỗi từ API calls
 * - Hiển thị thông báo lỗi cho người dùng
 * - Log lỗi để debugging
 */

/**
 * Xử lý lỗi từ các API calls
 * @param {Error} error Lỗi từ Axios hoặc nguồn khác
 * @param {string} defaultMessage Thông báo mặc định khi không xác định được lỗi cụ thể
 * @returns {Promise} Promise rejected với thông báo lỗi đã xử lý
 */
export const handleApiError = (error, defaultMessage = 'Đã xảy ra lỗi') => {
  console.error('API Error:', error);
  
  // Lấy thông báo lỗi cụ thể từ response nếu có
  let errorMessage = defaultMessage;
  
  if (error.response) {
    // Server trả về response với status code nằm ngoài phạm vi 2xx
    console.log('Error response:', error.response);
    
    // Ưu tiên lấy message từ response data
    if (error.response.data && error.response.data.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.response.statusText) {
      errorMessage = `${defaultMessage} (${error.response.status}: ${error.response.statusText})`;
    }
    
    // Xử lý một số trường hợp lỗi cụ thể
    switch (error.response.status) {
      case 401:
        errorMessage = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
        // Có thể thêm logic redirect đến trang đăng nhập ở đây
        break;
      case 403:
        errorMessage = 'Bạn không có quyền thực hiện hành động này';
        break;
      case 404:
        errorMessage = 'Không tìm thấy dữ liệu yêu cầu';
        break;
      case 429:
        errorMessage = 'Quá nhiều yêu cầu, vui lòng thử lại sau';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = 'Lỗi hệ thống, vui lòng thử lại sau';
        break;
      default:
        // Giữ errorMessage đã được xử lý ở trên
        break;
    }
  } else if (error.request) {
    // Request được gửi nhưng không nhận được response
    console.log('Error request:', error.request);
    errorMessage = 'Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng';
  } else {
    // Có lỗi trong quá trình thiết lập request
    console.log('Error message:', error.message);
    errorMessage = error.message || defaultMessage;
  }
  
  // Reject promise với thông báo lỗi đã xử lý
  return Promise.reject(new Error(errorMessage));
};

/**
 * Hiển thị thông báo lỗi cho người dùng
 * Có thể sử dụng với một thư viện toast notifications
 * @param {string} message Thông báo lỗi
 */
export const showErrorToast = (message) => {
  // Placeholder, cần thay thế bằng logic hiển thị toast thực tế
  console.error('Error:', message);
  // Ví dụ: toast.error(message);
};

/**
 * Xử lý lỗi chung trong ứng dụng
 * @param {Error} error Lỗi cần xử lý
 * @param {Function} callback Hàm callback tùy chọn được gọi sau khi xử lý lỗi
 */
export const handleGeneralError = (error, callback) => {
  const errorMessage = error.message || 'Đã xảy ra lỗi không xác định';
  
  // Log lỗi
  console.error('Application Error:', error);
  
  // Hiển thị thông báo
  showErrorToast(errorMessage);
  
  // Gọi callback nếu được cung cấp
  if (typeof callback === 'function') {
    callback(errorMessage);
  }
}; 