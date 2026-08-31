/**
 * Réseau de musées — xArtists en premier.
 * Hors xArtists = domaine public (Wikimedia). Plusieurs œuvres iconiques / lieu.
 */
import type { FrameItem } from '../components/museum/MuseumCorridor'

export type VirtualMuseumId =
  | 'xartists'
  | 'louvre'
  | 'orsay'
  | 'rijks'
  | 'uffizi'
  | 'prado'
  | 'met'
  | 'nglondon'
  | 'vangogh'
  | 'mauritshuis'

export type VirtualMuseum = {
  id: VirtualMuseumId
  name: string
  city: string
  country: string
  tagline: string
  source: 'onchain' | 'public_domain'
  room: 'cyber' | 'stone' | 'gold' | 'white' | 'dark'
  works: FrameItem[]
}

const W = {
  liberty:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Eug%C3%A8ne_Delacroix_-_Le_28_Juillet._La_Libert%C3%A9_guidant_le_peuple.jpg/640px-Eug%C3%A8ne_Delacroix_-_Le_28_Juillet._La_Libert%C3%A9_guidant_le_peuple.jpg',
  mona:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/480px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
  starry:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/640px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
  pearl:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/480px-1665_Girl_with_a_Pearl_Earring.jpg',
  nightwatch:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/The_Nightwatch_by_Rembrandt_-_Rijksmuseum.jpg/640px-The_Nightwatch_by_Rembrandt_-_Rijksmuseum.jpg',
  milkmaid:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg/480px-Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg',
  venus:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/640px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg',
  primavera:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Botticelli-primavera.jpg/640px-Botticelli-primavera.jpg',
  meninas:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Las_Meninas%2C_by_Diego_Vel%C3%A1zquez%2C_from_Prado_in_Google_Earth.jpg/640px-Las_Meninas%2C_by_Diego_Vel%C3%A1zquez%2C_from_Prado_in_Google_Earth.jpg',
  sunflowers:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Vincent_Willem_van_Gogh_127.jpg/480px-Vincent_Willem_van_Gogh_127.jpg',
  wave:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Great_Wave_off_Kanagawa2.jpg/640px-Great_Wave_off_Kanagawa2.jpg',
  whistle:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Whistlers_Mother_high_res.jpg/480px-Whistlers_Mother_high_res.jpg',
  arnolfini:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Van_Eyck_-_Arnolfini_Portrait.jpg/480px-Van_Eyck_-_Arnolfini_Portrait.jpg',
  haywain:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/John_Constable_The_Hay_Wain.jpg/640px-John_Constable_The_Hay_Wain.jpg',
  gogh_almond:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg/640px-Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg',
  raft:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/JEAN_LOUIS_TH%C3%89ODORE_G%C3%89RICAULT_-_La_Balsa_de_la_Medusa_%28Museo_del_Louvre%2C_1818-19%29.jpg/640px-JEAN_LOUIS_TH%C3%89ODORE_G%C3%89RICAULT_-_La_Balsa_de_la_Medusa_%28Museo_del_Louvre%2C_1818-19%29.jpg',
  sacre:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Jacques-Louis_David_-_The_Coronation_of_Napoleon_%2802%29.jpg/640px-Jacques-Louis_David_-_The_Coronation_of_Napoleon_%2802%29.jpg',
  winged:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Nike_of_Samothrace_-_Louvre%2C_Paris.jpg/480px-Nike_of_Samothrace_-_Louvre%2C_Paris.jpg',
  olympia:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Edouard_Manet_-_Olympia_-_Google_Art_Project.jpg/640px-Edouard_Manet_-_Olympia_-_Google_Art_Project.jpg',
  dejeuner:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/%C3%89douard_Manet_-_Le_D%C3%A9jeuner_sur_l%27herbe.jpg/640px-%C3%89douard_Manet_-_Le_D%C3%A9jeuner_sur_l%27herbe.jpg',
  jewish_bride:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rembrandt_Harmensz._van_Rijn_-_Het_Joodse_bruidje_-_Google_Art_Project.jpg/640px-Rembrandt_Harmensz._van_Rijn_-_Het_Joodse_bruidje_-_Google_Art_Project.jpg',
  view_delft:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Vermeer-view-of-delft.jpg/640px-Vermeer-view-of-delft.jpg',
  annunciation:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Leonardo_da_Vinci_-_Annunciation_-_Google_Art_Project.jpg/640px-Leonardo_da_Vinci_-_Annunciation_-_Google_Art_Project.jpg',
  maja:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Goya_Maja_desnuda.jpg/640px-Goya_Maja_desnuda.jpg',
  may3:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/El_Tres_de_Mayo%2C_by_Francisco_de_Goya%2C_from_Prado_thin_black_margin.jpg/640px-El_Tres_de_Mayo%2C_by_Francisco_de_Goya%2C_from_Prado_thin_black_margin.jpg',
  ambassadors:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Hans_Holbein_the_Younger_-_The_Ambassadors_-_Google_Art_Project.jpg/640px-Hans_Holbein_the_Younger_-_The_Ambassadors_-_Google_Art_Project.jpg',
  bedroom:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Vincent_van_Gogh_-_The_Bedroom_-_Google_Art_Project.jpg/640px-Vincent_van_Gogh_-_The_Bedroom_-_Google_Art_Project.jpg',
  irises:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Irises-Vincent_van_Gogh.jpg/640px-Irises-Vincent_van_Gogh.jpg',
  washington:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg/640px-Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg',
  aristotle:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Rembrandt_-_Aristotle_with_a_Bust_of_Homer_-_WGA19232.jpg/480px-Rembrandt_-_Aristotle_with_a_Bust_of_Homer_-_WGA19232.jpg',
  anatomy:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/The_Anatomy_Lesson.jpg/640px-The_Anatomy_Lesson.jpg',
  goldfinch:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Carel_Fabritius_-_The_Goldfinch_-_WGA7727.jpg/480px-Carel_Fabritius_-_The_Goldfinch_-_WGA7727.jpg',
}

