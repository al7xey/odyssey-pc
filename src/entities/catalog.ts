export const categories = [
  { id: 'case', label: 'Корпус', short: 'Корпус', icon: 'case' },
  { id: 'cpu', label: 'Процессор', short: 'CPU', icon: 'cpu' },
  {
    id: 'motherboard',
    label: 'Материнская плата',
    short: 'Плата',
    icon: 'board',
  },
  { id: 'gpu', label: 'Видеокарта', short: 'GPU', icon: 'gpu' },
  { id: 'ram', label: 'Оперативная память', short: 'RAM', icon: 'ram' },
  { id: 'storage', label: 'Накопитель', short: 'SSD', icon: 'ssd' },
  { id: 'cooler', label: 'Охлаждение', short: 'СВО', icon: 'fan' },
  { id: 'psu', label: 'Блок питания', short: 'Питание', icon: 'power' },
] as const;
export type Category = (typeof categories)[number]['id'];
export type Part = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  badge?: string;
  specs: [string, string][];
  socket?: 'AM5' | 'LGA1700';
  watts?: number;
  length?: number;
  capacity?: number;
  glass?: 'panorama' | 'side' | 'open';
  maxGpu?: number;
  radiator?: number;
  size?: number;
  modules?: number;
};
export type Selection = Record<Category, string>;
export type Appearance = {
  color: string;
  theme: 'dark' | 'white';
  brightness: number;
  fanSpeed: number;
  glass: boolean;
  exploded: boolean;
  rotating: boolean;
  quality: 'auto' | 'high' | 'eco';
};
export const catalog: Record<Category, Part[]> = {
  case: [
    {
      id: 'panorama',
      name: 'Панорамный',
      subtitle: 'Стекло спереди и сбоку',
      price: 18900,
      badge: '360° обзор',
      glass: 'panorama',
      maxGpu: 400,
      radiator: 360,
      specs: [
        ['Тип', 'Двухкамерный ATX'],
        ['Панели', 'Закалённое стекло'],
        ['Вентиляторы', '6 × 120 мм'],
        ['Видеокарта до', '400 мм'],
      ],
    },
    {
      id: 'airflow',
      name: 'Airflow',
      subtitle: 'Сетка спереди · стекло сбоку',
      price: 12900,
      badge: 'Поток воздуха',
      glass: 'side',
      maxGpu: 340,
      radiator: 360,
      specs: [
        ['Тип', 'Mid Tower ATX'],
        ['Панели', 'Mesh + стекло'],
        ['Вентиляторы', '6 × 120 мм'],
        ['Видеокарта до', '340 мм'],
      ],
    },
    {
      id: 'compact',
      name: 'Компактный',
      subtitle: 'Сплошной фасад · стекло сбоку',
      price: 10900,
      glass: 'side',
      maxGpu: 300,
      radiator: 240,
      specs: [
        ['Тип', 'Компактный ATX'],
        ['Панели', 'Алюминий + стекло'],
        ['Вентиляторы', '4 × 120 мм'],
        ['Видеокарта до', '300 мм'],
      ],
    },
    {
      id: 'open',
      name: 'Открытый стенд',
      subtitle: 'Без стекла · доступ к деталям',
      price: 14900,
      glass: 'open',
      maxGpu: 420,
      radiator: 360,
      specs: [
        ['Тип', 'Открытая рама ATX'],
        ['Панели', 'Без панелей'],
        ['Вентиляторы', '6 × 120 мм'],
        ['Видеокарта до', '420 мм'],
      ],
    },
  ],
  cpu: [
    {
      id: 'ryzen7',
      name: 'AMD Ryzen 7 7800X3D',
      subtitle: '8 ядер / 16 потоков · AM5',
      price: 42900,
      socket: 'AM5',
      watts: 120,
      badge: 'Для игр',
      specs: [
        ['Частота boost', 'до 5.0 ГГц'],
        ['Кэш L3', '96 МБ'],
        ['Сокет', 'AM5'],
        ['TDP', '120 Вт'],
      ],
    },
    {
      id: 'ryzen9',
      name: 'AMD Ryzen 9 9950X',
      subtitle: '16 ядер / 32 потока · AM5',
      price: 62900,
      socket: 'AM5',
      watts: 170,
      specs: [
        ['Частота boost', 'до 5.7 ГГц'],
        ['Кэш L3', '64 МБ'],
        ['Сокет', 'AM5'],
        ['TDP', '170 Вт'],
      ],
    },
    {
      id: 'intel7',
      name: 'Intel Core i7-14700KF',
      subtitle: '20 ядер / 28 потоков · LGA1700',
      price: 41900,
      socket: 'LGA1700',
      watts: 253,
      specs: [
        ['Частота boost', 'до 5.6 ГГц'],
        ['Кэш L3', '33 МБ'],
        ['Сокет', 'LGA1700'],
        ['Max turbo', '253 Вт'],
      ],
    },
  ],
  motherboard: [
    {
      id: 'b650',
      name: 'MSI B650 Tomahawk WiFi',
      subtitle: 'AM5 · ATX · DDR5',
      price: 25900,
      socket: 'AM5',
      specs: [
        ['Чипсет', 'AMD B650'],
        ['Память', '4 × DDR5'],
        ['Накопители', '3 × M.2'],
        ['Связь', 'Wi-Fi 6E / 2.5G LAN'],
      ],
    },
    {
      id: 'x870',
      name: 'ASUS TUF X870-Plus WiFi',
      subtitle: 'AM5 · ATX · PCIe 5.0',
      price: 39900,
      socket: 'AM5',
      badge: 'PCIe 5.0',
      specs: [
        ['Чипсет', 'AMD X870'],
        ['Память', '4 × DDR5'],
        ['Накопители', '4 × M.2'],
        ['Связь', 'Wi-Fi 7 / USB4'],
      ],
    },
    {
      id: 'z790',
      name: 'MSI Z790 Tomahawk WiFi',
      subtitle: 'LGA1700 · ATX · DDR5',
      price: 31900,
      socket: 'LGA1700',
      specs: [
        ['Чипсет', 'Intel Z790'],
        ['Память', '4 × DDR5'],
        ['Накопители', '4 × M.2'],
        ['Связь', 'Wi-Fi 6E / 2.5G LAN'],
      ],
    },
  ],
  gpu: [
    {
      id: 'rtx4070',
      name: 'GeForce RTX 4070 SUPER',
      subtitle: '12 ГБ GDDR6X · 2 вентилятора',
      price: 72900,
      length: 267,
      watts: 220,
      size: 2,
      specs: [
        ['Видеопамять', '12 ГБ GDDR6X'],
        ['Длина', '267 мм'],
        ['Потребление', '220 Вт'],
        ['Охлаждение', '2 вентилятора'],
      ],
    },
    {
      id: 'rtx4080',
      name: 'GeForce RTX 4080 SUPER',
      subtitle: '16 ГБ GDDR6X · 3 вентилятора',
      price: 119900,
      length: 342,
      watts: 320,
      size: 3,
      badge: 'Выбор Odyssey',
      specs: [
        ['Видеопамять', '16 ГБ GDDR6X'],
        ['Длина', '342 мм'],
        ['Потребление', '320 Вт'],
        ['Охлаждение', '3 вентилятора'],
      ],
    },
    {
      id: 'rtx4090',
      name: 'GeForce RTX 4090',
      subtitle: '24 ГБ GDDR6X · 3 вентилятора',
      price: 209900,
      length: 358,
      watts: 450,
      size: 3,
      specs: [
        ['Видеопамять', '24 ГБ GDDR6X'],
        ['Длина', '358 мм'],
        ['Потребление', '450 Вт'],
        ['Охлаждение', '3 вентилятора'],
      ],
    },
  ],
  ram: [
    {
      id: 'ram32',
      name: 'Kingston FURY RGB 32 ГБ',
      subtitle: '2 × 16 ГБ · DDR5-6000',
      price: 13900,
      capacity: 32,
      modules: 2,
      specs: [
        ['Объём', '32 ГБ'],
        ['Частота', '6000 МТ/с'],
        ['Тайминги', 'CL30'],
        ['Модули', '2 × 16 ГБ'],
      ],
    },
    {
      id: 'ram64',
      name: 'Kingston FURY RGB 64 ГБ',
      subtitle: '2 × 32 ГБ · DDR5-6000',
      price: 23900,
      capacity: 64,
      modules: 2,
      specs: [
        ['Объём', '64 ГБ'],
        ['Частота', '6000 МТ/с'],
        ['Тайминги', 'CL36'],
        ['Модули', '2 × 32 ГБ'],
      ],
    },
    {
      id: 'ram128',
      name: 'Kingston FURY RGB 128 ГБ',
      subtitle: '4 × 32 ГБ · DDR5-5200',
      price: 46900,
      capacity: 128,
      modules: 4,
      specs: [
        ['Объём', '128 ГБ'],
        ['Частота', '5200 МТ/с'],
        ['Тайминги', 'CL40'],
        ['Модули', '4 × 32 ГБ'],
      ],
    },
  ],
  storage: [
    {
      id: 'ssd1',
      name: 'Samsung 990 PRO 1 ТБ',
      subtitle: 'M.2 NVMe · PCIe 4.0',
      price: 11900,
      capacity: 1,
      specs: [
        ['Объём', '1 ТБ'],
        ['Чтение', 'до 7450 МБ/с'],
        ['Интерфейс', 'PCIe 4.0 ×4'],
        ['Формат', 'M.2 2280'],
      ],
    },
    {
      id: 'ssd2',
      name: 'Samsung 990 PRO 2 ТБ',
      subtitle: 'M.2 NVMe · PCIe 4.0',
      price: 18900,
      capacity: 2,
      badge: 'Оптимально',
      specs: [
        ['Объём', '2 ТБ'],
        ['Чтение', 'до 7450 МБ/с'],
        ['Интерфейс', 'PCIe 4.0 ×4'],
        ['Формат', 'M.2 2280'],
      ],
    },
    {
      id: 'ssd4',
      name: 'WD Black SN850X 4 ТБ',
      subtitle: 'M.2 NVMe · PCIe 4.0',
      price: 32900,
      capacity: 4,
      specs: [
        ['Объём', '4 ТБ'],
        ['Чтение', 'до 7300 МБ/с'],
        ['Интерфейс', 'PCIe 4.0 ×4'],
        ['Формат', 'M.2 2280'],
      ],
    },
  ],
  cooler: [
    {
      id: 'aio360',
      name: 'Odyssey Liquid 360 ARGB',
      subtitle: 'СВО · радиатор 360 мм',
      price: 16900,
      radiator: 360,
      capacity: 300,
      badge: 'Тихое охлаждение',
      specs: [
        ['Радиатор', '360 мм'],
        ['Вентиляторы', '3 × 120 мм'],
        ['Сокеты', 'AM5 / LGA1700'],
        ['Лимит модели', '300 Вт'],
      ],
    },
    {
      id: 'aio240',
      name: 'Odyssey Liquid 240 ARGB',
      subtitle: 'СВО · радиатор 240 мм',
      price: 11900,
      radiator: 240,
      capacity: 250,
      specs: [
        ['Радиатор', '240 мм'],
        ['Вентиляторы', '2 × 120 мм'],
        ['Сокеты', 'AM5 / LGA1700'],
        ['Лимит модели', '250 Вт'],
      ],
    },
  ],
  psu: [
    {
      id: 'psu750',
      name: 'Odyssey Power 750 Gold',
      subtitle: '750 Вт · 80 PLUS Gold',
      price: 9900,
      capacity: 750,
      specs: [
        ['Мощность', '750 Вт'],
        ['Стандарт', 'ATX 3.0'],
        ['Кабели', 'Модульные'],
        ['Эффективность', '80 PLUS Gold'],
      ],
    },
    {
      id: 'psu850',
      name: 'Odyssey Power 850 Gold',
      subtitle: '850 Вт · 80 PLUS Gold',
      price: 12900,
      capacity: 850,
      specs: [
        ['Мощность', '850 Вт'],
        ['Стандарт', 'ATX 3.0'],
        ['Кабели', 'Модульные'],
        ['Эффективность', '80 PLUS Gold'],
      ],
    },
    {
      id: 'psu1000',
      name: 'Odyssey Power 1000 Platinum',
      subtitle: '1000 Вт · 80 PLUS Platinum',
      price: 18900,
      capacity: 1000,
      specs: [
        ['Мощность', '1000 Вт'],
        ['Стандарт', 'ATX 3.0'],
        ['Кабели', 'Модульные'],
        ['Эффективность', '80 PLUS Platinum'],
      ],
    },
  ],
};
export const defaultSelection: Selection = {
  case: 'panorama',
  cpu: 'ryzen7',
  motherboard: 'b650',
  gpu: 'rtx4080',
  ram: 'ram32',
  storage: 'ssd2',
  cooler: 'aio360',
  psu: 'psu850',
};
export const defaultAppearance: Appearance = {
  color: '#ffe031',
  theme: 'dark',
  brightness: 80,
  fanSpeed: 65,
  glass: true,
  exploded: false,
  rotating: false,
  quality: 'auto',
};
export const presets = [
  {
    name: 'ARES',
    tag: 'ИГРОВОЙ БАЛАНС',
    description: '1440p-гейминг и ежедневная работа',
    selection: {
      ...defaultSelection,
      gpu: 'rtx4070',
      case: 'airflow',
      psu: 'psu750',
    },
  },
  {
    name: 'ODYSSEY',
    tag: 'НАША РЕКОМЕНДАЦИЯ',
    description: '4K, творчество и свобода апгрейда',
    selection: defaultSelection,
  },
  {
    name: 'TITAN',
    tag: 'МАКСИМУМ МОЩНОСТИ',
    description: 'Тяжёлый рендеринг и 3D-проекты',
    selection: {
      ...defaultSelection,
      cpu: 'ryzen9',
      gpu: 'rtx4090',
      ram: 'ram64',
      psu: 'psu1000',
      motherboard: 'x870',
    },
  },
];
export const money = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
export function getPart(selection: Selection, category: Category): Part {
  return catalog[category].find((p) => p.id === selection[category]) ?? catalog[category][0];
}
export function totalPrice(selection: Selection) {
  return categories.reduce((sum, c) => sum + getPart(selection, c.id).price, 8900);
}
export function powerDraw(selection: Selection) {
  return (getPart(selection, 'cpu').watts ?? 0) + (getPart(selection, 'gpu').watts ?? 0) + 85;
}
export type Issue = {
  category: Category;
  message: string;
};
export function compatibility(selection: Selection): Issue[] {
  const parts = Object.fromEntries(
    categories.map((c) => [c.id, getPart(selection, c.id)]),
  ) as Record<Category, Part>;
  const issues: Issue[] = [];
  if (parts.cpu.socket !== parts.motherboard.socket)
    issues.push({
      category: 'motherboard',
      message: 'Сокет платы не подходит процессору',
    });
  if (parts.gpu.length! > parts.case.maxGpu!)
    issues.push({
      category: 'case',
      message: `Видеокарта ${parts.gpu.length} мм: корпус вмещает до ${parts.case.maxGpu} мм`,
    });
  if (parts.cooler.radiator! > parts.case.radiator!)
    issues.push({
      category: 'cooler',
      message: 'Радиатор СВО не помещается в корпус',
    });
  if (powerDraw(selection) * 1.25 > parts.psu.capacity!)
    issues.push({
      category: 'psu',
      message: 'Недостаточный запас мощности блока питания (25%)',
    });
  if (parts.cpu.watts! > parts.cooler.capacity!)
    issues.push({
      category: 'cooler',
      message: 'Выберите охлаждение с большим запасом мощности',
    });
  return issues;
}
export function repairSelection(selection: Selection): Selection {
  const next = { ...selection };
  next.motherboard = catalog.motherboard.find((p) => p.socket === getPart(next, 'cpu').socket)!.id;
  if (getPart(next, 'cpu').watts! > getPart(next, 'cooler').capacity!) next.cooler = 'aio360';
  if (
    getPart(next, 'gpu').length! > getPart(next, 'case').maxGpu! ||
    getPart(next, 'cooler').radiator! > getPart(next, 'case').radiator!
  )
    next.case = 'panorama';
  if (powerDraw(next) * 1.25 > getPart(next, 'psu').capacity!)
    next.psu = catalog.psu.find((p) => p.capacity! >= powerDraw(next) * 1.25)!.id;
  return next;
}
export function validateSelection(value: unknown): Selection {
  const input = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return Object.fromEntries(
    categories.map((c) => [
      c.id,
      catalog[c.id].some((p) => p.id === input[c.id]) ? input[c.id] : defaultSelection[c.id],
    ]),
  ) as Selection;
}
export function validateAppearance(value: unknown): Appearance {
  const v = value && typeof value === 'object' ? (value as Partial<Appearance>) : {};
  return {
    ...defaultAppearance,
    color:
      typeof v.color === 'string' && /^#[0-9a-f]{6}$/i.test(v.color)
        ? v.color
        : defaultAppearance.color,
    theme: v.theme === 'white' ? 'white' : 'dark',
    glass: typeof v.glass === 'boolean' ? v.glass : true,
    brightness:
      typeof v.brightness === 'number' && Number.isFinite(v.brightness)
        ? Math.max(0, Math.min(100, v.brightness))
        : 80,
    fanSpeed:
      typeof v.fanSpeed === 'number' && Number.isFinite(v.fanSpeed)
        ? Math.max(0, Math.min(100, v.fanSpeed))
        : 65,
    quality: ['auto', 'high', 'eco'].includes(v.quality ?? '') ? v.quality! : 'auto',
  };
}
