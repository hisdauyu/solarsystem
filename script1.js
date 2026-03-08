let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000)
let renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1
renderer.physicallyCorrectLights = true
document.body.appendChild(renderer.domElement)

// Controls
let controls = new THREE.OrbitControls(camera, renderer.domElement)
camera.position.set(0, 200, 800)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.minDistance = 50
controls.maxDistance = 2000

// Loader
const loader = new THREE.TextureLoader()

// Lighting
let ambientLight = new THREE.AmbientLight(0x2b2b3f, 0.65)
scene.add(ambientLight)
let hemiLight = new THREE.HemisphereLight(0x666699, 0x080820, 0.25)
scene.add(hemiLight)
let sunLight = new THREE.PointLight(0xfff2cc, 2.0, 4000, 2)
sunLight.position.set(0, 0, 0)
scene.add(sunLight)
let dirLight = new THREE.DirectionalLight(0xfff3d1, 0.6)
dirLight.position.set(120, 80, 100)
scene.add(dirLight)

// Màu sắc cơ bản cho các hành tinh (dùng trong fallback)
const planetColors = {
  sun: 0xffaa00,
  mercury: 0x8c8c8c,
  venus: 0xe6b800,
  earth: 0x2e78c4,
  mars: 0xc1440e,
  jupiter: 0xd8a27a,
  saturn: 0xe0bb87,
  uranus: 0xb0e0e6,
  neptune: 0x4b70dd
}

// --- Định nghĩa nhiều URL dự phòng cho mỗi texture ---
const textureSources = {
  sun: [
    'https://www.solarsystemscope.com/textures/download/2k_sun.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/sun.png'
  ],
  mercury: [
    'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mercury.jpg'
  ],
  mercuryNormal: [
    'https://www.solarsystemscope.com/textures/download/2k_mercury_normal.jpg'
  ],
  venus: [
    'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/venus.jpg'
  ],
  venusNormal: [
    'https://www.solarsystemscope.com/textures/download/2k_venus_normal.jpg'
  ],
  earth: [
    'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
  ],
  earthNormal: [
    'https://www.solarsystemscope.com/textures/download/2k_earth_normal_map.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'
  ],
  earthClouds: [
    'https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png'
  ],
  mars: [
    'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mars.jpg'
  ],
  marsNormal: [
    'https://www.solarsystemscope.com/textures/download/2k_mars_normal.jpg'
  ],
  jupiter: [
    'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/jupiter.jpg'
  ],
  jupiterNormal: [
    'https://www.solarsystemscope.com/textures/download/2k_jupiter_normal.jpg'
  ],
  saturn: [
    'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/saturn.jpg'
  ],
  saturnNormal: [
    'https://www.solarsystemscope.com/textures/download/2k_saturn_normal.jpg'
  ],
  saturnRing: [
    'https://www.solarsystemscope.com/textures/download/2k_saturn_ring.png',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/saturn_ring.png'
  ],
  uranus: [
    'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg'
  ],
  uranusNormal: [
    'https://www.solarsystemscope.com/textures/download/2k_uranus_normal.jpg'
  ],
  uranusRing: [
    'https://www.solarsystemscope.com/textures/download/2k_uranus_ring.png'
  ],
  neptune: [
    'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg'
  ],
  neptuneNormal: [
    'https://www.solarsystemscope.com/textures/download/2k_neptune_normal.jpg'
  ]
}

let textures = {}

// --- Các hàm tạo texture procedural ---

// Normal map phẳng (dùng khi thiếu normal map)
function createFlatNormalTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 2
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgb(128, 128, 255)'
  ctx.fillRect(0, 0, 2, 2)
  return new THREE.CanvasTexture(canvas)
}

// Fallback cho normal map của sao Thủy (tạm thời dùng normal phẳng)
function createMercuryNormalMap() {
  return createFlatNormalTexture()
}

