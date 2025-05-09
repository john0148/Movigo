import asyncio
import motor.motor_asyncio
import os
import pymongo
import dns.resolver
import socket

mongo_url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
mongo_db_name = os.environ.get("MONGODB_NAME", "movigo")

# Kiểm tra kết nối đồng bộ với pymongo
def test_sync_connection():
    print("\n=== Kiểm tra kết nối đồng bộ ===")
    try:
        print(f"Đang kết nối đến: {mongo_url}")
        client = pymongo.MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        server_info = client.server_info()
        print(f"Kết nối thành công! Server Info: {server_info.get('version', 'Unknown')}")
        
        # Liệt kê các database
        databases = client.list_database_names()
        print(f"Các cơ sở dữ liệu: {', '.join(databases)}")
        
        # Thử kết nối đến database cụ thể
        db = client[mongo_db_name]
        collections = db.list_collection_names()
        print(f"Các collection trong '{mongo_db_name}': {', '.join(collections) if collections else 'Không có'}")
        
        return True
    except Exception as e:
        print(f"Lỗi kết nối pymongo: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()

# Kiểm tra kết nối bất đồng bộ với motor
async def test_async_connection():
    print("\n=== Kiểm tra kết nối bất đồng bộ ===")
    try:
        print(f"Đang kết nối đến: {mongo_url}")
        client = motor.motor_asyncio.AsyncIOMotorClient(
            mongo_url, 
            serverSelectionTimeoutMS=5000
        )
        
        # Thử ping để xác nhận kết nối
        await client.admin.command('ping')
        print("Ping thành công!")
        
        # Liệt kê các database
        databases = await client.list_database_names()
        print(f"Các cơ sở dữ liệu: {', '.join(databases)}")
        
        # Thử kết nối đến database cụ thể
        db = client[mongo_db_name]
        collections = await db.list_collection_names()
        print(f"Các collection trong '{mongo_db_name}': {', '.join(collections) if collections else 'Không có'}")
        
        return True
    except Exception as e:
        print(f"Lỗi kết nối motor: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()

# Kiểm tra kết nối mạng cơ bản
def test_network_connection():
    print("\n=== Kiểm tra kết nối mạng cơ bản ===")
    try:
        # Phân tích MongoDB URL
        if mongo_url.startswith("mongodb://"):
            url_parts = mongo_url.replace("mongodb://", "").split("/")[0]
            auth_host = url_parts.split("@")
            
            if len(auth_host) > 1:
                host_port = auth_host[1].split(":")
            else:
                host_port = auth_host[0].split(":")
            
            host = host_port[0]
            port = int(host_port[1]) if len(host_port) > 1 else 27017
            
            print(f"Kiểm tra kết nối đến host: {host} port: {port}")
            
            # Thử DNS lookup
            try:
                ip_address = socket.gethostbyname(host)
                print(f"DNS lookup thành công: {host} -> {ip_address}")
            except socket.gaierror as e:
                print(f"Không thể phân giải tên miền {host}: {str(e)}")
                return False
            
            # Thử kết nối socket
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2)
                result = s.connect_ex((ip_address, port))
                if result == 0:
                    print(f"Kết nối đến cổng {port} thành công")
                    return True
                else:
                    print(f"Không thể kết nối đến cổng {port} (Lỗi: {result})")
                    return False
            except Exception as e:
                print(f"Lỗi kết nối socket: {str(e)}")
                return False
            finally:
                if 's' in locals():
                    s.close()
        else:
            print(f"URL không hợp lệ: {mongo_url}")
            return False
    except Exception as e:
        print(f"Lỗi kiểm tra mạng: {str(e)}")
        return False

# Kiểm tra cài đặt MongoDB Compass
def check_mongodb_compass():
    print("\n=== Kiểm tra MongoDB Compass ===")
    print("Cách kết nối MongoDB Compass:")
    print(f"1. Mở MongoDB Compass")
    print(f"2. Nhập connection string: {mongo_url}")
    print(f"3. Nếu có lỗi 'Auth failed', hãy thử bỏ thông tin xác thực (chỉ dùng mongodb://localhost:27017)")
    print("\nỨng dụng cần MongoDB chạy trên máy tính của bạn.")
    print("Nếu bạn chưa cài đặt MongoDB, hãy tải và cài đặt từ: https://www.mongodb.com/try/download/community")

# Hướng dẫn fix lỗi kết nối MongoDB 
def print_troubleshooting_guide():
    print("\n=== Hướng dẫn khắc phục lỗi kết nối MongoDB ===")
    print("1. Đảm bảo MongoDB đã được cài đặt và đang chạy:")
    print("   - Windows: Kiểm tra services.msc xem dịch vụ MongoDB đang chạy chưa")
    print("   - Linux/Mac: Chạy lệnh 'sudo systemctl status mongod' hoặc 'brew services list'")
    
    print("\n2. Kiểm tra cấu hình URL MongoDB trong file .env:")
    print("   - Hiện tại đang sử dụng: " + mongo_url)
    print("   - Thử đổi thành: mongodb://localhost:27017 (nếu chạy MongoDB cục bộ)")
    
    print("\n3. Kiểm tra firewall hoặc antivirus có thể đang chặn kết nối:")
    print("   - Thêm ngoại lệ cho MongoDB trong firewall")
    print("   - Tạm thời tắt antivirus để kiểm tra")
    
    print("\n4. Kiểm tra MongoDB đang lắng nghe trên mạng:")
    print("   - Windows: Chạy 'netstat -an | findstr 27017'")
    print("   - Linux/Mac: Chạy 'netstat -an | grep 27017'")
    
    print("\n5. Đảm bảo database 'movigo' đã được tạo:")
    print("   - Chạy MongoDB shell: 'mongosh'")
    print("   - Tạo database: 'use movigo'")
    print("   - Tạo collection để database được lưu: 'db.createCollection(\"users\")'")

# Kiểm tra tất cả
async def run_all_tests():
    print("==================================================")
    print("     KIỂM TRA KẾT NỐI MONGODB CHI TIẾT")
    print("==================================================")

    # Thông tin cấu hình
    print(f"MongoDB URL: {mongo_url}")
    print(f"Database: {mongo_db_name}")

    # Kiểm tra mạng
    network_ok = test_network_connection()
    
    # Kiểm tra kết nối đồng bộ
    sync_ok = test_sync_connection()
    
    # Kiểm tra kết nối bất đồng bộ
    async_ok = await test_async_connection()
    
    # Hiển thị hướng dẫn MongoDB Compass
    check_mongodb_compass()
    
    # Kết quả tổng hợp
    print("\n=== KẾT QUẢ TỔNG HỢP ===")
    print(f"Kết nối mạng cơ bản: {'✅ OK' if network_ok else '❌ Lỗi'}")
    print(f"Kết nối đồng bộ (pymongo): {'✅ OK' if sync_ok else '❌ Lỗi'}")
    print(f"Kết nối bất đồng bộ (motor): {'✅ OK' if async_ok else '❌ Lỗi'}")
    
    if not (network_ok and sync_ok and async_ok):
        print_troubleshooting_guide()
    else:
        print("\n✅ Tất cả kết nối MongoDB đều OK! Ứng dụng nên hoạt động bình thường.")

if __name__ == "__main__":
    asyncio.run(run_all_tests()) 