/**
 * Philippine Administrative Divisions Data for Tactical Addressing
 * Maps Provinces -> Municipalities -> Key Barangays & Coordinates
 */

export interface MunicipalityInfo {
  name: string;
  coords: [number, number];
  barangays: string[];
}

export interface ProvinceInfo {
  name: string;
  coords: [number, number];
  municipalities: MunicipalityInfo[];
}

export const PH_PROVINCES: Record<string, ProvinceInfo> = {
  'Maguindanao del Sur': {
    name: 'Maguindanao del Sur',
    coords: [6.8850, 124.5800],
    municipalities: [
      {
        name: 'Shariff Aguak (Maganoy)',
        coords: [6.8622, 124.4419],
        barangays: ['Poblacion', 'Bagong', 'Kuloy', 'Labu-Labu', 'Lapok', 'Maitumaig', 'Malamote', 'Satan', 'Tapikan', 'Tuntungan'],
      },
      {
        name: 'Datu Piang (Dulawan)',
        coords: [6.9536, 124.4756],
        barangays: ['Poblacion', 'Buayan', 'Dado', 'Damabalas', 'Kanguan', 'Kalipapa', 'Lion', 'Magaslong', 'Masigay', 'Montay', 'Reina Regente'],
      },
      {
        name: 'Datu Saudi Ampatuan',
        coords: [6.9200, 124.4200],
        barangays: ['Dapiawan', 'Elian', 'Gawang', 'Kabangalan', 'Kitango', 'Kitapok', 'Madia', 'Salbu'],
      },
      {
        name: 'Mamasapano',
        coords: [6.9083, 124.5028],
        barangays: ['Bagumbayan', 'Dalican', 'Libutan', 'Lian', 'Lusay', 'Mamasapano', 'Manunggal', 'Pimbalakan', 'Tukanalipao', 'Tupalis'],
      },
      {
        name: 'Datu Unsay',
        coords: [6.8833, 124.4333],
        barangays: ['Iganagampong', 'Bulayan', 'Macalag', 'Maitumaig', 'Panat', 'Meta', 'Tugaig'],
      },
      {
        name: 'Ampatuan',
        coords: [6.8333, 124.4667],
        barangays: ['Poblacion', 'Dicalongan', 'Kakal', 'Kamasi', 'Kauran', 'Matagabong', 'Saniag', 'Tomadic', 'Tubak'],
      },
      {
        name: 'Sultan sa Barongis',
        coords: [6.8833, 124.6000],
        barangays: ['Poblacion', 'Barurao', 'Bulod', 'Darampua', 'Gadungan', 'Kulambog', 'Langgapan', 'Masulot', 'Paldong', 'Tugaig'],
      },
      {
        name: 'Buluan',
        coords: [6.7167, 124.7833],
        barangays: ['Poblacion', 'Digal', 'Lower Siling', 'Masurot', 'Popol', 'Sambulawan', 'Tenok', 'Upper Siling'],
      },
      {
        name: 'Rajah Buayan',
        coords: [6.9167, 124.5500],
        barangays: ['Bakat', 'Bettor', 'Cabalunan', 'Gaunan', 'Malibpolok', 'Mileb', 'Panadtaban', 'Pidsandawan', 'Sampao', 'Tabungao'],
      },
      {
        name: 'Guindulungan',
        coords: [6.9667, 124.3833],
        barangays: ['Bagan', 'Datu Amil', 'Kalumamis', 'Katibpuan', 'Lambayao', 'Macasampao', 'Muslim', 'Muti', 'Sampao'],
      },
    ],
  },
  'Maguindanao del Norte': {
    name: 'Maguindanao del Norte',
    coords: [7.2050, 124.2600],
    municipalities: [
      {
        name: 'Datu Odin Sinsuat (Dinaig)',
        coords: [7.1333, 124.1667],
        barangays: ['Awang', 'Badak', 'Bagoenged', 'Biti', 'Bugawas', 'Capiton', 'Dalican', 'Kakar', 'Kurintem', 'Semba', 'Tamontaka'],
      },
      {
        name: 'Sultan Kudarat (Nuling)',
        coords: [7.2333, 124.2833],
        barangays: ['Banubo', 'Bulalo', 'Calsada', 'Crossing Simuay', 'Dalumangcob', 'Katidtuan', 'Nangisan', 'Pinaring', 'Salimbao'],
      },
      {
        name: 'Parang',
        coords: [7.3750, 124.2667],
        barangays: ['Poblacion', 'Gadungan', 'Gumagadong-Calawag', 'Landasan', 'Manion', 'Moro', 'Nituan', 'Pinantao', 'Polloc', 'Sarmiento'],
      },
      {
        name: 'Upi (North Upi)',
        coords: [7.0333, 124.1667],
        barangays: ['Nuro (Poblacion)', 'Bantek', 'Blensong', 'Borongotan', 'Bugabungan', 'Darugao', 'Kibleg', 'Mirab', 'Ranao Babayan', 'Remipes'],
      },
      {
        name: 'Matanog',
        coords: [7.5500, 124.2667],
        barangays: ['Bayanga Norte', 'Bayanga Sur', 'Bugasan Norte', 'Bugasan Sur', 'Kidama', 'Langcong', 'Langis', 'Sapad', 'Poblacion'],
      },
      {
        name: 'Barira',
        coords: [7.5167, 124.3500],
        barangays: ['Barira (Poblacion)', 'Gadang', 'Korosoyan', 'Lamin', 'Lionas', 'Marang', 'Nabalawag', 'Panggao', 'Rominatsing'],
      },
      {
        name: 'Buldon',
        coords: [7.5000, 124.3667],
        barangays: ['Poblacion', 'Ampatuan', 'Cabayuan', 'Caladgaw', 'Dinganen', 'Kulimpang', 'Mataya', 'Minabay', 'Pantawan'],
      },
      {
        name: 'Datu Blah Sinsuat',
        coords: [6.9500, 123.9500],
        barangays: ['Poblacion', 'Kinimi', 'Laguitan', 'Matuber', 'Meti', 'Nalaan', 'Sedem', 'Sinipak', 'Tambak', 'Tubuan'],
      },
    ],
  },
  'Cotabato (North Cotabato)': {
    name: 'Cotabato (North Cotabato)',
    coords: [7.1500, 124.9500],
    municipalities: [
      {
        name: 'Kidapawan City',
        coords: [7.0083, 125.0894],
        barangays: ['Poblacion', 'Amas', 'Balindog', 'Ginatilan', 'Ilomavis', 'Kalaisan', 'Lanao', 'Manongol', 'Nuangan', 'Perez', 'Singao', 'Sudapin'],
      },
      {
        name: 'Midsayap',
        coords: [7.1917, 124.5306],
        barangays: ['Poblacion', 'Agriculture', 'Anonang', 'Central Katingawan', 'Kapinpilan', 'Malingao', 'Nabalawag', 'Olandang', 'Sambulawan', 'Tumbras'],
      },
      {
        name: 'Pikit',
        coords: [7.0500, 124.6667],
        barangays: ['Poblacion', 'Bagoinged', 'Balatican', 'Batulawan', 'Dapulog', 'Fort Pikit', 'Gligli', 'Inug-ug', 'Kolambog', 'Macabual', 'Rajah Muda'],
      },
      {
        name: 'Aleosan',
        coords: [7.1833, 124.6167],
        barangays: ['Dualing', 'Bagolibas', 'Cawilihan', 'Dunguan', 'Katalicanan', 'Lawili', 'Pagangan', 'Palacat', 'Pentil', 'San Mateo'],
      },
      {
        name: 'Carmen',
        coords: [7.2000, 124.7833],
        barangays: ['Poblacion', 'Aroman', 'Bentangan', 'General Luna', 'Kibayao', 'Kimadzil', 'Malapag', 'Nasapian', 'Palili', 'Ugalingan'],
      },
      {
        name: 'Kabacan',
        coords: [7.1167, 124.8333],
        barangays: ['Poblacion', 'Aringay', 'Bannawag', 'Katidtuan', 'Kayaga', 'Kilagasan', 'Malamote', 'Malanduague', 'Pedtad', 'Simbuhay'],
      },
      {
        name: 'Pigcawayan',
        coords: [7.2833, 124.4333],
        barangays: ['Poblacion', 'Anick', 'Bulucaon', 'Buricatan', 'Capayuran', 'Datu Mantil', 'Libungan Torreta', 'Malagakit', 'North Manarapan', 'Patot'],
      },
      {
        name: 'Tulunan',
        coords: [6.7833, 124.9167],
        barangays: ['Poblacion', 'Banayal', 'Batasan', 'Bual', 'Dungos', 'Kanibong', 'La Esperanza', 'Maybula', 'Minapan', 'New Caridad'],
      },
    ],
  },
  'Cotabato City': {
    name: 'Cotabato City',
    coords: [7.2236, 124.2464],
    municipalities: [
      {
        name: 'Cotabato City',
        coords: [7.2236, 124.2464],
        barangays: [
          'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Poblacion 4', 'Poblacion 5',
          'Poblacion 6', 'Poblacion 7', 'Poblacion 8', 'Poblacion 9',
          'Rosary Heights 1', 'Rosary Heights 2', 'Rosary Heights 3', 'Rosary Heights 4',
          'Rosary Heights 5', 'Rosary Heights 6', 'Rosary Heights 7', 'Rosary Heights 8',
          'Rosary Heights 9', 'Rosary Heights 10', 'Rosary Heights 11', 'Rosary Heights 12', 'Rosary Heights 13',
          'Bagua 1', 'Bagua 2', 'Bagua 3',
          'Kalanganan 1', 'Kalanganan 2',
          'Tamontaka 1', 'Tamontaka 2', 'Tamontaka 3', 'Tamontaka 4', 'Tamontaka 5',
        ],
      },
    ],
  },
  'South Cotabato': {
    name: 'South Cotabato',
    coords: [6.2500, 124.8500],
    municipalities: [
      {
        name: 'Koronadal City',
        coords: [6.5028, 124.8469],
        barangays: ['General Paulino Santos (Poblacion)', 'Zone I', 'Zone II', 'Zone III', 'Zone IV', 'Assumption', 'Avanceña', 'Carpenter Hill', 'Esperanza', 'Mabini', 'San Isidro', 'Saravia', 'Zulueta'],
      },
      {
        name: 'Polomolok',
        coords: [6.2167, 125.0667],
        barangays: ['Poblacion', 'Cannery Site', 'Crossing Pangi', 'Glamang', 'Klinan 6', 'Lumakil', 'Maligo', 'Pagalungan', 'Rubber', 'Silway 8', 'Upper Klinan'],
      },
      {
        name: 'Surallah',
        coords: [6.3833, 124.7333],
        barangays: ['Colonia (Poblacion)', 'Buenavista', 'Canahay', 'Centrala', 'Dajay', 'Lambontong', 'Libertad', 'Moloy', 'Tubiala', 'Upper Sepaka'],
      },
      {
        name: 'Tupi',
        coords: [6.3333, 124.9500],
        barangays: ['Poblacion', 'Acmonan', 'Bololmala', 'Bunao', 'Crossing Rubber', 'Linan', 'Lunen', 'Palian', 'Pula Bato', 'Simbo', 'Tubokar'],
      },
    ],
  },
  'Sultan Kudarat': {
    name: 'Sultan Kudarat',
    coords: [6.5500, 124.4500],
    municipalities: [
      {
        name: 'Isulan',
        coords: [6.6333, 124.6000],
        barangays: ['Kalawag I (Poblacion)', 'Kalawag II', 'Kalawag III', 'Bambad', 'Dansuli', 'Impao', 'Kenram', 'Kudanding', 'Lagandang', 'Sampao', 'Tayugo'],
      },
      {
        name: 'Tacurong City',
        coords: [6.6833, 124.6833],
        barangays: ['Poblacion', 'Baras', 'Buenaflor', 'Calean', 'Griquialo', 'Kalandagan', 'New Isabela', 'New Lagao', 'Rajah Muda', 'San Antonio', 'San Emmanuel'],
      },
      {
        name: 'Esperanza',
        coords: [6.7000, 124.5167],
        barangays: ['Poblacion', 'Ala', 'Daligan', 'Dukay', 'Guimbal', 'Magsaysay', 'New Panay', 'Pamantingan', 'Salabaca', 'Saliao'],
      },
      {
        name: 'Lebak',
        coords: [6.6167, 124.0500],
        barangays: ['Poblacion I', 'Poblacion II', 'Poblacion III', 'Basak', 'Bolebak', 'Datu Karon', 'Kalamongog', 'Nalamag', 'Purikay', 'Ragandang', 'Tibpuan'],
      },
      {
        name: 'Kalamansig',
        coords: [6.5667, 124.0500],
        barangays: ['Poblacion', 'Cadiz', 'Datu Celso', 'Dumangas Nuevo', 'Hinalaan', 'Limulan', 'Nalilidan', 'Paril', 'Sabanal', 'Sangay', 'Santa Clara'],
      },
      {
        name: 'Palimbang',
        coords: [6.2167, 124.2000],
        barangays: ['Poblacion', 'Badiangon', 'Baliango', 'Barongis', 'Kiponget', 'Kolong-Kolong', 'Kraan', 'Maganao', 'Malisbong', 'Medal', 'Milbuk', 'Wal'],
      },
    ],
  },
  'Lanao del Sur': {
    name: 'Lanao del Sur',
    coords: [7.9000, 124.3000],
    municipalities: [
      {
        name: 'Marawi City',
        coords: [8.0024, 124.2839],
        barangays: ['Banggolo Poblacion', 'Bacolod Chico', 'Boganga', 'Daguduban', 'Datu Saber', 'Gadongan', 'Lumbaca Madaya', 'Moncado Colony', 'Norhaya Village', 'Tolali'],
      },
      {
        name: 'Piagapo',
        coords: [8.0667, 124.2167],
        barangays: ['Poblacion', 'Aposong', 'Bagoaingud', 'Gacap', 'Katumbacan', 'Lininding', 'Paling', 'Radapan', 'Taporug', 'Udalo'],
      },
      {
        name: 'Malabang',
        coords: [7.6000, 124.0667],
        barangays: ['Bacolod', 'Badak Lumao', 'Bagoaingud', 'Chinatown (Poblacion)', 'Curvada', 'Matling', 'Montaner', 'Pasir', 'Tubok'],
      },
      {
        name: 'Balindong (Watu)',
        coords: [7.9167, 124.2000],
        barangays: ['Abaga', 'Bantogan', 'Bolinsong', 'Borakis', 'Dada-an', 'Lumbac', 'Poblacion', 'Salipongan', 'Tuka'],
      },
      {
        name: 'Butig',
        coords: [7.7333, 124.3000],
        barangays: ['Butig Poblacion', 'Coloyan', 'Dilimbayan', 'Dolangan', 'Malungun', 'Poktan', 'Raya', 'Samer', 'Sandab Madaya', 'Timbab'],
      },
    ],
  },
  'Lanao del Norte': {
    name: 'Lanao del Norte',
    coords: [8.0500, 123.9500],
    municipalities: [
      {
        name: 'Iligan City',
        coords: [8.2280, 124.2452],
        barangays: ['Poblacion', 'Dalipuga', 'Ditucalan', 'Hinaplanon', 'Kiwalan', 'Mahayahay', 'Pala-o', 'San Miguel', 'Suarez', 'Tambacan', 'Tibanga', 'Tubod'],
      },
      {
        name: 'Tubod',
        coords: [8.0500, 123.8000],
        barangays: ['Poblacion', 'Barakanas', 'Bulod', 'Camp V', 'Canaway', 'Malingao', 'Patudan', 'Pigcarangan', 'Pinpin', 'Pualas', 'San Antonio'],
      },
      {
        name: 'Munai',
        coords: [8.0167, 124.0333],
        barangays: ['Bacayawan', 'Balintad', 'Dalama', 'Kadayonan', 'Lininding', 'Matampay', 'North Tamparan', 'Poblacion', 'Punong', 'Tambac'],
      },
    ],
  },
  'Basilan': {
    name: 'Basilan',
    coords: [6.5667, 122.0333],
    municipalities: [
      {
        name: 'Isabela City',
        coords: [6.7042, 121.9711],
        barangays: ['Poblacion', 'Aguada', 'Begang', 'Binuangan', 'Busay', 'Carbon', 'Kaumpurnah', 'Kumalarang', 'Menzi', 'Riverside', 'San Rafael', 'Tabuk'],
      },
      {
        name: 'Lamitan City',
        coords: [6.6167, 122.1333],
        barangays: ['Malinao (Poblacion)', 'Aranginan', 'Ba-as', 'Baimbing', 'Boheyakan', 'Calugusan', 'Colonia', 'Danit-Puntoc', 'Kulay Bato', 'Limook', 'Malinis'],
      },
      {
        name: 'Tipo-Tipo',
        coords: [6.4833, 122.1000],
        barangays: ['Poblacion', 'Badja', 'Banuag', 'Bohebaca', 'Bohelebung', 'Lagayas', 'Limbo-Upis', 'Silangkum', 'Tipo-tipo Proper'],
      },
      {
        name: 'Sumisip',
        coords: [6.4167, 121.9833],
        barangays: ['Buli-buli (Poblacion)', 'Basak', 'Bohe-languyan', 'Cabunbata', 'Guiong', 'Libug', 'Mangal', 'Sahipa', 'Sapa Bulak', 'Tikki'],
      },
    ],
  },
  'Sulu': {
    name: 'Sulu',
    coords: [6.0000, 121.0000],
    municipalities: [
      {
        name: 'Jolo',
        coords: [6.0528, 121.0022],
        barangays: ['Walled City (Poblacion)', 'Alat', 'Asturias', 'Bus-Bus', 'Chinese Pier', 'San Raymundo', 'Takut-Takut', 'Tulay'],
      },
      {
        name: 'Patikul',
        coords: [6.0461, 121.0543],
        barangays: ['Anuling', 'Bakong', 'Bongkaong', 'Buhanginan', 'Danag', 'Igasan', 'Kaunayan', 'Maligay', 'Pangdan', 'Taglibi', 'Tandu-Bagua'],
      },
      {
        name: 'Indanan',
        coords: [6.0000, 120.9667],
        barangays: ['Poblacion', 'Bato-bato', 'Bunut', 'Kajatian', 'Licup', 'Mampallam', 'Pasil', 'Tagbak', 'Timbangan'],
      },
      {
        name: 'Talipao',
        coords: [5.9667, 121.1167],
        barangays: ['Poblacion', 'Bilaan', 'Bud Bunga', 'Kabungcol', 'Luhuk', 'Mahanub', 'Pantao', 'Samak', 'Upper Talipao'],
      },
    ],
  },
  'General Santos City': {
    name: 'General Santos City',
    coords: [6.1164, 125.1716],
    municipalities: [
      {
        name: 'General Santos City',
        coords: [6.1164, 125.1716],
        barangays: [
          'Dadiangas East', 'Dadiangas North', 'Dadiangas South', 'Dadiangas West',
          'Bula', 'Calumpang', 'Fatima', 'Lagao', 'San Isidro', 'Labangal',
          'Sinawal', 'Tambler', 'Mabuhay', 'City Heights', 'Apopong', 'Katangawan', 'San Jose', 'Tinagacan',
        ],
      },
    ],
  },
  'Zamboanga del Sur': {
    name: 'Zamboanga del Sur',
    coords: [7.8500, 123.2500],
    municipalities: [
      {
        name: 'Pagadian City',
        coords: [7.8250, 123.4370],
        barangays: ['San Pedro (Poblacion)', 'Balangasan', 'Balintawak', 'Danlugan', 'Gatas', 'Kawit', 'Lumbia', 'San Jose', 'Santa Lucia', 'Tiguma', 'Tuburan'],
      },
      {
        name: 'Dumalinao',
        coords: [7.8167, 123.3667],
        barangays: ['Pag-asa (Poblacion)', 'Anonang', 'Bag-ong Silao', 'Bibilik', 'Camalig', 'Kabuukan', 'Malasugue', 'Metokong', 'Pantad', 'Sumadat'],
      },
    ],
  },
  'Zamboanga City': {
    name: 'Zamboanga City',
    coords: [6.9214, 122.0790],
    municipalities: [
      {
        name: 'Zamboanga City',
        coords: [6.9214, 122.0790],
        barangays: [
          'Zone I (Poblacion)', 'Zone II', 'Zone III', 'Zone IV', 'Baliwasan',
          'Canelar', 'Guiwan', 'Pasonanca', 'San Roque', 'Santa Maria', 'Tetuan',
          'Tumaga', 'Vitali', 'Ayala', 'Cawit', 'Labuan', 'Mercedes', 'Putik', 'Talon-Talon',
        ],
      },
    ],
  },
};

export const COMMON_PUROKS = [
  'Purok 1',
  'Purok 2',
  'Purok 3',
  'Purok 4',
  'Purok 5',
  'Purok 6',
  'Purok 7',
  'Sitio Centro',
  'Sitio Riverside',
  'Sitio Upper',
  'Sitio Lower',
  'Sitio Crossing',
  'Sitio Maligaya',
  'Sitio San Isidro',
];
