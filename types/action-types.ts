export interface ActionState<T> {
  isSuccess: boolean;
  message: string;
  data?: T;
} 