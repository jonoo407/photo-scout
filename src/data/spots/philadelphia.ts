import type { Spot, SpotMedia } from '../../spots/types'
import type { DaySchedule, Hours, OpenInterval, TimeRef, Weekday } from '../../spots/hours'

/* ---- hours helpers (shared shape with tampa-bay.ts) ---- */
const WK: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const clk = (time: string): TimeRef => ({ at: 'clock', time })
const sr = (offsetMin?: number): TimeRef => ({ at: 'sunrise', offsetMin })
const ss = (offsetMin?: number): TimeRef => ({ at: 'sunset', offsetMin })
const iv = (from: TimeRef, to: TimeRef): OpenInterval => ({ from, to })
const open = (...intervals: OpenInterval[]): DaySchedule => ({ open: 'hours', intervals })
const H24: DaySchedule = { open: '24h' }
const CLOSED: DaySchedule = { open: 'closed' }
function days(fallback: DaySchedule, overrides: Partial<Record<Weekday, DaySchedule>> = {}): Hours {
  const d = {} as Record<Weekday, DaySchedule>
  for (const w of WK) d[w] = overrides[w] ?? fallback
  return { days: d }
}

// Wikimedia Commons reference photo (license-clean, attributed).
const pic = (src: string, caption: string, credit: string, license: string, sourceUrl: string, light?: SpotMedia['light']): SpotMedia => ({
  src, thumb: src.replace('/1280px-', '/500px-'), caption, credit, license, sourceUrl, ...(light ? { light } : {}),
})

