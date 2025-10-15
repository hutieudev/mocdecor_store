# mocdecor_store

Trình tạo collage ảnh trực tuyến cho phép bạn tải nhiều ảnh cùng lúc, sắp xếp lại bằng kéo thả và xuất ra tệp PNG chất lượng cao. Ứng dụng chạy hoàn toàn trên trình duyệt, không cần cấu hình phía máy chủ.

## Tính năng chính

- ✨ Ghép collage tự động theo bố cục lưới, ngang hoặc dọc.
- 🖱️ Kéo thả tệp trực tiếp vào khung tải ảnh.
- 🔀 Sắp xếp lại thứ tự bằng kéo thả hoặc các nút điều hướng.
- 🎨 Tùy chỉnh màu nền, khoảng cách giữa các ảnh và kích thước ảnh xuất.
- 💾 Tải về kết quả ở định dạng PNG chỉ với một cú nhấp chuột.

## Cách sử dụng

1. Mở tệp `index.html` trong trình duyệt hoặc chạy một máy chủ tĩnh (ví dụ `python -m http.server`).
2. Kéo thả hoặc chọn nhiều ảnh từ máy tính.
3. Điều chỉnh bố cục, khoảng cách, màu nền hoặc trộn thứ tự nếu muốn.
4. Nhấn **Tải về PNG** để lưu collage về máy.

## Phát triển

Toàn bộ mã nguồn nằm trong ba tệp chính:

- `index.html`: cấu trúc trang và thành phần giao diện.
- `styles.css`: phong cách hiển thị, hỗ trợ cả chế độ sáng và tối.
- `script.js`: logic xử lý tải ảnh, sắp xếp, dựng canvas và tải về kết quả.

Bạn có thể mở rộng thêm các bố cục hoặc hiệu ứng bằng cách chỉnh sửa các tệp trên.
