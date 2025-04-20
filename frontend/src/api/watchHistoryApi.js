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
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy lịch sử xem phim');
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