const SPOTS: Spot[] = [
  {
    id: 'spring-garden-bridge', name: 'Spring Garden Street Bridge', category: 'skyline', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['skyline over the Schuylkill', 'blue-hour reflections'], bestLight: ['sunset', 'blue-hour'],
    lat: 39.9627, lng: -75.1830, address: 'Spring Garden Street Bridge, Philadelphia, PA 19130', facing: 125, feeUSD: 0, isFree: true, driveMinutes: 8,
    hours: days(H24), phone: null,
    notes: 'A pedestrian-friendly bridge over the Schuylkill; the Center City skyline sits downstream to the SE and reflects in the river below the Fairmount Dam. The south/downstream railing gives the skyline; the north side frames Boathouse Row.',
    caveats: 'Pedestrian gates can close around sunset — confirm before a blue-hour shoot. Active roadway; brace against bridge vibration.',
    craft: {
      lightStrategy: 'Stand at the south (downstream) railing and shoot SE toward Center City; the skyline lights up and mirrors in the river through sunset and blue hour.',
      whatToShoot: ['Center City skyline over the Schuylkill', 'reflections below the Fairmount Dam', 'the river curving toward downtown'],
      signatureShots: [{ id: 'skyline-blue', label: 'Skyline reflected at blue hour', bestLight: 'blue-hour' }],
      compositionTips: ['Use the river and embankment as leading lines', 'Stay 20–30 min past sunset for the blue-hour balance'],
      gear: { lens: '24-70mm; 70-200 to compress the towers', tripod: true, settingsHint: 'f/8, ISO 100, bracket the bright sky' },
      ifCloudy: 'Low cloud catching city light adds drama; otherwise shoot Boathouse Row from the north side.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Philadelphia_from_South_Street_Bridge_July_2016_panorama_2.jpg/1280px-Philadelphia_from_South_Street_Bridge_July_2016_panorama_2.jpg', 'Center City skyline over the Schuylkill at golden hour', 'King of Hearts', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Philadelphia_from_South_Street_Bridge_July_2016_panorama_2.jpg', 'evening-golden')],
  },
  {
    id: 'belmont-plateau', name: 'Belmont Plateau', category: 'skyline', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['distant skyline', 'long-lens cityscape'], bestLight: ['evening-golden', 'sunset'],
    lat: 39.9898, lng: -75.2125, address: '2000 Belmont Mansion Dr, Philadelphia, PA 19131', facing: 128, feeUSD: 0, isFree: true, driveMinutes: 20,
    hours: days(open(iv(clk('06:00'), clk('22:00')))), phone: null,
    notes: 'A Fairmount Park overlook ~4 miles NW of downtown, ~240 ft above the Schuylkill; the classic distant-skyline view with a lone tree on the lawn for foreground.',
    caveats: 'Isolated overlook — shoot golden / early-blue hour rather than full dark. Parking off Belmont Mansion Dr.',
    craft: {
      lightStrategy: 'Shoot SE from the top of the lawn at golden hour; a telephoto compresses the distant skyline and the lone tree frames it.',
      whatToShoot: ['distant downtown skyline', 'the lone tree on the lawn', 'sweeping park foreground'],
      signatureShots: [{ id: 'plateau-skyline', label: 'Distant skyline framed by the lawn tree', bestLight: 'evening-golden' }],
      compositionTips: ['Use a 70-200 to compress the skyline', 'Include the lone tree for scale and framing'],
      gear: { lens: '70-200mm', tripod: true, settingsHint: 'f/8, ISO 100 to compress the skyline' },
      ifCloudy: 'Dramatic clouds over the skyline work well here; go moody.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/0/0c/Philly_Skyline_From_Belmont_-_panoramio.jpg', 'Distant skyline from Belmont Plateau', 'michaelwm25', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Philly_Skyline_From_Belmont_-_panoramio.jpg', 'daytime')],
  },
  {
    id: 'race-street-pier', name: 'Race Street Pier', category: 'skyline', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['Ben Franklin Bridge', 'sunrise over the Delaware'], bestLight: ['sunrise', 'blue-hour'],
    lat: 39.9535, lng: -75.1395, address: 'N Christopher Columbus Blvd & Race St, Philadelphia, PA 19106', facing: 35, feeUSD: 0, isFree: true, driveMinutes: 10,
    hours: days(open(iv(clk('07:00'), clk('23:00')))), phone: null,
    notes: 'A public park on the Delaware directly under the Benjamin Franklin Bridge; the signature shot looks NE up the span toward Camden, and sunrise rises behind the bridge.',
    caveats: 'Open 7am–11pm; nearby I-95 cap construction may affect access/parking. The skyline is behind you (W), not in the bridge frame.',
    craft: {
      lightStrategy: 'Stand at the lower/east end and shoot NE up the bridge as it sweeps overhead; the sun rises behind it to the east.',
      whatToShoot: ['the Ben Franklin Bridge towers + cables overhead', 'tiered-lawn leading lines', 'sunrise behind the bridge'],
      signatureShots: [{ id: 'bridge-up', label: 'Bridge sweeping overhead', bestLight: 'sunrise' }],
      compositionTips: ['Shoot up the span for dramatic perspective', 'Use the tiered lawn as leading lines'],
      gear: { lens: '16-35mm', tripod: true, settingsHint: 'f/11 for sunstars on the bridge lights' },
      ifCloudy: 'The graphic bridge structure works under any sky.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/2012_Ben_Franklin_Bridge_and_Race_Street_Pier.jpg/1280px-2012_Ben_Franklin_Bridge_and_Race_Street_Pier.jpg', 'Benjamin Franklin Bridge over the Delaware', 'Beyond My Ken', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:2012_Ben_Franklin_Bridge_and_Race_Street_Pier.jpg', 'daytime')],
  },
  {
    id: 'boathouse-row', name: 'Boathouse Row', category: 'architecture', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['lit boathouses', 'blue-hour reflections'], bestLight: ['blue-hour', 'night-astro'],
    lat: 39.9695, lng: -75.1875, address: 'Martin Luther King Jr Dr, Philadelphia, PA 19130', facing: 70, feeUSD: 0, isFree: true, driveMinutes: 12,
    hours: days(H24), phone: null,
    notes: "A row of lit Victorian boathouses on the Schuylkill's east bank, reflected at blue hour from the west-bank trail (MLK Drive). The LED outlines run nightly.",
    caveats: 'For the classic reflection use the west bank (MLK Drive), not the Kelly Drive side right next to the boathouses.',
    craft: {
      lightStrategy: 'From the west bank (Schuylkill River Trail / MLK Drive) shoot E across the water at blue hour; the lit boathouses mirror in the river.',
      whatToShoot: ['lit boathouses reflected in the river', 'the string of facades', 'long-exposure water'],
      signatureShots: [{ id: 'boathouse-blue', label: 'Lit boathouses mirrored at blue hour', bestLight: 'blue-hour' }],
      compositionTips: ['Shoot from the MLK Drive (west) side for the reflection', 'Long exposure for glassy water'],
      gear: { lens: '24-70mm + 70-200', tripod: true, settingsHint: 'f/11, ISO 100, 2–15s exposures' },
      ifCloudy: 'Still water and lights work in any sky; aim for just after sunset.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Boathouse_Row-wide.JPG/1280px-Boathouse_Row-wide.JPG', 'Boathouse Row along the Schuylkill', 'Jeffrey M. Vinocur', 'CC BY 2.5', 'https://commons.wikimedia.org/wiki/File:Boathouse_Row-wide.JPG', 'daytime')],
  },
  {
    id: 'bok-bar', name: 'Bok Bar (rooftop)', category: 'rooftop', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['rooftop skyline', 'South Philly views'], bestLight: ['sunset', 'blue-hour'],
    lat: 39.9215, lng: -75.1595, address: 'Bok Bar, 800 Mifflin St, Philadelphia, PA 19148', facing: 350, feeUSD: 0, isFree: true,
    feeNote: 'No cover; buy a drink', driveMinutes: 12,
    hours: days(open(iv(clk('17:00'), clk('23:00'))), {
      mon: CLOSED, tue: CLOSED,
      fri: open(iv(clk('17:00'), clk('24:00'))), sat: open(iv(clk('14:00'), clk('24:00'))), sun: open(iv(clk('14:00'), clk('21:00'))),
    }), phone: null,
    notes: "A seasonal 8th-floor rooftop beer garden atop the former Bok vocational school in South Philly; Center City skyline to the north. Open ~April–November.",
    caveats: 'Seasonal rooftop bar (Apr–Nov); closed Mon–Tue, 21+ after dark. Enter via the Bok building during open hours — confirm current hours.',
    craft: {
      lightStrategy: 'An elevated South-Philly rooftop looking N to Center City; grab the skyline as it lights up through sunset and blue hour.',
      whatToShoot: ['Center City skyline to the north', 'rooftop string-light ambiance', 'the city at blue hour'],
      signatureShots: [{ id: 'bok-skyline', label: 'Skyline from the rooftop at dusk', bestLight: 'sunset' }],
      compositionTips: ['Shoot over the rail to avoid the crowd', 'Brace on the rail after dark'],
      gear: { lens: '24-70mm', tripod: false, settingsHint: 'Handheld, ISO 800–1600 for blue hour' },
      accessTips: 'Seasonal (Apr–Nov); no cover but it is a bar — first-come. Closed Mon–Tue.',
    },
    media: [],
  },
  {
    id: 'philadelphia-city-hall', name: 'Philadelphia City Hall', category: 'architecture', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['William Penn tower', 'courtyard architecture'], bestLight: ['evening-golden', 'daytime', 'blue-hour'],
    lat: 39.9526, lng: -75.1635, address: '1400 John F. Kennedy Blvd, Philadelphia, PA 19107', facing: 135, feeUSD: 0, isFree: true, driveMinutes: 2,
    hours: days(H24), phone: null,
    notes: "The largest municipal building in the US, topped by Alexander Calder's 37-ft William Penn statue. The exterior and inner courtyard are free; a paid weekday tower tour reaches the 548-ft observation deck.",
    caveats: 'Exterior + courtyard free anytime. Tower tour weekdays only (Visitor Center, Room 121); not wheelchair accessible, weather-dependent.',
    craft: {
      lightStrategy: 'Golden hour warms the granite tower; shoot from Dilworth Park (NW) looking SE, or stand in the inner courtyard and shoot up the arches.',
      whatToShoot: ['the William Penn tower', 'the inner courtyard arches', 'Penn statue detail (long lens)'],
      signatureShots: [
        { id: 'penn-tower', label: 'William Penn tower at golden hour', bestLight: 'evening-golden' },
        { id: 'courtyard', label: 'Courtyard arches and tower', bestLight: 'daytime' },
      ],
      compositionTips: ['Shoot up the courtyard arches for symmetry', 'From Dilworth Park, use the open plaza for a clean tower shot'],
      gear: { lens: '24-70mm; 70-200 for the statue', tripod: false, settingsHint: 'f/8 for sharp facade detail' },
      ifCloudy: 'The architecture works in soft light; shoot detail and the courtyard.',
      accessTips: 'Exterior + courtyard free anytime; the paid tower tour is weekday-only.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Philadelphia_city_hall.jpg/1280px-Philadelphia_city_hall.jpg', 'City Hall and the William Penn tower', 'Toniklemm', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Philadelphia_city_hall.jpg', 'daytime')],
  },
  {
    id: 'independence-hall', name: 'Independence Hall', category: 'architecture', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['Georgian brick facade', 'the tower + steeple'], bestLight: ['morning-golden', 'evening-golden', 'daytime'],
    lat: 39.9489, lng: -75.1500, address: '520 Chestnut St, Philadelphia, PA 19106', facing: 0, feeUSD: 0, isFree: true, driveMinutes: 8,
    hours: days(open(iv(clk('09:00'), clk('17:00')))), phone: null,
    notes: 'Where the Declaration and Constitution were signed (a UNESCO site). The iconic shot is from Independence Square (south) looking N at the tower and steeple; the interior is by free timed ticket.',
    caveats: 'Interior is timed-ticket only (free; $1 admin fee via Recreation.gov) — arrive 30 min early for security on 5th St. Exterior always free.',
    craft: {
      lightStrategy: 'From Independence Square (south side) shoot N at the brick tower and steeple; the south facade takes soft morning light, the tower glows from the west at sunset.',
      whatToShoot: ['the steeple and tower facade', 'Georgian brick detail', 'the Square foreground'],
      signatureShots: [{ id: 'hall-tower', label: 'Tower and steeple from the Square', bestLight: 'evening-golden' }],
      compositionTips: ['Center the tower from the Square for symmetry', 'Include the Square’s trees for foreground'],
      gear: { lens: '24-70mm', tripod: false, settingsHint: 'f/8; watch blown highlights on the white steeple' },
      accessTips: 'Exterior always free. Interior needs a free timed ticket; winter months may not require one.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Exterior_of_the_Independence_Hall%2C_Aug_2019.jpg/1280px-Exterior_of_the_Independence_Hall%2C_Aug_2019.jpg', 'Independence Hall', 'Mys 721tx', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Exterior_of_the_Independence_Hall,_Aug_2019.jpg', 'daytime')],
  },
  {
    id: 'eastern-state-penitentiary', name: 'Eastern State Penitentiary', category: 'architecture', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['gothic cellblock ruins', 'castellated facade'], bestLight: ['daytime', 'evening-golden'],
    lat: 39.9683, lng: -75.1726, address: '2027 Fairmount Ave, Philadelphia, PA 19130', facing: null, feeUSD: 21, isFree: false,
    feeNote: '$21 adult (less for seniors/youth/students); the facade is free from Fairmount Ave', driveMinutes: 10,
    hours: days(open(iv(clk('10:00'), clk('17:00')))), phone: null,
    notes: "The world's first true penitentiary (1829), now a preserved gothic ruin — crumbling cellblocks, the cathedral-like vaulted corridors, and a castellated facade. Handheld photography is encouraged inside.",
    caveats: 'Open 10–5 (last entry 4). Handheld photo encouraged; tripods need a $10/day pass (on-site). No drones; commercial shoots need approval. Seasonal evening events run separately.',
    craft: {
      lightStrategy: 'Skylights and barred windows pour shafts of light into the decaying cellblocks — midday gives the strongest beams. Shoot the textures and the vanishing corridors with a fast lens.',
      whatToShoot: ['vaulted cellblock corridors with skylight beams', 'peeling cell interiors', 'the castellated gothic facade (from Fairmount Ave, free)'],
      signatureShots: [
        { id: 'cellblock', label: 'Skylight beam down a cellblock', bestLight: 'daytime' },
        { id: 'facade', label: 'Castellated gothic facade', bestLight: 'evening-golden' },
      ],
      compositionTips: ['Use the long cellblocks as vanishing-point lines', 'Expose for the skylight beams, lift shadows later'],
      gear: { lens: '16-35mm wide; fast prime for the cells', tripod: false, settingsHint: 'High ISO handheld; a tripod needs the $10 photo pass' },
      ifCloudy: 'Overcast softens the skylight beams but still works for moody texture shots.',
      accessTips: 'Personal handheld photography is encouraged; tripods require a $10/day pass sold on-site.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Eastern_state_penitentiary09.JPG/1280px-Eastern_state_penitentiary09.JPG', 'The castellated gothic facade on Fairmount Ave', 'Davidt8', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Eastern_state_penitentiary09.JPG', 'daytime')],
  },
  {
    id: 'elfreths-alley', name: "Elfreth's Alley", category: 'architecture', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['cobblestone street', 'colonial rowhouses'], bestLight: ['morning-golden', 'open-shade'],
    lat: 39.9527, lng: -75.1425, address: "Elfreth's Alley, Philadelphia, PA 19106", facing: 250, feeUSD: 0, isFree: true, driveMinutes: 10,
    hours: days(H24), phone: null,
    notes: 'The oldest continuously inhabited residential street in the US (c. 1703) — 32 preserved Federal and Georgian rowhouses on cobblestones. Shoot down the lane; the houses are private, occupied homes.',
    caveats: 'Public street, free — but private occupied homes: no entering stoops/yards, no flash into windows, keep quiet, and don’t block the narrow walk with a tripod.',
    craft: {
      lightStrategy: 'Come early morning before foot traffic; soft light or open shade keeps the cobblestones and colorful doors even. Shoot from the 2nd St (east) end looking WSW down the alley.',
      whatToShoot: ['the cobblestone lane framed by rowhouses', 'colonial doors + shutters detail', 'flower boxes and lanterns'],
      signatureShots: [
        { id: 'alley-down', label: 'Down the cobblestone alley', bestLight: 'morning-golden' },
        { id: 'door-detail', label: 'Colonial door and shutters', bestLight: 'open-shade' },
      ],
      compositionTips: ['Shoot straight down the lane for the vanishing-point view', 'Get low to emphasize the cobblestones'],
      gear: { lens: '24-70mm', tripod: false, settingsHint: 'f/5.6; shoot before the crowds arrive' },
      ifCloudy: 'Overcast is ideal for even color on the facades.',
      accessTips: 'Public street; the museum house (#126) tours Fri–Sun for a small fee.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Elfreth%27s_Alley.JPG/1280px-Elfreth%27s_Alley.JPG', 'Cobblestones and colonial rowhouses', 'Mr. Kjetil Ree', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Elfreth%27s_Alley.JPG', 'daytime')],
  },
  {
    id: '30th-street-station', name: '30th Street Station', category: 'interiors', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['Art-Deco concourse', 'window light + symmetry'], bestLight: ['daytime'],
    lat: 39.9558, lng: -75.1819, address: '2955 Market St, Philadelphia, PA 19104', facing: null, feeUSD: 0, isFree: true, driveMinutes: 6,
    hours: days(H24), phone: null,
    notes: "One of America's great railway halls — a 1933 Art-Deco concourse with a 95-ft coffered ceiling, monumental windows, and the bronze 'Angel of the Resurrection' war memorial. A major renovation runs through ~2026, so expect some scaffolding.",
    caveats: 'Free public transit hall; handheld photo OK, tripods discouraged (tripping hazard). Commercial shoots need Amtrak authorization. Renovation may obstruct parts through ~2026.',
    craft: {
      lightStrategy: 'Late-morning sun rakes through the tall east and west windows across the coffered ceiling and stone floor; shoot the symmetry of the hall and the Angel memorial.',
      whatToShoot: ['the coffered Art-Deco ceiling + chandeliers', 'window light across the concourse', "the 'Angel of the Resurrection' statue"],
      signatureShots: [
        { id: 'concourse', label: 'Window light down the concourse', bestLight: 'daytime' },
        { id: 'angel', label: 'Angel of the Resurrection memorial', bestLight: 'daytime' },
      ],
      compositionTips: ['Center the hall for symmetry', 'Wait for window light to hit the floor; include a figure for scale'],
      gear: { lens: '16-35mm wide', tripod: false, settingsHint: 'Handheld, high ISO; tripods restricted' },
      accessTips: 'Free public hall; handheld photography OK, tripods discouraged.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Station_Concourse_of_30th_Street_Station.jpg/1280px-Station_Concourse_of_30th_Street_Station.jpg', 'The Art-Deco concourse', 'ZhengZhou', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Station_Concourse_of_30th_Street_Station.jpg', 'daytime')],
  },
  {
    id: 'reading-terminal-market', name: 'Reading Terminal Market', category: 'interiors', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['market hall', 'neon + street life'], bestLight: ['daytime'],
    lat: 39.9534, lng: -75.1590, address: '1136 Arch St, Philadelphia, PA 19107', facing: null, feeUSD: 0, isFree: true, driveMinutes: 4,
    hours: days(open(iv(clk('08:00'), clk('18:00')))), phone: null,
    notes: 'A bustling 1893 market hall under an old iron train shed — Amish stalls, neon signs, produce, and crowds. Early morning (8–9am) has the best light and the fewest people.',
    caveats: 'Free entry. Busiest 11–2 (avoid for shooting). Ask vendors before photographing stalls/staff; commercial shoots need a permit.',
    craft: {
      lightStrategy: 'Come at 8–9am for clean light and room to shoot; capture the neon, the stall color, and the energy under the old train shed.',
      whatToShoot: ['neon stall signs', 'produce + flower color', 'vendors and the market crowd (ask first)'],
      signatureShots: [
        { id: 'neon-aisle', label: 'Neon-lit market aisle', bestLight: 'daytime' },
        { id: 'stall', label: 'Colorful stall detail', bestLight: 'daytime' },
      ],
      compositionTips: ['Shoot the aisles as leading lines', 'Higher ISO for the dim interior; catch candid moments'],
      gear: { lens: '35mm + fast prime', tripod: false, settingsHint: 'ISO 1600+, fast prime for the dim hall' },
      ifCloudy: 'Weather-independent — it’s indoors.',
      accessTips: 'Free; shoot before the 11–2 lunch rush. Ask before photographing people.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Reading_Terminal_Market.png/1280px-Reading_Terminal_Market.png', 'Inside the historic market hall', 'Bruce Andersen', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Reading_Terminal_Market.png', 'daytime')],
  },
  {
    id: 'cathedral-basilica-ss-peter-paul', name: 'Cathedral Basilica of SS. Peter and Paul', category: 'interiors', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['coffered dome', 'marble nave'], bestLight: ['daytime', 'morning-golden'],
    lat: 39.9575, lng: -75.1686, address: '1723 Race St, Philadelphia, PA 19103', facing: 90, feeUSD: 0, isFree: true, driveMinutes: 5,
    hours: days(open(iv(clk('07:00'), clk('17:00'))), { sat: open(iv(clk('09:00'), clk('18:30'))), sun: open(iv(clk('08:00'), clk('19:30'))) }), phone: null,
    notes: 'The grand domed cathedral on Logan Square (1864), Italian-Renaissance with a coffered dome, marble, and murals. Photograph the interior outside Mass times and be discreet.',
    caveats: 'Active church — visit outside Mass times. Non-flash handheld OK; be quiet and modestly dressed; tripods/pro gear may be restricted (ask an ambassador).',
    craft: {
      lightStrategy: 'Mid-morning light fills the dome and nave; shoot the symmetry toward the altar and look straight up into the coffered dome. Avoid Mass times.',
      whatToShoot: ['the coffered dome from below', 'the marble nave toward the altar', 'side chapels + murals'],
      signatureShots: [
        { id: 'dome', label: 'Up into the coffered dome', bestLight: 'daytime' },
        { id: 'nave', label: 'Symmetrical nave to the altar', bestLight: 'morning-golden' },
      ],
      compositionTips: ['Shoot straight up for the dome geometry', 'Center the aisle; brace on a pew, high ISO'],
      gear: { lens: '16-35mm wide', tripod: false, settingsHint: 'Handheld, ISO 1600+, no flash' },
      accessTips: 'Free; visit outside Mass (Mon–Fri 7–5, Sat 9–6:30, Sun 8–7:30). Be discreet.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Interior_Cathedral_Basilica_of_Saints_Peter_and_Paul_crop.JPG/1280px-Interior_Cathedral_Basilica_of_Saints_Peter_and_Paul_crop.JPG', "The cathedral's domed interior", 'Interstate295r, cropped by Beyond My Ken', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Interior_Cathedral_Basilica_of_Saints_Peter_and_Paul_crop.JPG', 'daytime')],
  },
  {
    id: 'shofuso-japanese-house', name: 'Shofuso Japanese House & Garden', category: 'gardens', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['Japanese house + koi pond', 'cherry blossoms / fall maples'], bestLight: ['morning-golden', 'open-shade', 'evening-golden'],
    lat: 39.9812, lng: -75.2128, address: 'Lansdowne & Horticultural Dr, West Fairmount Park, Philadelphia, PA 19131', facing: 315, feeUSD: 15, isFree: false,
    feeNote: '$15 adult; Philadelphia students/military free with ID', driveMinutes: 18,
    hours: days(open(iv(clk('11:00'), clk('17:00'))), { mon: CLOSED, tue: CLOSED }), phone: null,
    notes: 'A 17th-century-style Japanese house, koi pond, waterfall, and maples in West Fairmount Park — stunning under cherry blossoms (late March) and fall maple color. Timed-ticket entry; shoes off inside.',
    caveats: 'Seasonal (closed deep winter) and closed Mon/Tue; timed tickets. Shoes off inside the house (socks). No drones; pro shoots need a rental. Crowded during the Cherry Blossom Festival.',
    craft: {
      lightStrategy: 'From the far (SE) pond shore looking NW, the house, engawa, and maples mirror in the koi pond. Soft morning light or overcast keeps colors rich; peak under cherry blossoms or fall maples.',
      whatToShoot: ['the house reflected in the koi pond', 'cherry blossoms / fall maples', 'tea garden + waterfall detail'],
      signatureShots: [
        { id: 'house-pond', label: 'House mirrored in the koi pond', bestLight: 'morning-golden' },
        { id: 'maple', label: 'Maples over the pond', bestLight: 'open-shade' },
      ],
      compositionTips: ['Use the pond for a full reflection', 'Frame the house with overhanging maple branches'],
      gear: { lens: '24-70mm; 35mm for scenes', tripod: false, settingsHint: 'Polarizer to manage pond glare; f/8' },
      ifCloudy: 'Overcast is ideal — even color on the garden and house.',
      accessTips: 'Timed tickets (~$15); shoes off inside. Closed Mon/Tue and deep winter.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Shofuso_Spring.jpg/1280px-Shofuso_Spring.jpg', 'The Japanese house mirrored in the koi pond', '松風荘', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Shofuso_Spring.jpg', 'open-shade')],
  },
  {
    id: 'bartrams-garden', name: "Bartram's Garden", category: 'gardens', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['skyline across the Schuylkill', 'historic botanic garden'], bestLight: ['sunrise', 'evening-golden', 'daytime'],
    lat: 39.9335, lng: -75.2083, address: '5400 Lindbergh Blvd, Philadelphia, PA 19143', facing: 57, feeUSD: 0, isFree: true, driveMinutes: 18,
    hours: days(open(iv(sr(), ss()))), phone: null,
    notes: 'The oldest surviving botanic garden in North America (John Bartram, 1728) — 50 riverfront acres with the historic stone house and a downtown skyline view across the tidal Schuylkill from the public dock.',
    caveats: 'Grounds free, sunrise–sunset daily. The historic Bartram house opens only for special events. Free parking in the 54th St loop.',
    craft: {
      lightStrategy: 'From the riverfront dock (west bank) the Center City skyline sits NE across the tidal Schuylkill — sunrise front-lights the towers, sunset back-lights them over the water. The stone house and meadows are the daytime subjects.',
      whatToShoot: ['skyline across the Schuylkill from the dock', 'the 1728 stone house + barn', 'native meadows + the river'],
      signatureShots: [
        { id: 'skyline-dock', label: 'Skyline across the tidal river', bestLight: 'sunrise' },
        { id: 'stone-house', label: 'Historic Bartram house', bestLight: 'evening-golden' },
      ],
      compositionTips: ['Shoot from the dock for the river-foreground skyline', 'Catch low tide for cleaner reflections'],
      gear: { lens: '24-70mm + 70-200', tripod: true, settingsHint: 'f/8; grad ND to hold the sky' },
      ifCloudy: 'The historic house and meadows work in soft light.',
      accessTips: 'Grounds free, sunrise–sunset. Free parking in the 54th St loop.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/John_Bartram%27s_Stone_Barn_at_Bartram%27s_Garden_in_Philadelphia%2C_PA.jpg/1280px-John_Bartram%27s_Stone_Barn_at_Bartram%27s_Garden_in_Philadelphia%2C_PA.jpg', "Bartram's historic stone barn", 'Muran.Fox', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:John_Bartram%27s_Stone_Barn_at_Bartram%27s_Garden_in_Philadelphia,_PA.jpg', 'daytime')],
  },
  {
    id: 'morris-arboretum', name: 'Morris Arboretum & Gardens', category: 'gardens', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['canopy walk', 'swan pond + blooms'], bestLight: ['evening-golden', 'open-shade', 'morning-golden'],
    lat: 40.0897, lng: -75.2242, address: '100 E Northwestern Ave, Philadelphia, PA 19118', facing: null, feeUSD: 22, isFree: false,
    feeNote: '$22 adult / $20 online', driveMinutes: 30,
    hours: days(open(iv(clk('10:00'), clk('17:00')))), phone: null,
    notes: "A 92-acre Victorian public garden (Penn) in Chestnut Hill — rolling lawns, a swan pond, a fernery, and the 'Out on a Limb' treetop canopy walk.",
    caveats: 'Admission ~$22 ($20 online). Casual photo free; pro/portrait shoots need a paid pass. No drones or pets.',
    craft: {
      lightStrategy: 'Golden hour rakes across the rolling lawns and specimen trees; the Out-on-a-Limb canopy walk gives elevated views, and the swan pond reflects the plantings.',
      whatToShoot: ['the Out on a Limb canopy walk', 'swan pond reflections', 'specimen trees + seasonal blooms'],
      signatureShots: [
        { id: 'canopy-walk', label: 'Out on a Limb treetop walk', bestLight: 'evening-golden' },
        { id: 'swan-pond', label: 'Swan pond reflections', bestLight: 'open-shade' },
      ],
      compositionTips: ['Backlight foliage at golden hour for glow', 'Use the pond for reflections'],
      gear: { lens: '24-105mm; 100mm macro for blooms', tripod: false, settingsHint: 'f/8; backlight the foliage' },
      ifCloudy: 'Open shade / overcast is perfect for even garden and flower light.',
      accessTips: 'Open daily 10–5 (Apr–Oct weekends from 9). Casual photography free.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Canna_%C3%97_ehemannii%2C_Morris_Arboretum_01.jpg/1280px-Canna_%C3%97_ehemannii%2C_Morris_Arboretum_01.jpg', 'A canna bloom in the arboretum gardens', 'Shuvaev', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Canna_%C3%97_ehemannii,_Morris_Arboretum_01.jpg', 'daytime')],
  },
  {
    id: 'wissahickon-forbidden-drive', name: 'Wissahickon Valley (Forbidden Drive)', category: 'nature', city: 'Philadelphia', region: 'philadelphia',
    bestFor: ['creek + gorge trail', 'fall foliage'], bestLight: ['morning-golden', 'open-shade', 'sunrise'],
    lat: 40.0539, lng: -75.2178, address: '7 Valley Green Rd, Philadelphia, PA 19128', facing: null, feeUSD: 0, isFree: true, driveMinutes: 25,
    hours: days(open(iv(clk('06:00'), clk('22:00')))), phone: null,
    notes: 'A wooded gorge in NW Philadelphia — the flat gravel Forbidden Drive runs ~5 miles along the Wissahickon Creek past the 1850 Valley Green Inn and a stone bridge. Color peaks late Oct–early Nov.',
    caveats: 'Free, dawn-to-dusk (winter closes earlier). The small Valley Green lot fills fast on weekends and in fall — arrive early. Banks get muddy after rain.',
    craft: {
      lightStrategy: 'First/last light filters through the gorge canopy onto the creek; shoot the Valley Green Inn, the stone bridge, and creek reflections. Fall foliage peaks late Oct–early Nov.',
      whatToShoot: ['the creek + Forbidden Drive path', 'Valley Green Inn + stone bridge', 'fall foliage reflections'],
      signatureShots: [
        { id: 'creek-fall', label: 'Wissahickon Creek in autumn', bestLight: 'morning-golden' },
        { id: 'valley-green', label: 'Valley Green Inn by the creek', bestLight: 'open-shade' },
      ],
      compositionTips: ['Use the gravel drive as a leading line', 'Get low to the creek for reflections'],
      gear: { lens: '16-35 + 70-200', tripod: true, settingsHint: 'Polarizer for the water; slow shutter for silky creek' },
      ifCloudy: 'Overcast is ideal for even forest light and reflections.',
      accessTips: 'Free, dawn-to-dusk. Arrive early for the small Valley Green lot.',
    },
    media: [pic('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Wissahickon_Creek_in_autumn_near_the_Valley_Green_Inn.jpg/1280px-Wissahickon_Creek_in_autumn_near_the_Valley_Green_Inn.jpg', 'Wissahickon Creek along Forbidden Drive in autumn', 'Harrison Keely', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Wissahickon_Creek_in_autumn_near_the_Valley_Green_Inn.jpg', 'morning-golden')],
  },
]

export default SPOTS
