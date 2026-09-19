# HanziAI - Kiến Trúc Cơ Sở Dữ Liệu & Hướng Dẫn Supabase

Tài liệu thiết kế cơ sở dữ liệu PostgreSQL cho **HanziAI**, hỗ trợ lưu trữ đám mây, bảo mật hàng (Row Level Security - RLS), đồng bộ đa thiết bị và hỗ trợ chế độ Khách (Guest Mode) linh hoạt.

---

## 1. Danh sách Bảng dữ liệu (Tables)

### `profiles`
Bảng thông tin người dùng liên kết 1-1 với `auth.users(id)`.
* `id` (UUID, PK, REFERENCES auth.users): Mã định danh người dùng.
* `email` (TEXT): Email người dùng.
* `display_name` (TEXT): Tên hiển thị.
* `avatar_url` (TEXT): Đường dẫn ảnh đại diện.
* `native_language` (TEXT): Ngôn ngữ mẹ đẻ (mặc định `'vi'`).
* `target_language` (TEXT): Ngôn ngữ học (mặc định `'zh-CN'`).
* `hsk_level` (INT): Cấp độ HSK (1 - 6).
* `learning_goal` (TEXT): Mục tiêu (`conversation`, `travel`, `work`, `exam`, `culture`, `general`).
* `daily_minutes` (INT): Thời gian học mục tiêu hàng ngày (5, 10, 15, 30, 45).
* `show_pinyin` (BOOLEAN): Bật/tắt hiển thị pinyin.
* `show_translation` (BOOLEAN): Bật/tắt dịch nghĩa tiếng Việt.
* `preferred_voice` (TEXT): Giọng AI (mặc định `'Lina'`).
* `speech_speed` (NUMERIC): Tốc độ phát âm (0.75 - 1.25x).
* `onboarding_completed` (BOOLEAN): Trạng thái hoàn thành 5 bước thiết lập ban đầu.

### `conversation_sessions`
Các phiên trò chuyện giữa học viên và AI Lina.
* `id` (UUID, PK): Mã định danh phiên học.
* `user_id` (UUID, FK): Liên kết người dùng.
* `title` (TEXT): Tiêu đề buổi nói chuyện.
* `topic` (TEXT): Chủ đề (Cà phê, Du lịch, Phỏng vấn...).
* `learner_level` (INT): Cấp độ người học tại thời điểm trò chuyện.
* `summary` (TEXT): Bản tóm tắt ngữ cảnh cuộc trò chuyện được cập nhật tự động.
* `key_facts` (JSONB): Mảng các dữ kiện học viên đã chia sẻ (sở thích, công việc...).
* `vocabulary` (JSONB): Các từ vựng đã xuất hiện trong bài nói.

### `conversation_messages`
Các tin nhắn trong từng phiên hội thoại.
* `id` (TEXT, PK): Mã tin nhắn.
* `session_id` (UUID, FK): Phiên hội thoại.
* `user_id` (UUID, FK): Người dùng gửi hoặc nhận.
* `role` (TEXT): `'user'` hoặc `'assistant'`.
* `chinese` (TEXT): Nội dung chữ Hán.
* `pinyin` (TEXT): Phiên âm pinyin chuẩn.
* `translation` (TEXT): Nghĩa tiếng Việt.
* `analysis` (JSONB): Phân tích sửa lỗi, từ vựng, ngữ pháp, điểm tự nhiên.
* `timestamp` (TIMESTAMPTZ): Thời điểm gửi.

### `learning_progress`
Tiến độ học tập và chuỗi ngày học liên tục (Streak).
* `user_id` (UUID, PK, FK): Người dùng.
* `total_study_minutes` (INT): Tổng phút đã học.
* `lessons_completed` (INT): Số bài học hoàn thành.
* `words_learned` (INT): Số từ vựng đã thuộc.
* `speaking_minutes` (INT): Số phút luyện nói AI.
* `conversations_completed` (INT): Số buổi trò chuyện hoàn thành.
* `current_streak` (INT): Chuỗi ngày học liên tục hiện tại.
* `longest_streak` (INT): Kỷ lục streak dài nhất.
* `last_study_date` (DATE): Ngày học gần nhất (dùng để tính toán streak tự động).

### `user_vocabulary`
Sổ tay từ vựng cá nhân của học viên kèm Spaced Repetition (SRS).
* `id` (UUID, PK): Mã bản ghi từ vựng.
* `user_id` (UUID, FK): Người dùng sở hữu.
* `hanzi` (TEXT): Chữ Hán.
* `pinyin` (TEXT): Phiên âm.
* `meaning` (TEXT): Nghĩa tiếng Việt.
* `hsk_level` (INT): Cấp độ HSK.
* `status` (TEXT): `'new'`, `'learning'`, `'learned'`.
* `review_count` (INT): Số lần đã ôn tập.
* `next_review_at` (TIMESTAMPTZ): Thời điểm ôn tập tiếp theo.

### `subscriptions`
Trạng thái gói tài khoản người dùng (Free hoặc Pro).

---

## 2. Bảo mật RLS (Row Level Security)

Tất cả bảng đều được kích hoạt RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
Người dùng chỉ có thể đọc/ghi dữ liệu của chính mình thông qua điều kiện:
```sql
auth.uid() = user_id -- (hoặc auth.uid() = id đối với bảng profiles)
```

## 3. Biến môi trường

Khai báo trong `.env`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Tùy chọn Mock Mode khi chưa cấu hình Supabase
VITE_USE_MOCK_AUTH=false
```
Khi các biến trên không được cấu hình hoặc đặt `VITE_USE_MOCK_AUTH=true`, HanziAI tự động chuyển sang chế độ Mock/Demo đầy đủ tính năng mà không bị lỗi.
