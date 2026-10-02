import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  RotateCcw,
  Rotate3D,
  Layers3,
  Maximize,
  Minimize,
  Camera,
  Save,
  Share2,
  X,
  Plus,
  Minus,
  ShieldCheck,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Menu,
  MousePointer2,
  Palette,
  Box,
  Wrench,
} from 'lucide-react';
import {
  catalog,
  categories,
  getPart,
  money,
  totalPrice,
  compatibility,
  repairSelection,
  defaultAppearance,
  type Category,
  type Selection,
} from './entities/catalog';
import useBuild from './features/build/useBuild';
import PCViewer from './widgets/scene/PCViewer';
import type PCScene from './widgets/scene/engine';
import PartIcon from './shared/PartIcon';
import { downloadFile } from './shared/download';
import { rgbColors } from './entities/appearance';
import BuildDialogs, { type Dialog } from './widgets/BuildDialogs';
import ComponentPanel from './widgets/ComponentPanel';
import SiteSections from './widgets/SiteSections';
export default function App() {
  const { selection, appearance, dispatch } = useBuild();
  const [active, setActive] = useState<Category>('case');
  const [panel, setPanel] = useState<'parts' | 'style'>('parts');
  const [hovered, setHovered] = useState<Category | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [view, setView] = useState<'iso' | 'front' | 'side'>('iso');
  const sceneRef = useRef<PCScene | null>(null);
  const builderRef = useRef<HTMLDivElement>(null);
  const total = totalPrice(selection),
    issues = compatibility(selection);
  const compatibleCount = categories.length - new Set(issues.map((i) => i.category)).size;
  const notify = (message: string) => setToast(message);
  useEffect(() => {
    if (toast) {
      const id = window.setTimeout(() => setToast(''), 4200);
      return () => clearTimeout(id);
    }
  }, [toast]);
  useEffect(() => {
    const listener = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', listener);
    return () => document.removeEventListener('fullscreenchange', listener);
  }, []);
  const selectCategory = (category: Category) => {
    setActive(category);
    setPanel('parts');
  };
  const choose = (id: string) => {
    const next = { ...selection, [active]: id };
    if (active === 'cpu' && getPart(next, 'cpu').socket !== getPart(next, 'motherboard').socket) {
      const board = catalog.motherboard.find((p) => p.socket === getPart(next, 'cpu').socket)!;
      next.motherboard = board.id;
      dispatch({ type: 'load', value: { selection: next, appearance } });
      notify(`Материнская плата заменена на ${board.name}: подходящий сокет`);
    } else dispatch({ type: 'part', category: active, id });
  };
  const applyPreset = (next: Selection, name: string) => {
    dispatch({
      type: 'load',
      value: {
        selection: { ...next },
        appearance: {
          ...defaultAppearance,
          theme: appearance.theme,
          color: appearance.color,
        },
      },
    });
    notify(`Сборка ${name} загружена`);
  };
  const buildDocument = () => ({
    version: 1,
    brand: 'ODYSSEY PC',
    createdAt: new Date().toISOString(),
    selection,
    appearance,
    parts: categories.map((c) => ({
      category: c.label,
      ...getPart(selection, c.id),
    })),
    assembly: 8900,
    total,
    currency: 'RUB',
    estimated: true,
    compatibility: issues,
  });
  const exportBuild = () => {
    downloadFile(JSON.stringify(buildDocument(), null, 2), 'odyssey-build.json');
    notify('Конфигурация скачана. Сборка также сохранена в этом браузере.');
  };
  const shareBuild = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('build', btoa(JSON.stringify({ selection, appearance })));
    url.hash = 'configurator';
    try {
      await navigator.clipboard.writeText(url.toString());
      notify('Ссылка на сборку скопирована');
    } catch {
      downloadFile(url.toString(), 'odyssey-build-link.txt', 'text/plain');
      notify('Ссылка сохранена в текстовый файл');
    }
  };
  const screenshot = async () => {
    const blob = await sceneRef.current?.capture();
    if (blob) {
      downloadFile(blob, 'odyssey-pc.png');
      notify('Снимок 3D-модели сохранён');
    } else notify('Дождитесь загрузки 3D-модели');
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await builderRef.current?.requestFullscreen();
    } catch {
      notify('Полноэкранный режим недоступен в этом браузере');
    }
  };
  const changeView = (next: typeof view) => {
    setView(next);
    sceneRef.current?.view(next);
  };
  const pickFromScene = (category: Category) => {
    selectCategory(category);
    sceneRef.current?.focus(category);
  };
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Odyssey PC — главная">
          <img src="/brand/helmet.svg" alt="" />
          <span>
            ODYSSEY<span className="brand-pc">PC / CUSTOM SYSTEMS</span>
          </span>
        </a>
        <nav className={mobileNav ? 'main-nav open' : 'main-nav'} aria-label="Навигация">
          <a href="#builds" onClick={() => setMobileNav(false)}>
            Готовые сборки
          </a>
          <a href="#configurator" className="active" onClick={() => setMobileNav(false)}>
            3D-конфигуратор <span className="tiny-tag">NEW</span>
          </a>
          <a href="#workshop" onClick={() => setMobileNav(false)}>
            Мастерская
          </a>
        </nav>
        <div className="header-actions">
          <span className="studio-status">
            <i /> 3D-мастерская
          </span>
          <button className="contact-btn" onClick={() => setDialog('help')}>
            Связаться с нами <ArrowUpRight size={15} />
          </button>
          <button
            className="icon-btn mobile-menu"
            aria-label="Открыть меню"
            onClick={() => setMobileNav((v) => !v)}
          >
            {mobileNav ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="top">
        <section className="builder-intro page-width">
          <div className="breadcrumb">
            <span>Odyssey PC</span>
            <ChevronRight size={12} />
            <span>Мастерская вашей мощности</span>
          </div>
          <div className="intro-row">
            <div>
              <div className="eyebrow">
                <span className="yellow-dot" /> СОЗДАНО ВАМИ. СОБРАНО НАМИ.
              </div>
              <h1>
                Твоя мощь. <span>Твои правила.</span>
              </h1>
              <p>Соберите свой идеальный PC. Рассмотрите каждую деталь в 3D.</p>
            </div>
            <div className="intro-badge">
              <Box size={26} strokeWidth={1} />
              <span>
                Всё начинается
                <br />
                <b>с вашей идеи</b>
              </span>
              <span className="badge-index">01 / ∞</span>
            </div>
          </div>
        </section>
        <section className="page-width" id="configurator" aria-label="3D-конфигуратор ПК">
          <div className="builder" ref={builderRef}>
            <div className="builder-topbar">
              <div className="builder-title">
                <span className="builder-live" />
                <strong>
                  ODYSSEY <span>BUILDER</span>
                </strong>
                <span className="version">V. 1.0</span>
              </div>
              <div className="topbar-right">
                <span className="autosave">
                  <Check size={12} /> Автосохранение
                </span>
                <button
                  className="subtle-btn"
                  onClick={shareBuild}
                  title="Скопировать ссылку на сборку"
                >
                  <Share2 size={14} />
                  <span>Поделиться</span>
                </button>
                <button className="subtle-btn" onClick={exportBuild}>
                  <Save size={14} />
                  <span>Сохранить</span>
                </button>
                <button
                  className="icon-btn"
                  onClick={() => {
                    sceneRef.current?.resetCamera();
                    setView('iso');
                    dispatch({
                      type: 'appearance',
                      value: { exploded: false, rotating: false },
                    });
                    notify('Вид сброшен');
                  }}
                  title="Сбросить вид"
                  aria-label="Сбросить вид"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
            <div className="builder-body">
              <aside className="parts-sidebar">
                <div className="sidebar-heading">
                  ВАША КОНФИГУРАЦИЯ <span>08</span>
                </div>
                <div className="category-list">
                  {categories.map((category, index) => (
                    <button
                      key={category.id}
                      className={`category-row ${
                        active === category.id && panel === 'parts' ? 'active' : ''
                      } ${hovered === category.id ? 'scene-hover' : ''}`}
                      onClick={() => selectCategory(category.id)}
                      aria-pressed={active === category.id && panel === 'parts'}
                    >
                      <span className="category-number">0{index + 1}</span>
                      <PartIcon category={category.id} size={19} />
                      <span className="category-info">
                        <strong>{category.label}</strong>
                        <small>{getPart(selection, category.id).name}</small>
                      </span>
                      {issues.some((i) => i.category === category.id) ? (
                        <AlertTriangle size={13} className="warning-color" />
                      ) : (
                        <Check size={13} className="category-check" />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  className={`style-tab ${panel === 'style' ? 'active' : ''}`}
                  onClick={() => setPanel('style')}
                >
                  <Palette size={18} />
                  <span>Внешний вид и RGB</span>
                  <ChevronRight size={14} />
                </button>
                <div className="sidebar-bottom">
                  <div className="assembly-check">
                    <ShieldCheck size={19} />
                    <span>
                      <strong>{issues.length ? 'Нужна проверка' : 'Идеально совместимы'}</strong>
                      <small>{compatibleCount} из 8 компонентов</small>
                    </span>
                    <span className="check-orbit">{issues.length ? '!' : '✓'}</span>
                  </div>
                  <button className="summary-link" onClick={() => setDialog('summary')}>
                    Вся спецификация <ArrowUpRight size={13} />
                  </button>
                </div>
              </aside>
              <div className="scene-panel" style={{ '--rgb': appearance.color } as CSSProperties}>
                <div className="scene-grid" />
                <div className="scene-glow" />
                <div className="scene-top">
                  <div>
                    <span className="scene-label">LIVE PREVIEW</span>
                    <div className="scene-model-name">
                      ODYSSEY <b>CUSTOM</b>
                    </div>
                  </div>
                  <span className="scene-3d">
                    <span /> REALTIME 3D
                  </span>
                </div>
                <PCViewer
                  selection={selection}
                  appearance={appearance}
                  active={panel === 'style' ? 'case' : active}
                  sceneRef={sceneRef}
                  onHover={setHovered}
                  onSelect={pickFromScene}
                />
                <div className="scene-toolbar">
                  <button
                    className={`tool-btn ${appearance.rotating ? 'active' : ''}`}
                    title="Автовращение"
                    aria-label="Автовращение"
                    aria-pressed={appearance.rotating}
                    onClick={() =>
                      dispatch({
                        type: 'appearance',
                        value: { rotating: !appearance.rotating },
                      })
                    }
                  >
                    <Rotate3D size={19} />
                  </button>
                  <button
                    className={`tool-btn ${appearance.exploded ? 'active' : ''}`}
                    title="Разобрать по слоям"
                    aria-label="Разобрать по слоям"
                    aria-pressed={appearance.exploded}
                    onClick={() =>
                      dispatch({
                        type: 'appearance',
                        value: { exploded: !appearance.exploded },
                      })
                    }
                  >
                    <Layers3 size={18} />
                  </button>
                  <div className="tool-divider" />
                  <button
                    className="tool-btn"
                    title="Приблизить"
                    aria-label="Приблизить"
                    onClick={() => {
                      if (sceneRef.current) sceneRef.current.camera.position.multiplyScalar(0.92);
                    }}
                  >
                    <Plus size={19} />
                  </button>
                  <button
                    className="tool-btn"
                    title="Отдалить"
                    aria-label="Отдалить"
                    onClick={() => {
                      if (sceneRef.current) sceneRef.current.camera.position.multiplyScalar(1.08);
                    }}
                  >
                    <Minus size={19} />
                  </button>
                  <div className="tool-divider" />
                  <button
                    className="tool-btn"
                    onClick={screenshot}
                    title="Скачать снимок"
                    aria-label="Скачать снимок"
                  >
                    <Camera size={18} />
                  </button>
                  <button
                    className="tool-btn"
                    onClick={toggleFullscreen}
                    title="Полный экран"
                    aria-label="Полный экран"
                  >
                    {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                  </button>
                </div>
                {hovered && (
                  <div className="hover-label">
                    <PartIcon category={hovered} size={14} />
                    <span>{getPart(selection, hovered).name}</span>
                    <MousePointer2 size={12} />
                  </div>
                )}
                <div className="scene-bottom">
                  <div className="view-picker">
                    {(['iso', 'side', 'front'] as const).map((v) => (
                      <button
                        key={v}
                        className={view === v ? 'active' : ''}
                        onClick={() => changeView(v)}
                      >
                        {v === 'iso' ? 'Перспектива' : v === 'side' ? 'Сбоку' : 'Спереди'}
                      </button>
                    ))}
                  </div>
                  <span className="scene-scale">
                    1:1 <span> / </span> ATX
                  </span>
                </div>
                <div className="rgb-quick">
                  <span>RGB</span>
                  {rgbColors.map((c) => (
                    <button
                      key={c.color}
                      aria-label={c.label}
                      title={c.label}
                      aria-pressed={appearance.color === c.color}
                      className={appearance.color === c.color ? 'selected' : ''}
                      style={{ '--swatch': c.color } as CSSProperties}
                      onClick={() =>
                        dispatch({
                          type: 'appearance',
                          value: { color: c.color },
                        })
                      }
                    />
                  ))}
                  <button
                    className="rgb-config"
                    aria-label="Настройки подсветки"
                    onClick={() => setPanel('style')}
                  >
                    <SlidersHorizontal size={13} />
                  </button>
                </div>
              </div>
              <ComponentPanel
                active={active}
                panel={panel}
                selection={selection}
                appearance={appearance}
                dispatch={dispatch}
                choose={choose}
                onInspect={() => {
                  sceneRef.current?.focus(active);
                  notify(`Фокус: ${getPart(selection, active).name}`);
                }}
              />
            </div>
            <div className="builder-footer">
              <div className={`compatibility-status ${issues.length ? 'has-issues' : ''}`}>
                <ShieldCheck size={23} />
                <span>
                  <strong>
                    {issues.length ? `${issues.length} замечания к сборке` : 'Можно собирать'}
                  </strong>
                  <small>
                    {issues.length ? issues[0].message : 'Совместимость компонентов проверена'}
                  </small>
                </span>
                {issues.length > 0 && (
                  <button
                    onClick={() => {
                      dispatch({
                        type: 'load',
                        value: {
                          selection: repairSelection(selection),
                          appearance,
                        },
                      });
                      notify('Совместимые компоненты подобраны');
                    }}
                  >
                    Исправить
                  </button>
                )}
              </div>
              <div className="total-price">
                <span>СТОИМОСТЬ СБОРКИ</span>
                <strong>
                  {money(total)}
                  <small> / под ключ</small>
                </strong>
              </div>
              <button
                className="primary-btn quote-btn"
                onClick={() => {
                  setDialog('quote');
                }}
              >
                Получить расчёт <ArrowUpRight size={20} />
              </button>
            </div>
          </div>
          <div className="builder-under">
            <span>
              <ShieldCheck size={13} /> Сборка и настройка включены
            </span>
            <span>
              <Wrench size={13} /> Финальная проверка инженером
            </span>
            <span className="price-disclaimer">Предварительные цены · не публичная оферта</span>
          </div>
        </section>
        <SiteSections selection={selection} applyPreset={applyPreset} setDialog={setDialog} />
      </main>
      <footer className="site-footer page-width">
        <a className="footer-brand" href="#top">
          ODYSSEY <span>PC</span>
        </a>
        <span>Создан для вашего следующего шага.</span>
        <small>© {new Date().getFullYear()} Odyssey PC</small>
        <a href="#configurator">
          Наверх <ArrowUpRight size={13} />
        </a>
      </footer>
      <BuildDialogs
        dialog={dialog}
        setDialog={setDialog}
        selection={selection}
        appearance={appearance}
        issues={issues}
        total={total}
        dispatch={dispatch}
        notify={notify}
        exportBuild={exportBuild}
        buildDocument={buildDocument}
      />
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button aria-label="Закрыть уведомление" onClick={() => setToast('')}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
