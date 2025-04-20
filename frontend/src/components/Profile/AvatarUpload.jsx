import { useState, useRef } from 'react';
import { uploadAvatar } from '../../api/userApi';
import '../styles/Profile.css';

/**
 * AvatarUpload Component
 * Cho phép user upload và cập nhật ảnh đại diện
 * Props:
 * - currentAvatar: URL ảnh đại diện hiện tại
 * - onAvatarUpdated: Callback khi ảnh được cập nhật thành công
 */
const AvatarUpload = ({ currentAvatar, onAvatarUpdated }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng file
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Vui lòng chọn file ảnh định dạng JPG, JPEG hoặc PNG');
      return;
    }

    // Kiểm tra kích thước file (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
      return;
    }

    // Tạo preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const result = await uploadAvatar(formData);
      
      if (onAvatarUpdated) {
        onAvatarUpdated(result.avatar_url);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Không thể tải lên ảnh đại diện. Vui lòng thử lại sau.');
      // Reset preview nếu upload thất bại
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Ảnh đại diện mặc định nếu không có
  const defaultAvatar = 'https://via.placeholder.com/150?text=User';
  // Sử dụng preview nếu có, nếu không thì dùng avatar hiện tại, nếu không thì dùng mặc định
  const avatarSrc = previewUrl || currentAvatar || defaultAvatar;

  return (
    <div className="avatar-upload">
      <div className="avatar-container">
        {isUploading && (
          <div className="upload-overlay">
            <div className="spinner"></div>
          </div>
        )}
        <img 
          src={avatarSrc} 
          alt="Avatar" 
          className="avatar-image"
        />
        <button 
          type="button" 
          className="change-avatar-button"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          <i className="upload-icon"></i>
          Thay đổi
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleFileChange}
      />

      {error && <div className="avatar-error">{error}</div>}
    </div>
  );
};

export default AvatarUpload; 