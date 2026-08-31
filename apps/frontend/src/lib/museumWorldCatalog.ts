/** Réseau musées — xArtists 1er. PD Wikimedia + salle Affiche/rue (ancêtres street art). */
import type { FrameItem } from '../components/museum/MuseumCorridor'

export type VirtualMuseumId =
  | 'xartists' | 'louvre' | 'orsay' | 'rijks' | 'uffizi' | 'prado' | 'met'
  | 'nglondon' | 'vangogh' | 'mauritshuis' | 'tate' | 'hermitage' | 'vatican'
  | 'british' | 'graphic'

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

const U = 'https://upload.wikimedia.org/wikipedia/commons/thumb'
const W = {
  liberty: `${U}/5/5d/Eug%C3%A8ne_Delacroix_-_Le_28_Juillet._La_Libert%C3%A9_guidant_le_peuple.jpg/640px-Eug%C3%A8ne_Delacroix_-_Le_28_Juillet._La_Libert%C3%A9_guidant_le_peuple.jpg`,
  mona: `${U}/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/480px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg`,
  starry: `${U}/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/640px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg`,
  pearl: `${U}/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/480px-1665_Girl_with_a_Pearl_Earring.jpg`,
  nightwatch: `${U}/2/28/The_Nightwatch_by_Rembrandt_-_Rijksmuseum.jpg/640px-The_Nightwatch_by_Rembrandt_-_Rijksmuseum.jpg`,
  milkmaid: `${U}/2/21/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg/480px-Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg`,
  venus: `${U}/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/640px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg`,
  primavera: `${U}/3/3c/Botticelli-primavera.jpg/640px-Botticelli-primavera.jpg`,
  meninas: `${U}/3/31/Las_Meninas%2C_by_Diego_Vel%C3%A1zquez%2C_from_Prado_in_Google_Earth.jpg/640px-Las_Meninas%2C_by_Diego_Vel%C3%A1zquez%2C_from_Prado_in_Google_Earth.jpg`,
  sunflowers: `${U}/4/46/Vincent_Willem_van_Gogh_127.jpg/480px-Vincent_Willem_van_Gogh_127.jpg`,
  wave: `${U}/0/0d/Great_Wave_off_Kanagawa2.jpg/640px-Great_Wave_off_Kanagawa2.jpg`,
  whistle: `${U}/1/1b/Whistlers_Mother_high_res.jpg/480px-Whistlers_Mother_high_res.jpg`,
  arnolfini: `${U}/3/33/Van_Eyck_-_Arnolfini_Portrait.jpg/480px-Van_Eyck_-_Arnolfini_Portrait.jpg`,
  haywain: `${U}/d/d9/John_Constable_The_Hay_Wain.jpg/640px-John_Constable_The_Hay_Wain.jpg`,
  almond: `${U}/6/68/Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg/640px-Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg`,
  raft: `${U}/1/15/JEAN_LOUIS_TH%C3%89ODORE_G%C3%89RICAULT_-_La_Balsa_de_la_Medusa_%28Museo_del_Louvre%2C_1818-19%29.jpg/640px-JEAN_LOUIS_TH%C3%89ODORE_G%C3%89RICAULT_-_La_Balsa_de_la_Medusa_%28Museo_del_Louvre%2C_1818-19%29.jpg`,
  sacre: `${U}/2/2c/Jacques-Louis_David_-_The_Coronation_of_Napoleon_%2802%29.jpg/640px-Jacques-Louis_David_-_The_Coronation_of_Napoleon_%2802%29.jpg`,
  winged: `${U}/6/66/Nike_of_Samothrace_-_Louvre%2C_Paris.jpg/480px-Nike_of_Samothrace_-_Louvre%2C_Paris.jpg`,
  olympia: `${U}/8/8c/Edouard_Manet_-_Olympia_-_Google_Art_Project.jpg/640px-Edouard_Manet_-_Olympia_-_Google_Art_Project.jpg`,
  dejeuner: `${U}/2/2c/%C3%89douard_Manet_-_Le_D%C3%A9jeuner_sur_l%27herbe.jpg/640px-%C3%89douard_Manet_-_Le_D%C3%A9jeuner_sur_l%27herbe.jpg`,
  bride: `${U}/1/1d/Rembrandt_Harmensz._van_Rijn_-_Het_Joodse_bruidje_-_Google_Art_Project.jpg/640px-Rembrandt_Harmensz._van_Rijn_-_Het_Joodse_bruidje_-_Google_Art_Project.jpg`,
  delft: `${U}/a/a2/Vermeer-view-of-delft.jpg/640px-Vermeer-view-of-delft.jpg`,
  annun: `${U}/3/3b/Leonardo_da_Vinci_-_Annunciation_-_Google_Art_Project.jpg/640px-Leonardo_da_Vinci_-_Annunciation_-_Google_Art_Project.jpg`,
  maja: `${U}/3/31/Goya_Maja_desnuda.jpg/640px-Goya_Maja_desnuda.jpg`,
  may3: `${U}/f/fc/El_Tres_de_Mayo%2C_by_Francisco_de_Goya%2C_from_Prado_thin_black_margin.jpg/640px-El_Tres_de_Mayo%2C_by_Francisco_de_Goya%2C_from_Prado_thin_black_margin.jpg`,
  ambassadors: `${U}/8/88/Hans_Holbein_the_Younger_-_The_Ambassadors_-_Google_Art_Project.jpg/640px-Hans_Holbein_the_Younger_-_The_Ambassadors_-_Google_Art_Project.jpg`,
  bedroom: `${U}/7/76/Vincent_van_Gogh_-_The_Bedroom_-_Google_Art_Project.jpg/640px-Vincent_van_Gogh_-_The_Bedroom_-_Google_Art_Project.jpg`,
  irises: `${U}/3/3e/Irises-Vincent_van_Gogh.jpg/640px-Irises-Vincent_van_Gogh.jpg`,
  washington: `${U}/9/95/Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg/640px-Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg`,
  aristotle: `${U}/8/8c/Rembrandt_-_Aristotle_with_a_Bust_of_Homer_-_WGA19232.jpg/480px-Rembrandt_-_Aristotle_with_a_Bust_of_Homer_-_WGA19232.jpg`,
  anatomy: `${U}/4/4d/The_Anatomy_Lesson.jpg/640px-The_Anatomy_Lesson.jpg`,
  goldfinch: `${U}/9/9c/Carel_Fabritius_-_The_Goldfinch_-_WGA7727.jpg/480px-Carel_Fabritius_-_The_Goldfinch_-_WGA7727.jpg`,
  ophelia: `${U}/9/94/John_Everett_Millais_-_Ophelia_-_Google_Art_Project.jpg/640px-John_Everett_Millais_-_Ophelia_-_Google_Art_Project.jpg`,
  temeraire: `${U}/3/3c/Joseph_Mallord_William_Turner_-_The_Fighting_Temeraire_tugged_to_her_last_berth_to_be_broken_up_-_Google_Art_Project.jpg/640px-Joseph_Mallord_William_Turner_-_The_Fighting_Temeraire_tugged_to_her_last_berth_to_be_broken_up_-_Google_Art_Project.jpg`,
  prodigal: `${U}/1/1b/Rembrandt_Harmensz_van_Rijn_-_Return_of_the_Prodigal_Son_-_Google_Art_Project.jpg/640px-Rembrandt_Harmensz_van_Rijn_-_Return_of_the_Prodigal_Son_-_Google_Art_Project.jpg`,
  litta: `${U}/4/4c/Leonardo_da_Vinci_or_Boltraffio_%28attrib.%29_-_Madonna_Litta.jpg/480px-Leonardo_da_Vinci_or_Boltraffio_%28attrib.%29_-_Madonna_Litta.jpg`,
  adam: `${U}/6/6f/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg/640px-Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg`,
  athens: `${U}/4/49/Raphael_School_of_Athens.jpg/640px-Raphael_School_of_Athens.jpg`,
  rosetta: `${U}/2/23/Rosetta_Stone.JPG/480px-Rosetta_Stone.JPG`,
  parthenon: `${U}/6/6e/Elgin_Marbles_East_Pediment.jpg/640px-Elgin_Marbles_East_Pediment.jpg`,
  lautrec: `${U}/4/4f/Toulouse-Lautrec_-_Moulin_Rouge_-_La_Goulue.jpg/480px-Toulouse-Lautrec_-_Moulin_Rouge_-_La_Goulue.jpg`,
  mucha: `${U}/7/7c/Alfons_Mucha_-_1898_-_Job.jpg/480px-Alfons_Mucha_-_1898_-_Job.jpg`,
  cheret: `${U}/8/8a/Jules_Ch%C3%A9ret%2C_Folies_Berg%C3%A8re%2C_La_Lo%C3%AFe_Fuller%2C_1893.jpg/480px-Jules_Ch%C3%A9ret%2C_Folies_Berg%C3%A8re%2C_La_Lo%C3%AFe_Fuller%2C_1893.jpg`,
  fuji: `${U}/1/1e/Red_Fuji_southern_wind_clear_morning.jpg/640px-Red_Fuji_southern_wind_clear_morning.jpg`,
  scream: `${U}/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg/480px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg`,
  lilies: `${U}/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/640px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg`,
}