// Texture vành đai dự phòng
function createFallbackRingTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 1024, 0)
  gradient.addColorStop(0, 'rgba(190, 175, 150, 0)')
  gradient.addColorStop(0.2, 'rgba(220, 200, 170, 0.6)')
  gradient.addColorStop(0.5, 'rgba(240, 220, 190, 0.8)')
  gradient.addColorStop(0.8, 'rgba(220, 200, 170, 0.6)')
  gradient.addColorStop(1, 'rgba(190, 175, 150, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1024, 1)
  return new THREE.CanvasTexture(canvas)
}

// Texture mây dự phòng
function createCloudTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 1000; i++) {
    ctx.beginPath()
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const rad = Math.random() * 50 + 10
    ctx.arc(x, y, rad, 0, 2*Math.PI)
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
  return new THREE.CanvasTexture(canvas)
}

// Texture Trái Đất dự phòng (đơn giản)
function createEarthLikeTexture() {
  const width = 1024, height = 512
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#2e78c4'
  ctx.fillRect(0, 0, width, height)
  // Vẽ vài lục địa giả
  ctx.fillStyle = '#3a7e3a'
  ctx.beginPath()
  ctx.arc(300, 200, 150, 0, 2*Math.PI)
  ctx.fill()
  ctx.fillStyle = '#4c8b4c'
  ctx.beginPath()
  ctx.arc(700, 300, 200, 0, 2*Math.PI)
  ctx.fill()
  ctx.fillStyle = '#2d6a2d'
  ctx.beginPath()
  ctx.arc(500, 400, 120, 0, 2*Math.PI)
  ctx.fill()
  return new THREE.CanvasTexture(canvas)
}

// Texture procedural chung cho các hành tinh khác (khi không có texture riêng)
function createProceduralTexture(planetKey) {
  const width = 512, height = 256
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const color = planetColors[planetKey] || 0x888888
  const r = (color >> 16) & 255
  const g = (color >> 8) & 255
  const b = color & 255
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
  ctx.fillRect(0, 0, width, height)
  // Thêm nhiễu
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() > 0.9) {
      data[i] = Math.min(255, data[i] + (Math.random() - 0.5) * 40)
      data[i+1] = Math.min(255, data[i+1] + (Math.random() - 0.5) * 40)
      data[i+2] = Math.min(255, data[i+2] + (Math.random() - 0.5) * 40)
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return new THREE.CanvasTexture(canvas)
}

// --- Chi tiết từng hành tinh ---

