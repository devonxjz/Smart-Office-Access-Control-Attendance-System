---
name: mimo-ai
description: Sử dụng mô hình MiMo-V2.5-Pro để xử lý các câu hỏi thông minh, phân tích mã nguồn hoặc hỗ trợ tiếng Việt chuyên sâu. Sử dụng khi người dùng yêu cầu dùng "MiMo", "Xiaomi AI" hoặc khi cần một góc nhìn khác ngoài model chính.
---

# MiMo AI Skill

## Quick start

Để gọi MiMo AI, tôi sẽ sử dụng script `scripts/mimo_chat.py`. Bạn có thể yêu cầu:
- "Hỏi MiMo về đoạn code này"
- "Dùng MiMo AI giải thích cho tôi..."

## Workflows

1. **Gửi câu hỏi**: Tôi sẽ lấy nội dung câu hỏi từ bạn.
2. **Gọi Script**: Chạy `python .agents/skills/mimo-ai/scripts/mimo_chat.py --prompt "nội dung"`.
3. **Trả lời**: Trình bày kết quả nhận được từ MiMo-V2.5-Pro.

## Configuration

Các thông số API được lưu trong file `.env` ở thư mục gốc:
- `MIMO_API_KEY`: API Key
- `MIMO_BASE_URL`: https://token-plan-sgp.xiaomimimo.com/v1
- `MIMO_MODEL`: mimo-v2.5-pro