function w(id: string, title: string, artist: string, image: string, museum: string, year?: string): FrameItem {
  return {
    id, title,
    subtitle: artist + (year ? ` · ${year}` : ''),
    collection: museum,
    description: `Domaine public (Wikimedia). ${artist}${year ? `, ${year}` : ''}.`,
    image, type: 'Public domain', href: image,
  }
}

export const VIRTUAL_MUSEUMS: VirtualMuseum[] = [
  { id: 'xartists', name: 'Musée xArtists', city: 'MultiversX', country: 'On-chain', tagline: 'Premier musée — NFT mainnet', source: 'onchain', room: 'cyber', works: [] },
  { id: 'louvre', name: 'Louvre', city: 'Paris', country: 'France', tagline: 'Chefs-d’œuvre', source: 'public_domain', room: 'stone', works: [
    w('l1','La Joconde','Léonard de Vinci',W.mona,'Louvre','c.1503'),
    w('l2','La Liberté guidant le peuple','Delacroix',W.liberty,'Louvre','1830'),
    w('l3','Le Radeau de la Méduse','Géricault',W.raft,'Louvre','1819'),
    w('l4','Le Sacre de Napoléon','David',W.sacre,'Louvre','1807'),
    w('l5','Victoire de Samothrace','Hellénistique',W.winged,'Louvre','c.190 av. J.-C.'),
  ]},
  { id: 'orsay', name: 'Musée d’Orsay', city: 'Paris', country: 'France', tagline: 'XIXe modernes', source: 'public_domain', room: 'gold', works: [
    w('o1','Whistler’s Mother','Whistler',W.whistle,'Orsay','1871'),
    w('o2','Olympia','Manet',W.olympia,'Orsay','1863'),
    w('o3','Le Déjeuner sur l’herbe','Manet',W.dejeuner,'Orsay','1863'),
    w('o4','La Nuit étoilée','Van Gogh',W.starry,'PD','1889'),
    w('o5','Nymphéas','Monet',W.lilies,'PD','1906'),
  ]},
  { id: 'rijks', name: 'Rijksmuseum', city: 'Amsterdam', country: 'Pays-Bas', tagline: 'Âge d’or', source: 'public_domain', room: 'dark', works: [
    w('r1','La Ronde de nuit','Rembrandt',W.nightwatch,'Rijksmuseum','1642'),
    w('r2','La Laitière','Vermeer',W.milkmaid,'Rijksmuseum','c.1660'),
    w('r3','La Fiancée juive','Rembrandt',W.bride,'Rijksmuseum','c.1667'),
  ]},
  { id: 'mauritshuis', name: 'Mauritshuis', city: 'La Haye', country: 'Pays-Bas', tagline: 'Vermeer', source: 'public_domain', room: 'gold', works: [
    w('m1','La Jeune Fille à la perle','Vermeer',W.pearl,'Mauritshuis','c.1665'),
    w('m2','Vue de Delft','Vermeer',W.delft,'Mauritshuis','c.1661'),
    w('m3','Le Chardonneret','Fabritius',W.goldfinch,'Mauritshuis','1654'),
    w('m4','Leçon d’anatomie','Rembrandt',W.anatomy,'Mauritshuis','1632'),
  ]},
  { id: 'uffizi', name: 'Uffizi', city: 'Florence', country: 'Italie', tagline: 'Renaissance', source: 'public_domain', room: 'white', works: [
    w('u1','Naissance de Vénus','Botticelli',W.venus,'Uffizi','c.1485'),
    w('u2','Le Printemps','Botticelli',W.primavera,'Uffizi','c.1480'),
    w('u3','L’Annonciation','Léonard',W.annun,'Uffizi','c.1472'),
  ]},
  { id: 'prado', name: 'Prado', city: 'Madrid', country: 'Espagne', tagline: 'Siècle d’or', source: 'public_domain', room: 'stone', works: [
    w('p1','Les Ménines','Vélázquez',W.meninas,'Prado','1656'),
    w('p2','El Tres de Mayo','Goya',W.may3,'Prado','1814'),
    w('p3','La Maja desnuda','Goya',W.maja,'Prado','c.1800'),
  ]},
  { id: 'nglondon', name: 'National Gallery', city: 'Londres', country: 'UK', tagline: 'Collection nationale', source: 'public_domain', room: 'white', works: [
    w('n1','Les Époux Arnolfini','Van Eyck',W.arnolfini,'NG','1434'),
    w('n2','La Charrette de foin','Constable',W.haywain,'NG','1821'),
    w('n3','Les Ambassadeurs','Holbein',W.ambassadors,'NG','1533'),
    w('n4','Tournesols','Van Gogh',W.sunflowers,'NG','1888'),
    w('n5','The Fighting Temeraire','Turner',W.temeraire,'NG','1839'),
  ]},
  { id: 'vangogh', name: 'Van Gogh Museum', city: 'Amsterdam', country: 'Pays-Bas', tagline: 'Van Gogh', source: 'public_domain', room: 'white', works: [
    w('v1','Tournesols','Van Gogh',W.sunflowers,'VG','1888'),
    w('v2','Amandier en fleurs','Van Gogh',W.almond,'VG','1890'),
    w('v3','La Chambre à Arles','Van Gogh',W.bedroom,'VG','1888'),
    w('v4','Iris','Van Gogh',W.irises,'PD','1889'),
  ]},
  { id: 'met', name: 'The Met', city: 'New York', country: 'USA', tagline: 'Arts du monde', source: 'public_domain', room: 'stone', works: [
    w('me1','Grande Vague de Kanagawa','Hokusai',W.wave,'Met','c.1831'),
    w('me2','Washington Crossing the Delaware','Leutze',W.washington,'Met','1851'),
    w('me3','Aristote et Homère','Rembrandt',W.aristotle,'Met','1653'),
    w('me4','Fuji rouge','Hokusai',W.fuji,'PD','c.1831'),
  ]},
  { id: 'tate', name: 'Tate Britain', city: 'Londres', country: 'UK', tagline: 'Art britannique', source: 'public_domain', room: 'white', works: [
    w('t1','Ophélie','Millais',W.ophelia,'Tate','1851'),
    w('t2','Le Cri','Munch',W.scream,'PD','1893'),
  ]},
  { id: 'hermitage', name: 'Ermitage', city: 'Saint-Pétersbourg', country: 'Russie', tagline: 'Collection impériale', source: 'public_domain', room: 'gold', works: [
    w('h1','Retour du fils prodigue','Rembrandt',W.prodigal,'Ermitage','c.1669'),
    w('h2','Madonna Litta','Léonard (attr.)',W.litta,'Ermitage','c.1490'),
  ]},
  { id: 'vatican', name: 'Musées du Vatican', city: 'Vatican', country: 'Vatican', tagline: 'Sixtine & Raphael', source: 'public_domain', room: 'stone', works: [
    w('va1','Création d’Adam','Michel-Ange',W.adam,'Vatican','c.1512'),
    w('va2','L’École d’Athènes','Raphaël',W.athens,'Vatican','1509'),
  ]},
  { id: 'british', name: 'British Museum', city: 'Londres', country: 'UK', tagline: 'Civilisations', source: 'public_domain', room: 'stone', works: [
    w('b1','Pierre de Rosette','Égypte ptolémaïque',W.rosetta,'BM','196 av. J.-C.'),
    w('b2','Marbres du Parthénon','Grèce classique',W.parthenon,'BM','Ve s. av. J.-C.'),
  ]},
  { id: 'graphic', name: 'Affiche & rue', city: 'Paris · monde', country: 'Graphisme', tagline: 'Ancêtres du street art (PD)', source: 'public_domain', room: 'cyber', works: [
    w('g1','Moulin Rouge — La Goulue','Toulouse-Lautrec',W.lautrec,'Affiche','1891'),
    w('g2','Job','Alphonse Mucha',W.mucha,'Affiche','1898'),
    w('g3','Folies Bergère — Loïe Fuller','Jules Chéret',W.cheret,'Affiche','1893'),
    w('g4','La Grande Vague','Hokusai',W.wave,'Ukiyo-e','c.1831'),
    w('g5','Fuji rouge','Hokusai',W.fuji,'Ukiyo-e','c.1831'),
  ]},
]

export function getMuseum(id: VirtualMuseumId) {
  return VIRTUAL_MUSEUMS.find(m => m.id === id)
}
