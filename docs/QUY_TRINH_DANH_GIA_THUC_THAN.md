# Quy trình tìm kiếm và đánh giá thức thần

Quy trình này dùng cho mọi yêu cầu chỉ gồm tên một thức thần. Bản gốc được lưu tại `../du_lieu_web/reviews/<ID>.json`; công cụ đồng bộ sẽ sao chép nó thành `public/data/reviews/<ID>.json` để website đọc.

## 1. Xác định danh tính

- Tra tên Việt, Trung, Anh và ID trong `public/data/shikigami_catalog.json`.
- Lấy tên kỹ năng chính xác từ `public/data/shikigami/<ID>.json`.
- Đọc trường `sex` trước khi dịch hoặc viết đánh giá: `m` dùng “anh”, `f` dùng “cô”. Nếu để trống, ưu tiên gọi bằng tên hoặc “thức thần này”, không đoán giới tính.
- Không dịch lại tên đã có trong dữ liệu website.

## 2. Tìm nguồn

Tìm bằng tên Trung, tên Việt và tên Anh (nếu có), ưu tiên nội dung xuất bản sau bản cập nhật gần nhất.

1. Nguồn chính thức: thông báo, mô tả kỹ năng, ghi chú cân bằng.
2. Diễn đàn: NGA, TapTap và bài thảo luận có mô tả đội hình hoặc kèo đấu cụ thể.
3. Video thực chiến: Bilibili, YouTube; ưu tiên video có cấu hình, đội hình và kết quả quan sát được.
4. Trang hướng dẫn: chỉ dùng để bổ sung, không dùng một bài tổng hợp làm bằng chứng duy nhất.

Nếu NGA chặn khách, tìm tiêu đề và đoạn trích đã được Baidu/Bing lập chỉ mục, lấy đúng `tid`, đồng thời ghi rõ giới hạn truy cập. Không suy diễn phần bình luận chưa đọc được.

## 3. Ghi bằng chứng

Mỗi nhận định phải thuộc một trong ba loại:

- **Dữ kiện:** chỉ số, hệ số kỹ năng, hiệu ứng chính thức.
- **Quan sát thực chiến:** đội hình, kèo đấu, thời gian hoặc kết quả mà nguồn thể hiện.
- **Ý kiến:** đánh giá của tác giả/người chơi; luôn ghi là quan điểm cộng đồng.

Không nâng “ý kiến” thành “dữ kiện”. Kết luận mạnh cần ít nhất hai nguồn độc lập. Nếu nguồn mâu thuẫn, trình bày cả hai và hạ `confidence`.

## 4. Khung đánh giá bắt buộc

- Kết luận một câu và tóm tắt vai trò.
- Điểm PvE ngắn lượt, PvE dài lượt, PvP và giá trị cho người mới.
- Điểm mạnh, hạn chế.
- Phân tích PvE, PvP và ngự hồn.
- Danh sách nguồn, ngày đăng và nội dung đã dùng.
- Ngày cập nhật, trạng thái duyệt và độ tin cậy.

Điểm số là bản tóm tắt tương đối của phiên bản hiện tại, không phải dữ kiện chính thức.

## 5. Quy ước định dạng nội dung

- Kỹ năng: `[Tên kỹ năng]`
- Thức thần: `《Tên thức thần》`
- Buff, dấu ấn, trạng thái có lợi: `{+Tên hiệu ứng}`
- Debuff, khống chế, trạng thái bất lợi: `{-Tên hiệu ứng}`
- Ngự hồn: `〈Tên ngự hồn〉`

Website tự chuyển các ký hiệu này thành nhãn màu. Không dùng ngoặc vuông cho nội dung khác để tránh nhầm với kỹ năng.

## 6. Kiểm tra trước khi xuất bản

- Tất cả URL mở được hoặc ghi rõ nguồn bị giới hạn đăng nhập.
- Không có con số nào chỉ xuất hiện trong một nguồn thiếu uy tín.
- Tên kỹ năng khớp dữ liệu game và nằm trong ngoặc vuông.
- Tên thức thần, buff/debuff và ngự hồn dùng đúng ký hiệu.
- Đại từ khớp trường `sex` trong dữ liệu Excel/JSON.
- Nội dung không khẳng định “T0”, “bắt buộc nuôi” hoặc “thay thế hoàn toàn” nếu thiếu điều kiện và bằng chứng.
- JSON hợp lệ và `npm run build` hoàn tất.
