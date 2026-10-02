import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getPart, type Appearance, type Category, type Selection } from '../../entities/catalog';

type Callbacks = {
  hover: (part: Category | null) => void;
  select: (part: Category) => void;
  error: () => void;
};
type PartGroup = T.Group & {
  userData: {
    category?: Category;
    base?: T.Vector3;
    offset?: T.Vector3;
  };
};
const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);

function surfaceTexture(kind: 'metal' | 'pcb') {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = kind === 'pcb' ? '#15221d' : '#e0e0e0';
  ctx.fillRect(0, 0, 256, 256);
  let seed = 13;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  if (kind === 'metal') {
    for (let y = 0; y < 256; y++) {
      ctx.fillStyle = `rgba(${random() > 0.5 ? '255,255,255' : '0,0,0'},${random() * 0.03})`;
      ctx.fillRect(0, y, 256, 1);
    }
  } else {
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(random() * 32) * 8,
        y = Math.floor(random() * 32) * 8;
      ctx.strokeStyle = '#3e5142';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 24, y);
      ctx.lineTo(x + 40, y + 16);
      ctx.lineTo(x + 60, y + 16);
      ctx.stroke();
      ctx.fillStyle = '#748058';
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
  const texture = new T.CanvasTexture(c);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
function labelTexture(text: string, color = '#d1d4d6', bg = 'transparent') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  if (bg !== 'transparent') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
  }
  ctx.fillStyle = color;
  ctx.font = '700 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

