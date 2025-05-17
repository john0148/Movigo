import { useEffect, useRef } from "react";
import videojs from "video.js";
import "videojs-youtube";
import "video.js/dist/video-js.css";

/**
 * VideoJSPlayer Component
 * Một wrapper cho video.js player hỗ trợ cả video thông thường và YouTube
 */
const VideoJSPlayer = ({ options, onReady }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    useEffect(() => {
        // Đảm bảo Video.js player chỉ được khởi tạo một lần
        if (!playerRef.current) {
            // Tạo phần tử video-js
            const videoElement = document.createElement("video-js");
            videoElement.classList.add("vjs-big-play-centered", "vjs-16-9");

            // Thêm phần tử video vào container
            videoRef.current.appendChild(videoElement);

            // Khởi tạo player
            const player = videojs(
                videoElement,
                options,
                () => {
                    // Callback khi player đã sẵn sàng
                    onReady && onReady(player);
                }
            );

            // Lưu reference của player để sử dụng sau này
            playerRef.current = player;
        } else {
            // Cập nhật player nếu đã tồn tại
            const player = playerRef.current;

            // Cập nhật các options khi props thay đổi
            if (options.width) player.width(options.width);
            if (options.height) player.height(options.height);
            if (options.sources && Array.isArray(options.sources) && options.sources.length > 0) {
                player.src(options.sources);
            }
        }
    }, [options, videoRef, onReady]);

    // Giải phóng player khi component unmount
    useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    return (
        <div data-vjs-player>
            <div ref={videoRef} />
        </div>
    );
};

export default VideoJSPlayer;