import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  X,
  AlertTriangle,
  Wrench,
  Download,
  ArrowRight,
  ArrowUpRight,
  LoaderCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  categories,
  getPart,
  money,
  repairSelection,
  type Selection,
  type Appearance,
  type Issue,
} from '../entities/catalog';
import type useBuild from '../features/build/useBuild';
import PartIcon from '../shared/PartIcon';
import CaseThumbnail from '../shared/CaseThumbnail';
import { downloadFile } from '../shared/download';
export type Dialog = 'quote' | 'summary' | 'help' | null;
type Props = {
  dialog: Dialog;
  setDialog: (dialog: Dialog) => void;
  selection: Selection;
  appearance: Appearance;
  issues: Issue[];
  total: number;
  dispatch: ReturnType<typeof useBuild>['dispatch'];
  notify: (text: string) => void;
  exportBuild: () => void;
  buildDocument: () => Record<string, unknown>;
};
export default function BuildDialogs({
  dialog,
  setDialog,
  selection,
  appearance,
  issues,
  total,
  dispatch,
  notify,
  exportBuild,
  buildDocument,
}: Props) {
  const [quoteStatus, setQuoteStatus] = useState<'idle' | 'busy' | 'sent' | 'exported' | 'error'>(
    'idle',
  );
  const [quoteId, setQuoteId] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null),
    formRef = useRef<HTMLFormElement>(null),
    gpu = getPart(selection, 'gpu');
  useEffect(() => {
    if (dialog) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [dialog]);
  useEffect(() => {
    if (dialog === 'quote') {
      setQuoteStatus('idle');
      setQuoteId('');
    }
  }, [dialog]);
  const submitQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (issues.length) return;
    setQuoteStatus('busy');
    const form = new FormData(event.currentTarget),
      request = {
        ...buildDocument(),
        customer: {
          name: form.get('name'),
          contact: form.get('contact'),
          message: form.get('message'),
        },
        consent: true,
      };
    const endpoint = import.meta.env.VITE_QUOTE_ENDPOINT || '/api/quotes';
    if (endpoint === 'none') {
      downloadFile(JSON.stringify(request, null, 2), 'odyssey-quote-request.json');
      setQuoteStatus('exported');
      return;
    }
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json();
      setQuoteId(typeof data.id === 'string' ? data.id.slice(0, 8).toUpperCase() : '');
      setQuoteStatus('sent');
      formRef.current?.reset();
    } catch {
      setQuoteStatus('error');
    }
  };
  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={() => setDialog(null)}
      onClick={(e) => {
        if (e.target === e.currentTarget) setDialog(null);
      }}
    >
      <div className="modal-body">
        <button
          className="modal-close icon-btn"
          aria-label="Закрыть окно"
          onClick={() => setDialog(null)}
        >
          <X size={20} />
        </button>
        {dialog === 'summary' && (
          <>
            <span className="eyebrow">ODYSSEY / CUSTOM BUILD</span>
            <h2>Ваша спецификация</h2>
            <p className="modal-subtitle">Все детали. Никаких скрытых позиций.</p>
            <div className="specification-list">
              {categories.map((c) => (
                <div key={c.id}>
                  <PartIcon category={c.id} size={17} />
                  <span>
                    <small>{c.label}</small>
                    <strong>{getPart(selection, c.id).name}</strong>
                  </span>
                  <b>{money(getPart(selection, c.id).price)}</b>
                </div>
              ))}
              <div>
                <Wrench size={17} />
                <span>
                  <strong>Сборка и настройка</strong>
                </span>
                <b>{money(8900)}</b>
              </div>
            </div>
            {issues.length > 0 && (
              <div className="issue-list">
                {issues.map((i) => (
                  <p key={i.message}>
                    <AlertTriangle size={14} />
                    {i.message}
                  </p>
                ))}
              </div>
            )}
            <div className="modal-total">
              <span>Предварительная стоимость</span>
              <strong>{money(total)}</strong>
            </div>
            <button className="primary-btn full-width" onClick={exportBuild}>
              Скачать конфигурацию <Download size={17} />
            </button>
          </>
        )}
        {dialog === 'help' && (
          <>
            <span className="eyebrow">МАСТЕРСКАЯ НА СВЯЗИ</span>
            <h2>Начнём с вашей идеи.</h2>
            <p className="modal-subtitle">
              Выберите основу, настройте детали, сохраните спецификацию для обсуждения с инженером.
            </p>
            <div className="help-steps">
              <div>
                <span>01</span>
                <p>Вращайте модель мышью или пальцем. Колесо и кнопки ± меняют масштаб.</p>
              </div>
              <div>
                <span>02</span>
                <p>
                  Нажмите на компонент в сцене или выберите категорию слева. Жёлтый контур выделяет
                  деталь.
                </p>
              </div>
              <div>
                <span>03</span>
                <p>Включите разборку по слоям, чтобы рассмотреть плату, охлаждение и кабели.</p>
              </div>
              <div>
                <span>04</span>
                <p>
                  Получите файл расчёта и передайте его мастерской. Заявки сохраняются в мастерской.
                </p>
              </div>
            </div>
            <button
              className="primary-btn full-width"
              onClick={() => {
                setQuoteStatus('idle');
                setDialog('quote');
              }}
            >
              Подготовить расчёт <ArrowRight size={17} />
            </button>
          </>
        )}
        {dialog === 'quote' && (
          <>
            <span className="eyebrow">ЕЩЁ ОДИН ШАГ К ВАШЕМУ PC</span>
            <h2>
              {quoteStatus === 'sent'
                ? 'Заявка отправлена'
                : quoteStatus === 'exported'
                  ? 'Расчёт готов'
                  : 'Ваша следующая Одиссея'}
            </h2>
            {quoteStatus === 'sent' || quoteStatus === 'exported' ? (
              <div className="quote-success">
                <CheckCircle2 size={48} />
                <p>
                  {quoteStatus === 'sent'
                    ? `Заявка № ${quoteId} сохранена. Конфигурация и контакты доступны мастерской для расчёта.`
                    : 'Файл с конфигурацией и вашими пожеланиями скачан. Передайте его мастерской для уточнения стоимости. Онлайн-отправка в локальной версии ещё не подключена.'}
                </p>
                <button className="primary-btn full-width" onClick={() => setDialog(null)}>
                  Вернуться к сборке <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <p className="modal-subtitle">Проверим детали и подготовим точную стоимость.</p>
                <div className="quote-build">
                  <CaseThumbnail type={selection.case} color={appearance.color} />
                  <div>
                    <strong>ODYSSEY CUSTOM</strong>
                    <span>
                      {gpu.name} / {getPart(selection, 'ram').capacity} ГБ
                    </span>
                    <b>{money(total)}</b>
                  </div>
                </div>
                {issues.length > 0 ? (
                  <>
                    <div className="issue-list">
                      {issues.map((i) => (
                        <p key={i.message}>
                          <AlertTriangle size={14} />
                          {i.message}
                        </p>
                      ))}
                    </div>
                    <button
                      className="primary-btn full-width"
                      onClick={() => {
                        dispatch({
                          type: 'load',
                          value: {
                            selection: repairSelection(selection),
                            appearance,
                          },
                        });
                        notify('Сборка совместима');
                      }}
                    >
                      Подобрать совместимые детали <Wrench size={16} />
                    </button>
                  </>
                ) : (
                  <form ref={formRef} onSubmit={submitQuote} className="quote-form">
                    <label>
                      Ваше имя
                      <input
                        name="name"
                        required
                        maxLength={100}
                        placeholder="Как к вам обращаться?"
                        autoComplete="name"
                      />
                    </label>
                    <label>
                      Телефон, email или Telegram
                      <input
                        name="contact"
                        required
                        minLength={5}
                        maxLength={150}
                        placeholder="Ваш удобный способ связи"
                        autoComplete="email"
                      />
                    </label>
                    <label>
                      Пожелания <span>необязательно</span>
                      <textarea
                        name="message"
                        maxLength={2000}
                        rows={2}
                        placeholder="Во что играете, с чем работаете…"
                      />
                    </label>
                    <label className="consent">
                      <input type="checkbox" required />
                      <span>
                        Согласен передать указанные контакты мастерской для расчёта этой сборки.
                      </span>
                    </label>
                    {quoteStatus === 'error' && (
                      <p className="form-error" role="alert">
                        Не удалось отправить. Попробуйте ещё раз или скачайте сборку кнопкой
                        «Сохранить».
                      </p>
                    )}
                    <button className="primary-btn full-width" disabled={quoteStatus === 'busy'}>
                      {quoteStatus === 'busy' ? (
                        <>
                          <LoaderCircle className="spinner" size={16} /> Отправляем…
                        </>
                      ) : (
                        <>
                          {import.meta.env.VITE_QUOTE_ENDPOINT === 'none'
                            ? 'Скачать запрос на расчёт'
                            : 'Отправить заявку'}
                          <ArrowUpRight size={17} />
                        </>
                      )}
                    </button>
                    <p className="quote-note">
                      {import.meta.env.VITE_QUOTE_ENDPOINT === 'none'
                        ? 'Контакты останутся в скачанном файле.'
                        : 'Окончательная стоимость после проверки инженером.'}
                    </p>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