function work(
  id: string,
  title: string,
  artist: string,
  image: string,
  museum: string,
  year?: string
): FrameItem {
  return {
    id,
    title,
    subtitle: artist + (year ? ` · ${year}` : ''),
    collection: museum,
    description: `Œuvre du domaine public (Wikimedia). ${artist}${year ? `, ${year}` : ''}.`,
    image,
    type: 'Public domain',
    href: image,
  }
}

export const VIRTUAL_MUSEUMS: VirtualMuseum[] = [
  {
    id: 'xartists',
    name: 'Musée xArtists',
    city: 'MultiversX',
    country: 'On-chain',
    tagline: 'Premier musée du réseau — NFT mainnet',
    source: 'onchain',
    room: 'cyber',
    works: [],
  },
  {
    id: 'louvre',
    name: 'Louvre',
    city: 'Paris',
    country: 'France',
    tagline: 'Chefs-d’œuvre occidentaux',
    source: 'public_domain',
    room: 'stone',
    works: [
      work('louvre-mona', 'La Joconde', 'Léonard de Vinci', W.mona, 'Louvre', 'c.1503'),
      work('louvre-liberty', 'La Liberté guidant le peuple', 'Eugène Delacroix', W.liberty, 'Louvre', '1830'),
      work('louvre-raft', 'Le Radeau de la Méduse', 'Théodore Géricault', W.raft, 'Louvre', '1819'),
      work('louvre-sacre', 'Le Sacre de Napoléon', 'Jacques-Louis David', W.sacre, 'Louvre', '1807'),
      work('louvre-nike', 'Victoire de Samothrace', 'Anonyme hellénistique', W.winged, 'Louvre', 'c.190 av. J.-C.'),
    ],
  },
  {
    id: 'orsay',
    name: 'Musée d’Orsay',
    city: 'Paris',
    country: 'France',
    tagline: 'XIXe — modernes',
    source: 'public_domain',
    room: 'gold',
    works: [
      work('orsay-whistler', 'Arrangement in Grey and Black No.1', 'James McNeill Whistler', W.whistle, 'Orsay', '1871'),
      work('orsay-olympia', 'Olympia', 'Édouard Manet', W.olympia, 'Orsay', '1863'),
      work('orsay-dejeuner', 'Le Déjeuner sur l’herbe', 'Édouard Manet', W.dejeuner, 'Orsay', '1863'),
      work('orsay-starry', 'La Nuit étoilée', 'Vincent van Gogh', W.starry, 'PD image', '1889'),
    ],
  },
  {
    id: 'rijks',
    name: 'Rijksmuseum',
    city: 'Amsterdam',
    country: 'Pays-Bas',
    tagline: 'Âge d’or hollandais',
    source: 'public_domain',
    room: 'dark',
    works: [
      work('rijks-nightwatch', 'La Ronde de nuit', 'Rembrandt', W.nightwatch, 'Rijksmuseum', '1642'),
      work('rijks-milkmaid', 'La Laitière', 'Johannes Vermeer', W.milkmaid, 'Rijksmuseum', 'c.1660'),
      work('rijks-bride', 'La Fiancée juive', 'Rembrandt', W.jewish_bride, 'Rijksmuseum', 'c.1667'),
    ],
  },
  {
    id: 'mauritshuis',
    name: 'Mauritshuis',
    city: 'La Haye',
    country: 'Pays-Bas',
    tagline: 'Perle de Vermeer',
    source: 'public_domain',
    room: 'gold',
    works: [
      work('mh-pearl', 'La Jeune Fille à la perle', 'Johannes Vermeer', W.pearl, 'Mauritshuis', 'c.1665'),
      work('mh-delft', 'Vue de Delft', 'Johannes Vermeer', W.view_delft, 'Mauritshuis', 'c.1661'),
      work('mh-goldfinch', 'Le Chardonneret', 'Carel Fabritius', W.goldfinch, 'Mauritshuis', '1654'),
      work('mh-anatomy', 'La Leçon d’anatomie du Dr Tulp', 'Rembrandt', W.anatomy, 'Mauritshuis', '1632'),
    ],
  },
  {
    id: 'uffizi',
    name: 'Galerie des Offices',
    city: 'Florence',
    country: 'Italie',
    tagline: 'Renaissance florentine',
    source: 'public_domain',
    room: 'white',
    works: [
      work('uffizi-venus', 'La Naissance de Vénus', 'Sandro Botticelli', W.venus, 'Uffizi', 'c.1485'),
      work('uffizi-primavera', 'Le Printemps', 'Sandro Botticelli', W.primavera, 'Uffizi', 'c.1480'),
      work('uffizi-annun', 'L’Annonciation', 'Léonard de Vinci', W.annunciation, 'Uffizi', 'c.1472'),
    ],
  },
  {
    id: 'prado',
    name: 'Musée du Prado',
    city: 'Madrid',
    country: 'Espagne',
    tagline: 'Siècle d’or espagnol',
    source: 'public_domain',
    room: 'stone',
    works: [
      work('prado-meninas', 'Les Ménines', 'Diego Vélázquez', W.meninas, 'Prado', '1656'),
      work('prado-3may', 'El Tres de Mayo', 'Francisco de Goya', W.may3, 'Prado', '1814'),
      work('prado-maja', 'La Maja desnuda', 'Francisco de Goya', W.maja, 'Prado', 'c.1800'),
    ],
  },
  {
    id: 'nglondon',
    name: 'National Gallery',
    city: 'Londres',
    country: 'Royaume-Uni',
    tagline: 'Collection nationale',
    source: 'public_domain',
    room: 'white',
    works: [
      work('ng-arnolfini', 'Les Époux Arnolfini', 'Jan van Eyck', W.arnolfini, 'National Gallery', '1434'),
      work('ng-haywain', 'La Charrette de foin', 'John Constable', W.haywain, 'National Gallery', '1821'),
      work('ng-ambassadors', 'Les Ambassadeurs', 'Hans Holbein le Jeune', W.ambassadors, 'National Gallery', '1533'),
      work('ng-sun', 'Tournesols', 'Vincent van Gogh', W.sunflowers, 'National Gallery', '1888'),
    ],
  },
  {
    id: 'vangogh',
    name: 'Van Gogh Museum',
    city: 'Amsterdam',
    country: 'Pays-Bas',
    tagline: 'Vincent van Gogh',
    source: 'public_domain',
    room: 'white',
    works: [
      work('vg-sunflowers', 'Tournesols', 'Vincent van Gogh', W.sunflowers, 'Van Gogh Museum', '1888'),
      work('vg-almond', 'Amandier en fleurs', 'Vincent van Gogh', W.gogh_almond, 'Van Gogh Museum', '1890'),
      work('vg-bedroom', 'La Chambre à Arles', 'Vincent van Gogh', W.bedroom, 'Van Gogh Museum', '1888'),
      work('vg-irises', 'Iris', 'Vincent van Gogh', W.irises, 'PD', '1889'),
    ],
  },
  {
    id: 'met',
    name: 'The Met',
    city: 'New York',
    country: 'USA',
    tagline: 'Arts du monde',
    source: 'public_domain',
    room: 'stone',
    works: [
      work('met-wave', 'La Grande Vague de Kanagawa', 'Hokusai', W.wave, 'Met / PD', 'c.1831'),
      work('met-washington', 'Washington Crossing the Delaware', 'Emanuel Leutze', W.washington, 'Met', '1851'),
      work('met-aristotle', 'Aristote et le buste d’Homère', 'Rembrandt', W.aristotle, 'Met', '1653'),
    ],
  },
]

export function getMuseum(id: VirtualMuseumId) {
  return VIRTUAL_MUSEUMS.find(m => m.id === id)
}
