// Event payload types
type EventPayload = {
  'patient:status:changed': { patientId: string; newStatus: string };
};

type EventCallback<T = unknown> = (payload: T) => void;

// 간단한 이벤트 버스 구현
class EventBus {
  private events: { [K in keyof EventPayload]?: Array<EventCallback<EventPayload[K]>> } = {};

  on<K extends keyof EventPayload>(event: K, callback: EventCallback<EventPayload[K]>) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]!.push(callback);
  }

  off<K extends keyof EventPayload>(event: K, callback: EventCallback<EventPayload[K]>) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event]!.filter(cb => cb !== callback);
  }

  emit<K extends keyof EventPayload>(event: K, payload: EventPayload[K]) {
    if (!this.events[event]) return;
    this.events[event]!.forEach(callback => callback(payload));
  }
}

export const eventBus = new EventBus();

// 이벤트 타입
export const EVENTS = {
  PATIENT_STATUS_CHANGED: 'patient:status:changed',
} as const;