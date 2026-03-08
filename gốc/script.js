let scene = new THREE.Scene()

// Camera
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth/window.innerHeight,
  0.1,
  10000
)

let renderer = new THREE.WebGLRenderer({antialias:true})
renderer.setSize(window.innerWidth,window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1
renderer.physicallyCorrectLights = true

document.body.appendChild(renderer.domElement)

// Orbit controls
let controls = new THREE.OrbitControls(camera, renderer.domElement)
camera.position.set(0, 100, 400)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.minDistance = 50
controls.maxDistance = 1000

// Texture loader
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

// Load realistic planet textures (public-domain / CC0 sources)
loader.setCrossOrigin('anonymous')

const textureUrls = {
  sun: 'https://www.solarsystemscope.com/textures/download/2k_sun.jpg',
  mercury: 'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg',
  mercuryNormal: 'https://www.solarsystemscope.com/textures/download/2k_mercury_normal.jpg',
  venus: 'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg',
  venusNormal: 'https://www.solarsystemscope.com/textures/download/2k_venus_normal.jpg',
  earth: 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
  earthNormal: 'https://www.solarsystemscope.com/textures/download/2k_earth_normal_map.jpg',
  earthClouds: 'https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg',
  mars: 'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
  marsNormal: 'https://www.solarsystemscope.com/textures/download/2k_mars_normal.jpg',
  jupiter: 'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg',
  jupiterNormal: 'https://www.solarsystemscope.com/textures/download/2k_jupiter_normal.jpg',
  saturn: 'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg',
  saturnNormal: 'https://www.solarsystemscope.com/textures/download/2k_saturn_normal.jpg',
  saturnRing: 'https://www.solarsystemscope.com/textures/download/2k_saturn_ring.png',
  uranus: 'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg',
  uranusNormal: 'https://www.solarsystemscope.com/textures/download/2k_uranus_normal.jpg',
  uranusRing: 'https://www.solarsystemscope.com/textures/download/2k_uranus_ring.png',
  neptune: 'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg',
  neptuneNormal: 'https://www.solarsystemscope.com/textures/download/2k_neptune_normal.jpg'
}

let textures = {}

function createPlaceholderTexture(color = 0xffffff) {
  let canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 2
  let ctx = canvas.getContext('2d')
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
  ctx.fillRect(0, 0, 2, 2)
  return new THREE.CanvasTexture(canvas)
}

function createFlatNormalTexture() {
  // Neutral normal map (no surface perturbation)
  let canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 2
  let ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgb(128, 128, 255)'
  ctx.fillRect(0, 0, 2, 2)
  return new THREE.CanvasTexture(canvas)
}

function createFallbackRingTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 512, 0)
  gradient.addColorStop(0, 'rgba(190, 175, 150, 0)')
  gradient.addColorStop(0.2, 'rgba(220, 200, 170, 0.45)')
  gradient.addColorStop(0.5, 'rgba(240, 220, 190, 0.65)')
  gradient.addColorStop(0.8, 'rgba(220, 200, 170, 0.45)')
  gradient.addColorStop(1, 'rgba(190, 175, 150, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 1)
  return new THREE.CanvasTexture(canvas)
}

function loadTexture(key, url) {
  return new Promise(resolve => {
    loader.load(
      url,
      tex => {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        // Use sRGB for color textures, keep linear for normal maps
        if (key.toLowerCase().includes('normal')) {
          tex.encoding = THREE.LinearEncoding
        } else {
          tex.encoding = THREE.sRGBEncoding
        }
        resolve({ key, tex })
      },
      undefined,
      () => {
        console.warn(`Failed to load texture: ${url}`)
        resolve({ key, tex: createPlaceholderTexture(0x888888) })
      }
    )
  })
}

async function loadAllTextures() {
  const results = await Promise.all(
    Object.entries(textureUrls).map(([key, url]) => loadTexture(key, url))
  )

  results.forEach(({ key, tex }) => {
    textures[key] = tex
  })
}

// Create a very soft glow around Earth to simulate its atmosphere
function createEarthAtmosphere(radius) {
  const geo = new THREE.SphereGeometry(radius * 1.03, 64, 64)
  const mat = new THREE.MeshPhongMaterial({
    color: 0x8ccfff,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  })
  return new THREE.Mesh(geo, mat)
}

// Create a cloud layer for Earth using a real cloud map
function createEarthCloudLayer(radius) {
  const geo = new THREE.SphereGeometry(radius * 1.06, 64, 64)
  const mat = new THREE.MeshPhongMaterial({
    map: textures.earthClouds || createPlaceholderTexture(0xffffff),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    side: THREE.DoubleSide
  })
  return new THREE.Mesh(geo, mat)
}

