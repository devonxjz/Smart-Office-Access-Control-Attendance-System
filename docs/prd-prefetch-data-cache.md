# PRD — Type-Safe SPA Route Parallel Prefetch & Map Caching

## Problem Statement

Hiện tại, khi người dùng điều hướng giữa các trang trong ứng dụng Smart Office (Tổng quan, Nhân viên, Chấm công, Cài đặt), ứng dụng React sẽ thực hiện gọi API riêng lẻ cho từng trang **ngay lúc trang đó bắt đầu mount**. Điều này gây ra một số vấn đề nghiêm trọng ảnh hưởng đến trải nghiệm người dùng (UX):
*   Người dùng liên tục gặp màn hình tải (skeleton hoặc loading spinner) mỗi khi chuyển trang.
*   Cảm giác ứng dụng phản hồi chậm chạp (laggy perceived performance) mặc dù tốc độ đường truyền thực tế không hề chậm.
*   Không tối ưu hóa tài nguyên mạng do các API call có thể bị lặp lại và không được đồng bộ hóa chạy song song lúc khởi động.

---

## Solution

Xây dựng một Module Cache trung tâm bằng TypeScript hoạt động ngầm (background) giúp tải trước (prefetch) song song toàn bộ dữ liệu của 4 trang/tuyến đường (routes) chính ngay khi ứng dụng vừa được khởi động (`main.tsx`).
*   **Prefetch Song Song**: Sử dụng `Promise.allSettled` để fetch đồng thời 4 luồng dữ liệu chính (`home`, `employee`, `log`, `config`) ngay khi App khởi động, không chờ người dùng click chuyển trang.
*   **Bộ Nhớ Cache Tạm Thời**: Sử dụng một `Map` duy nhất lưu trong bộ nhớ (session-level) để lưu trữ dữ liệu.
*   **Hiển Thị Tức Thì (Instant-Load)**: Khi người dùng chuyển trang, component sẽ đọc dữ liệu trực tiếp từ Cache để hiển thị ngay lập tức (0ms delay). Nếu dữ liệu chưa được tải xong, component sẽ hiển thị trạng thái loading tạm thời và tự động cập nhật khi fetch hoàn tất.

---

## User Stories

1.  **As a** dashboard administrator, **I want** all core data to be loaded in the background immediately when the app starts, **so that** I do not have to wait for separate loading spinners on each page I visit.
2.  **As a** system operator, **I want** transition times between pages to be instantaneous, **so that** my daily workflows are fast and uninterrupted.
3.  **As a** mobile user with limited network resources, **I want** the app to cache previously fetched data in memory, **so that** redundant API calls are eliminated when navigating back and forth between the same pages.
4.  **As a** developer, **I want** the caching library to be fully type-safe in TypeScript, **so that** I cannot query invalid cache keys or pass incorrectly shaped objects.
5.  **As an** administrator, **I want** the cache to support manual clearing (e.g., during logout or manual refresh), **so that** I can force the application to retrieve the newest sheets data.

---

## Data Contracts (Sơ đồ Dữ liệu Endpoints)

Để đảm bảo tính toàn vẹn dữ liệu và hỗ trợ tính năng tự hoàn thiện kiểu (IntelliSense) khi phát triển, 4 tuyến dữ liệu chính được định nghĩa như sau:

