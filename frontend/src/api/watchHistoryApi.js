/**
 * Watch History API
 * 
 * Cung cấp các hàm giao tiếp với backend API cho các chức năng liên quan đến lịch sử xem và thống kê.
 * Bao gồm:
 * - Lấy thống kê xem phim (tổng thời gian, thể loại yêu thích)
 * - Lấy lịch sử xem phim
 * - Quản lý từng mục trong lịch sử (xem chi tiết, xóa)
 */

import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { API_BASE_URL } from '../config/constants';

const API_URL = `${API_BASE_URL}/watch-stats`;

/**
 * Lấy thống kê xem phim của người dùng hiện tại
 * @returns {Promise<Object>} Dữ liệu thống kê xem phim
 */
export const getWatchStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy thống kê xem phim');
  }
};

/**
 * Lấy danh sách lịch sử xem phim có phân trang
 * @param {number} page Trang hiện tại
 * @param {number} limit Số lượng mục mỗi trang
 * @returns {Promise<Object>} Dữ liệu lịch sử xem phim và thông tin phân trang
 */
export const getWatchHistory = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get(`${API_URL}/history`, {
      params: { page, limit }
    });
    return response.data.items;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Lấy chi tiết một mục trong lịch sử xem phim
 * @param {string} entryId ID của mục lịch sử
 * @returns {Promise<Object>} Chi tiết mục lịch sử
 */
export const getWatchHistoryEntry = async (entryId) => {
  try {
    const response = await axios.get(`${API_URL}/history/${entryId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy chi tiết lịch sử xem phim');
  }
};

/**
 * Xóa một mục trong lịch sử xem phim
 * @param {string} entryId ID của mục lịch sử
 * @returns {Promise<boolean>} True nếu xóa thành công
 */
export const deleteWatchHistoryEntry = async (entryId) => {
  try {
    await axios.delete(`${API_URL}/history/${entryId}`);
    return true;
  } catch (error) {
    handleApiError(error, 'Không thể xóa mục lịch sử');
    return false;
  }
};

export const addToWatchHistory = async (movieId, watchData) => {
  try {
    const response = await axios.post(`${API_URL}/history`, {
      movie_id: movieId,
      ...watchData
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}; 

// // Watch Later APIs
// export const getWatchLater = async (page = 1, limit = 20) => {
//   try {
//     const response = await axios.get(`${API_URL}/later`, {
//       params: { page, limit }
//     });
//     return response.data.items;
//   } catch (error) {
//     handleApiError(error);
//     throw error;
//   }
// };

// export const addToWatchLater = async (movieId, movieDetails) => {
//   try {
//     const response = await axios.post(`${API_URL}/later`, {
//       movie_id: movieId,
//       movie_details: movieDetails
//     });
//     return response.data;
//   } catch (error) {
//     handleApiError(error);
//     throw error;
//   }
// };

// export const removeFromWatchLater = async (entryId) => {
//   try {
//     await axios.delete(`${API_URL}/later/${entryId}`);
//     return true;
//   } catch (error) {
//     handleApiError(error);
//     throw error;
//   }
// };



/**
 * Thêm phim vào danh sách "Xem sau"
 * Yêu cầu user đã đăng nhập (có access token)
 * @param {string} movieId ID của phim
 * @returns {Promise<Object>} Phản hồi từ server
 */
export const addToWatchLater = async (movieId) => {
  try {
    const response = await axios.post(
      `${API_URL}/${movieId}/watch-later`,
      {}, 
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể thêm vào danh sách "Xem sau"');
  }
};

// // Lấy danh sách phim xem sau
// export const getWatchLaterList = async () => {
//   try {
//     const response = await axios.get(`${API_URL}/watch-later`, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem('access_token')}`,
//       },
//     });
//     return response.data;
//   } catch (error) {
//     return handleApiError(error, 'Không thể lấy danh sách xem sau');
//   }
// };

// // Kiểm tra phim đã lưu
// export const isInWatchLater = async (movieId) => {
//   try {
//     const response = await axios.get(`${API_URL}/${movieId}/watch-later-status`, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem('access_token')}`,
//       },
//     });
//     return response.data.in_watch_later;
//   } catch (error) {
//     return false;
//   }
// };

// // Xóa phim khỏi danh sách
// export const removeFromWatchLater = async (movieId) => {
//   try {
//     const response = await axios.delete(`${API_URL}/${movieId}/watch-later`, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem('access_token')}`,
//       },
//     });
//     return response.data;
//   } catch (error) {
//     return handleApiError(error, 'Không thể xóa khỏi danh sách "Xem sau"');
//   }
// };


//Lấy danh sách phim "xem sau"
export const getWatchLaterList = async () => {
  try {
    const response = await axios.get(`${API_URL}/watch-later`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    // đảm bảo mỗi item có added_date dạng ISO string
    const watchList = response.data.map((item) => ({
      ...item,
      added_date: item.added_date ? new Date(item.added_date).toISOString() : null,
    }));

    return watchList;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy danh sách xem sau');
  }
};

// Kiểm tra 1 phim có trong danh sách xem sau chưa
export const isInWatchLater = async (movieId) => {
  try {
    const response = await axios.get(`${API_URL}/${movieId}/watch-later-status`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data.in_watch_later;
  } catch (error) {
    return false; // fallback nếu lỗi
  }
};

// Xóa một phim khỏi danh sách xem sau
export const removeFromWatchLater = async (movieId) => {
  try {
    const response = await axios.delete(`${API_URL}/${movieId}/watch-later`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể xóa khỏi danh sách "Xem sau"');
  }
};