// Create material for planets using real textures and physical properties
function createPlanetMaterial(planetName) {
  const base = textures[planetName] || createPlaceholderTexture(0x444444)
  const normal = textures[`${planetName}Normal`] || createFlatNormalTexture()

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

  const roughness = roughnessByPlanet[planetName] ?? 0.6
  const metalness = metalnessByPlanet[planetName] ?? 0.0

  // Slight emissive on gas giants to make their storm bands pop
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

// Create a starfield background
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

// We'll delay planet creation until textures load
let planets = []
let planetSprites = {}
let sun, corona

// Planet data (scaled for visual balance; still roughly proportional)
let planetData = [
  { name: "mercury", size: 1.6, distance: 45, speed: 0.012 },
  { name: "venus", size: 3.9, distance: 65, speed: 0.009 },
  { name: "earth", size: 4.0, distance: 85, speed: 0.007 },
  { name: "mars", size: 2.1, distance: 105, speed: 0.006 },
  { name: "jupiter", size: 10.0, distance: 150, speed: 0.004 },
  { name: "saturn", size: 8.5, distance: 210, speed: 0.003, hasRing: true },
  { name: "uranus", size: 4.0, distance: 260, speed: 0.002, hasRing: true },
  { name: "neptune", size: 3.9, distance: 310, speed: 0.0017, hasRing: true }
]

function createPlanet(data) {
  let geo = new THREE.SphereGeometry(data.size, 64, 64)
  
  let mat = createPlanetMaterial(data.name)
  let mesh = new THREE.Mesh(geo, mat)

  // Earth gets a separate cloud layer and a gentle atmospheric glow
  if (data.name === 'earth') {
    const cloud = createEarthCloudLayer(data.size)
    mesh.add(cloud)

    const atmosphere = createEarthAtmosphere(data.size)
    mesh.add(atmosphere)
  }
  
  let orbit = new THREE.Group()
  mesh.position.x = data.distance
  orbit.add(mesh)
  scene.add(orbit)
  
  // Add rings
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
    
    let ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 128)
    
    const ringTexture = textures[`${data.name}Ring`] || createFallbackRingTexture()
    let ringMat = new THREE.MeshBasicMaterial({
      map: ringTexture,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    })
    
    let ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2 + tilt
    
    if (data.name === 'uranus') {
      ring.rotation.z = 0.3
    }
    
    mesh.add(ring)
  }
  
  // Orbit path
  let orbitPath = new THREE.EllipseCurve(0, 0, data.distance, data.distance, 0, 2 * Math.PI, false, 0)
  let points = orbitPath.getPoints(100)
  let orbitGeo = new THREE.BufferGeometry().setFromPoints(points)
  let orbitMat = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 })
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

planetData.forEach(data => createPlanet(data))

// Raycaster
let raycaster = new THREE.Raycaster()
let mouse = new THREE.Vector2()

let currentState = "overview"
let zoomedPlanet = null
let zoomedSprite = null

let closeBtn = document.getElementById("closeBtn")
let imageViewer = document.getElementById("imageViewer")
let bigImage = document.getElementById("bigImage")

window.addEventListener("click", onMouseClick)
window.addEventListener("touchstart", onTouchStart, {passive: false})

function onMouseClick(event) {
  handleClick(event.clientX, event.clientY)
}

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
      if (spriteName) {
        showImage(spriteName)
        return
      }
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
  
  let targetPos = new THREE.Vector3(
    worldPos.x,
    worldPos.y,
    worldPos.z + distance
  )
  
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
    let mat = new THREE.SpriteMaterial({ 
      map: tex,
      transparent: true,
      opacity: 0.2,
      depthTest: false
    })
    
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
    
    let targetPos = new THREE.Vector3(
      worldPos.x,
      worldPos.y,
      worldPos.z + 10
    )
    
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
    
    if (t < 1) {
      requestAnimationFrame(updateCamera)
    }
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
      
      let targetPos = new THREE.Vector3(
        worldPos.x,
        worldPos.y,
        worldPos.z + distance
      )
      
      animateCamera(targetPos, worldPos)
    }
  } else if (currentState === "planetZoom") {
    currentState = "overview"
    zoomedPlanet = null
    zoomedSprite = null
    
    imageViewer.style.display = "none"
    closeBtn.style.display = "none"
    
    animateCamera(new THREE.Vector3(0, 100, 400), new THREE.Vector3(0, 0, 0))
  }
}

closeBtn.onclick = function() {
  closeZoom()
}

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

  // Create Sun with basic material (simpler and more reliable)
  const sunGeo = new THREE.SphereGeometry(30, 64, 64)
  const sunMat = new THREE.MeshBasicMaterial({
    map: textures.sun
  })
  sun = new THREE.Mesh(sunGeo, sunMat)
  scene.add(sun)

  // Sun corona - simpler version
  const coronaGeo = new THREE.SphereGeometry(34, 32, 32)
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xFF8C00,
    transparent: true,
    opacity: 0.35,
    side: THREE.BackSide
  })
  corona = new THREE.Mesh(coronaGeo, coronaMat)
  scene.add(corona)

  // Outer glow
  const glowGeo = new THREE.SphereGeometry(42, 32, 32)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xFF6600,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  })
  const sunGlow = new THREE.Mesh(glowGeo, glowMat)
  scene.add(sunGlow)

  planetData.forEach(data => createPlanet(data))
  animate()
}

init()