```typescript
export interface HomeData {
  stats: {
    totalEmployees: number;
    activeToday: number;
    pendingRequests: number;
    systemStatus: 'online' | 'offline';
  };
  recentActivities: Array<{
    id: string;
    timestamp: string;
    description: string;
  }>;
}

export interface EmployeeData {
  'Mã NV': string;
  'Họ tên': string;
  'RFID UID': string;
  'Phòng ban': string;
  'Trạng thái': 'Active' | 'Inactive';
}

export interface LogData {
  date: string;
  uid: string;
  name: string;
  shiftStart: string;
  timeIn: string;
  status: string;
  timeOut: string;
}

export interface ConfigData {
  shiftStart: string;
  shiftEnd: string;
  allowLateMinutes: number;
  adminEmail: string;
}

// Cấu trúc gói tin phản hồi chuẩn từ Google Apps Script (GAS)
export interface AppsScriptResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

---

## Implementation Decisions

### 1. Centralized Memory Cache Module
Xây dựng một module cache trung tâm (`dataCache`) chịu trách nhiệm lưu trữ và điều phối tất cả các hoạt động prefetching.
*   Sử dụng cấu trúc `Map` trong bộ nhớ JavaScript để duy trì dữ liệu qua các lần chuyển trang (SPA transitions).
*   Định nghĩa kiểu dữ liệu nghiêm ngặt trong TypeScript để kiểm soát các Key hợp lệ:
    ```typescript
    export type CacheKey = 'home' | 'employee' | 'log' | 'config';
    ```

### 2. Parallel Prefetching with Promise.allSettled (Fault Tolerance)
*   Sử dụng `Promise.allSettled` thay vì `Promise.all` để tải dữ liệu song song. Quyết định này giúp tăng khả năng chịu lỗi (fault-tolerance): Nếu một hoặc nhiều nguồn dữ liệu gặp lỗi mạng hoặc cấu hình sai, các nguồn dữ liệu còn lại vẫn được tải và nạp vào cache bình thường (partial cache load), không làm sập toàn bộ dashboard shell.
*   Bộ ghi nhận lỗi ngầm sẽ sử dụng biến môi trường `import.meta.env.DEV` để chỉ log cảnh báo lỗi trong chế độ phát triển, tránh làm ô nhiễm (pollute) log console trên môi trường Production.
*   Trường hợp thiếu biến cấu hình URL gốc (`VITE_GAS_URL`), hệ thống sẽ quăng lỗi cảnh báo sớm trong môi trường kiểm thử/phát triển thay vì chạy ngầm sai sót không lời báo hiệu.

### 3. Fine-Grained Caching & TTL Expiration Check
*   **Thời gian sống của Cache (TTL - Time-To-Live)**: Đặt giới hạn TTL mặc định là **5 phút (300,000 ms)**.
*   **Tải từng phần thông minh (Fine-Grained Fetching)**: Khi kích hoạt `prefetchAll()`, hệ thống chỉ lọc ra và gửi request cho những CacheKey chưa có dữ liệu hoặc đã quá hạn TTL. Những key còn hiệu lực sẽ hoàn toàn được giữ lại, tiết kiệm tối đa lượt gọi API.
*   Khi truy cập dữ liệu qua `getCache()`, nếu kiểm tra thấy thời gian lưu trữ vượt quá giới hạn TTL, cache của key đó sẽ tự động bị xóa (evict) và trả về `undefined` để component kích hoạt fallback fetch dữ liệu mới.

### 4. Type-Safe Read/Write Interfaces
*   Cung cấp các hàm có định dạng kiểu generic gán trực tiếp theo bảng ánh xạ dữ liệu `CacheDataMap`:
    ```typescript
    export function getCache<K extends CacheKey>(key: K): CacheDataMap[K] | undefined;
    export function setCache<K extends CacheKey>(key: K, data: CacheDataMap[K]): void;
    ```
*   Cung cấp hàm `clearCache()` để giải phóng toàn bộ vùng nhớ cache khi người dùng đăng xuất hoặc khi cần tải lại thủ công.

---

## Testing & Performance Decisions

### 1. Acceptance Benchmark & Performance Tracking
*   Sử dụng hệ thống Web Performance API chuẩn của trình duyệt (`performance.mark` và `performance.measure`) để ghi nhận khoảng thời gian prefetch dữ liệu dưới tên đo lường `prefetch-duration`.
*   Tự động xóa các mốc ghi nhận (`performance.clearMarks`) trước khi ghi nhận lượt mới để tránh cảnh báo trùng lặp mốc (duplicate markers) trên các nền tảng trình duyệt khác nhau.
*   Mục tiêu trải nghiệm điều hướng tức thì sẽ được đánh giá tự động thông qua các kịch bản đo kiểm End-to-End (E2E) bằng việc lấy khoảng thời gian chênh lệch giữa click chuyển trang và kết xuất hoàn tất (Time-to-Interactive) đảm bảo luôn đạt mức nhỏ hơn **50ms** khi dữ liệu đã sẵn sàng trong cache.

### 2. Kiểm Thử Hành Vi Bên Ngoài (Behavior-Driven Testing)
*   Tập trung kiểm thử các hành vi đầu ra và tính nhất quán của bộ nhớ cache đối với các tương tác của người dùng, không phụ thuộc vào chi tiết cài đặt bên trong.
*   Sử dụng **Vitest** để kiểm tra độ tin cậy của các hàm.

### 3. Các Case Cần Kiểm Thử Đầy Đủ
*   **Manual Cache Control**: Đảm bảo hàm `setCache` lưu trữ đúng và `getCache` lấy ra đúng cấu trúc đối tượng dữ liệu. Hàm `clearCache` phải dọn sạch hoàn toàn các dữ liệu đã lưu.
*   **Parallel Fetch Execution**: Sử dụng cơ chế Mock Global `fetch` để kiểm tra hàm `prefetchAll` kích hoạt đúng số lượng cuộc gọi mạng song song cần thiết và trích xuất đúng trường `data` từ Apps Script response envelope.
*   **Fine-Grained Skip behavior**: Xác thực hành vi bỏ qua các key đã có cache còn hiệu lực và chỉ tải lại các key đã hết hạn hoặc chưa tồn tại.

---

## Out of Scope

*   **Persistent Offline Storage**: Không lưu trữ cache xuống `localStorage` hay `IndexedDB` để phòng ngừa rủi ro lộ lọt thông tin nhạy cảm của nhân sự trên thiết bị dùng chung. Cache chỉ sống trong phiên làm việc hiện tại (In-Memory).
*   **Web Workers / Service Workers**: Không tách luồng prefetch sang Service Worker để giữ cho cấu trúc ứng dụng đơn giản và dễ bảo trì.
*   **Real-time Synchronization**: Đồng bộ hóa dữ liệu thời gian thực thông qua WebSockets không nằm trong phạm vi của PRD này. Dữ liệu sẽ được cập nhật thủ công hoặc theo cơ chế stale-while-revalidate ở tầng trên.

---

## Further Notes

*   **Tương thích mở rộng**: Thiết kế của `dataCache` ở mức độc lập cao (deep module), cho phép tầng React Context hoặc bất kỳ React Hook nào (như `useAppData`) bọc ngoài nó để bổ sung thêm cơ chế tự động làm mới ngầm (Interval Background Refresh) hoặc cơ chế hiển thị đệm một cách dễ dàng mà không làm ảnh hưởng đến các Component tiêu dùng dữ liệu ở mức dưới.
