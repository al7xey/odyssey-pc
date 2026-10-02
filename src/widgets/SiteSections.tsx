import { Gauge, Wrench, Headphones, ArrowUpRight } from 'lucide-react';
import {
  getPart,
  money,
  powerDraw,
  presets,
  totalPrice,
  type Selection,
} from '../entities/catalog';
import PartIcon from '../shared/PartIcon';
import CaseThumbnail from '../shared/CaseThumbnail';
import type { Dialog } from './BuildDialogs';
type Props = {
  selection: Selection;
  applyPreset: (selection: Selection, name: string) => void;
  setDialog: (dialog: Dialog) => void;
};
export default function SiteSections({ selection, applyPreset, setDialog }: Props) {
  const gpu = getPart(selection, 'gpu'),
    cpu = getPart(selection, 'cpu'),
    draw = powerDraw(selection),
    psu = getPart(selection, 'psu').capacity!;
  return (
    <>
      <section className="telemetry page-width" aria-label="Параметры сборки">
        <div className="telemetry-intro">
          <span className="eyebrow">СИСТЕМА В ДЕТАЛЯХ</span>
          <h3>Внутри — всё серьёзно.</h3>
          <p>Каждый компонент на своём месте.</p>
        </div>
        <div className="metric">
          <PartIcon category="gpu" size={19} />
          <span>ГРАФИЧЕСКИЙ ПОТЕНЦИАЛ</span>
          <strong>
            {gpu.id === 'rtx4070' ? '1440p' : '4K'} <small>GAMING</small>
          </strong>
          <div className="metric-bar">
            <i
              style={{
                width: gpu.id === 'rtx4090' ? '100%' : gpu.id === 'rtx4080' ? '78%' : '60%',
              }}
            />
          </div>
          <p>Класс GPU · без обещаний FPS</p>
        </div>
        <div className="metric">
          <PartIcon category="psu" size={19} />
          <span>РАСЧЁТНАЯ МОЩНОСТЬ</span>
          <strong>
            {draw} <small>/ {psu} Вт</small>
          </strong>
          <div className="metric-bar">
            <i style={{ width: `${Math.min((draw / psu) * 100, 100)}%` }} />
          </div>
          <p>{Math.round((1 - draw / psu) * 100)}% запаса БП · оценка нагрузки</p>
        </div>
        <div className="metric">
          <PartIcon category="ram" size={19} />
          <span>ПАМЯТЬ И ХРАНЕНИЕ</span>
          <strong>
            {getPart(selection, 'ram').capacity} <small>ГБ DDR5</small>
          </strong>
          <div className="metric-dual">
            <span>
              {getPart(selection, 'storage').capacity} ТБ <small>NVMe</small>
            </span>
            <span>{cpu.socket}</span>
          </div>
          <p>Готова к вашим большим идеям</p>
        </div>
      </section>
      <section className="presets-section page-width" id="builds">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">НАЧНИТЕ С ХОРОШЕЙ ОСНОВЫ</span>
            <h2>
              Три характера. <span>Ваш выбор.</span>
            </h2>
          </div>
          <p>
            Готовые конфигурации, которые
            <br />
            можно сделать своими.
          </p>
        </div>
        <div className="presets-grid">
          {presets.map((preset, index) => (
            <article
              className={`preset-card ${index === 1 ? 'recommended' : ''}`}
              key={preset.name}
            >
              <div className="preset-top">
                <span>{preset.tag}</span>
                <span>0{index + 1}</span>
              </div>
              <div className="preset-body">
                <div>
                  <h3>{preset.name}</h3>
                  <p>{preset.description}</p>
                </div>
                <div className="preset-visual">
                  <CaseThumbnail
                    type={preset.selection.case}
                    color={index === 2 ? '#b6a0ff' : '#ffe031'}
                  />
                </div>
              </div>
              <div className="preset-specs">
                <span>{getPart(preset.selection, 'cpu').name.replace('AMD ', '')}</span>
                <span>{getPart(preset.selection, 'gpu').name.replace('GeForce ', '')}</span>
                <span>
                  {getPart(preset.selection, 'ram').capacity} ГБ /{' '}
                  {getPart(preset.selection, 'storage').capacity} ТБ
                </span>
              </div>
              <div className="preset-bottom">
                <strong>{money(totalPrice(preset.selection))}</strong>
                <a href="#configurator" onClick={() => applyPreset(preset.selection, preset.name)}>
                  Настроить <ArrowUpRight size={15} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="workshop-section page-width" id="workshop">
        <div className="workshop-heading">
          <img src="/brand/helmet.svg" alt="" />
          <span className="eyebrow">ODYSSEY PC / МАСТЕРСКАЯ ПЕРСОНАЛЬНЫХ СИСТЕМ</span>
          <h2>
            Ваша идея.
            <br />
            <span>Наше мастерство.</span>
          </h2>
          <p>
            Собрать детали — только начало. Продумать охлаждение, уложить каждый кабель, настроить
            систему — вот где рождается Odyssey.
          </p>
          <button className="subtle-btn" onClick={() => setDialog('help')}>
            Обсудить вашу сборку <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="workshop-services">
          <div>
            <Wrench size={24} />
            <span>01</span>
            <h3>Сборка с вниманием к деталям</h3>
            <p>Аккуратный кабель-менеджмент, проверка креплений и баланс воздушных потоков.</p>
          </div>
          <div>
            <Gauge size={24} />
            <span>02</span>
            <h3>Проверка под нагрузкой</h3>
            <p>Диагностика стабильности и температур перед выдачей компьютера.</p>
          </div>
          <div>
            <Headphones size={24} />
            <span>03</span>
            <h3>Поддержка инженера</h3>
            <p>Поможем разобраться с конфигурацией и спланировать будущий апгрейд.</p>
          </div>
        </div>
      </section>
    </>
  );
}