// Sao Thủy: bề mặt nhiều miệng núi lửa, màu xám đa sắc
function createMercuryColorTexture() {
  const width = 2048, height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Nền xám với nhiễu
  const baseGray = 100 + Math.random() * 30
  ctx.fillStyle = `rgb(${baseGray}, ${baseGray}, ${baseGray})`
  ctx.fillRect(0, 0, width, height)

  // Vẽ nhiều miệng núi lửa với màu sắc ngẫu nhiên
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const radius = Math.random() * 50 + 3
    const brightness = baseGray - 20 + Math.random() * 60
    // Vành sáng
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`
    ctx.fill()
    // Lòng chảo tối
    ctx.beginPath()
    ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.7, 0, 2 * Math.PI)
    ctx.fillStyle = `rgb(${brightness - 50}, ${brightness - 50}, ${brightness - 50})`
    ctx.fill()
    // Điểm sáng
    ctx.beginPath()
    ctx.arc(x + radius * 0.25, y + radius * 0.25, radius * 0.15, 0, 2 * Math.PI)
    ctx.fillStyle = `rgb(${brightness + 40}, ${brightness + 40}, ${brightness + 40})`
    ctx.fill()
  }

  // Thêm các tia sáng từ va chạm lớn
  for (let i = 0; i < 10; i++) {
    const cx = Math.random() * width
    const cy = Math.random() * height
    const rayLength = 200 + Math.random() * 300
    for (let j = 0; j < 8; j++) {
      const angle = (j / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(angle) * rayLength, cy + Math.sin(angle) * rayLength)
      ctx.strokeStyle = `rgba(200,200,200,0.2)`
      ctx.lineWidth = 5 + Math.random() * 10
      ctx.stroke()
    }
  }

  // Nhiễu hạt
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() > 0.85) {
      data[i] = Math.min(255, data[i] + (Math.random() - 0.5) * 30)
      data[i+1] = Math.min(255, data[i+1] + (Math.random() - 0.5) * 30)
      data[i+2] = Math.min(255, data[i+2] + (Math.random() - 0.5) * 30)
    }
  }
  ctx.putImageData(imageData, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

// Sao Kim: bề mặt ẩn dưới lớp mây dày, nhưng có các đặc điểm núi lửa
function createVenusColorTexture() {
  const width = 2048, height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Màu nền vàng nhạt
  ctx.fillStyle = '#e6b800'
  ctx.fillRect(0, 0, width, height)

  // Vẽ các vùng tối hơn (đồng bằng bazan)
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const radX = Math.random() * 300 + 100
    const radY = Math.random() * 200 + 50
    ctx.beginPath()
    ctx.ellipse(x, y, radX, radY, 0, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(180, 140, 0, ${Math.random() * 0.4 + 0.3})`
    ctx.fill()
  }

  // Vẽ các vùng sáng (cao nguyên)
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const radX = Math.random() * 200 + 50
    const radY = Math.random() * 150 + 30
    ctx.beginPath()
    ctx.ellipse(x, y, radX, radY, 0, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(255, 220, 150, ${Math.random() * 0.3 + 0.2})`
    ctx.fill()
  }

  // Lớp mây mờ
  ctx.globalCompositeOperation = 'overlay'
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const rad = Math.random() * 150 + 20
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, rad)
    gradient.addColorStop(0, 'rgba(255,255,255,0.3)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, 2 * Math.PI)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

// Sao Hỏa: bề mặt đỏ với các vùng tối, núi lửa, hẻm núi
function createMarsColorTexture() {
  const width = 2048, height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Màu nền đỏ cam
  ctx.fillStyle = '#c1440e'
  ctx.fillRect(0, 0, width, height)

  // Vùng tối (đồng bằng)
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const radX = Math.random() * 400 + 100
    const radY = Math.random() * 200 + 50
    ctx.beginPath()
    ctx.ellipse(x, y, radX, radY, 0, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(80, 30, 10, ${Math.random() * 0.5 + 0.3})`
    ctx.fill()
  }

  // Vùng sáng (núi lửa, bụi)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const radX = Math.random() * 200 + 50
    const radY = Math.random() * 150 + 30
    ctx.beginPath()
    ctx.ellipse(x, y, radX, radY, 0, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(255, 150, 100, ${Math.random() * 0.4 + 0.3})`
    ctx.fill()
  }

  // Hẻm núi Valles Marineris (vệt dài)
  ctx.strokeStyle = '#5a2e0e'
  ctx.lineWidth = 20
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    const startX = Math.random() * width * 0.3 + width * 0.1
    const startY = Math.random() * height
    ctx.moveTo(startX, startY)
    for (let j = 0; j < 10; j++) {
      ctx.lineTo(startX + 200 + j * 100, startY + (Math.random() - 0.5) * 100)
    }
    ctx.stroke()
  }

  // Nhiễu
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() > 0.9) {
      data[i] = Math.min(255, data[i] + (Math.random() - 0.5) * 40)
      data[i+1] = Math.min(255, data[i+1] + (Math.random() - 0.5) * 40)
      data[i+2] = Math.min(255, data[i+2] + (Math.random() - 0.5) * 40)
    }
  }
  ctx.putImageData(imageData, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

// Sao Mộc: các dải mây, Vết Đỏ Lớn
function createJupiterColorTexture() {
  const width = 2048, height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Màu nền
  ctx.fillStyle = '#d8a27a'
  ctx.fillRect(0, 0, width, height)

  // Vẽ các dải mây
  const bandColors = ['#b87333', '#c19a6b', '#a0522d', '#8b4513', '#d2b48c']
  for (let y = 0; y < height; y += 40) {
    const bandHeight = 20 + Math.random() * 30
    const col = bandColors[Math.floor(Math.random() * bandColors.length)]
    ctx.fillStyle = col
    ctx.fillRect(0, y, width, bandHeight)
  }

  // Xoáy bão (Vết Đỏ Lớn)
  ctx.save()
  ctx.translate(width * 0.7, height * 0.4)
  ctx.scale(1.5, 0.8)
  ctx.beginPath()
  ctx.ellipse(0, 0, 150, 80, 0, 0, 2 * Math.PI)
  ctx.fillStyle = '#8b3a3a'
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-30, -10, 100, 50, 0, 0, 2 * Math.PI)
  ctx.fillStyle = '#b22222'
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(40, 20, 70, 35, 0, 0, 2 * Math.PI)
  ctx.fillStyle = '#a52a2a'
  ctx.fill()
  ctx.restore()

  // Thêm xoáy nhỏ
  for (let i = 0; i < 20; i++) {
    const cx = Math.random() * width
    const cy = Math.random() * height
    const rad = 30 + Math.random() * 60
    ctx.beginPath()
    ctx.ellipse(cx, cy, rad, rad * 0.6, 0, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(160, 100, 60, 0.3)`
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

// Sao Thổ: tương tự Sao Mộc nhưng nhạt hơn, có vành đai (riêng)
function createSaturnColorTexture() {
  const width = 2048, height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Màu nền vàng nhạt
  ctx.fillStyle = '#e0bb87'
  ctx.fillRect(0, 0, width, height)

  // Dải mây
  const bandColors = ['#c9a87c', '#b88a5e', '#a26b44', '#dbbc8c']
  for (let y = 0; y < height; y += 35) {
    const bandHeight = 15 + Math.random() * 25
    const col = bandColors[Math.floor(Math.random() * bandColors.length)]
    ctx.fillStyle = col
    ctx.fillRect(0, y, width, bandHeight)
  }

  // Xoáy bão nhẹ
  for (let i = 0; i < 10; i++) {
    const cx = Math.random() * width
    const cy = Math.random() * height
    const rad = 50 + Math.random() * 100
    ctx.beginPath()
    ctx.ellipse(cx, cy, rad, rad * 0.5, 0, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(180, 140, 100, 0.2)`
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

// Sao Thiên Vương: xanh nhạt đồng nhất với các dải mây mờ
function createUranusColorTexture() {
  const width = 2048, height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Màu nền xanh nhạt
  ctx.fillStyle = '#b0e0e6'
  ctx.fillRect(0, 0, width, height)

  // Dải mây rất mờ
  for (let y = 0; y < height; y += 30) {
    ctx.fillStyle = `rgba(255,255,255,0.05)`
    ctx.fillRect(0, y, width, 10)
  }

  // Một vàng vùng sáng tối
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const rad = Math.random() * 100 + 20
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, rad)
    gradient.addColorStop(0, 'rgba(200,240,255,0.1)')
    gradient.addColorStop(1, 'rgba(200,240,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, 2 * Math.PI)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

// Sao Hải Vương: xanh đậm với các vệt trắng xoáy (Vết Tối Lớn)
function createNeptuneColorTexture() {
  const width = 2048, height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Màu nền xanh đậm
  ctx.fillStyle = '#4b70dd'
  ctx.fillRect(0, 0, width, height)

  // Dải mây trắng
  for (let i = 0; i < 10; i++) {
    const y = Math.random() * height
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(0, y, width, 20)
  }

  // Vết Tối Lớn (xoáy)
  ctx.save()
  ctx.translate(width * 0.3, height * 0.6)
  ctx.rotate(0.3)
  ctx.beginPath()
  ctx.ellipse(0, 0, 150, 100, 0, 0, 2 * Math.PI)
  ctx.fillStyle = '#2a4b8c'
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(50, -30, 80, 50, 0, 0, 2 * Math.PI)
  ctx.fillStyle = '#3a5f9e'
  ctx.fill()
  ctx.restore()

  // Xoáy nhỏ
  for (let i = 0; i < 15; i++) {
    const cx = Math.random() * width
    const cy = Math.random() * height
    const rad = 40 + Math.random() * 80
    ctx.beginPath()
    ctx.ellipse(cx, cy, rad, rad * 0.6, 0, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(70, 130, 200, 0.3)`
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

// --- Hàm load texture với nhiều URL dự phòng ---
function loadTexture(key, urls) {
  return new Promise(resolve => {
    const tryLoad = (index) => {
      if (index >= urls.length) {
        console.warn(`All URLs failed for ${key}, using fallback.`)
        let fallbackTex
        if (key.includes('Normal')) {
          if (key === 'mercuryNormal') {
            fallbackTex = createMercuryNormalMap()
          } else {
            fallbackTex = createFlatNormalTexture()
          }
        } else if (key.includes('Ring')) {
          fallbackTex = createFallbackRingTexture()
        } else if (key.includes('Clouds')) {
          fallbackTex = createCloudTexture()
        } else if (key === 'earth') {
          fallbackTex = createEarthLikeTexture()
        } else {
          // Gọi hàm tạo texture riêng cho từng hành tinh
          switch(key) {
            case 'mercury': fallbackTex = createMercuryColorTexture(); break;
            case 'venus': fallbackTex = createVenusColorTexture(); break;
            case 'mars': fallbackTex = createMarsColorTexture(); break;
            case 'jupiter': fallbackTex = createJupiterColorTexture(); break;
            case 'saturn': fallbackTex = createSaturnColorTexture(); break;
            case 'uranus': fallbackTex = createUranusColorTexture(); break;
            case 'neptune': fallbackTex = createNeptuneColorTexture(); break;
            default: fallbackTex = createProceduralTexture(key);
          }
        }
        if (fallbackTex) {
          fallbackTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
          fallbackTex.encoding = key.includes('Normal') ? THREE.LinearEncoding : THREE.sRGBEncoding
        }
        resolve({ key, tex: fallbackTex })
        return
      }

      loader.load(
        urls[index],
        tex => {
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
          tex.encoding = key.includes('Normal') ? THREE.LinearEncoding : THREE.sRGBEncoding
          tex.minFilter = THREE.LinearMipmapLinearFilter
          tex.magFilter = THREE.LinearFilter
          resolve({ key, tex })
        },
        undefined,
        () => tryLoad(index + 1)
      )
    }
    tryLoad(0)
  })
}

async function loadAllTextures() {
  const promises = Object.entries(textureSources).map(([key, urls]) => loadTexture(key, urls))
  const results = await Promise.all(promises)
  results.forEach(({ key, tex }) => { textures[key] = tex })
}

// --- Vật liệu và thông số ---
const roughnessByPlanet = {
  mercury: 0.92,
  venus: 0.82,
  earth: 0.55,
  mars: 0.82,
  jupiter: 0.5,
  saturn: 0.55,
  uranus: 0.48,
  neptune: 0.47
}
const metalnessByPlanet = {
  mercury: 0.04,
  venus: 0.0,
  earth: 0.0,
  mars: 0.02,
  jupiter: 0.0,
  saturn: 0.0,
  uranus: 0.0,
  neptune: 0.0
}

function createPlanetMaterial(planetName) {
  const base = textures[planetName]
  const normal = textures[`${planetName}Normal`] || createFlatNormalTexture()

  const roughness = roughnessByPlanet[planetName] ?? 0.6
  const metalness = metalnessByPlanet[planetName] ?? 0.0

  let emissive = new THREE.Color(0x000000)
  let emissiveIntensity = 0
  if (planetName === 'jupiter') {
    emissive = new THREE.Color(0x221100)
    emissiveIntensity = 0.08
  } else if (planetName === 'saturn') {
    emissive = new THREE.Color(0x2a1f0f)
    emissiveIntensity = 0.06
  } else if (planetName === 'uranus' || planetName === 'neptune') {
    emissive = new THREE.Color(0x0b1b2a)
    emissiveIntensity = 0.04
  }

  return new THREE.MeshStandardMaterial({
    map: base,
    normalMap: normal,
    color: new THREE.Color(0xffffff),
    roughness: roughness,
    metalness: metalness,
    emissive: emissive,
    emissiveIntensity: emissiveIntensity,
    envMapIntensity: 1.0
  })
}

// --- Hiệu ứng khí quyển ---
function createEarthAtmosphere(radius) {
  const geo = new THREE.SphereGeometry(radius * 1.03, 128, 128)
  const mat = new THREE.MeshPhongMaterial({
    color: 0x8ccfff,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  })
  return new THREE.Mesh(geo, mat)
}
function createEarthCloudLayer(radius) {
  const geo = new THREE.SphereGeometry(radius * 1.06, 128, 128)
  const mat = new THREE.MeshPhongMaterial({
    map: textures.earthClouds || createCloudTexture(),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    side: THREE.DoubleSide
  })
  return new THREE.Mesh(geo, mat)
}
function createVenusAtmosphere(radius) {
  const geo = new THREE.SphereGeometry(radius * 1.05, 128, 128)
  const mat = new THREE.MeshPhongMaterial({
    color: 0xffe6b0,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  })
  return new THREE.Mesh(geo, mat)
}
function createMarsDust(radius) {
  const geo = new THREE.SphereGeometry(radius * 1.03, 128, 128)
  const mat = new THREE.MeshPhongMaterial({
    color: 0xc07c4a,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide
  })
  return new THREE.Mesh(geo, mat)
}

// --- Starfield ---
function createStarfield() {
  const starsGeo = new THREE.BufferGeometry()
  const starCount = 10000
  const positions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * 2 * Math.PI
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 2000
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: true })
  const stars = new THREE.Points(starsGeo, starsMat)
  scene.add(stars)
}
createStarfield()

let planets = []
let planetSprites = {}
let sun, corona

// Kích thước: mặt trời 20, hành tinh x5
const planetData = [
  { name: "mercury", size: 1.8 * 5, distance: 45, speed: 0.012 },
  { name: "venus", size: 4.2 * 5, distance: 65, speed: 0.009 },
  { name: "earth", size: 4.3 * 5, distance: 85, speed: 0.007 },
  { name: "mars", size: 2.3 * 5, distance: 105, speed: 0.006 },
  { name: "jupiter", size: 11.0 * 5, distance: 150, speed: 0.004 },
  { name: "saturn", size: 9.5 * 5, distance: 210, speed: 0.003, hasRing: true },
  { name: "uranus", size: 4.5 * 5, distance: 260, speed: 0.002, hasRing: true },
  { name: "neptune", size: 4.4 * 5, distance: 310, speed: 0.0017, hasRing: true }
]

function createPlanet(data) {
  let geo = new THREE.SphereGeometry(data.size, 128, 128)
  let mat = createPlanetMaterial(data.name)
  let mesh = new THREE.Mesh(geo, mat)

  if (data.name === 'earth') {
    mesh.add(createEarthCloudLayer(data.size))
    mesh.add(createEarthAtmosphere(data.size))
  } else if (data.name === 'venus') {
    mesh.add(createVenusAtmosphere(data.size))
  } else if (data.name === 'mars') {
    mesh.add(createMarsDust(data.size))
  }

  let orbit = new THREE.Group()
  mesh.position.x = data.distance
  orbit.add(mesh)
  scene.add(orbit)

  if (data.hasRing) {
    let innerRadius, outerRadius, tilt
    if (data.name === 'saturn') {
      innerRadius = data.size * 1.3
      outerRadius = data.size * 2.3
      tilt = 0.4
    } else if (data.name === 'uranus') {
      innerRadius = data.size * 1.5
      outerRadius = data.size * 2.0
      tilt = 1.7
    } else {
      innerRadius = data.size * 1.4
      outerRadius = data.size * 1.9
      tilt = 0.5
    }
    let ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 256)
    const ringTexture = textures[`${data.name}Ring`] || createFallbackRingTexture()
    let ringMat = new THREE.MeshStandardMaterial({
      map: ringTexture,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0x111111)
    })
    let ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2 + tilt
    if (data.name === 'uranus') ring.rotation.z = 0.3
    mesh.add(ring)
  }

  // Quỹ đạo
  let orbitPath = new THREE.EllipseCurve(0, 0, data.distance, data.distance, 0, 2 * Math.PI, false, 0)
  let points = orbitPath.getPoints(200)
  let orbitGeo = new THREE.BufferGeometry().setFromPoints(points)
  let orbitMat = new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.2 })
  let orbitLine = new THREE.Line(orbitGeo, orbitMat)
  orbitLine.rotation.x = Math.PI / 2
  scene.add(orbitLine)

  let planet = {
    mesh: mesh,
    orbit: orbit,
    speed: data.speed,
    data: data,
    images: [],
    imageAdded: false,
    name: data.name
  }
  planets.push(planet)
  planetSprites[data.name] = []
  return planet
}

