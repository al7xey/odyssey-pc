import { useEffect, useRef, useState, type RefObject } from 'react';
import { Box, RotateCcw, MousePointer2 } from 'lucide-react';
import type PCScene from './engine';
import type { Appearance, Category, Selection } from '../../entities/catalog';
type Props = {
  selection: Selection;
  appearance: Appearance;
  active: Category;
  sceneRef: RefObject<PCScene | null>;
  onHover: (category: Category | null) => void;
  onSelect: (category: Category) => void;
};
export default function PCViewer({
  selection,
  appearance,
  active,
  sceneRef,
  onHover,
  onSelect,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ selection, appearance, active, onHover, onSelect });
  latest.current = { selection, appearance, active, onHover, onSelect };
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    import('./engine')
      .then(({ default: Engine }) => {
        if (cancelled || !host.current) return;
        try {
          const current = latest.current;
          sceneRef.current = new Engine(host.current, current.selection, current.appearance, {
            hover: (c) => latest.current.onHover(c),
            select: (c) => latest.current.onSelect(c),
            error: () => setStatus('error'),
          });
          sceneRef.current.highlight(current.active);
          setStatus('ready');
        } catch {
          setStatus('error');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [retry, sceneRef]);
  useEffect(() => {
    sceneRef.current?.build(selection);
  }, [selection, sceneRef]);
  useEffect(() => {
    sceneRef.current?.updateAppearance(appearance);
  }, [appearance, sceneRef]);
  useEffect(() => {
    sceneRef.current?.highlight(active);
  }, [active, sceneRef]);
  return (
    <>
      <div className="scene-canvas" ref={host} />
      {status === 'loading' && (
        <div className="scene-status">
          <Box size={36} className="loading-cube" />
          <strong>Собираем вашу Одиссею</strong>
          <span>Загружаем 3D-мастерскую…</span>
        </div>
      )}
      {status === 'error' && (
        <div className="scene-status">
          <Box size={40} />
          <strong>3D-сцена недоступна</strong>
          <span>
            Включите аппаратное ускорение браузера.
            <br />
            Выбор деталей и расчёт продолжают работать.
          </span>
          <button className="subtle-btn" onClick={() => setRetry((v) => v + 1)}>
            <RotateCcw size={15} /> Повторить
          </button>
        </div>
      )}
      {status === 'ready' && (
        <div className="scene-hint">
          <MousePointer2 size={13} /> Вращайте модель · Нажмите на деталь
        </div>
      )}
    </>
  );
}
