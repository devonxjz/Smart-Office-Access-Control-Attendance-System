import { describe, it, expect } from 'vitest';
import { getDoorStatuses } from './chart-transforms';

describe('getDoorStatuses transform helper', () => {
  it('should return 4 devices when records is empty (demo mode default)', () => {
    const devices = getDoorStatuses([]);
    expect(devices).toHaveLength(4);
    
    const [door1, door2, light, socket] = devices;
    
    expect(door1.label).toBe('Cửa chính');
    expect(door1.status).toBe('offline');
    expect(door1.type).toBe('door');

    expect(door2.label).toBe('Cửa phụ');
    expect(door2.status).toBe('offline');
    expect(door2.type).toBe('door');

    // In demo mode, defaults to online (Bật)
    expect(light.label).toBe('Đèn dây tóc');
    expect(light.status).toBe('online');
    expect(light.type).toBe('light');

    expect(socket.label).toBe('Ổ cắm nguồn');
    expect(socket.status).toBe('online');
    expect(socket.type).toBe('socket');
  });

  it('should set light and socket to online if there are active check-ins (people inside)', () => {
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const records = [
      {
        uid: 'NV01',
        name: 'Alice',
        timeIn: '08:00:00',
        timeOut: '',
        date: todayStr,
      }
    ];

    const devices = getDoorStatuses(records);
    expect(devices).toHaveLength(4);

    const [, , light, socket] = devices;
    expect(light.status).toBe('online');
    expect(socket.status).toBe('online');
  });

  it('should set light and socket to offline if everyone has checked out (no one inside)', () => {
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const records = [
      {
        uid: 'NV01',
        name: 'Alice',
        timeIn: '08:00:00',
        timeOut: '17:00:00',
        date: todayStr,
      }
    ];

    const devices = getDoorStatuses(records);
    expect(devices).toHaveLength(4);

    const [, , light, socket] = devices;
    expect(light.status).toBe('offline');
    expect(socket.status).toBe('offline');
  });
});