// --- Raycaster và zoom (giữ nguyên) ---
let raycaster = new THREE.Raycaster()
let mouse = new THREE.Vector2()
let currentState = "overview"
let zoomedPlanet = null
let zoomedSprite = null
let closeBtn = document.getElementById("closeBtn")
let imageViewer = document.getElementById("imageViewer")
let bigImage = document.getElementById("bigImage")

window.addEventListener("click", onMouseClick)
window.addEventListener("touchstart", onTouchStart, { passive: false })

function onMouseClick(event) { handleClick(event.clientX, event.clientY) }
function onTouchStart(event) {
  if (event.touches.length > 0) {
    event.preventDefault()
    handleClick(event.touches[0].clientX, event.touches[0].clientY)
  }
}
function handleClick(x, y) {
  mouse.x = (x / window.innerWidth) * 2 - 1
  mouse.y = -(y / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  if (currentState === "imageZoom") {
    let spriteHits = raycaster.intersectObjects(Object.values(zoomedSprite).map(s => s))
    if (spriteHits.length > 0) {
      let spriteName = Object.keys(planetSprites[zoomedPlanet.name]).find(
        key => planetSprites[zoomedPlanet.name][key] === spriteHits[0].object
      )
      if (spriteName) showImage(spriteName)
      return
    }
    closeZoom()
    return
  }

  if (currentState === "planetZoom") {
    let spriteHits = raycaster.intersectObjects(planetSprites[zoomedPlanet.name])
    if (spriteHits.length > 0) {
      let sprite = spriteHits[0].object
      showImage(sprite.userData.imageName)
      return
    }
    closeZoom()
    return
  }

  let planetMeshes = planets.map(p => p.mesh)
  let intersects = raycaster.intersectObjects(planetMeshes)
  if (intersects.length > 0) {
    let planet = planets.find(p => p.mesh === intersects[0].object)
    zoomToPlanet(planet)
  }
}

function zoomToPlanet(planet) {
  currentState = "planetZoom"
  zoomedPlanet = planet
  let worldPos = new THREE.Vector3()
  planet.mesh.getWorldPosition(worldPos)
  let distance = planet.data.size * 0.05
  let targetPos = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z + distance)
  animateCamera(targetPos, worldPos)
  closeBtn.style.display = "block"
  if (!planet.imageAdded) {
    addImagesToPlanet(planet)
    planet.imageAdded = true
  }
}