export default class PCScene {
  renderer: T.WebGLRenderer;
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
  controls: OrbitControls;
  model = new T.Group();
  groups = new Map<Category, PartGroup>();
  fans: T.Group[] = [];
  rgb: T.MeshStandardMaterial[] = [];
  highlights: T.LineSegments[] = [];
  glass: T.Mesh[] = [];
  private disposed = false;
  private frame = 0;
  private lastTime = 0;
  private lastRender = 0;
  private visible = true;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private hovered: Category | null = null;
  private selected: Category | null = null;
  private pointer = new T.Vector2();
  private raycaster = new T.Raycaster();
  private observer: ResizeObserver;
  private intersection: IntersectionObserver;
  private down: [number, number] = [0, 0];
  private resizeWidth = 1;
  private resizeHeight = 1;
  private environment: T.Texture;
  private textures = {
    metal: surfaceTexture('metal'),
    pcb: surfaceTexture('pcb'),
  };
  private appearance: Appearance;
  private focusGoal: T.Vector3 | null = null;
  private environmentLight = new T.PointLight('#ffe031', 8, 8, 2);
  private metal = new T.MeshStandardMaterial({
    color: '#33383e',
    metalness: 0.85,
    roughness: 0.32,
  });
  private black = new T.MeshStandardMaterial({
    color: '#15191c',
    metalness: 0.55,
    roughness: 0.46,
  });
  private silver = new T.MeshStandardMaterial({
    color: '#86939b',
    metalness: 0.95,
    roughness: 0.25,
  });
  private chassis = new T.MeshStandardMaterial({
    color: '#20252a',
    metalness: 0.7,
    roughness: 0.32,
    map: this.textures.metal,
  });
  private accent: T.MeshStandardMaterial;
  private halo = new T.ShaderMaterial({
    uniforms: {
      color: { value: new T.Color('#ffe031') },
      strength: { value: 0.3 },
    },
    vertexShader:
      'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:
      'varying vec2 vUv; uniform vec3 color; uniform float strength; void main(){float r=length(vUv-.5);float glow=exp(-pow((r-.418)*26.,2.));gl_FragColor=vec4(color,glow*strength);}',
    transparent: true,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide,
  });
  constructor(
    private host: HTMLElement,
    selection: Selection,
    appearance: Appearance,
    private callbacks: Callbacks,
  ) {
    this.appearance = appearance;
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor('#101315', 0);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Интерактивная 3D-модель компьютера. Вращайте мышью или пальцем, нажмите на деталь для выбора.',
    );
    this.renderer.domElement.setAttribute('role', 'img');
    this.host.append(this.renderer.domElement);
    const pmrem = new T.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04).texture;
    this.scene.environment = this.environment;
    room.dispose();
    pmrem.dispose();
    this.scene.environmentIntensity = 0.65;
    this.camera.position.set(6.6, 3.2, 8.1);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 5.6;
    this.controls.maxDistance = 15;
    this.controls.maxPolarAngle = Math.PI * 0.77;
    this.controls.enablePan = false;
    this.controls.autoRotateSpeed = 0.55;
    this.controls.addEventListener('start', () => {
      this.focusGoal = null;
    });
    const key = new T.DirectionalLight('#fff4dd', 4.5);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    key.shadow.bias = -0.001;
    const fill = new T.DirectionalLight('#becbff', 2.8);
    fill.position.set(-4, 2, 1);
    const rim = new T.DirectionalLight('#ffffff', 5);
    rim.position.set(1, 4, -4);
    this.environmentLight.position.set(0.2, 0.4, 0.8);
    this.scene.add(key, fill, rim, new T.AmbientLight('#ffffff', 0.45), this.environmentLight);
    const floor = new T.Mesh(new T.PlaneGeometry(200, 200), new T.ShadowMaterial({ opacity: 0.4 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.35;
    floor.receiveShadow = true;
    this.scene.add(floor, this.model);
    const ring = new T.Mesh(
      new T.TorusGeometry(2.35, 0.006, 6, 120),
      new T.MeshBasicMaterial({
        color: '#655d24',
        transparent: true,
        opacity: 0.4,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2.34;
    this.scene.add(ring);
    this.accent = new T.MeshStandardMaterial({
      color: appearance.color,
      emissive: appearance.color,
      emissiveIntensity: 2.2,
      toneMapped: false,
    });
    this.rgb.push(this.accent);
    this.build(selection);
    this.updateAppearance(appearance);
    this.observer = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      this.resizeWidth = r.width;
      this.resizeHeight = r.height;
      this.resize();
    });
    this.observer.observe(host);
    this.intersection = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
    });
    this.intersection.observe(host);
    this.renderer.domElement.addEventListener('pointermove', this.onMove);
    this.renderer.domElement.addEventListener('pointerleave', this.onLeave);
    this.renderer.domElement.addEventListener('pointerdown', this.onDown);
    this.renderer.domElement.addEventListener('pointerup', this.onUp);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.frame = requestAnimationFrame(this.animate);
  }
  private box(
    parent: T.Object3D,
    size: [number, number, number],
    pos: [number, number, number],
    material = this.black,
    radius = 0.025,
  ) {
    const geometry = radius
      ? new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map((s) => s / 3)))
      : new T.BoxGeometry(...size);
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(...pos);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  private cylinder(
    parent: T.Object3D,
    radius: number,
    length: number,
    pos: [number, number, number],
    material = this.metal,
  ) {
    const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, length, 20), material);
    mesh.position.set(...pos);
    parent.add(mesh);
    mesh.castShadow = true;
    return mesh;
  }
  private text(
    parent: T.Object3D,
    text: string,
    size: [number, number],
    pos: [number, number, number],
    color = '#b7bfc5',
  ) {
    const mesh = new T.Mesh(
      new T.PlaneGeometry(...size),
      new T.MeshBasicMaterial({
        map: labelTexture(text, color),
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    mesh.position.set(...pos);
    parent.add(mesh);
    return mesh;
  }
  private group(category: Category, offset: T.Vector3): PartGroup {
    const group = new T.Group();
    group.userData = { category, base: V(), offset };
    this.model.add(group);
    this.groups.set(category, group);
    return group;
  }
  private tube(parent: T.Object3D, points: T.Vector3[], radius = 0.05, material = this.black) {
    const mesh = new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 36, radius, 8, false),
      material,
    );
    parent.add(mesh);
    return mesh;
  }
  private fan(
    parent: T.Object3D,
    pos: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0],
    scale = 1,
  ) {
    const fan = new T.Group();
    fan.position.set(...pos);
    fan.rotation.set(...rotation);
    fan.scale.setScalar(scale);
    parent.add(fan);
    this.box(fan, [0.94, 0.94, 0.12], [0, 0, 0], this.chassis, 0.055);
    const face = new T.Mesh(new T.CylinderGeometry(0.413, 0.413, 0.13, 48), this.black);
    face.rotation.x = Math.PI / 2;
    fan.add(face);
    for (const z of [-0.083, 0.083]) {
      const rim = new T.Mesh(new T.TorusGeometry(0.394, 0.018, 8, 64), this.accent);
      rim.position.z = z;
      fan.add(rim);
      const halo = new T.Mesh(new T.PlaneGeometry(0.94, 0.94), this.halo);
      halo.position.z = z + (z > 0 ? 0.002 : -0.002);
      fan.add(halo);
    }
    const rotor = new T.Group();
    rotor.position.z = 0.08;
    fan.add(rotor);
    this.fans.push(rotor);
    const shape = new T.Shape();
    shape.moveTo(0.085, -0.025);
    shape.bezierCurveTo(0.17, -0.15, 0.28, -0.16, 0.38, -0.03);
    shape.bezierCurveTo(0.27, 0.015, 0.2, 0.11, 0.1, 0.07);
    shape.lineTo(0.085, -0.025);
    const bladeGeometry = new T.ExtrudeGeometry(shape, {
      depth: 0.016,
      bevelEnabled: false,
      curveSegments: 5,
    });
    for (let i = 0; i < 9; i++) {
      const blade = new T.Mesh(bladeGeometry, this.metal);
      blade.rotation.z = (i * Math.PI * 2) / 9;
      rotor.add(blade);
    }
    const hub = this.cylinder(rotor, 0.105, 0.045, [0, 0, 0.018], this.black);
    hub.rotation.x = Math.PI / 2;
    this.text(rotor, 'O', [0.1, 0.03], [0, 0, 0.05], '#ffe031');
    for (const x of [-0.39, 0.39])
      for (const y of [-0.39, 0.39]) {
        const screw = this.cylinder(fan, 0.027, 0.013, [x, y, 0.07], this.silver);
        screw.rotation.x = Math.PI / 2;
      }
    return fan;
  }
  build(selection: Selection) {
    this.clearModel();
    this.fans = [];
    this.glass = [];
    this.highlights = [];
    this.groups.clear();
    const casePart = getPart(selection, 'case'),
      gpuPart = getPart(selection, 'gpu');
    const frame = this.group('case', V(0, 0, 0));
    const open = casePart.glass === 'open',
      compact = casePart.id === 'compact';
    const halfX = compact ? 1.32 : 1.52;
    for (const x of [-halfX, halfX])
      for (const z of [-1.03, 1.03])
        this.box(frame, [0.085, 4.13, 0.085], [x, 0.02, z], this.chassis);
    for (const y of [-2.05, 2.07]) {
      this.box(frame, [halfX * 2 + 0.1, 0.075, 2.13], [0, y, 0], this.chassis);
      if (open) this.box(frame, [halfX * 2 - 0.1, 0.08, 0.04], [0, y + 0.05, 1.06], this.accent);
    }
    this.box(frame, [halfX * 2, 3.95, 0.045], [0, 0, -1.04], this.chassis);
    this.box(frame, [halfX * 2 - 0.08, 0.38, 2.04], [0, -1.79, 0], this.chassis);
    this.text(
      frame,
      'O D Y S S E Y',
      [1.12, 0.27],
      [0.4, -1.78, 1.03],
      this.appearance.theme === 'white' ? '#42464b' : '#aeb5b9',
    );
    this.box(frame, [0.42, 0.012, 0.03], [-0.75, -1.57, 1.04], this.accent);
    for (const x of [-1.05, 1.05])
      for (const z of [-0.77, 0.77]) this.box(frame, [0.34, 0.17, 0.32], [x, -2.17, z], this.black);
    for (let i = 0; i < 26; i++)
      this.box(frame, [0.04, 0.006, 1.67], [-1.2 + i * 0.096, 2.112, 0], this.black, 0);
    const power = this.cylinder(frame, 0.055, 0.015, [halfX - 0.17, 2.12, 0.76], this.accent);
    power.rotation.x = 0;
    for (let i = 0; i < 2; i++)
      this.box(frame, [0.07, 0.018, 0.02], [halfX - 0.43 - i * 0.13, 2.122, 0.76], this.black);
    if (!open) {
      const glassMaterial = new T.MeshPhysicalMaterial({
        color: '#a0b6c6',
        metalness: 0.05,
        roughness: 0.06,
        transparent: true,
        opacity: 0.075,
        envMapIntensity: 1.7,
        side: T.DoubleSide,
        depthWrite: false,
        clearcoat: 1,
      });
      const side = this.box(
        frame,
        [halfX * 2 - 0.06, 3.91, 0.018],
        [0, 0.02, 1.058],
        glassMaterial,
        0,
      );
      side.userData.ignore = true;
      this.glass.push(side);
      if (casePart.glass === 'panorama') {
        const front = this.box(
          frame,
          [0.018, 3.91, 1.99],
          [halfX + 0.015, 0.02, 0],
          glassMaterial,
          0,
        );
        front.userData.ignore = true;
        this.glass.push(front);
        // A subtle studio strip reflected in the glass.
        const shine = new T.Mesh(
          new T.PlaneGeometry(0.05, 3.8),
          new T.MeshBasicMaterial({
            color: '#fff2c1',
            opacity: 0.09,
            transparent: true,
            depthWrite: false,
          }),
        );
        shine.position.set(halfX - 0.035, 0, 1.073);
        shine.userData.ignore = true;
        frame.add(shine);
        this.glass.push(shine);
      } else {
        this.box(frame, [0.055, 3.95, 2.02], [halfX, 0.02, 0], this.chassis);
        if (!compact) {
          // Mesh grille uses one instanced draw call.
          const grille = new T.InstancedMesh(
            new T.BoxGeometry(0.012, 0.016, 0.016),
            this.black,
            35 * 18,
          );
          const matrix = new T.Matrix4();
          let idx = 0;
          for (let y = 0; y < 35; y++)
            for (let z = 0; z < 18; z++) {
              matrix.makeTranslation(halfX + 0.035, -1.5 + y * 0.095, -0.8 + z * 0.095);
              grille.setMatrixAt(idx++, matrix);
            }
          frame.add(grille);
        } else
          this.text(frame, 'ODYSSEY', [0.75, 0.19], [halfX + 0.035, 0.7, 0], '#ffe031').rotation.y =
            Math.PI / 2;
      }
    }
    const board = this.group('motherboard', V(-1.15, 0.15, 1.2));
    this.box(
      board,
      [2.39, 2.87, 0.065],
      [-0.2, 0.17, -0.83],
      new T.MeshStandardMaterial({
        map: this.textures.pcb,
        color: '#b1b9ad',
        roughness: 0.63,
        metalness: 0.35,
      }),
      0,
    );
    this.text(
      board,
      getPart(selection, 'motherboard').id === 'z790' ? 'Z790 / DDR5' : 'AM5 / DDR5',
      [0.78, 0.12],
      [-0.65, -0.88, -0.744],
    );
    // VRM heatsinks and fins, rear I/O enclosure.
    this.box(board, [0.4, 1.5, 0.27], [-1.13, 0.74, -0.64], this.chassis);
    this.box(board, [1.02, 0.29, 0.24], [-0.47, 1.39, -0.65], this.chassis);
    for (let i = 0; i < 13; i++)
      this.box(board, [0.025, 1.3, 0.08], [-1.29 + i * 0.027, 0.74, -0.46], this.silver, 0);
    for (let i = 0; i < 18; i++)
      this.box(board, [0.022, 0.23, 0.06], [-0.95 + i * 0.052, 1.39, -0.5], this.metal, 0);
    this.text(board, 'TOMAHAWK', [0.8, 0.11], [-0.38, 1.39, -0.51]);
    const chips = new T.InstancedMesh(new T.BoxGeometry(0.085, 0.12, 0.035), this.black, 65);
    const matrix = new T.Matrix4();
    for (let i = 0; i < 65; i++) {
      const x = -0.96 + ((i * 7) % 22) * 0.085,
        y = -1.13 + Math.floor(i / 11) * 0.14;
      matrix.makeTranslation(x, y, -0.772);
      chips.setMatrixAt(i, matrix);
    }
    board.add(chips);
    for (let i = 0; i < 16; i++) {
      const cap = this.cylinder(
        board,
        0.032,
        0.08,
        [-0.91 + (i % 8) * 0.07, 0.98 + Math.floor(i / 8) * 0.13, -0.71],
        this.silver,
      );
      cap.rotation.x = Math.PI / 2;
    }
    for (let i = 0; i < 3; i++) {
      this.box(board, [1.51, 0.09, 0.075], [-0.25, -0.42 - i * 0.28, -0.739], this.silver);
      this.box(board, [1.4, 0.025, 0.02], [-0.25, -0.41 - i * 0.28, -0.686], this.black, 0);
    }
    this.box(board, [0.36, 0.46, 0.1], [0.73, -0.97, -0.69], this.chassis);
    for (const x of [-1.26, 0.85])
      for (const y of [-1.16, 1.51]) {
        const screw = this.cylinder(board, 0.032, 0.035, [x, y, -0.775], this.silver);
        screw.rotation.x = Math.PI / 2;
      }
    // CPU socket, contact frame and heat spreader.
    const cpu = this.group('cpu', V(0, 0.7, 0.65));
    this.box(cpu, [0.61, 0.63, 0.09], [-0.35, 0.66, -0.713], this.black);
    this.box(cpu, [0.53, 0.53, 0.032], [-0.35, 0.66, -0.65], this.silver);
    this.text(
      cpu,
      getPart(selection, 'cpu').socket === 'AM5' ? 'RYZEN' : 'intel',
      [0.36, 0.095],
      [-0.35, 0.66, -0.63],
      '#3f454a',
    );
    this.tube(
      cpu,
      [V(-0.04, 0.92, -0.69), V(0.02, 0.92, -0.69), V(0.02, 0.36, -0.69)],
      0.012,
      this.silver,
    );
    // Memory slots, individual heat spreaders, etched details and RGB diffusers.
    const ram = this.group('ram', V(0.5, 0.6, 0.75));
    for (let i = 0; i < 4; i++)
      this.box(board, [0.069, 1.37, 0.075], [0.23 + i * 0.16, 0.67, -0.738], this.black);
    const modules = getPart(selection, 'ram').modules!;
    for (let i = 0; i < modules; i++) {
      const x = modules === 4 ? 0.23 + i * 0.16 : 0.39 + i * 0.32;
      this.box(ram, [0.065, 1.24, 0.23], [x, 0.66, -0.57], this.chassis);
      for (let j = 0; j < 7; j++)
        this.box(ram, [0.071, 0.025, 0.18], [x, 0.19 + j * 0.15, -0.52], this.silver, 0);
      this.box(ram, [0.078, 1.26, 0.041], [x, 0.66, -0.433], this.accent);
    }
    // M.2 drive and ribbed thermal cover.
    const ssd = this.group('storage', V(-0.4, -0.3, 1));
    this.box(ssd, [1.06, 0.2, 0.065], [-0.47, -0.2, -0.65], this.chassis);
    for (let i = 0; i < 24; i++)
      this.box(ssd, [0.015, 0.165, 0.025], [-0.94 + i * 0.04, -0.2, -0.609], this.metal, 0);
    this.text(
      ssd,
      'NVMe / ' + getPart(selection, 'storage').capacity + ' TB',
      [0.5, 0.07],
      [-0.45, -0.19, -0.587],
    );
    // GPU PCB, heatsink, backplate, power cable and rotating fans.
    const gpu = this.group('gpu', V(0.15, -0.55, 1.45));
    const length = gpuPart.size === 2 ? 2.0 : 2.65;
    this.box(gpu, [length, 0.12, 1.14], [-0.07, -0.44, 0.06], this.chassis);
    this.box(gpu, [length - 0.1, 0.26, 1.03], [-0.07, -0.63, 0.06], this.silver);
    const fins = new T.InstancedMesh(new T.BoxGeometry(0.013, 0.25, 1.04), this.metal, 70);
    for (let i = 0; i < 70; i++) {
      matrix.makeTranslation(-length / 2 + 0.03 + (i * (length - 0.15)) / 70, -0.63, 0.06);
      fins.setMatrixAt(i, matrix);
    }
    gpu.add(fins);
    this.box(gpu, [length + 0.03, 0.22, 0.09], [-0.07, -0.55, 0.65], this.chassis);
    this.box(gpu, [length - 0.18, 0.017, 0.016], [-0.07, -0.47, 0.71], this.accent);
    this.text(gpu, 'GEFORCE RTX', [1.1, 0.15], [-0.1, -0.55, 0.703], '#e1e4e4');
    for (let i = 0; i < gpuPart.size!; i++)
      this.fan(gpu, [-length / 2 + 0.37 + i * 0.83, -0.84, 0.02], [Math.PI / 2, 0, 0], 0.81);
    for (let i = 0; i < 5; i++)
      this.tube(
        gpu,
        [
          V(0.72 + i * 0.026, -0.42, 0.6),
          V(0.95 + i * 0.026, -0.08, 0.52),
          V(1.08 + i * 0.026, -0.18, -0.15),
          V(1.08 + i * 0.026, -1.66, -0.4),
        ],
        0.017,
        i === 0 ? this.accent : this.black,
      );
    const gpuText = this.text(gpu, 'ODYSSEY', [0.86, 0.16], [0, -0.371, 0.14]);
    gpuText.rotation.x = -Math.PI / 2;
    // Cooling: braided tubes, illuminated pump, radiator fins and fans.
    const cooling = this.group('cooler', V(-0.2, 1.1, 0.6));
    const coolingSize = getPart(selection, 'cooler').radiator === 360 ? 3 : 2;
    this.box(cooling, [coolingSize * 0.91, 0.16, 0.98], [-0.15, 1.79, -0.04], this.black);
    for (let i = 0; i < coolingSize; i++)
      this.fan(cooling, [-0.99 + i * 0.92, 1.64, -0.02], [Math.PI / 2, 0, 0], 0.93);
    const pump = this.cylinder(cooling, 0.27, 0.25, [-0.35, 0.66, -0.42], this.chassis);
    pump.rotation.x = Math.PI / 2;
    const pumpRing = new T.Mesh(new T.TorusGeometry(0.232, 0.015, 8, 64), this.accent);
    pumpRing.position.set(-0.35, 0.66, -0.278);
    cooling.add(pumpRing);
    this.text(cooling, 'ODYSSEY', [0.38, 0.095], [-0.35, 0.66, -0.265], '#ffe031');
    for (let i = 0; i < 2; i++) {
      this.tube(
        cooling,
        [
          V(-0.08, 0.68 + i * 0.12, -0.4),
          V(0.34, 1 + i * 0.11, -0.09),
          V(0.36, 1.33 + i * 0.09, -0.13),
          V(0.94, 1.59, -0.25 - i * 0.17),
        ],
        0.042,
        this.black,
      );
      const fitting = this.cylinder(
        cooling,
        0.057,
        0.08,
        [-0.06, 0.68 + i * 0.12, -0.4],
        this.silver,
      );
      fitting.rotation.z = Math.PI / 2;
    }
    for (let i = 0; i < (compact ? 2 : 3); i++)
      this.fan(frame, [-0.99 + i * 0.94, -1.45, -0.02], [-Math.PI / 2, 0, 0], 0.94);
    if (!compact)
      for (let i = 0; i < 3; i++)
        this.fan(frame, [halfX - 0.2, -0.9 + i * 0.95, -0.06], [0, Math.PI / 2, 0], 0.91);
    this.fan(frame, [-halfX + 0.14, 1.02, -0.07], [0, Math.PI / 2, 0], 0.85);
    const psu = this.group('psu', V(-0.5, -1.1, 0.7));
    this.box(psu, [1.24, 0.3, 1.4], [-0.64, -1.78, -0.12], this.black);
    this.text(
      psu,
      getPart(selection, 'psu').capacity + 'W GOLD',
      [0.8, 0.13],
      [-0.64, -1.78, 0.599],
      '#ffe031',
    );
    this.model.updateMatrixWorld(true);
    this.mergeStaticMeshes();
    this.renderer.shadowMap.needsUpdate = true;
    // Edges follow each mesh, producing a real component outline on hover.
    for (const [category, group] of this.groups) {
      const meshes: T.Mesh[] = [];
      group.traverse((obj) => {
        if (obj instanceof T.Mesh && !(obj instanceof T.InstancedMesh) && !obj.userData.ignore)
          meshes.push(obj);
      });
      for (const mesh of meshes) {
        if (
          mesh.geometry instanceof T.PlaneGeometry ||
          (mesh.parent && this.fans.includes(mesh.parent as T.Group))
        )
          continue;
        const lines = new T.LineSegments(
          new T.EdgesGeometry(mesh.geometry, 35),
          new T.LineBasicMaterial({
            color: '#ffe031',
            transparent: true,
            opacity: 0.7,
            depthTest: false,
            depthWrite: false,
          }),
        );
        lines.visible = false;
        lines.userData.category = category;
        lines.renderOrder = 10;
        mesh.add(lines);
        this.highlights.push(lines);
      }
    }
    this.updateAppearance(this.appearance);
    this.highlight(this.selected);
  }
  updateAppearance(appearance: Appearance) {
    this.appearance = appearance;
    this.chassis.color.set(appearance.theme === 'white' ? '#e8edf0' : '#32383e');
    this.metal.color.set(appearance.theme === 'white' ? '#9aa1a6' : '#343a40');
    this.accent.color.set(appearance.color);
    this.accent.emissive.set(appearance.color);
    this.accent.emissiveIntensity = (appearance.brightness / 100) * 2.1;
    this.halo.uniforms.color.value.set(appearance.color);
    this.halo.uniforms.strength.value = (appearance.brightness / 100) * 0.34;
    this.environmentLight.color.set(appearance.color);
    this.environmentLight.intensity = (appearance.brightness / 100) * 6;
    this.glass.forEach((mesh) => {
      mesh.visible = appearance.glass && !appearance.exploded;
    });
    this.controls.autoRotate = appearance.rotating && !this.reducedMotion;
    this.renderer.shadowMap.enabled = appearance.quality !== 'eco';
    this.resize();
  }
  highlight(category: Category | null) {
    this.selected = category;
    this.highlights.forEach((edge) => {
      edge.visible =
        edge.userData.category === (this.hovered ?? category) &&
        (edge.userData.category !== 'case' || this.hovered === 'case');
    });
  }
  focus(category: Category) {
    this.selected = category;
    this.highlight(category);
    const group = this.groups.get(category);
    if (!group) return;
    const center = new T.Box3().setFromObject(group).getCenter(new T.Vector3());
    this.focusGoal = center.multiplyScalar(0.45);
  }
  resetCamera() {
    this.camera.position.set(6.6, 3.2, 8.1);
    this.controls.target.set(0, 0, 0);
    this.focusGoal = null;
    this.controls.update();
  }
  view(name: 'front' | 'side' | 'iso') {
    this.camera.position.copy(
      name === 'front' ? V(10, 1.5, 0.1) : name === 'side' ? V(0.1, 1.2, 10) : V(6.6, 3.2, 8.1),
    );
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }
  capture(): Promise<Blob | null> {
    this.renderer.render(this.scene, this.camera);
    return new Promise((resolve) => this.renderer.domElement.toBlob(resolve, 'image/png'));
  }
  private resize() {
    const quality = this.appearance.quality;
    this.renderer.setPixelRatio(
      quality === 'eco' ? 1 : Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.5),
    );
    this.renderer.setSize(Math.max(1, this.resizeWidth), Math.max(1, this.resizeHeight));
    this.camera.aspect = this.resizeWidth / Math.max(1, this.resizeHeight);
    this.camera.updateProjectionMatrix();
  }
  private pick(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    for (const hit of this.raycaster.intersectObjects(this.model.children, true)) {
      if (!(hit.object instanceof T.Mesh) || hit.object.userData.ignore) continue;
      let object: T.Object3D | null = hit.object;
      while (object) {
        if (object.userData.category) return object.userData.category as Category;
        object = object.parent;
      }
    }
    return null;
  }
  private onMove = (event: PointerEvent) => {
    if (event.buttons) return;
    const part = this.pick(event);
    if (this.hovered === part) return;
    this.hovered = part;
    this.renderer.domElement.style.cursor = part ? 'pointer' : 'grab';
    this.highlight(this.selected);
    this.callbacks.hover(part);
  };
  private onLeave = () => {
    this.hovered = null;
    this.highlight(this.selected);
    this.callbacks.hover(null);
  };
  private onDown = (e: PointerEvent) => {
    this.down = [e.clientX, e.clientY];
  };
  private onUp = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - this.down[0], event.clientY - this.down[1]) < 5) {
      const part = this.pick(event);
      if (part) this.callbacks.select(part);
    }
  };
  private onContextLost = (event: Event) => {
    event.preventDefault();
    this.callbacks.error();
  };
  private onVisibility = () => {
    this.lastTime = 0;
  };
  private animate = (now: number) => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    if (!this.visible || document.hidden) {
      this.lastTime = now;
      return;
    }
    if (now - this.lastRender < (this.appearance.quality === 'eco' ? 32 : 15)) return;
    const dt = Math.min((now - (this.lastTime || now)) / 1000, 0.05);
    this.lastTime = now;
    this.lastRender = now;
    if (!this.reducedMotion)
      for (const rotor of this.fans)
        rotor.rotation.z =
          (rotor.rotation.z + ((dt * this.appearance.fanSpeed) / 100) * 12) % (Math.PI * 2);
    const scaleGoal = this.appearance.exploded ? 0.77 : 1;
    const scale = T.MathUtils.lerp(
      this.model.scale.x,
      scaleGoal,
      this.reducedMotion ? 1 : 1 - Math.exp(-dt * 6),
    );
    if (Math.abs(scale - this.model.scale.x) > 0.00001) this.renderer.shadowMap.needsUpdate = true;
    this.model.scale.setScalar(scale);
    this.model.position.y = -2.2 * (1 - scale);
    for (const group of this.groups.values()) {
      const goal = this.appearance.exploded ? group.userData.offset! : group.userData.base!;
      if (group.position.distanceToSquared(goal) > 0.00001)
        this.renderer.shadowMap.needsUpdate = true;
      group.position.lerp(goal, this.reducedMotion ? 1 : 1 - Math.exp(-dt * 6));
    }
    if (this.focusGoal) this.controls.target.lerp(this.focusGoal, 1 - Math.exp(-dt * 5));
    this.controls.update(dt);
    this.renderer.render(this.scene, this.camera);
  };
  private mergeStaticMeshes() {
    // Keep spinning rotors, glass and decals independent; batch the static hardware by material.
    for (const group of this.groups.values()) {
      const inverse = group.matrixWorld.clone().invert();
      const batches = new Map<
        T.Material,
        {
          geometries: T.BufferGeometry[];
          meshes: T.Mesh[];
        }
      >();
      group.traverse((obj) => {
        if (
          !(obj instanceof T.Mesh) ||
          obj instanceof T.InstancedMesh ||
          obj.userData.ignore ||
          Array.isArray(obj.material) ||
          !(obj.material instanceof T.MeshStandardMaterial) ||
          obj.material.transparent
        )
          return;
        let ancestor: T.Object3D | null = obj.parent;
        while (ancestor && ancestor !== group) {
          if (this.fans.includes(ancestor as T.Group)) return;
          ancestor = ancestor.parent;
        }
        const geometry = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
        geometry.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, obj.matrixWorld));
        const batch = batches.get(obj.material) ?? {
          geometries: [],
          meshes: [],
        };
        batch.geometries.push(geometry);
        batch.meshes.push(obj);
        batches.set(obj.material, batch);
      });
      for (const [material, batch] of batches) {
        const merged = mergeGeometries(batch.geometries);
        if (merged) {
          const mesh = new T.Mesh(merged, material);
          mesh.castShadow = mesh.receiveShadow = true;
          group.add(mesh);
          for (const original of batch.meshes) {
            original.removeFromParent();
            original.geometry.dispose();
          }
        }
        batch.geometries.forEach((g) => g.dispose());
      }
    }
  }
  private clearModel() {
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>();
    this.model.traverse((obj) => {
      if (obj instanceof T.Mesh || obj instanceof T.LineSegments) {
        geometries.add(obj.geometry);
        for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material])
          if (
            ![this.black, this.metal, this.silver, this.chassis, this.accent, this.halo].includes(
              mat as T.MeshStandardMaterial,
            )
          )
            materials.add(mat);
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => {
      const map = (m as T.MeshBasicMaterial).map;
      if (map && !Object.values(this.textures).includes(map as T.CanvasTexture)) map.dispose();
      m.dispose();
    });
    this.model.clear();
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.intersection.disconnect();
    this.controls.dispose();
    this.renderer.domElement.removeEventListener('pointermove', this.onMove);
    this.renderer.domElement.removeEventListener('pointerleave', this.onLeave);
    this.renderer.domElement.removeEventListener('pointerdown', this.onDown);
    this.renderer.domElement.removeEventListener('pointerup', this.onUp);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.clearModel();
    this.scene.traverse((obj) => {
      if (obj instanceof T.Mesh) {
        obj.geometry.dispose();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m) => m.dispose());
      }
    });
    Object.values(this.textures).forEach((t) => t.dispose());
    [this.black, this.metal, this.silver, this.chassis, this.accent].forEach((m) => m.dispose());
    this.environment.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.halo.dispose();
  }
}
