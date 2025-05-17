import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { API_BASE_URL } from '../config/constants';

const API_URL = `${API_BASE_URL}/movies`;

/**
 * Movie API
 * 
 * Cung cấp các hàm giao tiếp với backend API cho các chức năng liên quan đến phim.
 * Bao gồm:
 * - Lấy danh sách phim ngẫu nhiên
 * - Lấy danh sách phim được xem nhiều
 * - Lấy thông tin chi tiết phim
 * - Tìm kiếm phim
 * - Cập nhật lượt xem phim
 */

/**
 * Lấy danh sách phim ngẫu nhiên
 * @param {number} limit Số lượng phim tối đa muốn lấy
 * @returns {Promise<Array>} Danh sách phim
 */
export const getRandomMovies = async (limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/random`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy danh sách phim ngẫu nhiên');
  }
};

/**
 * Lấy danh sách phim được xem nhiều nhất
 * @param {number} limit Số lượng phim tối đa muốn lấy
 * @returns {Promise<Array>} Danh sách phim
 */
export const getMostViewedMovies = async (limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/most-viewed`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy danh sách phim xem nhiều');
  }
};

/**
 * Lấy danh sách phim nổi bật
 * @param {number} limit Số lượng phim tối đa muốn lấy
 * @returns {Promise<Array>} Danh sách phim
 */
export const getFeaturedMovies = async (limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/featured`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy danh sách phim nổi bật');
  }
};

/**
 * Lấy chi tiết phim theo ID
 * @param {string} id ID của phim
 * @returns {Promise<Object>} Thông tin chi tiết phim
 */
export const getMovieDetails = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy thông tin chi tiết phim');
  }
};

/**
 * Tìm kiếm phim
 * @param {string} query Từ khóa tìm kiếm
 * @param {string} genre Thể loại phim (tùy chọn)
 * @param {number} year Năm phát hành (tùy chọn)
 * @param {number} page Trang hiện tại
 * @param {number} limit Số lượng phim mỗi trang
 * @returns {Promise<Object>} Kết quả tìm kiếm và thông tin phân trang
 */
export const searchMovies = async (query, genre = null, year = null, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;
    const response = await axios.get(`${API_URL}/search`, {
      params: {
        query,
        genre,
        year,
        skip,
        limit
      }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể tìm kiếm phim');
  }
};

/**
 * Cập nhật lượt xem cho phim
 * Yêu cầu user đã đăng nhập (có access token)
 * @param {string} id ID của phim
 * @returns {Promise<Object>} Phim đã được cập nhật lượt xem
 */
export const incrementMovieView = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/view`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể cập nhật lượt xem');
  }
};

/**
 * Lấy danh sách phim theo thể loại
 * @param {string} genre Thể loại phim
 * @param {number} limit Số lượng phim tối đa muốn lấy
 * @returns {Promise<Array>} Danh sách phim
 */
export const getMoviesByGenre = async (genre, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/search`, {
      params: {
        genre,
        limit
      }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy danh sách phim theo thể loại');
  }
};

// Lấy phim liên quan
export const fetchRelatedMovies = async (movieId, limit = 6) => {
  try {
    const response = await axios.get(`${API_URL}/${movieId}/related`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching related movies for ID ${movieId}:`, error);
    throw error;
  }
}; 

export const getPopularMovies = async (page = 1) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/tmdb/popular`, {
      params: { page }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy danh sách phim phổ biến');
  }
};