function addImagesToPlanet(planet) {
  let numImages = 50
  let radius = planet.data.size
  for (let i = 0; i < numImages; i++) {
    let phi = Math.acos(-1 + (2 * i) / numImages)
    let theta = Math.sqrt(numImages * Math.PI) * phi
    let x = radius * Math.cos(theta) * Math.sin(phi)
    let y = radius * Math.sin(theta) * Math.sin(phi)
    let z = radius * Math.cos(phi)
    let tex = loader.load("placeholder.png")
    let mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.2, depthTest: false })
    let sprite = new THREE.Sprite(mat)
    sprite.position.set(x, y, z)
    sprite.scale.set(planet.data.size * 0.05, planet.data.size * 0.05, 1)
    sprite.userData.imageName = "image_" + i
    sprite.userData.planetName = planet.name
    planet.mesh.add(sprite)
    planetSprites[planet.name].push(sprite)
  }
}

function showImage(imageName) {
  currentState = "imageZoom"
  let sprite = planetSprites[zoomedPlanet.name].find(s => s.userData.imageName === imageName)
  if (sprite) {
    zoomedSprite = {}
    zoomedSprite[imageName] = sprite
    let worldPos = new THREE.Vector3()
    sprite.getWorldPosition(worldPos)
    let targetPos = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z + 10)
    animateCamera(targetPos, worldPos)
  }
  bigImage.src = "placeholder.png"
  imageViewer.style.display = "flex"
  closeBtn.style.display = "block"
}

