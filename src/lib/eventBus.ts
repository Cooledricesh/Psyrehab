// 간단한 이벤트 버스 구현
class EventBus {
  private events: { [key: string]: Array<(...args: unknown[]) => void> } = {};

  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: unknown[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }
}

export const eventBus = new EventBus();

// 이벤트 타입
export const EVENTS = {
  PATIENT_STATUS_CHANGED: 'patient:status:changed',
} as const;