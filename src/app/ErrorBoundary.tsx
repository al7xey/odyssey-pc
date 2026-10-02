import { Component, type ReactNode } from 'react';
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  {
    failed: boolean;
  }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="scene-status">
          <strong>Не удалось открыть мастерскую</strong>
          <span>Ваша сборка сохранена в браузере.</span>
          <button className="primary-btn" onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </button>
        </div>
      );
    return this.props.children;
  }
}