function animateCamera(targetPos, lookAtPos) {
  let startPos = camera.position.clone()
  let startTarget = controls.target.clone()
  let startTime = Date.now()
  let duration = 1000
  function updateCamera() {
    let elapsed = Date.now() - startTime
    let t = Math.min(elapsed / duration, 1)
    t = 1 - Math.pow(1 - t, 3)
    camera.position.lerpVectors(startPos, targetPos, t)
    controls.target.lerpVectors(startTarget, lookAtPos, t)
    if (t < 1) requestAnimationFrame(updateCamera)
  }
  updateCamera()
}

function closeZoom() {
  if (currentState === "imageZoom") {
    currentState = "planetZoom"
    imageViewer.style.display = "none"
    if (zoomedPlanet) {
      let worldPos = new THREE.Vector3()
      zoomedPlanet.mesh.getWorldPosition(worldPos)
      let distance = zoomedPlanet.data.size * 0.05
      let targetPos = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z + distance)
      animateCamera(targetPos, worldPos)
    }
  } else if (currentState === "planetZoom") {
    currentState = "overview"
    zoomedPlanet = null
    zoomedSprite = null
    imageViewer.style.display = "none"
    closeBtn.style.display = "none"
    animateCamera(new THREE.Vector3(0, 200, 800), new THREE.Vector3(0, 0, 0))
  }
}
closeBtn.onclick = closeZoom

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

