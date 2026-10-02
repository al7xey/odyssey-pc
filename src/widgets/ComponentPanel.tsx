import { useEffect, useState } from 'react';
import { Search, ChevronDown, Check, ArrowUpRight, Crosshair, Palette, Info } from 'lucide-react';
import {
  catalog,
  categories,
  getPart,
  money,
  type Selection,
  type Appearance,
  type Category,
} from '../entities/catalog';
import { rgbColors } from '../entities/appearance';
import type useBuild from '../features/build/useBuild';
import PartIcon from '../shared/PartIcon';
import CaseThumbnail from '../shared/CaseThumbnail';
type Props = {
  active: Category;
  panel: 'parts' | 'style';
  selection: Selection;
  appearance: Appearance;
  dispatch: ReturnType<typeof useBuild>['dispatch'];
  choose: (id: string) => void;
  onInspect: () => void;
};
export default function ComponentPanel({
  active,
  panel,
  selection,
  appearance,
  dispatch,
  choose,
  onInspect,
}: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('default');
  const [showSpecs, setShowSpecs] = useState(true);
  const current = getPart(selection, active);
  const candidates = catalog[active]
    .filter((p) => `${p.name} ${p.subtitle}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : 0));
  useEffect(() => {
    setQuery('');
    setSort('default');
  }, [active, panel]);
  return (
    <aside className="options-panel">
      {panel === 'parts' ? (
        <>
          <div className="options-header">
            <span className="eyebrow">
              КОМПОНЕНТ / 0{categories.findIndex((c) => c.id === active) + 1}
            </span>
            <div>
              <h2>{categories.find((c) => c.id === active)?.label}</h2>
              <PartIcon category={active} size={25} />
            </div>
            <p>
              {active === 'case'
                ? 'Выберите архитектуру вашей сборки'
                : 'Мощность, которую выбираете вы'}
            </p>
          </div>
          <div className="options-filters">
            <label className="search-field">
              <Search size={13} />
              <input
                aria-label="Поиск компонентов"
                placeholder="Найти компонент"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="sort-field">
              <select
                aria-label="Сортировка по цене"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="default">Подборка</option>
                <option value="low">Цена ↑</option>
                <option value="high">Цена ↓</option>
              </select>
              <ChevronDown size={11} />
            </label>
          </div>
          <div className="options-list">
            {candidates.map((part) => (
              <button
                key={part.id}
                onClick={() => choose(part.id)}
                aria-pressed={selection[active] === part.id}
                className={`part-option ${selection[active] === part.id ? 'selected' : ''}`}
              >
                <div className="part-thumb">
                  {active === 'case' ? (
                    <CaseThumbnail type={part.id} color={appearance.color} />
                  ) : (
                    <PartIcon category={active} size={37} />
                  )}
                </div>
                <div className="part-option-copy">
                  <div className="part-option-title">
                    <strong>{part.name}</strong>
                    <span className="select-circle">
                      {selection[active] === part.id && <Check size={10} />}
                    </span>
                  </div>
                  <p>{part.subtitle}</p>
                  <span className="part-option-price">{money(part.price)}</span>
                  {part.badge && <small className="part-badge">{part.badge}</small>}
                </div>
              </button>
            ))}
            {!candidates.length && (
              <div className="empty-results">
                Ничего не найдено
                <button onClick={() => setQuery('')}>Очистить поиск</button>
              </div>
            )}
          </div>
          <div className="selected-specs">
            <button
              className="specs-toggle"
              onClick={() => setShowSpecs((v) => !v)}
              aria-expanded={showSpecs}
            >
              <span>ДЕТАЛИ КОМПОНЕНТА</span>
              <ChevronDown
                size={13}
                style={{
                  transform: showSpecs ? 'rotate(180deg)' : '',
                }}
              />
            </button>
            {showSpecs && (
              <dl>
                {current.specs.map(([name, value]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <button className="inspect-part" onClick={onInspect}>
              <Crosshair size={13} /> Рассмотреть в 3D <ArrowUpRight size={13} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="options-header">
            <span className="eyebrow">ВАША ЭСТЕТИКА</span>
            <div>
              <h2>Внешний вид</h2>
              <Palette size={25} />
            </div>
            <p>Пусть мощность выглядит как вы</p>
          </div>
          <div className="appearance-controls">
            <div className="control-group">
              <label>Цвет корпуса</label>
              <div className="segmented">
                <button
                  className={appearance.theme === 'dark' ? 'active' : ''}
                  onClick={() =>
                    dispatch({
                      type: 'appearance',
                      value: { theme: 'dark' },
                    })
                  }
                >
                  <i className="case-swatch dark" /> Graphite
                </button>
                <button
                  className={appearance.theme === 'white' ? 'active' : ''}
                  onClick={() =>
                    dispatch({
                      type: 'appearance',
                      value: { theme: 'white' },
                    })
                  }
                >
                  <i className="case-swatch white" /> Arctic
                </button>
              </div>
            </div>
            <div className="control-group">
              <label>
                Подсветка{' '}
                <span>
                  {rgbColors.find((c) => c.color === appearance.color)?.label ?? 'Свой цвет'}
                </span>
              </label>
              <div className="color-picker">
                {rgbColors.map((c) => (
                  <button
                    key={c.color}
                    className={appearance.color === c.color ? 'selected' : ''}
                    title={c.label}
                    aria-label={c.label}
                    style={{ background: c.color }}
                    onClick={() =>
                      dispatch({
                        type: 'appearance',
                        value: { color: c.color },
                      })
                    }
                  >
                    {appearance.color === c.color && <Check size={15} />}
                  </button>
                ))}
                <input
                  type="color"
                  aria-label="Свой цвет RGB"
                  value={appearance.color}
                  onChange={(e) =>
                    dispatch({
                      type: 'appearance',
                      value: { color: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="control-group">
              <label htmlFor="brightness">
                Яркость подсветки <span>{appearance.brightness}%</span>
              </label>
              <input
                id="brightness"
                type="range"
                min="0"
                max="100"
                value={appearance.brightness}
                onChange={(e) =>
                  dispatch({
                    type: 'appearance',
                    value: { brightness: +e.target.value },
                  })
                }
              />
            </div>
            <div className="control-group">
              <label htmlFor="fan-speed">
                Скорость анимации вентиляторов <span>{appearance.fanSpeed}%</span>
              </label>
              <input
                id="fan-speed"
                type="range"
                min="0"
                max="100"
                value={appearance.fanSpeed}
                onChange={(e) =>
                  dispatch({
                    type: 'appearance',
                    value: { fanSpeed: +e.target.value },
                  })
                }
              />
            </div>
            <label className="toggle-control">
              <span>Стеклянные панели</span>
              <input
                type="checkbox"
                checked={appearance.glass}
                onChange={(e) =>
                  dispatch({
                    type: 'appearance',
                    value: { glass: e.target.checked },
                  })
                }
              />
              <i />
            </label>
            <label className="toggle-control">
              <span>Разборка по слоям</span>
              <input
                type="checkbox"
                checked={appearance.exploded}
                onChange={(e) =>
                  dispatch({
                    type: 'appearance',
                    value: { exploded: e.target.checked },
                  })
                }
              />
              <i />
            </label>
            <div className="control-group quality-control">
              <label htmlFor="quality">Качество 3D</label>
              <select
                id="quality"
                value={appearance.quality}
                onChange={(e) =>
                  dispatch({
                    type: 'appearance',
                    value: {
                      quality: e.target.value as 'auto' | 'high' | 'eco',
                    },
                  })
                }
              >
                <option value="auto">Адаптивное</option>
                <option value="high">Максимальное</option>
                <option value="eco">Экономия ресурсов</option>
              </select>
              <p>Вне экрана 3D-сцена автоматически приостанавливается.</p>
            </div>
          </div>
        </>
      )}
      <div className="engineer-note">
        <Info size={15} />
        <p>
          3D — визуализация сборки. Точная геометрия и оттенки реальных деталей могут отличаться.
        </p>
      </div>
    </aside>
  );
}
