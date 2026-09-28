/**
 * Œuvres iconiques par musée — images Wikimedia Commons / PD (pas Met-only).
 * Garantit une présence « réelle » (ex. Joconde au Louvre) avec image qui charge.
 */
export type IconicWork = {
  id: string
  museumId: string
  title: string
  artist: string
  year?: string
  remote: string
  kind?: 'painting' | 'sculpture'
}

/** Wikimedia Commons special/File paths via upload.wikimedia.org */
export const ICONIC_WORKS: IconicWork[] = [
  {
    id: 'louvre-joconde',
    museumId: 'louvre',
    title: 'La Joconde (Mona Lisa)',
    artist: 'Léonard de Vinci',
    year: '1503–1506',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
  },
  {
    id: 'louvre-venus',
    museumId: 'louvre',
    title: 'Vénus de Milo',
    artist: 'Alexandros d’Antioche (attr.)',
    year: 'ca. 130–100 av. J.-C.',
    kind: 'sculpture',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Venus_de_Milo_Louvre_Ma399_n4.jpg/600px-Venus_de_Milo_Louvre_Ma399_n4.jpg',
  },
  {
    id: 'orsay-soleil',
    museumId: 'orsay',
    title: 'Impression, soleil levant',
    artist: 'Claude Monet',
    year: '1872',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Monet_-_Impression%2C_Sunrise.jpg/800px-Monet_-_Impression%2C_Sunrise.jpg',
  },
  {
    id: 'orsay-dejeuner',
    museumId: 'orsay',
    title: 'Le Déjeuner sur l’herbe',
    artist: 'Édouard Manet',
    year: '1863',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Edouard_Manet_-_Luncheon_on_the_Grass_-_Google_Art_Project.jpg/800px-Edouard_Manet_-_Luncheon_on_the_Grass_-_Google_Art_Project.jpg',
  },
  {
    id: 'rijks-nightwatch',
    museumId: 'rijks',
    title: 'The Night Watch',
    artist: 'Rembrandt',
    year: '1642',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/The_Nightwatch_by_Rembrandt.jpg/800px-The_Nightwatch_by_Rembrandt.jpg',
  },
  {
    id: 'prado-meninas',
    museumId: 'prado',
    title: 'Las Meninas',
    artist: 'Diego Velázquez',
    year: '1656',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Las_Meninas_01.jpg/700px-Las_Meninas_01.jpg',
  },
  {
    id: 'uffizi-birth',
    museumId: 'uffizi',
    title: 'La Naissance de Vénus',
    artist: 'Sandro Botticelli',
    year: 'ca. 1485',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/800px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg',
  },
  {
    id: 'moma-starry',
    museumId: 'moma',
    title: 'The Starry Night',
    artist: 'Vincent van Gogh',
    year: '1889',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/800px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
  },
  {
    id: 'met-washington',
    museumId: 'met',
    title: 'Washington Crossing the Delaware',
    artist: 'Emanuel Leutze',
    year: '1851',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg/800px-Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg',
  },
  {
    id: 'tate-turner',
    museumId: 'tate',
    title: 'The Fighting Temeraire',
    artist: 'J. M. W. Turner',
    year: '1839',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/The_Fighting_Temeraire%2C_JMW_Turner%2C_National_Gallery.jpg/800px-The_Fighting_Temeraire%2C_JMW_Turner%2C_National_Gallery.jpg',
  },
  {
    id: 'hermitage-return',
    museumId: 'hermitage',
    title: 'The Return of the Prodigal Son',
    artist: 'Rembrandt',
    year: 'ca. 1668',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Rembrandt_Harmensz_van_Rijn_-_Return_of_the_Prodigal_Son_-_Google_Art_Project.jpg/700px-Rembrandt_Harmensz_van_Rijn_-_Return_of_the_Prodigal_Son_-_Google_Art_Project.jpg',
  },
  {
    id: 'pompidou-guernica-note',
    museumId: 'pompidou',
    title: 'Composition (hommage moderne)',
    artist: 'Collection moderne',
    year: 'XXe',
    remote:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Wassily_Kandinsky%2C_1923_-_Composition_8%2C_oil_on_canvas%2C_140_x_201_cm%2C_Guggenheim_Museum.jpg/800px-Wassily_Kandinsky%2C_1923_-_Composition_8%2C_oil_on_canvas%2C_140_x_201_cm%2C_Guggenheim_Museum.jpg',
  },
]

export function iconicForMuseum(museumId: string): IconicWork[] {
  return ICONIC_WORKS.filter(w => w.museumId === museumId)
}