function animate() {
  requestAnimationFrame(animate)
  planets.forEach(planet => {
    if (currentState === "overview" || (currentState === "planetZoom" && zoomedPlanet !== planet)) {
      planet.orbit.rotation.y += planet.speed
    }
    planet.mesh.rotation.y += 0.003
  })
  if (sun) sun.rotation.y += 0.002
  if (corona) corona.rotation.y -= 0.001
  controls.update()
  renderer.render(scene, camera)
}

async function init() {
  await loadAllTextures()

  // Mặt trời
  const sunGeo = new THREE.SphereGeometry(20, 128, 128)
  const sunMat = new THREE.MeshStandardMaterial({
    map: textures.sun || createProceduralTexture('sun'),
    emissive: new THREE.Color(0xffaa00),
    emissiveIntensity: 1.2
  })
  sun = new THREE.Mesh(sunGeo, sunMat)
  scene.add(sun)

  const coronaGeo = new THREE.SphereGeometry(24, 64, 64)
  const coronaMat = new THREE.MeshBasicMaterial({ color: 0xFF8C00, transparent: true, opacity: 0.35, side: THREE.BackSide })
  corona = new THREE.Mesh(coronaGeo, coronaMat)
  scene.add(corona)

  const glowGeo = new THREE.SphereGeometry(30, 64, 64)
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.15, side: THREE.BackSide })
  const sunGlow = new THREE.Mesh(glowGeo, glowMat)
  scene.add(sunGlow)

  planetData.forEach(data => createPlanet(data))
  animate()
}
init()