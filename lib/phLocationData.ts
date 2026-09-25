/**
 * Philippine Administrative Divisions Data for Tactical Addressing
 * Comprehensive Database covering Provinces -> Municipalities/Cities -> Key Barangays & Coordinates
 * Specially detailed for Joint Task Force Central (JTFC) AOR & National Regions
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
  // =========================================================================
  // ── BANGSAMORO AUTONOMOUS REGION IN MUSLIM MINDANAO (BARMM) ──────────────
  // =========================================================================
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
        name: 'Datu Salibo',
        coords: [6.9400, 124.4500],
        barangays: ['Poblacion', 'Alonganan', 'Andavit', 'Balasan', 'Bulanay', 'Pagatin', 'Penditen', 'Sambulawan', 'Tee'],
      },
      {
        name: 'Shariff Saydona Mustapha',
        coords: [6.9300, 124.4900],
        barangays: ['Poblacion', 'Bakat', 'Duguengen', 'Ganta', 'Inaladan', 'Linantangan', 'Maganoy', 'Pagatin', 'Pamalian', 'Pikeg'],
      },
      {
        name: 'Datu Hoffer Ampatuan',
        coords: [6.8500, 124.4100],
        barangays: ['Poblacion', 'Kubentog', 'Labu-Labu I', 'Labu-Labu II', 'Limpongo', 'Macalag', 'Sayphudin', 'Talibadok', 'Tuayan'],
      },
      {
        name: 'Ampatuan',
        coords: [6.8333, 124.4667],
        barangays: ['Poblacion', 'Dicalongan', 'Kakal', 'Kamasi', 'Kauran', 'Matagabong', 'Saniag', 'Tomadic', 'Tubak'],
      },
      {
        name: 'Sultan sa Barongis (Lambayong)',
        coords: [6.8833, 124.6000],
        barangays: ['Poblacion', 'Barurao', 'Bulod', 'Darampua', 'Gadungan', 'Kulambog', 'Langgapan', 'Masulot', 'Paldong', 'Tugaig'],
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
      {
        name: 'Talayan',
        coords: [6.9833, 124.3500],
        barangays: ['Poblacion', 'Brar', 'Boboguiron', 'Damablac', 'Fugotan', 'Katibpuan', 'Kedama', 'Linuk', 'Marader', 'Tamar'],
      },
      {
        name: 'Datu Anggal Midtimbang',
        coords: [7.0000, 124.3667],
        barangays: ['Poblacion', 'Adaon', 'Brar', 'Mapayag', 'Midtimbang', 'Nunangan', 'Tulunan'],
      },
      {
        name: 'Buluan',
        coords: [6.7167, 124.7833],
        barangays: ['Poblacion', 'Digal', 'Lower Siling', 'Masurot', 'Popol', 'Sambulawan', 'Tenok', 'Upper Siling'],
      },
      {
        name: 'Datu Paglas',
        coords: [6.7500, 124.8667],
        barangays: ['Poblacion', 'Alip', 'Bonza', 'Damawato', 'Datumanot', 'Elbebe', 'Kalanganan', 'Lipao', 'Madidis', 'Mala-it', 'Mangat'],
      },
      {
        name: 'Pagalungan',
        coords: [7.0500, 124.7000],
        barangays: ['Poblacion', 'Bagoinged', 'Dalgan', 'Damalasak', 'Galakit', 'Inug-ug', 'Kalbugan', 'Kilangan', 'Kudal', 'Layog', 'Linandangan'],
      },
      {
        name: 'Datu Montawal (Pagagawan)',
        coords: [7.0833, 124.7167],
        barangays: ['Poblacion', 'Bulit', 'Bulod', 'Dungguan', 'Limbalud', 'Maridagao', 'Nabundas', 'Pagagawan', 'Talitay', 'Tunggol'],
      },
      {
        name: 'Paglat',
        coords: [6.7667, 124.8167],
        barangays: ['Poblacion', 'Damakling', 'Damawato', 'Kakal', 'Salamen', 'Tual', 'Upper Paglat'],
      },
      {
        name: 'Pandag',
        coords: [6.7000, 124.7500],
        barangays: ['Poblacion', 'Kabuling', 'Kayaga', 'Kayupo', 'Lepak', 'Lower Dilag', 'Malangit', 'Pandag Proper'],
      },
      {
        name: 'Mangudadatu',
        coords: [6.6833, 124.8000],
        barangays: ['Poblacion', 'Daladagan', 'Kalian', 'Luayan', 'Paitan', 'Panapan', 'Tenes', 'Tinambulan'],
      },
      {
        name: 'General Salipada K. Pendatun',
        coords: [6.7833, 124.7500],
        barangays: ['Poblacion', 'Badak', 'Bakat', 'Kakul', 'Kalamangan', 'Lasangan', 'Lower Panggal', 'Midpandacan', 'Panadtaban', 'Ramcor', 'Upper Panggal'],
      },
      {
        name: 'South Upi',
        coords: [6.8500, 124.1667],
        barangays: ['Timanan (Poblacion)', 'Biarong', 'Bongkog', 'Itaw', 'Kigan', 'Kuya', 'Lamud', 'Looy', 'Pandit', 'Pilar', 'Romabonga', 'San Jose'],
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
        barangays: ['Awang', 'Badak', 'Bagoenged', 'Biti', 'Bugawas', 'Capiton', 'Dalican', 'Kakar', 'Kurintem', 'Semba', 'Tamontaka', 'Tanuel', 'Tapian', 'Ambolodto'],
      },
      {
        name: 'Sultan Kudarat (Nuling)',
        coords: [7.2333, 124.2833],
        barangays: ['Banubo', 'Bulalo', 'Calsada', 'Crossing Simuay', 'Dalumangcob', 'Katidtuan', 'Nangisan', 'Pinaring', 'Salimbao', 'Pigcalagan', 'Rebucon'],
      },
      {
        name: 'Parang',
        coords: [7.3750, 124.2667],
        barangays: ['Poblacion', 'Gadungan', 'Gumagadong-Calawag', 'Landasan', 'Manion', 'Moro', 'Nituan', 'Pinantao', 'Polloc', 'Sarmiento', 'Making', 'Orandang'],
      },
      {
        name: 'Upi (North Upi)',
        coords: [7.0333, 124.1667],
        barangays: ['Nuro (Poblacion)', 'Bantek', 'Blensong', 'Borongotan', 'Bugabungan', 'Darugao', 'Kibleg', 'Mirab', 'Ranao Babayan', 'Remipes', 'Renede', 'Renti'],
      },
      {
        name: 'Matanog',
        coords: [7.5500, 124.2667],
        barangays: ['Poblacion', 'Bayanga Norte', 'Bayanga Sur', 'Bugasan Norte', 'Bugasan Sur', 'Kidama', 'Langcong', 'Langis', 'Sapad'],
      },
      {
        name: 'Barira',
        coords: [7.5167, 124.3500],
        barangays: ['Barira (Poblacion)', 'Gadang', 'Korosoyan', 'Lamin', 'Lionas', 'Marang', 'Nabalawag', 'Panggao', 'Rominatsing', 'Togop'],
      },
      {
        name: 'Buldon',
        coords: [7.5000, 124.3667],
        barangays: ['Poblacion', 'Ampatuan', 'Cabayuan', 'Caladgaw', 'Dinganen', 'Kulimpang', 'Mataya', 'Minabay', 'Pantawan', 'Piers'],
      },
      {
        name: 'Datu Blah Sinsuat',
        coords: [6.9500, 123.9500],
        barangays: ['Poblacion', 'Kinimi', 'Laguitan', 'Matuber', 'Meti', 'Nalaan', 'Sedem', 'Sinipak', 'Tambak', 'Tubuan'],
      },
      {
        name: 'Kabuntalan (Tumbao)',
        coords: [7.1167, 124.3833],
        barangays: ['Poblacion', 'Bagumbayan', 'Butril', 'Dadtumog', 'Gamble', 'Katumbao', 'Langeban', 'Lion', 'Maitum', 'Pagalungan', 'Taviran'],
      },
      {
        name: 'Northern Kabuntalan',
        coords: [7.1833, 124.4167],
        barangays: ['Sabaken (Poblacion)', 'Damatog', 'Gayonga', 'Guiawa', 'Indatuan', 'Kapadpat', 'Libungan', 'Montay', 'Paulino Labio', 'Salilangan'],
      },
      {
        name: 'Sultan Mastura',
        coords: [7.3000, 124.3000],
        barangays: ['Tambur (Poblacion)', 'Balut', 'Boliok', 'Bungabong', 'Dagurungan', 'Kirkir', 'Macabiso', 'Namuken', 'Simuay Seashore', 'Tariken', 'Tuka'],
      },
      {
        name: 'Talitay (Sultan Sumagka)',
        coords: [7.0167, 124.3167],
        barangays: ['Talitay (Poblacion)', 'Bintan', 'Gadungan', 'Kiladap', 'Kilalan', 'Kuden', 'Manggay', 'Pageda', 'Talitay Proper'],
      },
    ],
  },
  'Cotabato City': {
    name: 'Cotabato City',
    coords: [7.2236, 124.2464],
    municipalities: [
      {
        name: 'Cotabato City (Direct)',
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
  'Special Geographic Area (SGA BARMM)': {
    name: 'Special Geographic Area (SGA BARMM)',
    coords: [7.1333, 124.6000],
    municipalities: [
      {
        name: 'Kadayangan',
        coords: [7.1800, 124.5200],
        barangays: ['Central Labas', 'Kapinpilan', 'Malingao', 'Mudseng', 'Sambulawan', 'Sibsib', 'Tumbras'],
      },
      {
        name: 'Kapalawan',
        coords: [7.1950, 124.5800],
        barangays: ['Kibayao', 'Kitulaan', 'Langogan', 'Manarapan', 'Nasapian', 'Pebpoloan', 'Tupig'],
      },
      {
        name: 'Ligawasan',
        coords: [7.0200, 124.6300],
        barangays: ['Bagoinged', 'Barungis', 'Bulol', 'Bualan', 'Gli-Gli', 'Kulambog', 'Rajah Muda'],
      },
      {
        name: 'Malidegao',
        coords: [7.0800, 124.6800],
        barangays: ['Balungis', 'Batulawan', 'Fort Pikit', 'Gokotan', 'Nabundas', 'Nalapaan', 'Nunguan'],
      },
      {
        name: 'Nabalawag',
        coords: [7.0515, 124.5184],
        barangays: ['Damatulan', 'Kadigasan', 'Kadingilan', 'Kadingilan II', 'Nabalawag', 'Olandang', 'Macasendeg'],
      },
      {
        name: 'Old Kaabakan',
        coords: [7.1200, 124.8100],
        barangays: ['Buluan', 'Nangaan', 'Pedtad', 'Simbuhay', 'Sanggadong', 'Simone', 'Tamped'],
      },
      {
        name: 'Pahamuddin',
        coords: [7.2100, 124.7100],
        barangays: ['Ciringan', 'Kibenes', 'Kudungan', 'Libungan Torreta', 'Matilac', 'Patot', 'Pangankalan'],
      },
      {
        name: 'Tugunan',
        coords: [7.2500, 124.4500],
        barangays: ['Balacayon', 'Buricatan', 'Datu Binasing', 'Datu Mantil', 'Kadingilan', 'Matilac', 'Patot'],
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
        barangays: ['Banggolo Poblacion', 'Bacolod Chico', 'Boganga', 'Daguduban', 'Datu Saber', 'Gadongan', 'Lumbaca Madaya', 'Moncado Colony', 'Norhaya Village', 'Tolali', 'Raya Saduc', 'Toros', 'Basak Malutlut'],
      },
      {
        name: 'Piagapo',
        coords: [8.0667, 124.2167],
        barangays: ['Poblacion', 'Aposong', 'Bagoaingud', 'Gacap', 'Katumbacan', 'Lininding', 'Paling', 'Radapan', 'Taporug', 'Udalo'],
      },
      {
        name: 'Malabang',
        coords: [7.6000, 124.0667],
        barangays: ['Bacolod', 'Badak Lumao', 'Bagoaingud', 'Chinatown (Poblacion)', 'Curvada', 'Matling', 'Montaner', 'Pasir', 'Tubok', 'Jose Abad Santos'],
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
      {
        name: 'Marantao',
        coords: [7.9500, 124.2333],
        barangays: ['Poblacion', 'Bacong', 'Camalig', 'Cawayan', 'Daanaingud', 'Inudaran', 'Lumbac', 'Maabang', 'Mantapao', 'Poona Marantao'],
      },
      {
        name: 'Saguiaran',
        coords: [8.0333, 124.2333],
        barangays: ['Poblacion', 'Alinun', 'Bagoaingud', 'Bubong', 'Cadayonan', 'Lumbac', 'Malingon', 'Pantao', 'Pindolonan', 'Sunggod'],
      },
      {
        name: 'Wao',
        coords: [7.6333, 124.7167],
        barangays: ['Extension Poblacion', 'Balatin', 'Bangkudo', 'Ceboleda', 'Eastern Wao', 'Gata', 'Kabasalan', 'Katutungan', 'Manila', 'Park Area'],
      },
      {
        name: 'Ganassi',
        coords: [7.8333, 124.1000],
        barangays: ['Poblacion', 'Bagoaingud', 'Barorao', 'Campong a Ranao', 'Gadongan', 'Gui', 'Linuk', 'Lumbac', 'Macaguiling', 'Pantaon'],
      },
      {
        name: 'Tubaran',
        coords: [7.6833, 124.2333],
        barangays: ['Poblacion', 'Alog', 'Beta', 'Campo', 'Datumanong', 'Guiarong', 'Malaganding', 'Rignantang', 'Tangcal', 'Wago'],
      },
      {
        name: 'Kapatagan',
        coords: [7.4833, 124.1667],
        barangays: ['Poblacion', 'Bacolod', 'Bongabong', 'Daguan', 'Inudaran', 'Kabaniakawan', 'Lusain', 'Matimus', 'Minimao', 'Upper Dinganen'],
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
      {
        name: 'Al-Barka',
        coords: [6.5000, 122.1333],
        barangays: ['Apil-apil', 'Bato-bato', 'Bohe-Piang', 'Bucalo', 'Danan', 'Kailih', 'Kinukusan', 'Kuhon', 'Linuan', 'Macalang', 'Magcawa'],
      },
      {
        name: 'Ungkaya Pukan',
        coords: [6.5333, 122.0667],
        barangays: ['Amaloy', 'Bohe-Pahing', 'Bohe-Suyak', 'Cabangalan', 'Danit', 'Kamamburingan', 'Matata', 'Materling', 'Pipil', 'Sungkayut'],
      },
      {
        name: 'Tuburan',
        coords: [6.6333, 122.2500],
        barangays: ['Poblacion', 'Bohetambis', 'Datu Ramis', 'Lahi-lahi', 'Mahawid', 'Sinulatan', 'Tablas Usew'],
      },
      {
        name: 'Maluso',
        coords: [6.5500, 121.8833],
        barangays: ['Poblacion', 'Batungal', 'Calang Canas', 'Fuente Maluso', 'Guioni', 'Muslim Area', 'Port Holland', 'Tamuk', 'Tubigan'],
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
        barangays: ['Anuling', 'Bakong', 'Bongkaong', 'Buhanginan', 'Danag', 'Igasan', 'Kaunayan', 'Maligay', 'Pangdan', 'Taglibi', 'Tandu-Bagua', 'Timpook'],
      },
      {
        name: 'Indanan',
        coords: [6.0000, 120.9667],
        barangays: ['Poblacion', 'Bato-bato', 'Bunut', 'Kajatian', 'Licup', 'Mampallam', 'Pasil', 'Tagbak', 'Timbangan', 'Buansa'],
      },
      {
        name: 'Talipao',
        coords: [5.9667, 121.1167],
        barangays: ['Poblacion', 'Bilaan', 'Bud Bunga', 'Kabungcol', 'Luhuk', 'Mahanub', 'Pantao', 'Samak', 'Upper Talipao'],
      },
      {
        name: 'Maimbung',
        coords: [5.9333, 121.0333],
        barangays: ['Poblacion', 'Anak Jati', 'Bato Ugis', 'Kapuk Punggol', 'Kulasi', 'Lapa', 'Matatal', 'Ratag Limbon', 'Tubig Samin'],
      },
      {
        name: 'Old Panamao',
        coords: [5.9833, 121.1833],
        barangays: ['Poblacion', 'Asin', 'Bakung', 'Bangday', 'Baunoh', 'Bitanag', 'Lianan', 'Pugad Manaul', 'Seit Lake', 'Tubig Gantang'],
      },
      {
        name: 'Luuk',
        coords: [5.9667, 121.3167],
        barangays: ['Poblacion', 'Bual', 'Guimbangun', 'Kan-Bulak', 'Lambago', 'Maligay', 'Niog-niog', 'Tandu-Bato', 'Tubig-Puti'],
      },
      {
        name: 'Parang',
        coords: [5.9167, 120.9167],
        barangays: ['Poblacion', 'Alu-Alu', 'Bato-Bato', 'Biid', 'Bukid', 'Gimba Lagasan', 'Kaha', 'Kulik-Kulik', 'Lanao Dakula', 'Silangkan'],
      },
    ],
  },
  'Tawi-Tawi': {
    name: 'Tawi-Tawi',
    coords: [5.1667, 120.0000],
    municipalities: [
      {
        name: 'Bongao',
        coords: [5.0333, 119.7833],
        barangays: ['Poblacion', 'Lamion', 'Luuk Pandan', 'Mandulan', 'Montay-Montay', 'Pag-asa', 'Pagasinan', 'Simandagit', 'Tubig Basag', 'Tubig Tanah'],
      },
      {
        name: 'Panglima Sugala (Balimbing)',
        coords: [5.1333, 119.9000],
        barangays: ['Batu-batu (Poblacion)', 'Buan', 'Dungon', 'Luuk Buntal', 'Malum', 'Manta', 'Tanduh Bato', 'Tundon'],
      },
      {
        name: 'Simunul',
        coords: [4.9000, 119.8167],
        barangays: ['Bakong (Poblacion)', 'Doh-Tong', 'Luuk Datan', 'Manuk Mangkaw', 'Mongkay', 'Panglima Mastul', 'Tampakan', 'Tubig Indangan'],
      },
      {
        name: 'Sitangkai',
        coords: [4.6667, 119.3833],
        barangays: ['Poblacion', 'Datu Simbang', 'Tongmageng', 'Tongusong', 'Panglima Alari', 'Sipangkot'],
      },
      {
        name: 'Languyan',
        coords: [5.2667, 120.0833],
        barangays: ['Darussalam (Poblacion)', 'Bakong', 'Bas-bas', 'Languyan Proper', 'Maraning', 'Tuhog'],
      },
      {
        name: 'Sapa-Sapa',
        coords: [5.1500, 120.0500],
        barangays: ['Dalo-dalo (Poblacion)', 'Lookan', 'Mantabuan', 'Palate', 'Sapa-Sapa Proper', 'Tabunan'],
      },
      {
        name: 'South Ubian',
        coords: [5.1833, 120.5000],
        barangays: ['Bunay (Poblacion)', 'Babagan', 'Bohe', 'Dampalan', 'Laminusa', 'Tampakan'],
      },
      {
        name: 'Tandubas',
        coords: [5.1333, 120.3500],
        barangays: ['Sapa (Poblacion)', 'Ballak', 'Kako-ungun', 'Kalang-kalang', 'Lahay-lahay', 'Silantup', 'Tapian'],
      },
    ],
  },

  // =========================================================================
  // ── REGION XII (SOCCSKSARGEN) ────────────────────────────────────────────
  // =========================================================================
  'Cotabato (North Cotabato)': {
    name: 'Cotabato (North Cotabato)',
    coords: [7.1500, 124.9500],
    municipalities: [
      {
        name: 'Kidapawan City',
        coords: [7.0083, 125.0894],
        barangays: ['Poblacion', 'Amas', 'Balindog', 'Ginatilan', 'Ilomavis', 'Kalaisan', 'Lanao', 'Manongol', 'Nuangan', 'Perez', 'Singao', 'Sudapin', 'Meohao', 'Paco'],
      },
      {
        name: 'Midsayap',
        coords: [7.1917, 124.5306],
        barangays: ['Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Poblacion 4', 'Poblacion 5', 'Poblacion 6', 'Poblacion 7', 'Poblacion 8', 'Agriculture', 'Anonang', 'Bual Norte', 'Central Bulanan', 'Central Glad', 'Ilagan', 'Kapinpilan', 'Malingao', 'Patindeguen', 'Sambulawan', 'Villarica'],
      },
      {
        name: 'Pikit',
        coords: [7.0500, 124.6667],
        barangays: ['Poblacion', 'Bagoinged', 'Balakakan', 'Balatican', 'Batulawan', 'Dapulog', 'Fort Pikit', 'Gligli', 'Inug-ug', 'Kolambog', 'Macabual', 'Rajah Muda', 'Silik', 'Takepan'],
      },
      {
        name: 'Aleosan',
        coords: [7.1833, 124.6167],
        barangays: ['Dualing (Poblacion)', 'Bagolibas', 'Cawilihan', 'Dunguan', 'Katalicanan', 'Lawili', 'Pagangan', 'Palacat', 'Pentil', 'San Mateo', 'Tapodoc'],
      },
      {
        name: 'Carmen',
        coords: [7.2000, 124.7833],
        barangays: ['Poblacion', 'Aroman', 'Bentangan', 'General Luna', 'Kibayao', 'Kimadzil', 'Malapag', 'Nasapian', 'Palili', 'Ugalingan', 'Ranzo', 'Tupig'],
      },
      {
        name: 'Kabacan',
        coords: [7.1167, 124.8333],
        barangays: ['Poblacion', 'Aringay', 'Bannawag', 'Cuyapon', 'Katidtuan', 'Kayaga', 'Kilagasan', 'Malamote', 'Malanduague', 'Pedtad', 'Simbuhay', 'Osias'],
      },
      {
        name: 'Pigcawayan',
        coords: [7.2833, 124.4333],
        barangays: ['Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Anick', 'Bulucaon', 'Buricatan', 'Capayuran', 'Datu Mantil', 'Libungan Torreta', 'Malagakit', 'North Manarapan', 'Patot', 'Tubon'],
      },
      {
        name: 'Libungan',
        coords: [7.2333, 124.5167],
        barangays: ['Poblacion', 'Batiocan', 'Demapaco', 'Grebona', 'Gumaga', 'Kapayawi', 'Kilavarn', 'Montay', 'Sinawingan', 'Ulamian'],
      },
      {
        name: 'Alamada',
        coords: [7.5500, 124.5500],
        barangays: ['Kitacubong (Poblacion)', 'Bao', 'Dado', 'Guiling', 'Macabasa', 'Malitubog', 'Mapurok', 'Mirab', 'Polayagan', 'Rangayen'],
      },
      {
        name: 'Banisilan',
        coords: [7.6333, 124.6000],
        barangays: ['Poblacion I', 'Poblacion II', 'Bano', 'Gastav', 'Kalawaig', 'Malinao', 'Paradise', 'Pinamulaan', 'Thailand', 'Wadya'],
      },
      {
        name: 'Tulunan',
        coords: [6.7833, 124.9167],
        barangays: ['Poblacion', 'Banayal', 'Batasan', 'Bual', 'Dungos', 'Kanibong', 'La Esperanza', 'Maybula', 'Minapan', 'New Caridad', 'Popoyon', 'Tuburan'],
      },
      {
        name: 'Antipas',
        coords: [7.2500, 125.0500],
        barangays: ['Poblacion', 'Bato', 'Camutan', 'Canaan', 'Dolores', 'Kiyaab', 'Luhong', 'Magsaysay', 'Malangag', 'New Pontevedra'],
      },
      {
        name: 'Arakan',
        coords: [7.3500, 125.1833],
        barangays: ['Poblacion', 'Badiangon', 'Datu Ladayon', 'Doroluman', 'Greenfield', 'Kabalantian', 'Kinawayan', 'Kulaman', 'Liliongan', 'Santo Niño'],
      },
      {
        name: 'President Roxas',
        coords: [7.1500, 125.0500],
        barangays: ['Poblacion', 'Alegria', 'Cabangbangan', 'Camasi', 'Greenhill', 'Kahayag', 'Kamasi', 'Labu-o', 'Tuael'],
      },
      {
        name: 'Magpet',
        coords: [7.1167, 125.1167],
        barangays: ['Poblacion', 'Alimodian', 'Bongolanon', 'Datu Celo', 'Kamada', 'Kisandal', 'Magbok', 'Mahongcog', 'Pangao-an', 'Tagbac'],
      },
      {
        name: 'Makilala',
        coords: [6.9500, 125.0833],
        barangays: ['Poblacion', 'Batasan', 'Bato', 'Biangan', 'Buenavida', 'Gubat', 'Kisante', 'Malabuan', 'New Bulatukan', 'Saguing'],
      },
      {
        name: 'M\'lang',
        coords: [6.9333, 124.8833],
        barangays: ['Poblacion A', 'Poblacion B', 'Bagontapay', 'Bialong', 'Buayan', 'Dugong', 'Katipunan', 'La Fortuna', 'Lepaga', 'New Antique', 'Tibal-og'],
      },
      {
        name: 'Matalam',
        coords: [7.0833, 124.9000],
        barangays: ['Poblacion', 'Dalapitan', 'Ilian', 'Kabulacan', 'Kilada', 'Lampayan', 'Marbel', 'Natutungan', 'Pangao-an', 'Taguranao'],
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
        barangays: ['Kalawag I (Poblacion)', 'Kalawag II', 'Kalawag III', 'Bambad', 'Dansuli', 'Impao', 'Kenram', 'Kudanding', 'Lagandang', 'Sampao', 'Tayugo', 'Mapantig'],
      },
      {
        name: 'Tacurong City',
        coords: [6.6833, 124.6833],
        barangays: ['Poblacion', 'Baras', 'Buenaflor', 'Calean', 'Griquialo', 'Kalandagan', 'New Isabela', 'New Lagao', 'Rajah Muda', 'San Antonio', 'San Emmanuel', 'San Pablo'],
      },
      {
        name: 'Esperanza',
        coords: [6.7000, 124.5167],
        barangays: ['Poblacion', 'Ala', 'Daligan', 'Dukay', 'Guimbal', 'Magsaysay', 'New Panay', 'Pamantingan', 'Salabaca', 'Saliao', 'Villamor'],
      },
      {
        name: 'Lebak',
        coords: [6.6167, 124.0500],
        barangays: ['Poblacion I', 'Poblacion II', 'Poblacion III', 'Basak', 'Bolebak', 'Datu Karon', 'Kalamongog', 'Nalamag', 'Purikay', 'Ragandang', 'Tibpuan', 'Salangsang', 'Taguisa'],
      },
      {
        name: 'Kalamansig',
        coords: [6.5667, 124.0500],
        barangays: ['Poblacion', 'Cadiz', 'Datu Celso', 'Dumangas Nuevo', 'Hinalaan', 'Limulan', 'Nalilidan', 'Paril', 'Sabanal', 'Sangay', 'Santa Clara'],
      },
      {
        name: 'Palimbang',
        coords: [6.2167, 124.2000],
        barangays: ['Poblacion', 'Badiangon', 'Baliango', 'Barongis', 'Kiponget', 'Kolong-Kolong', 'Kraan', 'Maganao', 'Malisbong', 'Medal', 'Milbuk', 'Wal', 'Tibulod'],
      },
      {
        name: 'Bagumbayan',
        coords: [6.5333, 124.5500],
        barangays: ['Poblacion', 'Bai Saripinang', 'Biwang', 'Chua', 'Daguma', 'Kapingkong', 'Kinayao', 'Masiag', 'Monteverde', 'Santo Niño', 'Tisa'],
      },
      {
        name: 'Columbio',
        coords: [6.7000, 124.9000],
        barangays: ['Poblacion', 'Bantunan', 'Datu Policarpo', 'Elbebe', 'Lasak', 'Makililala', 'Maligaya', 'Mayo', 'Natividad', 'Sinapulan', 'Telafas'],
      },
      {
        name: 'Lutayan',
        coords: [6.6167, 124.8500],
        barangays: ['Tamnag (Poblacion)', 'Antong', 'Bayan', 'Blenas', 'Mamali', 'Manili', 'Palavilla', 'Sampao', 'Sisiman', 'Tananzang'],
      },
      {
        name: 'President Quirino',
        coords: [6.7167, 124.7167],
        barangays: ['Poblacion', 'Bagumbayan', 'Bayawa', 'Camanan', 'Katiko', 'Mabini', 'Pedukisan', 'Romualdez', 'San Jose', 'Suben'],
      },
      {
        name: 'Senator Ninoy Aquino (Kulaman)',
        coords: [6.4667, 124.3167],
        barangays: ['Poblacion (Kulaman)', 'Banali', 'Basag', 'Buenaflores', 'Bugso', 'Kadi', 'Kapatagan', 'Kiadsam', 'Kuden', 'Maliit Biwang', 'Tinalon'],
      },
      {
        name: 'Lambayong (Mariano Marcos)',
        coords: [6.8333, 124.6333],
        barangays: ['Poblacion (Lambayong)', 'Kapingkong', 'Madanding', 'Mamali', 'Matiompong', 'Pimbalayan', 'Pinguiaman', 'Sadsalan', 'Tinumigues'],
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
        barangays: ['General Paulino Santos (Poblacion)', 'Zone I', 'Zone II', 'Zone III', 'Zone IV', 'Assumption', 'Avanceña', 'Carpenter Hill', 'Esperanza', 'Mabini', 'San Isidro', 'Saravia', 'Zulueta', 'Concepcion', 'Paraiso'],
      },
      {
        name: 'Polomolok',
        coords: [6.2167, 125.0667],
        barangays: ['Poblacion', 'Cannery Site', 'Crossing Pangi', 'Glamang', 'Klinan 6', 'Lumakil', 'Maligo', 'Pagalungan', 'Rubber', 'Silway 8', 'Upper Klinan', 'Sulit'],
      },
      {
        name: 'Surallah',
        coords: [6.3833, 124.7333],
        barangays: ['Colonia (Poblacion)', 'Buenavista', 'Canahay', 'Centrala', 'Dajay', 'Lambontong', 'Libertad', 'Moloy', 'Tubiala', 'Upper Sepaka', 'Veterans'],
      },
      {
        name: 'Tupi',
        coords: [6.3333, 124.9500],
        barangays: ['Poblacion', 'Acmonan', 'Bololmala', 'Bunao', 'Crossing Rubber', 'Linan', 'Lunen', 'Palian', 'Pula Bato', 'Simbo', 'Tubokar'],
      },
      {
        name: 'Banga',
        coords: [6.4333, 124.7833],
        barangays: ['Benitez (Poblacion)', 'Cabudian', 'El Nonok', 'Kusan', 'Lambingi', 'Lanton', 'Malaya', 'Punong Grande', 'Rizal', 'San Vicente', 'Yangco'],
      },
      {
        name: 'Lake Sebu',
        coords: [6.2167, 124.7000],
        barangays: ['Poblacion', 'Bacdulong', 'Denlag', 'Halilan', 'Hanoon', 'Klutum', 'Lam Dalag', 'Lam Lahak', 'Luhib', 'Ned', 'Seven Falls', 'Tasiman'],
      },
      {
        name: 'Norala',
        coords: [6.5167, 124.6833],
        barangays: ['Poblacion', 'Dumaguil', 'Esperanza', 'Kibang', 'Lapuz', 'Liberty', 'Lopez Jaena', 'Matapol', 'San Jose', 'Simsiman', 'Tinago'],
      },
      {
        name: 'Santo Niño',
        coords: [6.4333, 124.6667],
        barangays: ['Poblacion', 'Ambalgan', 'Guinsang-an', 'Katipunan', 'Manuel Roxas', 'Panay', 'San Isidro', 'San Vicente', 'Teresita'],
      },
      {
        name: 'Tampakan',
        coords: [6.4500, 124.9333],
        barangays: ['Poblacion', 'Albagan', 'Danlag', 'Kaltuad', 'Lambayong', 'Liberty', 'Maltana', 'Palo', 'Pula Bato', 'San Isidro', 'Tablu'],
      },
      {
        name: 'Tantangan',
        coords: [6.5667, 124.7667],
        barangays: ['Poblacion', 'Bukay Pait', 'Cabuling', 'Dumadalig', 'Libas', 'Magon', 'Maibo', 'New Iloilo', 'New Lambunao', 'San Felipe', 'Tinongcop'],
      },
      {
        name: 'T\'boli',
        coords: [6.2833, 124.8167],
        barangays: ['Poblacion', 'Aflek', 'Basag', 'Datu Sembing', 'Edwards', 'Kematu', 'Lamsalome', 'New Dumangas', 'Salacafe', 'Sinolon', 'Tudok'],
      },
    ],
  },
  'General Santos City': {
    name: 'General Santos City',
    coords: [6.1164, 125.1716],
    municipalities: [
      {
        name: 'General Santos City (Direct)',
        coords: [6.1164, 125.1716],
        barangays: [
          'Dadiangas East', 'Dadiangas North', 'Dadiangas South', 'Dadiangas West',
          'Bula', 'Calumpang', 'Fatima', 'Lagao', 'San Isidro', 'Labangal',
          'Sinawal', 'Tambler', 'Mabuhay', 'City Heights', 'Apopong', 'Katangawan',
          'San Jose', 'Tinagacan', 'Batomelong', 'Bawing', 'Buayan', 'Conel', 'Ligaya', 'Olympog', 'Upper Labay',
        ],
      },
    ],
  },
  'Sarangani': {
    name: 'Sarangani',
    coords: [5.8833, 125.0833],
    municipalities: [
      {
        name: 'Alabel',
        coords: [6.1000, 125.2833],
        barangays: ['Poblacion', 'Alegria', 'Bagacay', 'Baluntay', 'Datal Anggas', 'Domolok', 'Kawas', 'Maribulan', 'Pag-asa', 'Paraiso', 'Spring', 'Tokawal'],
      },
      {
        name: 'Glan',
        coords: [5.8167, 125.2000],
        barangays: ['Poblacion', 'Baliton', 'Burias', 'Cablalan', 'Calabanit', 'Cross', 'Gumasa', 'Kapatan', 'Lago', 'Pangyan', 'San Jose', 'Taluya'],
      },
      {
        name: 'Kiamba',
        coords: [6.0000, 124.6333],
        barangays: ['Poblacion', 'Badtasan', 'Datu Dani', 'Gasi', 'Kapate', 'Katubao', 'Kling', 'Laguimit', 'Luma', 'Nalus', 'Salakit', 'Tambilil'],
      },
      {
        name: 'Maasim',
        coords: [5.8500, 125.0000],
        barangays: ['Poblacion', 'Amsipit', 'Bato', 'Colon', 'Daliao', 'Kamanga', 'Kanalo', 'Lumasal', 'Malbang', 'Pananag', 'Seven Hills', 'Tinoto'],
      },
      {
        name: 'Maitum',
        coords: [6.0333, 124.5000],
        barangays: ['Mambing (Poblacion)', 'Balisong', 'Kalaong', 'Kiambing', 'Kalaneg', 'Linao', 'Malalag', 'Old Poblacion', 'Pangi', 'Pinol', 'Ticulab', 'Upo'],
      },
      {
        name: 'Malapatan',
        coords: [5.9667, 125.2833],
        barangays: ['Poblacion', 'Daan Suyan', 'Kihan', 'Kinam', 'Libi', 'Lun Masila', 'Lun Padidu', 'Patag', 'Sapu Masla', 'Sapu Padidu', 'Tuyon'],
      },
      {
        name: 'Malungon',
        coords: [6.2667, 125.2667],
        barangays: ['Poblacion', 'Alkikan', 'Ampon', 'Banahaw', 'Banate', 'Datal Batong', 'Kiblat', 'Kinabalan', 'Malabod', 'Nagpan', 'San Juan', 'Talaca'],
      },
    ],
  },

  // =========================================================================
  // ── REGION IX & X (ZAMBOANGA & NORTHERN MINDANAO) ────────────────────────
  // =========================================================================
  'Zamboanga City': {
    name: 'Zamboanga City',
    coords: [6.9214, 122.0790],
    municipalities: [
      {
        name: 'Zamboanga City (Direct)',
        coords: [6.9214, 122.0790],
        barangays: [
          'Zone I (Poblacion)', 'Zone II', 'Zone III', 'Zone IV', 'Baliwasan',
          'Canelar', 'Guiwan', 'Pasonanca', 'San Roque', 'Santa Maria', 'Tetuan',
          'Tumaga', 'Vitali', 'Ayala', 'Cawit', 'Labuan', 'Mercedes', 'Putik', 'Talon-Talon',
          'Curuan', 'Divisoria', 'Manicahan', 'Sta. Barbara', 'Sinunuc', 'Recodo',
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
        barangays: ['San Pedro (Poblacion)', 'Balangasan', 'Balintawak', 'Danlugan', 'Gatas', 'Kawit', 'Lumbia', 'San Jose', 'Santa Lucia', 'Tiguma', 'Tuburan', 'Bulatukan', 'Dumalinao'],
      },
      {
        name: 'Dumalinao',
        coords: [7.8167, 123.3667],
        barangays: ['Pag-asa (Poblacion)', 'Anonang', 'Bag-ong Silao', 'Bibilik', 'Camalig', 'Kabuukan', 'Malasugue', 'Metokong', 'Pantad', 'Sumadat'],
      },
      {
        name: 'Aurora',
        coords: [7.9500, 123.5833],
        barangays: ['Poblacion', 'Balide', 'Cahayagan', 'Inasagan', 'Kauswagan', 'Lintugop', 'Mansababer', 'San Jose', 'Sapa Loboc'],
      },
      {
        name: 'Molave',
        coords: [8.0833, 123.4833],
        barangays: ['Mabuhay (Poblacion)', 'Blancia', 'Dipolo', 'Maliliping', 'Miligan', 'Rizal', 'Silangit', 'Sudlon'],
      },
      {
        name: 'Guipos',
        coords: [7.7167, 123.3167],
        barangays: ['Poblacion', 'Bagong Oroquieta', 'Canunan', 'Dacsol', 'Guling', 'Katipunan', 'Regla', 'San Miguel'],
      },
      {
        name: 'San Miguel',
        coords: [7.6500, 123.2667],
        barangays: ['Poblacion', 'Betinan', 'Bulawan', 'Calube', 'Dumalian', 'Lourdes', 'San Isidro'],
      },
    ],
  },
  'Zamboanga Sibugay': {
    name: 'Zamboanga Sibugay',
    coords: [7.7500, 122.7500],
    municipalities: [
      {
        name: 'Ipil',
        coords: [7.7833, 122.5833],
        barangays: ['Poblacion', 'Bacalan', 'Buluan', 'Don Andres', 'Labasan', 'Lumbia', 'Sanito', 'Taway', 'Tiayon'],
      },
      {
        name: 'Kabasalan',
        coords: [7.8000, 122.7667],
        barangays: ['Poblacion', 'Banker', 'Canayan', 'Diampak', 'Lumbayao', 'Nazareth', 'Salipyasin', 'Sayao'],
      },
      {
        name: 'Titay',
        coords: [7.9667, 122.5333],
        barangays: ['Poblacion', 'Dalangin', 'Galis', 'Kipit', 'Mabini', 'Malagandis', 'Namnama', 'Palomoc'],
      },
      {
        name: 'Tungawan',
        coords: [7.5167, 122.4000],
        barangays: ['Poblacion', 'Batu', 'Datu Tumanggong', 'Langon', 'Loboc', 'San Isidro', 'San Pedro', 'Taglibas'],
      },
      {
        name: 'Buug',
        coords: [7.7333, 123.0667],
        barangays: ['Poblacion', 'Basa', 'Datu Panas', 'Guintoloan', 'Mabuhay', 'Maganay', 'Taliran'],
      },
      {
        name: 'Diplahan',
        coords: [7.6833, 122.9833],
        barangays: ['Poblacion', 'Balangao', 'Ditulan', 'Guinoman', 'Kauswagan', 'Lindang', 'Sampoli'],
      },
    ],
  },
  'Zamboanga del Norte': {
    name: 'Zamboanga del Norte',
    coords: [8.5000, 123.3333],
    municipalities: [
      {
        name: 'Dipolog City',
        coords: [8.5833, 123.3333],
        barangays: ['Central (Poblacion)', 'Barra', 'Biasong', 'Estaka', 'Galas', 'Gulayon', 'Miputak', 'Olingan', 'Santa Filomena', 'Turno'],
      },
      {
        name: 'Dapitan City',
        coords: [8.6500, 123.4167],
        barangays: ['Poblacion', 'Bagting', 'Banonong', 'Dawo', 'Linabo', 'Potungan', 'San Pedro', 'Tag-ulo'],
      },
      {
        name: 'Sindangan',
        coords: [8.2333, 123.0000],
        barangays: ['Poblacion', 'Bantayan', 'Calatunan', 'Disakan', 'Guba', 'La Concepcion', 'Mandih', 'Ramon Magsaysay'],
      },
      {
        name: 'Siocon',
        coords: [7.7000, 122.1333],
        barangays: ['Poblacion', 'Balagonan', 'Datu Saipudin', 'Latabon', 'Matiag', 'Panabutan', 'Pisawak', 'Suhaile Arabi'],
      },
      {
        name: 'Sirawai',
        coords: [7.5833, 122.1500],
        barangays: ['Poblacion', 'Balubohan', 'Culasian', 'Danganon', 'Gubamon', 'Piacan', 'San Nicolas', 'Sipayan'],
      },
      {
        name: 'Sibuco',
        coords: [7.3000, 122.0667],
        barangays: ['Poblacion', 'Anongan', 'Culambog', 'Lunday', 'Malayal', 'Nalinan', 'Panganuran', 'Tangarak'],
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
        barangays: ['Poblacion', 'Dalipuga', 'Ditucalan', 'Hinaplanon', 'Kiwalan', 'Mahayahay', 'Pala-o', 'San Miguel', 'Suarez', 'Tambacan', 'Tibanga', 'Tubod', 'Saray', 'Ubaldo Laya'],
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
      {
        name: 'Kapatagan',
        coords: [7.9000, 123.7667],
        barangays: ['Poblacion', 'Bagusan', 'Bel-is', 'Catmon', 'Lapinig', 'Maranding', 'San Vicente', 'Suson', 'Waterfalls'],
      },
      {
        name: 'Baloi',
        coords: [8.1167, 124.2000],
        barangays: ['Poblacion', 'Abaga', 'Angungan', 'Bangko', 'Matampay', 'Nangka', 'Sapad', 'Sigayan'],
      },
    ],
  },
  'Bukidnon': {
    name: 'Bukidnon',
    coords: [8.1500, 125.1333],
    municipalities: [
      {
        name: 'Malaybalay City',
        coords: [8.1575, 125.1278],
        barangays: ['Poblacion', 'Aglayan', 'Bancud', 'Canayan', 'Casisang', 'Kalasungay', 'Laguitas', 'San Jose', 'Sumpong'],
      },
      {
        name: 'Valencia City',
        coords: [7.9064, 125.0939],
        barangays: ['Poblacion', 'Bagontaas', 'Batangan', 'Catualan', 'Guinoyoran', 'Laligan', 'Lumbo', 'Mailag', 'San Carlos', 'Sugod'],
      },
      {
        name: 'Maramag',
        coords: [7.7500, 125.0000],
        barangays: ['Base Camp', 'Camp 1', 'Colambugon', 'Dagumba-an', 'Dologon', 'Kiharong', 'Kuya', 'North Poblacion', 'South Poblacion'],
      },
      {
        name: 'Manolo Fortich',
        coords: [8.3667, 124.8667],
        barangays: ['Tankulan (Poblacion)', 'Agusan Canyon', 'Alae', 'Dahilayan', 'Damilag', 'Dicklum', 'Guilang-guilang', 'Lunocan', 'Sankanan'],
      },
      {
        name: 'Quezon',
        coords: [7.7333, 125.1000],
        barangays: ['Poblacion', 'Butong', 'Dumalama', 'Kibaruda', 'Linabo', 'Lipacar', 'Merangeran', 'San Jose', 'Santa Cruz'],
      },
    ],
  },
  'Misamis Oriental': {
    name: 'Misamis Oriental',
    coords: [8.5000, 124.7500],
    municipalities: [
      {
        name: 'Cagayan de Oro City',
        coords: [8.4814, 124.6464],
        barangays: ['Poblacion (Barangay 1-40)', 'Balulang', 'Bugo', 'Bulua', 'Camaman-an', 'Carmen', 'Gusa', 'Iponan', 'Kauswagan', 'Lapasan', 'Macabalan', 'Macasandig', 'Nazareth', 'Puerto', 'Puntod', 'Tablon'],
      },
      {
        name: 'Gingoog City',
        coords: [8.8250, 125.1000],
        barangays: ['Poblacion', 'Agusan', 'Baga-o', 'Daan-Lungsod', 'Lunao', 'Odiongan', 'San Juan', 'Santiago'],
      },
      {
        name: 'El Salvador City',
        coords: [8.5667, 124.5167],
        barangays: ['Poblacion', 'Bolisong', 'Cogon', 'Hinigdaan', 'Molugan', 'Sambulawan', 'Sinaloc'],
      },
      {
        name: 'Tagoloan',
        coords: [8.5333, 124.7500],
        barangays: ['Poblacion', 'Baluarte', 'Casinglot', 'Natumolan', 'Santa Ana', 'Santa Cruz', 'Sugbongcogon'],
      },
      {
        name: 'Opol',
        coords: [8.5167, 124.5667],
        barangays: ['Poblacion', 'Barra', 'Bonbon', 'Igpit', 'Luyong Bonbon', 'Malanang', 'Patag'],
      },
    ],
  },
  'Misamis Occidental': {
    name: 'Misamis Occidental',
    coords: [8.3333, 123.7500],
    municipalities: [
      {
        name: 'Ozamiz City',
        coords: [8.1469, 123.8419],
        barangays: ['Aguada (Poblacion)', 'Bacolod', 'Bagakay', 'Carmen Annex', 'Catadman', 'Gango', 'Lam-an', 'San Roque', 'Triunfo'],
      },
      {
        name: 'Oroquieta City',
        coords: [8.4833, 123.8000],
        barangays: ['Poblacion I', 'Poblacion II', 'Canubay', 'Lamac', 'Lower Langcangan', 'Mobod', 'Talairon', 'Villaflor'],
      },
      {
        name: 'Tangub City',
        coords: [8.0667, 123.7500],
        barangays: ['Poblacion', 'Aquino', 'Balatacan', 'Garang', 'Kauswagan', 'Maloro', 'Silanga'],
      },
    ],
  },
  'Camiguin': {
    name: 'Camiguin',
    coords: [9.1667, 124.7167],
    municipalities: [
      {
        name: 'Mambajao',
        coords: [9.2500, 124.7167],
        barangays: ['Poblacion', 'Agoho', 'Balbagon', 'Baylao', 'Benhaan', 'Bug-ong', 'Kuguita', 'Pandan', 'Yumbing'],
      },
      {
        name: 'Catarman',
        coords: [9.1833, 124.6333],
        barangays: ['Poblacion', 'Bonbon', 'Bura', 'Catibac', 'Compol', 'Lawigan', 'Mainit', 'Mandawa'],
      },
    ],
  },

  // =========================================================================
  // ── REGION XI (DAVAO REGION) ─────────────────────────────────────────────
  // =========================================================================
  'Davao City': {
    name: 'Davao City',
    coords: [7.1907, 125.4553],
    municipalities: [
      {
        name: 'Davao City (Direct)',
        coords: [7.1907, 125.4553],
        barangays: [
          'Poblacion (Districts 1-4)', 'Agdao', 'Buhangin', 'Bunawan', 'Calinan',
          'Marilog', 'Paquibato', 'Talomo', 'Toril', 'Tugbok', 'Matina Crossing',
          'Maa', 'Sasa', 'Tibungco', 'Panacan', 'Bago Oshiro',
        ],
      },
    ],
  },
  'Davao del Sur': {
    name: 'Davao del Sur',
    coords: [6.7500, 125.3500],
    municipalities: [
      {
        name: 'Digos City',
        coords: [6.7500, 125.3500],
        barangays: ['Zone 1 (Poblacion)', 'Zone 2', 'Zone 3', 'Aplaya', 'Balabag', 'Cogon', 'Colorado', 'Matti', 'Ruparan', 'San Jose', 'Tres de Mayo'],
      },
      {
        name: 'Bansalan',
        coords: [6.7833, 125.2167],
        barangays: ['Poblacion', 'Bitaug', 'Dolo', 'Kinuskusan', 'Libertad', 'Managa', 'Marber', 'New Clarin', 'Tubod'],
      },
      {
        name: 'Santa Cruz',
        coords: [6.8333, 125.4167],
        barangays: ['Poblacion', 'Astorga', 'Bato', 'Coronon', 'Darong', 'Inawayan', 'Saliducon', 'Sibulan', 'Tagabuli', 'Tuban'],
      },
      {
        name: 'Hagonoy',
        coords: [6.6833, 125.3500],
        barangays: ['Poblacion', 'Aplaya', 'Balutakay', 'Guihing Plan', 'Kibuaya', 'La Union', 'Malabang', 'Sinayawan'],
      },
      {
        name: 'Matanao',
        coords: [6.6833, 125.1833],
        barangays: ['Poblacion', 'Asbang', 'Colonsabak', 'Dongan Pekong', 'Kabasalan', 'La Suerte', 'Mancocao', 'San Vicente'],
      },
    ],
  },
  'Davao del Norte': {
    name: 'Davao del Norte',
    coords: [7.4500, 125.7000],
    municipalities: [
      {
        name: 'Tagum City',
        coords: [7.4478, 125.8078],
        barangays: ['Magugpo Poblacion', 'Apokon', 'Canocotan', 'La Filipina', 'Madaum', 'Mankilam', 'San Miguel', 'Visayan Village'],
      },
      {
        name: 'Panabo City',
        coords: [7.3000, 125.6833],
        barangays: ['San Vicente (Poblacion)', 'Cacao', 'Gredu', 'Little Panay', 'New Pandan', 'Salvacion', 'Southern Davao'],
      },
      {
        name: 'Island Garden City of Samal',
        coords: [7.0833, 125.7167],
        barangays: ['Peñaplata (Poblacion)', 'Babak', 'Caliclic', 'Kaputian', 'Limao', 'Moncado', 'Tagbitan-ag', 'Toril'],
      },
      {
        name: 'Carmen',
        coords: [7.3667, 125.7167],
        barangays: ['Poblacion', 'Alejal', 'Asuncion', 'Mabaus', 'Magsaysay', 'Salvacion', 'Santo Niño', 'Tuganay'],
      },
    ],
  },
  'Davao Oriental': {
    name: 'Davao Oriental',
    coords: [7.1000, 126.3333],
    municipalities: [
      {
        name: 'Mati City',
        coords: [6.9500, 126.2167],
        barangays: ['Central (Poblacion)', 'Badas', 'Dahican', 'Dawan', 'Langka', 'Matiao', 'Mayo', 'Sainz', 'Tamisan'],
      },
      {
        name: 'Lupon',
        coords: [6.9000, 126.0167],
        barangays: ['Poblacion', 'Bagumbayan', 'Cabadiangan', 'Corporacion', 'Ilangay', 'Langka', 'Marayag', 'Tagugpo'],
      },
      {
        name: 'Baganga',
        coords: [7.5833, 126.5667],
        barangays: ['Poblacion', 'Baculin', 'Batawan', 'Bobonao', 'Campawan', 'Kinablangan', 'Lucod', 'Mahan-ub', 'Salingcomot'],
      },
    ],
  },
  'Davao de Oro (Compostela Valley)': {
    name: 'Davao de Oro (Compostela Valley)',
    coords: [7.6000, 125.9667],
    municipalities: [
      {
        name: 'Nabunturan',
        coords: [7.6000, 125.9667],
        barangays: ['Poblacion', 'Anislagan', 'Basak', 'Cabidianan', 'Katipunan', 'Mainit', 'Manat', 'Magsaysay', 'San Roque'],
      },
      {
        name: 'Monkayo',
        coords: [7.8500, 126.0500],
        barangays: ['Poblacion', 'Baylo', 'Casoon', 'Inambatan', 'Mount Diwata (Diwalwal)', 'Olaycon', 'Pasian', 'Tubud', 'Union'],
      },
      {
        name: 'Compostela',
        coords: [7.6667, 126.0833],
        barangays: ['Poblacion', 'Bagongon', 'Gabi', 'Lagab', 'Maparat', 'Ngan', 'Panansalan', 'San Jose', 'Tamia'],
      },
      {
        name: 'Pantukan',
        coords: [7.1167, 125.8833],
        barangays: ['Kingking (Poblacion)', 'Bongabong', 'Fuentes', 'Kingking', 'Magnaga', 'Matiao', 'Napnapan', 'Tagdangua', 'Tambongon'],
      },
    ],
  },
  'Davao Occidental': {
    name: 'Davao Occidental',
    coords: [6.0000, 125.6000],
    municipalities: [
      {
        name: 'Malita',
        coords: [6.4167, 125.6167],
        barangays: ['Poblacion', 'Bolo', 'Culaman', 'Fishing Village', 'Kinangan', 'Lacaron', 'Mana', 'Pangaleon', 'Tubu-tubu'],
      },
      {
        name: 'Santa Maria',
        coords: [6.5500, 125.4667],
        barangays: ['Poblacion', 'Basiawan', 'Buca', 'Cadaatan', 'Mamacao', 'Ogbon', 'San Agustin', 'San Pedro'],
      },
      {
        name: 'Jose Abad Santos (Trinidad)',
        coords: [5.8000, 125.5333],
        barangays: ['Caburan Poblacion', 'Balangonan', 'Bukid', 'Culaman', 'Kalbay', 'Mangile', 'Nuing', 'Sugal'],
      },
    ],
  },

  // =========================================================================
  // ── REGION XIII (CARAGA) ─────────────────────────────────────────────────
  // =========================================================================
  'Agusan del Norte': {
    name: 'Agusan del Norte',
    coords: [9.0000, 125.5000],
    municipalities: [
      {
        name: 'Butuan City',
        coords: [8.9492, 125.5436],
        barangays: ['Poblacion', 'Ampayon', 'Baan', 'Doongan', 'Golden Ribbon', 'Libertad', 'Ong Yiu', 'San Vicente', 'Villa Kananga'],
      },
      {
        name: 'Cabadbaran City',
        coords: [9.1231, 125.5342],
        barangays: ['Poblacion 1-12', 'Bayabas', 'Caasinan', 'Calamba', 'Katugasan', 'Mabini', 'Tolosa'],
      },
      {
        name: 'Nasipit',
        coords: [8.9833, 125.3333],
        barangays: ['Poblacion', 'Aclan', 'Amontay', 'Camagong', 'Kinamuzan', 'Punta', 'Triangulo'],
      },
    ],
  },
  'Agusan del Sur': {
    name: 'Agusan del Sur',
    coords: [8.5000, 125.7500],
    municipalities: [
      {
        name: 'Prosperidad',
        coords: [8.5833, 125.9167],
        barangays: ['Poblacion', 'Awa', 'La Caridad', 'Los Arcos', 'Lucena', 'Mabuhay', 'Patin-ay', 'Salimbogaon', 'San Joaquin'],
      },
      {
        name: 'Bayugan City',
        coords: [8.7167, 125.7500],
        barangays: ['Poblacion', 'Fili', 'Gamao', 'Maygatasan', 'Noli', 'Sagmone', 'San Juan', 'Taglatawan'],
      },
      {
        name: 'San Francisco',
        coords: [8.5000, 125.9833],
        barangays: ['Barangay 1 (Poblacion)', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Bahi', 'Hubang', 'Karaos', 'Rizal'],
      },
    ],
  },
  'Surigao del Norte': {
    name: 'Surigao del Norte',
    coords: [9.7833, 125.5000],
    municipalities: [
      {
        name: 'Surigao City',
        coords: [9.7833, 125.5000],
        barangays: ['Washington (Poblacion)', 'Taft', 'Canlanipa', 'Cagdianao', 'Ipil', 'Lipata', 'Luna', 'Rizal', 'San Juan'],
      },
      {
        name: 'General Luna (Siargao)',
        coords: [9.7833, 126.1500],
        barangays: ['Poblacion 1-5', 'Catangnan (Cloud 9)', 'Consuelo', 'Corazon', 'Daku', 'Malinao', 'Santa Fe'],
      },
      {
        name: 'Dapa (Siargao)',
        coords: [9.7500, 126.0500],
        barangays: ['Poblacion 1-13', 'Cambas-ac', 'Don Paulino', 'Montserrat', 'Osmeña', 'San Carlos', 'Union'],
      },
    ],
  },
  'Surigao del Sur': {
    name: 'Surigao del Sur',
    coords: [8.7500, 126.0000],
    municipalities: [
      {
        name: 'Tandag City',
        coords: [9.0833, 126.2000],
        barangays: ['Bag-ong Lungsod (Poblacion)', 'Bongtod', 'Dagocdoc', 'Mabua', 'San Agustin', 'Telaje', 'Victoria'],
      },
      {
        name: 'Bislig City',
        coords: [8.2167, 126.3167],
        barangays: ['Poblacion', 'Coleto', 'Mangagoy', 'San Fernando', 'San Jose', 'Tabon'],
      },
      {
        name: 'Hinatuan',
        coords: [8.3667, 126.3333],
        barangays: ['Poblacion', 'Bigaan', 'Cambilin', 'Dugmanon', 'Loyola', 'San Juan', 'Talisay', 'Tarusan (Enchanted River)'],
      },
    ],
  },
  'Dinagat Islands': {
    name: 'Dinagat Islands',
    coords: [10.0500, 125.6000],
    municipalities: [
      {
        name: 'San Jose',
        coords: [10.0167, 125.5667],
        barangays: ['Poblacion', 'Aurelio', 'Cuarenta', 'Don Ruben Ecleo', 'Justiniana Edera', 'Luna', 'Mahayahay'],
      },
      {
        name: 'Dinagat',
        coords: [9.9500, 125.6000],
        barangays: ['White Beach (Poblacion)', 'Bagumbayan', 'Cab-ilan', 'Cayetano', 'Escolta', 'Mabini', 'New Mabuhay'],
      },
    ],
  },

  // =========================================================================
  // ── NATIONAL CAPITAL REGION & LUZON KEY PROVINCES ────────────────────────
  // =========================================================================
  'Metro Manila (NCR)': {
    name: 'Metro Manila (NCR)',
    coords: [14.5995, 120.9842],
    municipalities: [
      {
        name: 'Manila City',
        coords: [14.5995, 120.9842],
        barangays: ['Binondo', 'Ermita', 'Intramuros', 'Malate', 'Paco', 'Pandacan', 'Port Area', 'Quiapo', 'Sampaloc', 'San Miguel', 'San Nicolas', 'Santa Ana', 'Santa Cruz', 'Tondo'],
      },
      {
        name: 'Quezon City',
        coords: [14.6760, 121.0437],
        barangays: ['Batasan Hills', 'Commonwealth', 'Diliman', 'Fairview', 'Kamuning', 'Loyola Heights', 'New Era', 'Novaliches', 'Payatas', 'Project 6', 'Project 8', 'South Triangle', 'Tandang Sora'],
      },
      {
        name: 'Taguig City (BGC / Fort Bonifacio)',
        coords: [14.5176, 121.0509],
        barangays: ['Fort Bonifacio (BGC)', 'Central Bicutan', 'Lower Bicutan', 'Upper Bicutan', 'Signal Village', 'Western Bicutan', 'Ususan', 'Tuktukan'],
      },
      {
        name: 'Pasig City',
        coords: [14.5764, 121.0851],
        barangays: ['San Nicolas (Poblacion)', 'Kapitolyo', 'Manggahan', 'Maybunga', 'Oranbo', 'Pinagbuhatan', 'Rosario', 'San Antonio (Ortigas)', 'Ugong'],
      },
      {
        name: 'Makati City',
        coords: [14.5547, 121.0244],
        barangays: ['Bel-Air', 'Poblacion', 'San Lorenzo', 'San Antonio', 'Urdaneta', 'Forbes Park', 'Dasmariñas', 'Palanan', 'Pio del Pilar', 'Bangkal', 'Guadalupe Nuevo', 'Guadalupe Viejo', 'Pembo', 'Comembo'],
      },
      {
        name: 'Pasay City',
        coords: [14.5378, 120.9997],
        barangays: ['Barangay 1-201', 'Baclaran', 'San Rafael', 'San Roque', 'Villamor Airbase', 'Mall of Asia Complex'],
      },
      {
        name: 'Caloocan City',
        coords: [14.6488, 120.9678],
        barangays: ['Grace Park', 'Bagong Barrio', 'Bagong Silang', 'Camarin', 'Tala', 'Deparo'],
      },
    ],
  },
  'Cebu': {
    name: 'Cebu',
    coords: [10.3157, 123.8854],
    municipalities: [
      {
        name: 'Cebu City',
        coords: [10.3157, 123.8854],
        barangays: ['Lahug', 'Mabolo', 'Guadalupe', 'Banilad', 'Kasambagan', 'Talamban', 'Kamputhaw', 'Pari-an', 'Capitol Site', 'Pardo', 'Tisa', 'Labangon'],
      },
      {
        name: 'Mandaue City',
        coords: [10.3333, 123.9333],
        barangays: ['Centro (Poblacion)', 'Alang-alang', 'Bakilid', 'Banilad', 'Basak', 'Cabancalan', 'Ibabao-Estancia', 'Looc', 'Maguikay', 'Subangdaku', 'Tipolo'],
      },
      {
        name: 'Lapu-Lapu City (Mactan)',
        coords: [10.3103, 123.9494],
        barangays: ['Poblacion', 'Basak', 'Buaya', 'Gun-ob', 'Ibo', 'Mactan', 'Maribago', 'Marigondon', 'Punta Engaño', 'Pusok'],
      },
      {
        name: 'Talisay City',
        coords: [10.2500, 123.8500],
        barangays: ['Poblacion', 'Bulacao', 'Cansojong', 'Dumlog', 'Lawaan I', 'Lawaan II', 'Linao', 'Mohon', 'Pooc', 'San Roque', 'Tangke'],
      },
      {
        name: 'Toledo City',
        coords: [10.3833, 123.6333],
        barangays: ['Poblacion', 'Bato', 'Cabitoonan', 'Cantabaco', 'Don Andres Soriano (Lutopan)', 'Ilihan', 'Luray I', 'Poog'],
      },
    ],
  },
  'Iloilo': {
    name: 'Iloilo',
    coords: [10.7202, 122.5621],
    municipalities: [
      {
        name: 'Iloilo City',
        coords: [10.7202, 122.5621],
        barangays: ['City Proper', 'Jaro', 'La Paz', 'Mandurriao', 'Molo', 'Arevalo', 'Lapuz'],
      },
      {
        name: 'Passi City',
        coords: [11.1078, 122.6417],
        barangays: ['Poblacion Ilawod', 'Poblacion Ilaya', 'Agdahon', 'Gines Viejo', 'Man-it', 'Salngan'],
      },
      {
        name: 'Oton',
        coords: [10.6942, 122.4864],
        barangays: ['Poblacion South', 'Poblacion North', 'Buray', 'Cagbang', 'San Antonio', 'Santa Clara', 'Trapiche'],
      },
    ],
  },
  'Bohol': {
    name: 'Bohol',
    coords: [9.8500, 124.1435],
    municipalities: [
      {
        name: 'Tagbilaran City',
        coords: [9.6500, 123.8500],
        barangays: ['Poblacion I', 'Poblacion II', 'Poblacion III', 'Bool', 'Booy', 'Cogon', 'Dampas', 'Mansasa', 'Taloto', 'Ubujan'],
      },
      {
        name: 'Panglao',
        coords: [9.5833, 123.7500],
        barangays: ['Poblacion', 'Bil-isan', 'Bolod', 'Danao', 'Doljo', 'Libaong', 'Looc', 'Tawala (Alona Beach)'],
      },
      {
        name: 'Carmen (Chocolate Hills)',
        coords: [9.8333, 124.2000],
        barangays: ['Poblacion Norte', 'Poblacion Sur', 'Buenos Aires', 'Katipunan', 'Montevideo', 'Nueva Fuerza'],
      },
    ],
  },
  'Pangasinan': {
    name: 'Pangasinan',
    coords: [15.9167, 120.3333],
    municipalities: [
      {
        name: 'Dagupan City',
        coords: [16.0433, 120.3344],
        barangays: ['Poblacion Oeste', 'Bonuan Boquig', 'Bonuan Gueset', 'Lucao', 'Malued', 'Pantal', 'Pogo Chico', 'Tapuac'],
      },
      {
        name: 'San Carlos City',
        coords: [15.9281, 120.3489],
        barangays: ['Poblacion', 'Abanon', 'Balite Sur', 'Bocboc', 'Coliling', 'Ilang', 'Mamarlao', 'Taloy'],
      },
      {
        name: 'Lingayen',
        coords: [16.0217, 120.2319],
        barangays: ['Poblacion', 'Aliwekwek', 'Baay', 'Domalandan Center', 'Maniboc', 'Pangapisan North', 'Tonton'],
      },
    ],
  },
  'Pampanga': {
    name: 'Pampanga',
    coords: [15.0333, 120.6833],
    municipalities: [
      {
        name: 'San Fernando City',
        coords: [15.0333, 120.6833],
        barangays: ['Dolores', 'San Agustin', 'San Jose', 'San Nicolas', 'Santa Lucia', 'Sindalan', 'Telabastagan'],
      },
      {
        name: 'Angeles City',
        coords: [15.1450, 120.5886],
        barangays: ['Balibago', 'Cutcut', 'Malabanias', 'Pampang', 'Pulung Maragul', 'Santo Rosario (Poblacion)'],
      },
      {
        name: 'Mabalacat City',
        coords: [15.2239, 120.5739],
        barangays: ['Poblacion', 'Camachiles', 'Dau', 'Dolores', 'Mabiga', 'Sapang Biabas'],
      },
    ],
  },
  'Cavite': {
    name: 'Cavite',
    coords: [14.2833, 120.9167],
    municipalities: [
      {
        name: 'Imus City',
        coords: [14.4297, 120.9367],
        barangays: ['Poblacion', 'Alapan', 'Anabu', 'Bucandala', 'Malagasang', 'Medicion', 'Palico', 'Tanzang Luma'],
      },
      {
        name: 'Bacoor City',
        coords: [14.4624, 120.9647],
        barangays: ['Poblacion', 'Habay', 'Mambog', 'Molino I-VII', 'Niog', 'Panapaan', 'Queens Row', 'Talaba', 'Zapote'],
      },
      {
        name: 'Dasmariñas City',
        coords: [14.3294, 120.9367],
        barangays: ['Zone I-IV (Poblacion)', 'Burol', 'Fatima', 'Langkaan', 'Paliparan', 'Salawag', 'Salitran', 'Sampaloc'],
      },
      {
        name: 'Tagaytay City',
        coords: [14.1153, 120.9622],
        barangays: ['Kaybagal', 'Maharlika', 'Mendez Crossing', 'Sambong', 'Silang Junction', 'Tolentino'],
      },
    ],
  },
  'Laguna': {
    name: 'Laguna',
    coords: [14.2667, 121.3833],
    municipalities: [
      {
        name: 'Calamba City',
        coords: [14.2117, 121.1656],
        barangays: ['Poblacion 1-7', 'Bucal', 'Canlubang', 'Halang', 'Makiling', 'Pansol', 'Real', 'Turbina'],
      },
      {
        name: 'Santa Rosa City',
        coords: [14.3139, 121.1119],
        barangays: ['Poblacion', 'Balibago', 'Dila', 'Don Jose', 'Macabling', 'Malitlit', 'Market Area', 'Tagapo'],
      },
      {
        name: 'San Pedro City',
        coords: [14.3583, 121.0167],
        barangays: ['Poblacion', 'Cuyab', 'Landayan', 'Narra', 'Pacita Complex 1-2', 'San Antonio', 'San Roque'],
      },
      {
        name: 'Biñan City',
        coords: [14.3389, 121.0806],
        barangays: ['Poblacion', 'Canlalay', 'De La Paz', 'Malaban', 'Platero', 'San Antonio', 'San Vicente', 'Santo Tomas'],
      },
    ],
  },
  'Batangas': {
    name: 'Batangas',
    coords: [13.7565, 121.0583],
    municipalities: [
      {
        name: 'Batangas City',
        coords: [13.7565, 121.0583],
        barangays: ['Poblacion 1-24', 'Alangilan', 'Balagtas', 'Bolbok', 'Kumintang Ibaba', 'Kumintang Ilaya', 'Pallocan'],
      },
      {
        name: 'Lipa City',
        coords: [13.9419, 121.1644],
        barangays: ['Poblacion 1-12', 'Balintawak', 'Dagatan', 'Inosloban', 'Lodlod', 'Marawoy', 'Mataas na Lupa', 'Sabang', 'Tambo'],
      },
      {
        name: 'Tanauan City',
        coords: [14.0861, 121.1500],
        barangays: ['Poblacion 1-7', 'Bagumbayan', 'Darasa', 'Hidalgo', 'Natatas', 'Pagaspas', 'Sambat'],
      },
    ],
  },
  'Rizal': {
    name: 'Rizal',
    coords: [14.6000, 121.3000],
    municipalities: [
      {
        name: 'Antipolo City',
        coords: [14.5842, 121.1764],
        barangays: ['Poblacion', 'Bagong Nayon', 'Beverly Hills', 'Cupang', 'Dalig', 'Dela Paz', 'Mambugan', 'Mayamot', 'San Isidro', 'San Jose', 'San Roque'],
      },
      {
        name: 'Cainta',
        coords: [14.5775, 121.1158],
        barangays: ['San Andres (Poblacion)', 'San Isidro', 'San Juan', 'San Roque', 'Santa Rosa', 'Santo Domingo', 'Santo Niño'],
      },
      {
        name: 'Taytay',
        coords: [14.5667, 121.1333],
        barangays: ['Dolores (Poblacion)', 'Muzon', 'San Isidro', 'San Juan', 'Santa Ana'],
      },
    ],
  },
  'Palawan': {
    name: 'Palawan',
    coords: [9.8349, 118.7384],
    municipalities: [
      {
        name: 'Puerto Princesa City',
        coords: [9.7392, 118.7353],
        barangays: ['Poblacion', 'Bagong Pag-asa', 'Irawan', 'Manduriao', 'San Jose', 'San Manuel', 'San Miguel', 'San Pedro', 'Santa Lourdes', 'Tagburos'],
      },
      {
        name: 'El Nido (Bacuit)',
        coords: [11.1833, 119.4000],
        barangays: ['Buena Suerte (Poblacion)', 'Corong-Corong', 'Maligaya', 'Masagana', 'Villa Libertad', 'Bebeladan', 'Bucana'],
      },
      {
        name: 'Coron',
        coords: [12.0000, 120.2000],
        barangays: ['Poblacion 1-6', 'Banuang Daan', 'Bintuan', 'Borac', 'Buenavista', 'Marcilla', 'Tagumpay'],
      },
      {
        name: 'Brooke\'s Point',
        coords: [8.7833, 117.8333],
        barangays: ['Poblacion I', 'Poblacion II', 'Aribungos', 'Barong-barong', 'Mainit', 'Oring-oring', 'Pangobilian', 'Tubtub'],
      },
      {
        name: 'Bataraza',
        coords: [8.5000, 117.3500],
        barangays: ['Marangas (Poblacion)', 'Bono-bono', 'Culandanum', 'Iwahig', 'Rio Tuba', 'Sumbiling', 'Tarusan'],
      },
      {
        name: 'Balabac',
        coords: [7.9833, 117.0667],
        barangays: ['Poblacion 1-6', 'Agutayan', 'Catagupan', 'Mangsee', 'Melobog', 'Rabor', 'Salang'],
      },
    ],
  },
  'Benguet': {
    name: 'Benguet',
    coords: [16.5000, 120.6667],
    municipalities: [
      {
        name: 'Baguio City',
        coords: [16.4023, 120.5960],
        barangays: ['Session Road (Poblacion)', 'Camp 7', 'Camp 8', 'Irisan', 'Loakan', 'Mines View', 'Pacdal', 'Trancoville'],
      },
      {
        name: 'La Trinidad',
        coords: [16.4583, 120.5889],
        barangays: ['Poblacion', 'Alapang', 'Balili', 'Beckel', 'Betag (Strawberry Farm)', 'Cruz', 'Pico', 'Puguis', 'Shilan', 'Wangal'],
      },
    ],
  },
  'Abra': {
    name: 'Abra',
    coords: [17.5833, 120.75],
    municipalities: [
      {
        name: 'Bangued',
        coords: [17.5986, 120.6186],
        barangays: ["Poblacion","Agtangao","Angad","Bañacao","Bangbangar","Calaba","Cosili West","Dangdangla","Lingtan","Lipcan","Malita","Maoay","Palao","Patucannay","Sagap","San Antonio","Santa Rosa","Zone 1","Zone 2","Zone 3","Zone 4","Zone 5","Zone 6","Zone 7"],
      },
      {
        name: 'Bucay',
        coords: [17.5333, 120.7167],
        barangays: ["Poblacion","Abang","Bangbangcag","Bangcagan","Banglolao","Bugbog","Calao","Dugong","Labon","Layugan","Madalipay","Pagala","Pakiling","Palaquio","Patoc","Quimloong","Salnec","San Miguel","Siblong","Tabiog","Tuganiw"],
      },
      {
        name: 'Dolores',
        coords: [17.65, 120.7167],
        barangays: ["Poblacion","Bimmador","Cabaroan","Isit","Kimmalaba","Libtec","Mudiit","Namit-ingan","Pacac","Salucag","San Pascual","Talogtog","Taping"],
      },
      {
        name: 'La Paz',
        coords: [17.6833, 120.6833],
        barangays: ["Poblacion","Benben","Bulbulala","Bungacheg","Canan","Liguis","Malabbaga","Mudeng","San Gregorio","Toon","Udangan"],
      },
      {
        name: 'Tayum',
        coords: [17.6167, 120.65],
        barangays: ["Poblacion","Bagalay","Basbasa","Budac","Bumagcat","Cabaroan","Deet","Gaddani","Patucannay","Pias","Salnec","Velasco"],
      },
      {
        name: 'Peñarrubia',
        coords: [17.5667, 120.65],
        barangays: ["Poblacion","Dumayco","Lusuac","Malamsit","Namarabar","Patiao","Pokpok","Riang","Santa Rosa","Tebag"],
      },
      {
        name: 'Lagangilang',
        coords: [17.6167, 120.7333],
        barangays: ["Poblacion","Aguet","Bagan","Balais","Cayapa","Dalit","Laang","Lagben","Nagtipulan","Nangobongan","Paganao","Pawa","Presentar","San Isidro","Tagodtod","Taping"],
      },
    ],
  },
  'Apayao': {
    name: 'Apayao',
    coords: [18, 121.1667],
    municipalities: [
      {
        name: 'Kabugao',
        coords: [18.0247, 121.1831],
        barangays: ["Poblacion","Badduat","Baliwanan","Bulong","Dagara","Dibagat","Cawayan","Lenneng","Lucab","Luttuacan","Madatag","Madduang","Magabubong","Maragat","Musimut","Nagbabalayan","Tuyangan","Wakat"],
      },
      {
        name: 'Conner',
        coords: [17.7833, 121.3167],
        barangays: ["Poblacion","Allangigan","Banban","Buluan","Caglayan","Cupis","Daga","Guinaang","Ili","Karikitan","Katablangan","Malama","Manag","Nabuangan","Paddaoan","Pasydan","Ripang","Sacpil","Talifugo"],
      },
      {
        name: 'Flora',
        coords: [18.25, 121.4],
        barangays: ["Poblacion East","Poblacion West","Alliga","Anninipan","Bagutong","Balasi","Balluyan","Malayugan","Malubibit","Santa Maria","Tamlang","Upper Atok"],
      },
      {
        name: 'Luna',
        coords: [18.3333, 121.3667],
        barangays: ["Poblacion","Bacsay","Capagaypayan","Dagupan","Lappa","Marag","Poblacion West","Quirino","Salvacion","San Francisco","San Gregorio","San Isidro","San Sebastian","Santa Lina","Shalom","Talogtog","Turod","Zumigui"],
      },
      {
        name: 'Pudtol',
        coords: [18.15, 121.2833],
        barangays: ["Poblacion","Aga","Alem","Cabatacan","Caganayan","Capannikian","Doña Loreta","Emilia","Imelda","Lower Maton","Malibang","Matagisi","San Antonio","San Jose","San Luis","San Mariano","Swan","Upper Maton"],
      },
      {
        name: 'Santa Marcela',
        coords: [18.2833, 121.4333],
        barangays: ["Poblacion","Barocboc","Consuelo","Imelda","Malantao","Marcela","Nueva","Panay","San Antonio","San Carlos","San Juan","San Mariano","San Rafael"],
      },
      {
        name: 'Calanasan (Bayag)',
        coords: [18.2667, 121.05],
        barangays: ["Poblacion","Eleazar","Eva","Kabugawan","Langnao","Lubong","Macatol","Nagui-ilian","Namaltugan","Sabangan","Santa Elena","Santa Filomena","Tubongan"],
      },
    ],
  },
  'Ifugao': {
    name: 'Ifugao',
    coords: [16.8333, 121.1667],
    municipalities: [
      {
        name: 'Lagawe',
        coords: [16.8, 121.1167],
        barangays: ["Poblacion East","Poblacion West","Poblacion South","Poblacion North","Boliwong","Burnay","Buyabuyan","Caba","Cudog","Dulao","Jucbong","Montabiong","Olilit","Ponghal","Pullaan","Tungngod"],
      },
      {
        name: 'Banaue',
        coords: [16.9167, 121.0667],
        barangays: ["Poblacion","Amganad","Anaba","Bangaan","Batad (Rice Terraces)","Bocos","Banao","Cambulo","Ducligan","Gohang","Kinakin","Poitan","San Fernando","Tam-an","Viewpoint"],
      },
      {
        name: 'Alfonso Lista (Potia)',
        coords: [16.9667, 121.5],
        barangays: ["San Marcos (Poblacion)","Bangag","Busilac","Calupaan","Caragasan","Dolowog","Kiling","Namnama","Namillangan","Pinto","San Jose","San Juan","San Quintin","Santa Maria"],
      },
      {
        name: 'Kiangan',
        coords: [16.7833, 121.0833],
        barangays: ["Poblacion","Ambabag","Baguinge","Bokiawan","Dalligan","Duit","Hucab","Julongan","Lingay","Mappit","Nagacadan","Pindongan","Tuplac"],
      },
      {
        name: 'Mayoyao',
        coords: [16.9833, 121.2167],
        barangays: ["Poblacion","Aduyongan","Alimit","Banao","Banhal","Bongan","Chumang","Guinihang","Liwo","Magat","Maple","Nalbu","Palaad","Tulaed"],
      },
      {
        name: 'Lamut',
        coords: [16.6833, 121.15],
        barangays: ["Poblacion","Ambasing","Bimpal","Hapid","Lawig","Lucban","Mabuway","Magulod","Nayun","Panopdopan","Payawan","Pugol","Salamague","Sanafe","Umilag"],
      },
    ],
  },
  'Kalinga': {
    name: 'Kalinga',
    coords: [17.4167, 121.25],
    municipalities: [
      {
        name: 'Tabuk City',
        coords: [17.45, 121.45],
        barangays: ["Dagupan Center (Poblacion)","Agbanawag","Amlao","Appas","Bagumbayan","Balawag","Bulanao","Bulo","Calaccad","Cabaruan","Casigayan","Cudal","Dilag","Dupag","Gobgob","Guilayon","Laya East","Laya West","Lucog","Magtoma","Malin-awa","Nambaran","Naneng","San Juan"],
      },
      {
        name: 'Lubuagan',
        coords: [17.3167, 121.1833],
        barangays: ["Poblacion","Dangoy","Mabilong","Mabongtot","Poblacion Upper","Tanglag","Uma del Norte","Uma del Sur","Upper Uma"],
      },
      {
        name: 'Pasil',
        coords: [17.3833, 121.1],
        barangays: ["Am-ao","Balatoc","Balinciagao Norte","Balinciagao Sur","Cagaluan","Colayo","Dalupa","Dangtalan","Galdang","Guina-ang","Malucsad","Pugong"],
      },
      {
        name: 'Pinukpuk',
        coords: [17.55, 121.4167],
        barangays: ["Poblacion","Aciga","Allaguia","Ammacian","Apatan","Ba-ay","Ballayangon","Bayao","Cagayan","Camalog","Katabbogan","Limos","Magaogao","Malagnag","Pinukpuk Junction","Socbot","Tappo","Tuguegarao"],
      },
      {
        name: 'Tinglayan',
        coords: [17.2667, 121.0333],
        barangays: ["Poblacion","Ambato Legleg","Bangad Centro","Basao","Bugnay (Buscalan)","Buscalan","Butbut Proper","Dananao","Loccong","Luplupa","Mallango","Ngibat","Old Tinglayan","Sumadel 1","Sumadel 2","Tulgao East","Tulgao West"],
      },
      {
        name: 'Rizal (Liwan)',
        coords: [17.5, 121.5833],
        barangays: ["Babalag East (Poblacion)","Babalag West","Calao","Kinama","Liwan East","Liwan West","Macutay","Romualdez","San Gabriel","San Pascual","San Pedro","Santor"],
      },
    ],
  },
  'Mountain Province': {
    name: 'Mountain Province',
    coords: [17.0833, 121],
    municipalities: [
      {
        name: 'Bontoc',
        coords: [17.0833, 120.9833],
        barangays: ["Poblacion","Alab Oriente","Alab Proper","Balili","Bayyo","Bontoc Ili","Caneo","Dalican","Guinaang","Mainit","Maligcong","Samoki","Talubin","Tocucan"],
      },
      {
        name: 'Sagada',
        coords: [17.0833, 120.9],
        barangays: ["Poblacion (Patay)","Aguid","Ambasing","Angkeling","Antadao","Balugan","Bangaan","Dagdag","Demang","Fidelisan","Kilong","Madongo","Nacagang","Pide","Suyo","Tanulong","Tetepan Norte","Tetepan Sur"],
      },
      {
        name: 'Bauko',
        coords: [17, 120.8667],
        barangays: ["Abatan","Bagnen Oriente","Bagnen Proper","Balugan","Bila","Guinzadan Central","Guinzadan Norte","Guinzadan Sur","Lagawa","Mabaay","Monamon Norte","Monamon Sur","Mount Data","Otucan Norte","Otucan Sur","Poblacion","Sadsadan","Tapapan"],
      },
      {
        name: 'Tadian',
        coords: [16.9833, 120.8],
        barangays: ["Poblacion","Balaoa","Banaao","Bantey","Batayan","Bayan","Cadad-anan","Cagubatan","Duagan","Kayan East","Kayan West","Labbay","Masla","Pandayan","Sumadel","Tue"],
      },
      {
        name: 'Besao',
        coords: [17.1, 120.85],
        barangays: ["Poblacion","Agawa","Ambagiw","Bayan","Banguitan","Besao East","Besao West","Catengan","Gueday","Kin-iway","Lacmaan","Laylaya","Padangaan","Suquib","Tamboan"],
      },
      {
        name: 'Paracelis',
        coords: [17.15, 121.4333],
        barangays: ["Poblacion","Anonat","Bacari","Bananao","Bantay","Boton","Buringal","Palitud","San Rafael"],
      },
    ],
  },
  'Ilocos Norte': {
    name: 'Ilocos Norte',
    coords: [18.1667, 120.6667],
    municipalities: [
      {
        name: 'Laoag City',
        coords: [18.196, 120.5927],
        barangays: ["Barangay 1 (San Lorenzo)","Barangay 2 (Santa Joaquina)","Barangay 9 (Santa Angela)","Barangay 14 (Santo Tomas)","Barangay 23 (San Matias)","Nalbo","Navotas","San Mateo","Tangid","Zamboanga"],
      },
      {
        name: 'Batac City',
        coords: [18.0558, 120.5647],
        barangays: ["Poblacion 1-S","Aglipay","Baay","Baligat","Bungon","Callaguip","Coloma","Lacub","Palpalicong","Quiling Norte","Quiling Sur","Rayuray","San Mateo","Tabug"],
      },
      {
        name: 'Pagudpud',
        coords: [18.5583, 120.7867],
        barangays: ["Poblacion 1","Poblacion 2","Baduang","Balaoi","Burayoc","Caparispisan","Ligaya","Pancian","Passuquin","Saud","Subec"],
      },
      {
        name: 'Paoay',
        coords: [18.0617, 120.5217],
        barangays: ["Poblacion","Bacsil","Cabangaran","Callaguip","Laao","Nagbacalan","Nanguyudan","Pawa","Suba (Paoay Lake)","Sungadan"],
      },
      {
        name: 'Bangui',
        coords: [18.5375, 120.7675],
        barangays: ["San Lorenzo (Poblacion)","Abaca","Banban","Baruyen","Dadaor","Lanao","Malasin","Manayon","Masngit","San Isidro","Taguiporo","Utol"],
      },
      {
        name: 'San Nicolas',
        coords: [18.1722, 120.5956],
        barangays: ["San Agustin (Poblacion)","San Baltazar","San Bartolome","San Cayetano","San Eugenio","San Fernando","San Francisco","San Ildefonso","San Jose","San Juan","San Lorenzo","San Marcos","San Miguel","San Pablo","San Pedro","San Rufino","San Silvestre","Santa Asuncion","Santa Cecilia","Santa Monica","Barit-Pandan","Bingao","Catuguing"],
      },
      {
        name: 'Dingras',
        coords: [18.1, 120.7],
        barangays: ["Albano (Poblacion)","Baresbes","Barong","Cali","Dancel","Elizabeth","Espiritu","Foz","Guerrero","Lanas","Madamba","Mandaloque","Medina","Parado","Peralta","Puruganan","Root","Saludpud","San Esteban","San Marcelino","San Marcos","San Roque","Ver"],
      },
    ],
  },
  'Ilocos Sur': {
    name: 'Ilocos Sur',
    coords: [17.3333, 120.5],
    municipalities: [
      {
        name: 'Vigan City',
        coords: [17.5747, 120.3869],
        barangays: ["Poblacion (Calle Crisologo)","Ayusan Norte","Ayusan Sur","Barangay 1","Barangay 2","Barangay 3","Barangay 4","Barangay 5","Barangay 6","Beddeng Laud","Bongtolan","Bulala","Cabalangegan","Cabaroan Daya","Cabaroan Laud","Camangaan","Capangpangan","Mindoro","Nagsangalan","Pantay Daya","Pantay Fatima","Pantay Laud","Paoa","Paratong","Pong-ol","Purok-a-bassit","Purok-a-dakkel","Raois","Rugsuanan","Salcedo","San Jose","San Julian Norte","San Julian Sur","San Pedro","Tamag"],
      },
      {
        name: 'Candon City',
        coords: [17.1917, 120.4486],
        barangays: ["Poblacion","Bagani Campo","Bagani Gabor","Bagani Tocgo","Balingaoan","Bugnay","Calaoa-an","Calongbuyan","Caterman","Cubcubbuot","Darapidap","Langlangca 1st","Langlangca 2nd","Oaig-Daya","Palacapac","Paras","Parioc 1st","Parioc 2nd","San Agustin","San Andres","San Antonio","San Isidro","San Jose","San Juan","San Nicolas","San Pedro","San Rafael","Santo Tomas","Tablac","Talogtog","Tamurong 1st","Tamurong 2nd","Villarica"],
      },
      {
        name: 'Narvacan',
        coords: [17.4167, 120.4833],
        barangays: ["Santa Lucia (Poblacion)","San Jose (Poblacion)","Aquib","Bantay Abot","Bulanos","Camarao","Casilagan","Codoog","Dasay","Dinalaoan","Lungog","Margaay","Nanguneg East","Nanguneg West","Orence","Pantoc","Paratong","Quinarayan","Rivilla","San Antonio","San Pablo","San Pedro","San Roque","Sulvec","Turod"],
      },
      {
        name: 'Santa Maria',
        coords: [17.3667, 120.4833],
        barangays: ["Poblacion Sur","Poblacion Norte","Ag-Agraoc","Ampambi-an","Baballasioan","Baliw Daya","Baliw Laud","Bia-o","Butir","Cabaroan","Danuman East","Danuman West","Dungglayan","Gusing","Langayan","Las-ud","Lingsat","Lubong","Maynganay Daya","Maynganay Laud","Nagsayaoan","Nagtupacan","Nalvo","Pacang","Penned","Pilar","San Agustin","San Antonio","San Isidro","Silag","Sumagui","Susungdalaga","Tangaoan","Tinaan"],
      },
      {
        name: 'Tagudin',
        coords: [16.9333, 120.45],
        barangays: ["Poblacion","Ambalayat","Barrientos","Bitalag","Borono","Bucao East","Bucao West","Cabaroan","Dardarat","Del Pilar","Farola","Gabur","Garitan","Jardin","Lacong","Lantag","Las-ud","Libtong","Magsaysay","Malacañang","Pallogan","Pudoc East","Pudoc West","Quirino","Ranget","Rizal","Salvacion","San Miguel","Sawat","Tallaoen"],
      },
    ],
  },
  'La Union': {
    name: 'La Union',
    coords: [16.5, 120.3333],
    municipalities: [
      {
        name: 'San Fernando City',
        coords: [16.6159, 120.3209],
        barangays: ["Poblacion","Bangbangolan","Biday","Birunget","Cabaroan","Cadaclan","Calabugao","Camansi","Catbangen","Dalumpinas Este","Dalumpinas Oeste","Ilocanos Norte","Ilocanos Sur","Langoffen","Lingsat","Madayegdeg","Mameltac","Naminuan","Pagdaraoan","Pagudpud","Parian","San Agustin","San Francisco","Sevilla","Tanon"],
      },
      {
        name: 'San Juan',
        coords: [16.6833, 120.3333],
        barangays: ["Ili Norte (Poblacion)","Ili Sur","Allangigan","Aludaid","Bacsayan","Balballosa","Bambanay","Bugbugcao","Cabaroan","Caarusipan","Catdongan","Dangdangla","Dasay","Guinabang","Nagpanaoan","Nagsabaran","Nagsamping","Nalvo Norte","Nalvo Sur","Oka","Panicsican","Pequi","San Manuel Norte","San Manuel Sur","Santa Rosa","Taboc","Talogtog","Urbiztondo (Surfing Capital)"],
      },
      {
        name: 'Agoo',
        coords: [16.3167, 120.3667],
        barangays: ["San Nicolas Norte (Poblacion)","San Nicolas Sur","Ambitacay","Balawarte","Capas","Consolacion","Macalva Central","Macalva Norte","Macalva Sur","Nazareno","Purok","San Agustin East","San Agustin Norte","San Agustin Sur","San Antonino","San Antonio","San Francisco","San Isidro","San Joaquin Norte","San Joaquin Sur","San Jose","San Julian Central","San Julian East","San Julian Norte","San Julian West","San Manuel Norte","San Manuel Sur","San Marcos","San Miguel","San Pedro","San Roque West","San Vicente Norte","San Vicente Sur","Santa Ana","Santa Barbara","Santa Fe","Santa Monica","Santa Rita Central","Santa Rita East","Santa Rita Norte","Santa Rita Sur","Santa Rita West"],
      },
      {
        name: 'Bauang',
        coords: [16.5333, 120.3333],
        barangays: ["Central East (Poblacion)","Central West","Acao","Baccuit Norte","Baccuit Sur","Bagbag","Ballay","Bawanta","Boy-utan","Bucayab","Cabalayongan","Cabuyao","Calumbaya","Carmay","Casilagan","Central","Disso-or","Guerrero","Lower San Agustin","Nagrebcan","Pagudpud","Parian Este","Parian Oeste","Pottot","Pudoc","Pugo","Quinavidad","Santiago","Taberna","Ubagan","Upper San Agustin"],
      },
      {
        name: 'Rosario',
        coords: [16.2333, 120.4833],
        barangays: ["Poblacion East","Poblacion West","Agat","Alipangpang","Ambangonan","Amlang","Bacani","Bangar","Bani","Benteng-Sapilang","Cadumanian","Camp One","Carunuan East","Carunuan West","Casilagan","Cataguingtingan","Concepcion","Damortis","Gumot-Nagales","Inabaan Norte","Inabaan Sur","Marcos","Nangcamotian","Parasapas","Poblacion","Puzon","Rabon","San Jose","Subusub","Tanglag","Tubao","Udiao","Vila"],
      },
    ],
  },
  'Batanes': {
    name: 'Batanes',
    coords: [20.4486, 121.9708],
    municipalities: [
      {
        name: 'Basco',
        coords: [20.4486, 121.9708],
        barangays: ["Ihubok II (Kayvaluganan)","Ihubok I (Kaychanarianan)","San Antonio","San Joaquin","Chanarian","Kayhuvokan"],
      },
      {
        name: 'Itbayat',
        coords: [20.7833, 121.8333],
        barangays: ["San Rafael (Idiang)","Santa Lucia (Kauhauhasan)","Santa Maria (Marapuy)","Santa Rosa (Kaynatuan)","Raele"],
      },
      {
        name: 'Ivana',
        coords: [20.3667, 121.9167],
        barangays: ["Radiwan","Salagao","San Vicente (Igang)","Tuhel"],
      },
      {
        name: 'Mahatao',
        coords: [20.4167, 121.95],
        barangays: ["Hañgan","Kaumbakan","Panatayan","Uvoy"],
      },
      {
        name: 'Sabtang',
        coords: [20.3333, 121.8667],
        barangays: ["Chavayan","Malakdang","Nakanmuan","Savidug","Sinandungan","Sumnanga"],
      },
      {
        name: 'Uyugan',
        coords: [20.35, 121.9333],
        barangays: ["Kayvaluganan","Kayuganan","Itbud","Imnajbu"],
      },
    ],
  },
  'Cagayan': {
    name: 'Cagayan',
    coords: [17.6667, 121.75],
    municipalities: [
      {
        name: 'Tuguegarao City',
        coords: [17.6131, 121.7269],
        barangays: ["Centro 01 (Poblacion)","Centro 02","Centro 03","Centro 04","Centro 05","Centro 06","Centro 07","Centro 08","Centro 09","Centro 10","Centro 11","Centro 12","Annafunan East","Annafunan West","Atulayan Norte","Atulayan Sur","Buntun","Caggay","Capatan","Carig Norte","Carig Sur","Caritan Centro","Caritan Norte","Caritan Sur","Cataggaman Nuevo","Cataggaman Pardo","Cataggaman Viejo","Larion Alto","Larion Bajo","Leonarda","Linao East","Linao Norte","Linao West","Pengue-Ruyu","San Gabriel","Tagga","Tanza","Ugac Norte","Ugac Sur"],
      },
      {
        name: 'Aparri',
        coords: [18.3561, 121.6417],
        barangays: ["Centro 1 (Poblacion)","Centro 2","Centro 3","Centro 4","Centro 5","Centro 6","Centro 7","Centro 8","Centro 9","Centro 10","Centro 11","Centro 12","Centro 13","Centro 14","Centro 15","Bisagu","Bukig","Bulala Norte","Bulala Sur","Caapan","Fuga Island","Gaddani","Linao","Mabanguc","Maura","Minanga","Punta","San Antonio","Toran"],
      },
      {
        name: 'Baggao',
        coords: [17.8967, 121.87],
        barangays: ["Poblacion","Adaoag","Agaman Norte","Agaman Sur","Alba","Annabbucan","Asassi","Awili","Baculud","Bitag Grande","Canagatan","Dabbac Grande","Imurung","Mabini","Remus","San Jose","San Miguel","San Vicente","Santa Margarita","Santor","Tallang","Temblique"],
      },
      {
        name: 'Lal-lo',
        coords: [18.1969, 121.6608],
        barangays: ["Centro (Poblacion)","Abagao","Alaguia","Bagumbayan","Bagu","Bicud","Bical","Cabaggan","Cagayan Valley Airport","Catayauan","Dalaya","Fabrica","Lalafugan","Logac","Malanao","Maxingal","Nagbayugan","Paranum","San Lorenzo","San Mariano","Santa Maria","Sicatna","Tucalana"],
      },
      {
        name: 'Solana',
        coords: [17.65, 121.6833],
        barangays: ["Centro (Poblacion)","Andarayan North","Andarayan South","Bantay","Basi East","Basi West","Bauag East","Bauag West","Caladdat","Calilauan","Carilucud","Daddamin","Iraga","Lannig","Lanna","Malabbac","Nangalisan","Nattapian East","Nattapian West","Padidle","Pataya","Sampaguita","San Vicente","Ubong"],
      },
    ],
  },
  'Isabela': {
    name: 'Isabela',
    coords: [16.9667, 121.8333],
    municipalities: [
      {
        name: 'Ilagan City',
        coords: [17.1478, 121.8897],
        barangays: ["Centro Poblacion","Alibagu","Balingasag","Bliss Village","Calamagui 1st","Calamagui 2nd","Capellan","Guinatan","Malalam","Marana 1st","Marana 2nd","Naguilian Norte","Naguilian Sur","Osmeña","San Felipe","San Vicente","Santa Barbara","Sipay","Upi"],
      },
      {
        name: 'Santiago City',
        coords: [16.6908, 121.5475],
        barangays: ["Centro East","Centro West","Balintocatoc","Batal","Buenavista","Calaocan","Dubinan East","Dubinan West","Mabini","Malvar","Patul","Plaridel","Rizal","Rosario","San Andres","San Isidro","Victory Norte","Victory Sur"],
      },
      {
        name: 'Cauayan City',
        coords: [16.9297, 121.7706],
        barangays: ["District 1 (Poblacion)","District 2","District 3","Alicauauan","Baringin Norte","Baringin Sur","Cabugao","Caritan","Cassap Fuera","Catalina","Culalabat","Dabburab","De La Paz","Gagabutan","Guayabal","Labinab","Minante 1","Minante 2","Naganacan","San Fermin","San Luis","Sillawit","Tagaran","Turayong"],
      },
      {
        name: 'Roxas',
        coords: [17.1167, 121.6167],
        barangays: ["Bantug (Poblacion)","Doña Concha","Imbiao","Lanting","Lucban","Marcos","Matusalem","Muñoz","Quiling","Rang-ayan","Rizal","San Antonio","San Jose","San Luis","San Pedro","San Rafael","Simimbaan","Vira"],
      },
      {
        name: 'Alicia',
        coords: [16.7833, 121.7],
        barangays: ["Antonino (Poblacion)","Amis","Apanay","Aurora","Bagnos","Burgos","Calaocan","Callao","Linglingay","Mabini","Magsaysay","Padre Sigayan","Rizal","San Antonio","San Fernando","Santa Cruz","Santa Maria","Santo Tomas","Victoria"],
      },
      {
        name: 'Echague',
        coords: [16.7, 121.6833],
        barangays: ["San Fabian (Poblacion)","Annafunan","Arabiat","Aromin","Babaran","Bacsil","Benguet","Buneg","Cabugao","Caratcat","Dammang East","Dammang West","Dicamay","Garit Norte","Garit Sur","Gucab","Ipil","Madadamian","Malitao","Naragdong","Pangunguna","San Antonio","San Bernardo","San Isidro","Silauan Norte","Silauan Sur","Soyung","Villa Gonzaga"],
      },
    ],
  },
  'Nueva Vizcaya': {
    name: 'Nueva Vizcaya',
    coords: [16.3333, 121.1667],
    municipalities: [
      {
        name: 'Bayombong',
        coords: [16.4833, 121.15],
        barangays: ["District IV (Poblacion)","Bonfal East","Bonfal Proper","Bonfal West","Buing","Cabuan","Casat","Don Mariano Marcos","Don Tomas Maddela","Ipil-Cuneg","La Torre North","La Torre South","Luyang","Magapuy","Magsaysay","Masoc","Paitan","Salvacion","San Nicolas","Santa Rosa","Vista Alegre"],
      },
      {
        name: 'Solano',
        coords: [16.5167, 121.1833],
        barangays: ["Poblacion North","Poblacion South","Aggub","Bangaan","Bangar","Bascaran","Communal","Concepcion","Curifang","Dadap","General Luna","Maddiangat","Osmeña","Quezon","Quirino","Rizal","San Juan","San Luis","Tucal","Uddiawan"],
      },
      {
        name: 'Bambang',
        coords: [16.3833, 121.1],
        barangays: ["Almaguer North","Almaguer South","Banggot (Poblacion)","Barat","Buag","Calaocan","Daliogan","Indiana","Mabuaya","Macate","Manambrong","Mauan","Pinasling","Salinas (Salt Springs)","San Antonio North","San Antonio South","San Fernando","Santo Domingo"],
      },
      {
        name: 'Aritao',
        coords: [16.3, 121.0333],
        barangays: ["Poblacion","Banganan","Betinas","Bone North","Bone South","Comon","Cutape","Darapidap","Kirang","Nagcuartelan","Ocapon","Poblacion","Santa Clara","Tabueng","Tucao","Yaway"],
      },
      {
        name: 'Bagabag',
        coords: [16.6, 121.2667],
        barangays: ["Bakir","Baret-bet","Careb","Lantap","Murong","Nantagaan","Paniki","Pogonsino","San Geronimo (Poblacion)","San Pedro","Santa Cruz","Santa Lucia","Tuao","Villa Coloma","Villa Quirino"],
      },
    ],
  },
  'Quirino': {
    name: 'Quirino',
    coords: [16.2833, 121.5833],
    municipalities: [
      {
        name: 'Cabarroguis',
        coords: [16.5167, 121.5167],
        barangays: ["Mangandingay (Poblacion)","Banuar","Burgos","Calaoagan","Del Pilar","Dibibi","Dingasan","Eden","Gundaway","San Marcos","Santo Domingo","Tucod","Villamor","Zamora"],
      },
      {
        name: 'Diffun',
        coords: [16.5667, 121.5],
        barangays: ["Aurora East (Poblacion)","Aurora West","Bagabag","Balagbag","Bannawag","Cabarroguis","Camp Dos","Don Mariano Marcos","Dumanisi","Gabriela Silang","Gulac","Gurayan","Liwayway","Makate","Maria Clara","Ricarte Sur","San Antonio","San Isidro","San Leonardo","Villa Pascua"],
      },
      {
        name: 'Maddela',
        coords: [16.35, 121.6833],
        barangays: ["Poblacion Norte","Poblacion Sur","Abbag","Balligui","Buenavista","Cabaruan","Cabua-an","Cofcaville","Diduyon","Dipintin","Divisoria Norte","Divisoria Sur","Dumabato Norte","Dumabato Sur","Lusod","San Martin","San Pedro","San Salvador","Santo Niño","Villa Gracia","Villa Hermosa"],
      },
      {
        name: 'Saguday',
        coords: [16.55, 121.5667],
        barangays: ["Magsaysay (Poblacion)","Cardenas","Dibul","Gamis","La Paz","Rizal","Salvacion","Santo Tomas","Tres Reyes"],
      },
      {
        name: 'Aglipay',
        coords: [16.45, 121.6167],
        barangays: ["Poblacion","Cabugao","Dagupan","Dudungan","Guimod","Ligaya","Nagabgaban","Palacian","Progreso","Ramos","San Antonio","San Leonardo","San Ramon","Victoria","Villa Santiago"],
      },
      {
        name: 'Nagtipunan',
        coords: [16.2167, 121.6],
        barangays: ["Dipantan (Poblacion)","Anak","Asaklat","Disangal","Guinangyon","La Concepcion","Landingan","Mataddi","Matmad","Old Gumiad","Ponggo","San Dionisio","Sangbay","Wasid"],
      },
    ],
  },
  'Aurora': {
    name: 'Aurora',
    coords: [15.75, 121.55],
    municipalities: [
      {
        name: 'Baler',
        coords: [15.7594, 121.5625],
        barangays: ["Poblacion Barangay 1","Poblacion Barangay 2","Poblacion Barangay 3","Poblacion Barangay 4","Poblacion Barangay 5","Buhangin","Calabuanan","Obligacion","Pingit","Reserva","Sabang (Surfing Beach)","Suklayin","Zabali"],
      },
      {
        name: 'Casiguran',
        coords: [16.2833, 122.1167],
        barangays: ["Barangay 1 (Poblacion)","Barangay 2","Barangay 3","Barangay 4","Barangay 5","Barangay 6","Barangay 7","Barangay 8","Calabgan","Calangcuasan","Calintaan","Cozo","Culat","Dibacong","Esperanza","Esteves","Marikit","San Ildefonso","Tabas","Tinib"],
      },
      {
        name: 'Dingalan',
        coords: [15.3833, 121.4],
        barangays: ["Poblacion","Aplaya","Butas Na Bato","Cabog","Caragsacan","Davildavilan","Dikapanikian","Ibona","Paltic","Tanawan","Umirey"],
      },
      {
        name: 'Maria Aurora',
        coords: [15.7944, 121.4722],
        barangays: ["Barangay I (Poblacion)","Barangay II","Barangay III","Barangay IV","Alcala","Baguray","Bannawag","Barangay East","Bazal","Cabatuan","Cadacan","Diaat","Dialatnan","Florida","Galintuja","Malasin","Quirino","Ramada","San Joaquin","San Jose","San Leonardo","Santa Lucia","Silvit","Wenceslao"],
      },
      {
        name: 'Dipaculao',
        coords: [15.9833, 121.6333],
        barangays: ["North Poblacion","South Poblacion","Bayuar","Borlongan","Buenavista","Calaocan","Diamanen","Diatagon","Ditale","Gupa","Ipil","Laboy","Lipit","Lobbot","Maligaya","Mijares","Mucdol","Salay","Saparyo","Toytoyan"],
      },
    ],
  },
  'Bataan': {
    name: 'Bataan',
    coords: [14.6667, 120.4167],
    municipalities: [
      {
        name: 'Balanga City',
        coords: [14.6806, 120.5414],
        barangays: ["Poblacion","Bagong Silang","Bagumbayan","Cabog-Cabog","Camacho","Cataning","Central","Cupang North","Cupang Proper","Cupang West","Dangcol","Doña Francisca","Ibayo","Malabia","Munting Batangas","Puerto Rivas Ibaba","Puerto Rivas Itaas","San Jose","Sibacan","Talisi","Tanato","Tenejero","Tortugas","Tuyo"],
      },
      {
        name: 'Mariveles',
        coords: [14.4333, 120.4833],
        barangays: ["Poblacion","Alas-asin","Alion","Balon-Anito","Baseco Country (NASSCO)","Batangas II","Biaan","Cabcaben","Camaya","Ipag","Lucanin","Malaya","Maligaya","Mount View","San Carlos","San Isidro","Sisiman","Townsite"],
      },
      {
        name: 'Dinalupihan',
        coords: [14.8667, 120.4667],
        barangays: ["San Ramon (Poblacion)","Bangal","Bayan-bayanan","Colo","Daang Bago","General Luna","Happy Valley","Jose C. Payumo, Jr.","Luacan","Maligaya","Naparing","New San Jose","Old San Jose","Padre Dandan","Pag-asa","Pagalanggang","Pinulot","Roosevelt","San Benito","San Felipe","San Isidro","San Simon","Santa Isabel","Santo Niño","Sapang Balas","Tubotubo","Tucop"],
      },
      {
        name: 'Orani',
        coords: [14.8, 120.5333],
        barangays: ["Centro 1 (Poblacion)","Centro 2","Apollo","Bagong Paraiso","Balut","Bayan","Calero","Kaparangan","Mabaldog","Masantol","Mulawin","Pag-asa","Paking-Velasco","Palihan","Pantalan Bago","Pantalan Luma","Parang Parang","Poblacion","San Jose","Silahis","Tagumpay","Tala","Talimundoc","Tapulao","Tugatog","Wawa"],
      },
      {
        name: 'Hermosa',
        coords: [14.8333, 120.5],
        barangays: ["Poblacion","Acle","Almacen","Bacong","Balsic","Bamban","Burgos-Soliman","Cataning","Culis","Daungan","Judge Roman Cruz Sr.","Mabiga","Mabuco","Maite","Mambog","Palihan","Pandatung","Pulo","Sacsac","San Pedro","Santo Cristo","Sumalo","Tipo"],
      },
      {
        name: 'Limay',
        coords: [14.5667, 120.5833],
        barangays: ["Townsite (Poblacion)","Alangan","Duale","Kitang I","Kitang 2 & Luz","Lamao","Landing","Poblacion","Reformista","Saint Francis II","San Francisco de Asis","Wawa"],
      },
    ],
  },
  'Bulacan': {
    name: 'Bulacan',
    coords: [14.9667, 120.9167],
    municipalities: [
      {
        name: 'Malolos City',
        coords: [14.8433, 120.8114],
        barangays: ["Catmon","San Gabriel","Sto. Rosario (Poblacion)","Atlag","Babatnin","Balite","Bangkal","Barihan","Bulihan","Caingin","Calero","Caliligawan","Canalate","Caniogan","Cofradia","Dakila","Guinhawa","Ligas","Liang","Look 1st","Look 2nd","Lugam","Mabolo","Mambog","Matimbo","Mojon","Panasahan","Pinagbakahan","San Agustin","San Juan","San Pablo","San Vicente","Santor","Santo Cristo","Santo Niño","Sumapang Bata","Sumapang Matanda","Taal","Tikay"],
      },
      {
        name: 'San Jose del Monte City',
        coords: [14.8139, 121.0453],
        barangays: ["Poblacion","Ciudad Real","Dulong Bayan","Francisco Homes-Guijo","Francisco Homes-Mulawin","Francisco Homes-Narra","Francisco Homes-Yakal","Gaya-gaya","Graceville","Kaybanban","Kaypian","Minuyan Proper","Muzon Proper","Muzon East","Muzon West","Muzon South","Paradise III","San Manuel","San Martin de Porres","San Pedro","San Rafael I-V","San Roque","Sapang Palay Proper","Santo Cristo","Tungkong Mangga"],
      },
      {
        name: 'Meycauayan City',
        coords: [14.7389, 120.9583],
        barangays: ["Poblacion","Bagbaguin","Bahay Pare","Bancal","Bañga","Bayugo","Caingin","Calvario","Camalig","Hulo","Iba","Langka","Lawa","Libtong","Liputan","Malhacan","Pajo","Pandayan","Pantoc","Perez","Saluysoy","Tugatog","Ubihan","Zamora"],
      },
      {
        name: 'Baliuag (Baliwag)',
        coords: [14.9536, 120.9008],
        barangays: ["Poblacion","Bagong Nayon","Barangca","Calantipay","Catulinan","Concepcion","Hinukay","Makinabang","Matangtubig","Pagala","Paitan","Piel","Pinagbarilan","Poblacion","Sabang","San Jose","San Roque","Santa Barbara","Santo Cristo","Santo Niño","Subic","Sulivan","Tangos","Tarcan","Tiaong","Tibag","Virgen delas Flores"],
      },
      {
        name: 'Marilao',
        coords: [14.7583, 120.9472],
        barangays: ["Poblacion I","Poblacion II","Abangan Norte","Abangan Sur","Ibayo","Lambakin","Lias","Loma de Gato","Nagbalon","Patubig","Prenza I","Prenza II","Santa Rosa I","Santa Rosa II","Tabing Ilog"],
      },
      {
        name: 'Santa Maria',
        coords: [14.8194, 120.9611],
        barangays: ["Poblacion","Bagbaguin","Balasing","Buenavista","Bulac","Camangyanan","Catmon","Caypombo","Caysio","Guyong","Lalacuhan","Mag-asawang Sapa","Mahabang Parang","Manggahan","Parada","Pulong Buhangin","San Gabriel","San Jose Patag","San Vicente","Santa Clara","Santa Cruz","Silangan","Tabing Bakod","Tumana"],
      },
      {
        name: 'Bocaue',
        coords: [14.8, 120.9333],
        barangays: ["Poblacion","Antipona","Bagumbayan","Bambang","Batia","Biñang 1st","Biñang 2nd","Bolacan","Bundukan","Bunlo","Caingin","Duhat","Igulot","Lolomboy","Sulucan","Taal","Tambobong","Turo","Wakas"],
      },
    ],
  },
  'Nueva Ecija': {
    name: 'Nueva Ecija',
    coords: [15.5833, 120.9667],
    municipalities: [
      {
        name: 'Cabanatuan City',
        coords: [15.4858, 120.9672],
        barangays: ["Poblacion","Barrera District","Bitas","Cabu","Camp Tinio","Cruz Roja","Dicarma","General Luna","Hermogenes C. Concepcion, Sr.","Imelda District","Kapitan Pepe","Mabini Extension","Magsaysay Norte","Magsaysay Sur","Mayapyap Norte","Mayapyap Sur","Padre Burgos","Pag-asahan","San Josef Sur","San Roque Norte","San Roque Sur","Santa Arcadia","Sumacab Este","Sumacab Norte","Sumacab South","Valdefuente","Valle Cruz","Zulueta District"],
      },
      {
        name: 'Palayan City',
        coords: [15.5408, 121.0847],
        barangays: ["Atate (Poblacion)","Aulo","Bagong Buhay","Cabaluay","Caimito","Doña Josefa","Ganaderia","Imelda Valley","Langka","Malate","Manacnac","Maple","Popolon","Singalat"],
      },
      {
        name: 'Gapan City',
        coords: [15.3083, 120.95],
        barangays: ["San Vicente (Poblacion)","Balanay","Bayanihan","Bulaklak","Bungo","Kapalangan","Mabunga","Maburak","Mahipon","Malimba","Mangino","Marelo","Pambuan","Parcutela","Putan","San Lorenzo","San Nicolas","San Roque","Santa Cruz","Santo Cristo Norte","Santo Cristo Sur","Santo Niño"],
      },
      {
        name: 'San Jose City',
        coords: [15.7917, 120.9917],
        barangays: ["Rafael Rueda, Sr. (Poblacion)","Abar 1st","Abar 2nd","Bagong Sikat","Caanawan","Calaocan","Camanacsacan","Culimy","Dizol","Ferdinand E. Marcos","Kita-Kita","Malasin","Manicla","Palestina","Pinili","Porais","San Agustin","San Juan","San Mauricio","Santo Niño 1st","Santo Niño 2nd","Santo Niño 3rd","Sibut","Sinamar","Tabulac","Tayabo","Tondod","Tulat","Villa Flores","Villa Joson","Villa Marina"],
      },
      {
        name: 'Science City of Muñoz',
        coords: [15.7117, 120.9036],
        barangays: ["Poblacion East","Poblacion North","Poblacion South","Poblacion West","Bagong Sikat","Balante","Bantug","Bical","CLSU (Central Luzon State Univ)","Calabalabaan","Calisitan","Catalanacan","Curva","Franza","Gabaldon","Labney","Licaong","Linglingay","Mangandingay","Mapangpang","Maragol","Matingkis","Naglabrahan","Palusapis","Pandalla","Rang-ayan","Rizal","San Antonio","San Andres","San Felipe","Sapang Cauayan","Villa Cuizon","Villa Isla","Villa Nati","Villa Santos","Villa Soriente"],
      },
      {
        name: 'Guimba',
        coords: [15.6583, 120.7667],
        barangays: ["Santa Veronica (Poblacion)","Agcano","Ayos Lomboy","Bacayao","Bagong Barrio","Balbalino","Bantug","Bunol","Caballero","Cabaruan","Camiling","Cavite","Cawayan Bugtong","Consuelo","Culong","Faigal","Galvan","Guiset","Macamabang","Macatcat East","Macatcat West","Manacsac","Manggang Marikit","Nagpandayan","Narvacan","Pacac","Partida 1st","Partida 2nd","Pasong Intsik","Saint John","San Agustin","San Andres","San Bernardino","San Marcelino","San Miguel","San Rafael","San Roque","Santa Ana","Santa Cruz","Subol","Tampac 1st","Tampac 2nd","Tampac 3rd","Triala","Yuzon"],
      },
      {
        name: 'Talavera',
        coords: [15.5833, 120.9167],
        barangays: ["Maestrang Kikay (Poblacion)","Pag-asa (Poblacion)","Andal Alino","Bagong Sikat","Bakod Bayan","Baluga","Bantug","Bapor","Basang Hamog","Bugtong na Buli","Bulac","Burnay","Caaniplan","Cabiangan","Calipahan","Campos","Collado","Dimasalang Norte","Dimasalang Sur","Dinarayat","Esguerra","General Luna","Homestead I","Homestead II","Kinalanguyan","La Torre","Lomboy","Mamandil","Marcos District","Matias District","Pagas","Pinagpanaan","Poblacion Sur","Pulong San Miguel","Sampaloc","San Miguel na Munti","San Pascual","San Ricardo","Sibul","Tabacao","Tagche","Valle"],
      },
    ],
  },
  'Tarlac': {
    name: 'Tarlac',
    coords: [15.4833, 120.5833],
    municipalities: [
      {
        name: 'Tarlac City',
        coords: [15.4802, 120.5979],
        barangays: ["Poblacion","Aguso","Alvindia","Amucao","Armenia","Asturias","Atioc","Balanti","Balete","Balibago I","Balibago II","Balingcanaway","Banaba","Bantog","Baras-baras","Batang-batang","Binauganan","Bora","Buenavista","Buhilit","Burot","Calingcuan","Capehan","Carangian","Care","Central","Culipat","Cut-cut I","Cut-cut II","Dalayap","Dela Paz","Dolores","Laoang","Ligtasan","Mabini","Maligaya","Maliwalo","Mapaci","Matatalaib","Paraiso","Salapungan","San Carlos","San Francisco","San Isidro","San Jose","San Jose de Urquico","San Juan Bautista","San Juan de Mata","San Luis","San Manuel","San Miguel","San Nicolas","San Pablo","San Pascual","San Rafael","San Sebastian","San Vicente","Santa Cruz","Santa Maria","Santo Cristo","Santo Domingo","Santo Niño","Sapang Maragul","Sapang Tagalog","Sepung Calzada","Sinait","Suizo","Tariji","Tibag","Tibagan","Trinidad","Ungot","Villa Bacolor"],
      },
      {
        name: 'Capas',
        coords: [15.3333, 120.5833],
        barangays: ["Sto. Domingo 1st (Poblacion)","Sto. Domingo 2nd","Aranguren","Bueno","Cristo Rey","Cubcub","Cutcut 1st","Cutcut 2nd","Dolores","Estrada (New Clark City)","Lawy","Manga","Manlapig","Maruglu","O'Donnell","Santa Juliana","Santa Lucia","Santa Rita","Santo Rosario","Talaga"],
      },
      {
        name: 'Concepcion',
        coords: [15.325, 120.6556],
        barangays: ["San Nicolas (Poblacion)","Alfonso","Balutu","Cafe","Calius Gueco","Caluluan","Castillo","Corazon de Jesus","Culatingan","Dungan","Dutung-a-Matas","Green Village","Lilibangan","Mabilog","Magao","Malupa","Minane","Panalicsican","Pando","Parang","Parulung","Pitabunan","San Agustin","San Antonio","San Bartolome","San Francisco","San Isidro","San Jose","San Juan","San Martin","San Nicolas","San Pedro","San Roque","San Vicente","Santa Cruz","Santa Maria","Santa Rita","Santo Cristo","Santo Niño","Santo Rosario","Talimundoc Marimla","Talimundoc San Miguel","Telabanca","Tinang"],
      },
      {
        name: 'Paniqui',
        coords: [15.6667, 120.5833],
        barangays: ["Poblacion Norte","Poblacion Sur","Acocolao","Aduas","Apulid","Balaoang","Barang","Briones","Cabayaoasan","Canan","Caridad","Cayanga","Colibangbang","Coral","Dapdap","Estacion","Mabilang","Manaois","Nancalinan","Salumague","Samput","San Carlos","San Isidro","San Juan de Milla","Santa Ines","Tablang","Ventenilla"],
      },
      {
        name: 'Camiling',
        coords: [15.6833, 120.4167],
        barangays: ["Poblacion A-J","Anoling 1st","Anoling 2nd","Banga-banga","Bilad","Birbira","Bobon 1st","Bobon 2nd","Cabanabaan","Cacamilingan Norte","Cacamilingan Sur","Caniwing","Florida","Lasong","Libueg","Malacampa","Manaois","Matubog","Nagrambacan","Palimbo Proper","Pao 1st","Pao 2nd","Pao 3rd","Papaac","Pindongan Centro","San Esteban","San Isidro","San Jose","San Juan","Santa Maria","Sawat","Sinilian 1st","Sinilian 2nd","Sinilian 3rd","Sinulatan 1st","Sinulatan 2nd","Surgui 1st","Surgui 2nd","Tambugan","Telbang"],
      },
    ],
  },
  'Zambales': {
    name: 'Zambales',
    coords: [15.3333, 120],
    municipalities: [
      {
        name: 'Olongapo City',
        coords: [14.8386, 120.2842],
        barangays: ["Asinan","Banicain","Barretto (Subic Bay Beach)","East Bajac-bajac","East Tapinac","Gordon Heights","Kalaklan","Mabayuan","New Cabalan","New Ilalim","New Kababae","New Kalalake","Old Cabalan","Pag-asa","Santa Rita","West Bajac-bajac","West Tapinac"],
      },
      {
        name: 'Iba',
        coords: [15.3267, 119.9792],
        barangays: ["Poblacion","Amungan","Bangantalinga","Dirita-Baloganon","Lipay-Dingin-Panibuatan","Palanginan","San Agustin","Santa Barbara","Santo Rosario","Zone 1","Zone 2","Zone 3","Zone 4","Zone 5","Zone 6"],
      },
      {
        name: 'Subic',
        coords: [14.8833, 120.2333],
        barangays: ["Baraca-Camachile (Poblacion)","Aningway Sacatihan","Asinan Poblacion","Asinan Proper","Calapacuan","Calapandayan","Cawag","Ilwas","Mangan-Vaca","Matain","Naugsol","Pamatawan","San Isidro","Santo Tomas","Sucol","Wawandue"],
      },
      {
        name: 'Castillejos',
        coords: [14.9333, 120.2],
        barangays: ["San Juan (Poblacion)","Balaybay","Buenavista","Del Pilar","Looc","Magsaysay","Nagbayan","Nagbunga","San Agustin","San Jose","San Nicolas","San Pablo","San Roque","Santa Maria"],
      },
      {
        name: 'Botolan',
        coords: [15.2833, 120.0333],
        barangays: ["Poblacion","Bancal","Bangan","Batonlapoc","Belbel","Beneg","Binuclutan","Burgos","Cabatuan","Capayawan","Carael","Danacbunga","Maguisguis","Malomboy","Mambog","Moraza","Nacolcol","Owaog-Nibloc","Paco","Palis","Panan","Parel","Paudpod","Poblacion","Poonbato","Porac","San Isidro","San Jose","San Juan","San Miguel","Santiago","Tampo","Taugtog","Villar"],
      },
      {
        name: 'San Marcelino',
        coords: [14.9833, 120.2],
        barangays: ["Central (Poblacion)","Aglao","Buhawen","Consuelo Norte","Consuelo Sur","La Paz","Laoag","Linasin","Linusungan","Lucero","Nagbunga","Rabanes","San Guillermo","San Isidro","San Rafael","Santa Fe"],
      },
    ],
  },
  'Quezon': {
    name: 'Quezon',
    coords: [14, 121.9167],
    municipalities: [
      {
        name: 'Lucena City',
        coords: [13.9372, 121.6172],
        barangays: ["Barangay 1 (Poblacion)","Barangay 2","Barangay 3","Barangay 4","Barangay 5","Barangay 6","Barangay 7","Barangay 8","Barangay 9","Barangay 10","Barangay 11","Barangay 12","Barra","Bocohan","Cotabato","Cotta","Dalahican","Domoit","Gulang-Gulang","Ibabang Dupay","Ibabang Iyam","Ibabang Talim","Ilayang Dupay","Ilayang Iyam","Ilayang Talim","Isabang","Kanlurang Mayao","Market View","Mayao Castillo","Mayao Crossing","Mayao Parada","Mayao Silangan","Ransohan","Salinas","Talao-Talao"],
      },
      {
        name: 'Tayabas City',
        coords: [14.025, 121.5931],
        barangays: ["Angeles Zone I (Poblacion)","Angeles Zone II","Angeles Zone III","Angeles Zone IV","Alitao","Alsam Ibaba","Alsam Ilaya","Baguio","Banilad","Bukal Ibaba","Bukal Ilaya","Calumpang","Camaysa","Dapdap","Ibabang Bukal","Ibabang Palale","Ilayang Palale","Isabang","Katigan","Lalo","Mateuna","Opias","Palale Centro","Potol","San Diego Zone I","San Diego Zone II","San Diego Zone III","San Diego Zone IV","San Isidro Zone I","San Isidro Zone II","San Jose","San Roque Zone I","San Roque Zone II","Talolong","Tamlong","Tongko","Wakewake"],
      },
      {
        name: 'Sariaya',
        coords: [13.9667, 121.5333],
        barangays: ["Poblacion 1-6","Antipolo","Balubal","Bignay 1","Bignay 2","Bucal","Castañas","Concepcion Banahaw","Concepcion Palasan","Concepcion Pinagbakahan","Gibanga","Guis-Guis San Roque","Guis-Guis Talon","Janagdong 1","Janagdong 2","Lutucan 1","Lutucan Bata","Lutucan Malabag","Mamala 1","Mamala 2","Manggalang 1","Manggalang Tulo-tulo","Montecillo","Morong","Pili","Sampaloc 1","Sampaloc 2","Sampaloc Bogon","Santo Cristo","Talaan Aplaya","Talaan Pantoc","Tubahan"],
      },
      {
        name: 'Candelaria',
        coords: [13.9333, 121.4167],
        barangays: ["Poblacion","Bukal Norte","Bukal Sur","Buenavista East","Buenavista West","Kinatihan I","Kinatihan II","Malabanban Norte","Malabanban Sur","Mangilag Norte","Mangilag Sur","Masalukot I","Masalukot II","Masalukot III","Masalukot IV","Masalukot V","Masin Norte","Masin Sur","Mayabobo","Pahinga Norte","Pahinga Sur","San Andres","San Isidro","Santa Catalina Norte","Santa Catalina Sur"],
      },
      {
        name: 'Tiaong',
        coords: [13.9667, 121.3167],
        barangays: ["Poblacion I-IV","Anastacia","Aquino","Ayusan I","Ayusan II","Behia","Bukal","Bula","Bulakin","Cabatang","Cabay","Del Rosario","Lagusan","Lalig","Lumingon","Lusacan","Paiisa","Palagaran","Quipot","San Agustin","San Isidro","San Jose","San Juan","San Pedro","Tagbakin","Talisay","Tamlong"],
      },
      {
        name: 'Gumaca',
        coords: [13.9222, 122.1],
        barangays: ["Barangay Zone I-VI (Poblacion)","Anonang","Bagong Buhay","Bantad","Batungbacal","Biga","Binambang","Buensuceso","Bungahan","Cawayan","Gitnang Barrio","Inaclagan","Labnig","Lagyo","Mabini","Magallanes","Mankilam","Panikihan","Pipisik","Progreso","Rosario","San Agustin","San Diego","San Isidro Kanluran","San Isidro Silangan","San Juan de Jesus","San Vicente","Sipi","Villa Arcaya","Villa Bota","Villa Padua","Villa Perez","Villa Victoria"],
      },
      {
        name: 'Infanta',
        coords: [14.7417, 121.65],
        barangays: ["Poblacion 1","Poblacion 38","Poblacion 39","Agos-agos","Alitas","Amolongin","Anoling","Antikin","Bacong","Balobo","Bantilan","Banugao","Batican","Binonoan","Binulasan","Boboin","Catambungan","Cawayanin","Comon","Dinahican","Gumian","Ilog","Ingas","Libjo","Lual","Magsaysay","May-it","Miswa","Pilaway","Pinaglapatan","Pulo","Silang","Tongohin","Tudturan"],
      },
    ],
  },
  'Marinduque': {
    name: 'Marinduque',
    coords: [13.4167, 121.9167],
    municipalities: [
      {
        name: 'Boac',
        coords: [13.4475, 121.8411],
        barangays: ["Mataas Na Bayan (Poblacion)","Murallon","San Miguel","Agot","Agumaymayan","Amoingon","Apitong","Balagasan","Balaring","Balimbing","Bamban","Bangbangalon","Bantad","Bantay","Bayuti","Binunga","Boi","Boton","Buliasnin","Bunganay","Caganhao","Canat","Catubugan","Cawit","Daig","Daypay","Duyay","Hinukay","Ihatub","Isok 1","Isok 2","Laylay","Lupac","Mahinhin","Mainit","Malbog","Malusak","Mansiwat","Marlangga","Maybo","Mercado","Poras","Puting Buhangin","Santol","Sawi","Tabi","Tabigue","Tagumpay","Tampus","Tanza","Tugos","Tumagabok","Tumapon"],
      },
      {
        name: 'Santa Cruz',
        coords: [13.4833, 122.0333],
        barangays: ["Poblacion","Alobo","Angas","Aturan","Bagacay","Bagting","Balogo","Bani","Biga","Botilao","Buyabod","Dating Gat","Devilla","Dolores","Haguimit","Hupi","Kaganhao","Kalubakis","Kasily","Kilo-kilo","Kinyaman","Labo","Lamesa","Landy","Lapu-lapu","Libjo","Lipa","Lusok","Maharlika","Makulapnit","Maniwaya Island","Marapilit","Masaguisi","Masalukot","Matalaba","Mongpong Island","Morales","Napo","Pag-asa","Pantayin","Polo","San Antonio","San Isidro","Tagum","Tamayo","Tambangan","Tawiran","Taytay"],
      },
      {
        name: 'Gasan',
        coords: [13.3167, 121.85],
        barangays: ["Barangay I-III (Poblacion)","Antipolo","Bachao Ibaba","Bachao Ilaya","Bacong-Bacong","Bahi","Bangbang","Banot","Banuyo","Bognuyan","Cabugao","Dawis","Dili","Libtangin","Mahunig","Mangiliway","Matabao","Pinggan","Poblacion","Tabionan","Tapuyan","Tiguion"],
      },
      {
        name: 'Mogpog',
        coords: [13.4833, 121.8667],
        barangays: ["Market Site (Poblacion)","Villa Mendez","Anapog-Sibucao","Argao","Balanacan (Port)","Banto","Bintakay","Bocboc","Butansapa","Candahon","Capayang","Danao","Dulong Bayan","Gitnang Bayan","Guisian","Hinadharan","Hinukay","Ino","Janagdong","Lamesa","Laon","Magapua","Malayak","Malusak","Mampaitan","Mangyan-Mababad","Market Site","Mataas na Bayan","Mendez","Nangka 1","Nangka 2","Paye","Pili","Poblacion","Puting Buhangin","Sayao","Silangan","Sumangga","Tarug"],
      },
      {
        name: 'Torrijos',
        coords: [13.3167, 122.0833],
        barangays: ["Poblacion","Bangwayin","Bayakbakin","Bolo","Bonliw","Buangan","Cabuyo","Cagpo","Dampulan","Kay Duke","Mabuhay","Makawayan","Malinao","Maranlig","Marlangga","Matuyatuya","Napo","Pakaskasan","Payanas","Poblacion","Poctoy (White Beach)","Sibuyao","Suha","Talawan","Tigwi"],
      },
      {
        name: 'Buenavista',
        coords: [13.25, 121.95],
        barangays: ["Bagacay","Bagtingon","Bicas-bicas","Caigangan","Daykitin","Libas","Malbog","Sihi","Timbo","Tungib-Lipata","Yook"],
      },
    ],
  },
  'Occidental Mindoro': {
    name: 'Occidental Mindoro',
    coords: [13, 120.75],
    municipalities: [
      {
        name: 'Mamburao',
        coords: [13.2233, 120.5964],
        barangays: ["Poblacion 1-8","Balansay","Fatima","Payompon","San Luis","Talabaan","Tangalan","Tayamaan"],
      },
      {
        name: 'San Jose',
        coords: [12.3528, 121.0675],
        barangays: ["Poblacion 1-8","Ansiray","Bagong Sikat","Bangkal","Barangay 1","Barangay 2","Batasan","Bayotbot","Bubog","Buri","Caminawit","Catayungan","Central","Iling Proper","Inasakan","Labangan Ilog","Labangan Poblacion","Magbay","Mangarin","Mapaya","Murtha","Natandol","Pag-asa","Pawican","San Agustin","San Isidro","San Roque"],
      },
      {
        name: 'Sablayan',
        coords: [12.8333, 120.7667],
        barangays: ["Buenavista","Burgos","Claudio Salgado","General Emilio Aguinaldo","Iblo","Ilvita","Lagnas","Ligaya","Malisbong","Poblacion","San Agustin","San Francisco","San Nicolas","San Vicente","Santa Lucia","Santo Niño","Tagumpay","Tuban","Victoria"],
      },
      {
        name: 'Abra de Ilog',
        coords: [13.45, 120.7333],
        barangays: ["Poblacion","Armado","Cabacao","Lumangbayan","San Vicente","Tibag","Udalo","Wawa"],
      },
      {
        name: 'Lubang',
        coords: [13.8583, 120.125],
        barangays: ["Agsunang","Binacas","Cabuyao","Likas Kamaynilaan","Maligaya","Maliig","Tagbac","Tangal","Vigo"],
      },
    ],
  },
  'Oriental Mindoro': {
    name: 'Oriental Mindoro',
    coords: [13, 121.4167],
    municipalities: [
      {
        name: 'Calapan City',
        coords: [13.4117, 121.1803],
        barangays: ["Poblacion","Balingayan","Balite","Baruyan","Batino","Bayanan I","Bayanan II","Biga","Bondoc","Bucayao","Buhuan","Bulusan","Calero","Camansihan","Camilmil","Canubing I","Canubing II","Comunal","Guinobatan","Gulod","Gutad","Ibaba East","Ibaba West","Ilaya","Lalud","Lazareto","Libis","Lumangbayan","Mahal na Pangalan","Maidlang","Malprimitivo","Masipit","Nag-iba I","Nag-iba II","Navotas","Pachoca","Palhi","Panggalaan","Parang","Patas","Personas","Puting Tubig","Salong","San Antonio","San Vicente Central","San Vicente East","San Vicente North","San Vicente South","San Vicente West","Santa Cruz","Santa Isabel","Santa Maria Village","Santa Rita","Santo Niño","Sapul","Silonay","Suqui","Tawagan","Tawiran","Tibag","Wawa"],
      },
      {
        name: 'Puerto Galera',
        coords: [13.5, 120.95],
        barangays: ["Poblacion","Aninuan","Baclayan","Balatero","Dulangan","Palangan","Sabang (Dive Resort)","San Antonio","San Isidro (White Beach)","Santo Niño","Sinandigan","Tabinay","Villaflor"],
      },
      {
        name: 'Naujan',
        coords: [13.3167, 121.3],
        barangays: ["Poblacion 1-3","Adrialuna","Andres Ylagan","Antipolo","Apitong","Arangin","Aurora","Bacungan","Baghobong","Balite","Bancuro","Banuton","Barcenaga","Bayani","Buhangin","Caburo","Concepcion","Dao","Del Pilar","Estrella","Evangelista","Gamao","General Esco","Herrera","Inarawan","Kalinisan","Laguna","Mabini","Magtibay","Mahabang Parang","Malaya","Malinao","Malinao","Masagana","Masaguing","Melgar A","Melgar B","Metorex","Montelago","Montemayor","Motoderazo","Mulawin","Nag-iba I","Nag-iba II","Pag-asa","Paitan","Paniquian","Pinagsabangan I","Pinagsabangan II","Piña","Sampaguita","San Agustin I","San Agustin II","San Andres","San Carlos","San Isidro","San Jose","San Luis","San Nicolas","San Pedro","Santa Cruz","Santa Isabel","Santa Maria","Santo Niño","Tagbakin","Tigkan"],
      },
      {
        name: 'Pinamalayan',
        coords: [13.05, 121.4833],
        barangays: ["Zone I-IV (Poblacion)","Anoling","Bacungan","Bangbang","Bonglig","Cacawan","Calingag","Del Razon","Guinhawa","Inclanay","Lumambayan","Malaya","Maliangcog","Maningcol","Marayos","Marfrancisco","Nabuslot","Pagalagala","Palayan","Pambisan Malaki","Pambisan Munti","Panggulayan","Papandayan","Pili","Quinabigan","Ranzo","Rosario","Sabang","Santa Isabel","Santa Maria","Santa Rita","Santo Niño","Wawa"],
      },
      {
        name: 'Roxas',
        coords: [12.5833, 121.5167],
        barangays: ["Bagumbayan (Poblacion)","Cantil","Dangay (Port)","Happy Valley","Libertad","Mabuhay","Maray","Odiong","Paclasan","San Aquilino","San Isidro","San Jose","San Mariano","San Miguel","San Rafael","San Vicente","Santo Niño","Victoria","Little Tanauan"],
      },
    ],
  },
  'Romblon': {
    name: 'Romblon',
    coords: [12.55, 122.2833],
    municipalities: [
      {
        name: 'Romblon',
        coords: [12.5786, 122.2694],
        barangays: ["Barangay I-IV (Poblacion)","Agbaluto","Agpanabat","Agnaga","Agnipa","Agtiwa","Alad Island","Bagacay","Cajimos","Calabogo","Capaclan","Cobrador Island","Ipil","Layog","Libertad","Logbon Island","Lunas","Lonos","Macalas","Mapula","Palje","Sablayan","Sawang","Sua","Tambac"],
      },
      {
        name: 'Odiongan',
        coords: [12.4, 121.9833],
        barangays: ["Poblacion","Amatong","Anahao","Bangon","Batiano","Budiong","Canduyong","Dapawan","Gabawan","Libertad","Malilico","Mayha","Panique","Pato-o","Poctoy","Progreso East","Progreso West","Rizal","San Agustin","San Andres","San Antonio","San Fernando","San Isidro","San Jose","San Roque","San Vicente","Tabing Dagat","Tabobo-an","Tuburan","Tumingad"],
      },
      {
        name: 'San Agustin',
        coords: [12.5667, 122.1333],
        barangays: ["Poblacion","Bachawan","Binongaan","Bunsuran","Cabolutan","Cagbo-aya","Camindan","Carmen","Cawayan","Doña Juana","Dubduban","Hinugusan","Lusong","Mahabangbaybay","Sugod"],
      },
      {
        name: 'Cajidiocan',
        coords: [12.3667, 122.6833],
        barangays: ["Poblacion","Alibagon","Cambajao","Cambalo","Cambug","Camaligan","Cantagda","Danaol","Gutiphoc","Lico","Marigondon","Sugod","Taguilos"],
      },
    ],
  },
  'Albay': {
    name: 'Albay',
    coords: [13.1667, 123.6667],
    municipalities: [
      {
        name: 'Legazpi City',
        coords: [13.1391, 123.7438],
        barangays: ["Albay District (Poblacion)","Port District","Bagacay","Bagong Abre","Bigaa","Bitano","Bogtong","Bonot","Cabangan","Cruzada","Dap-dap","Em's Barrio","Gogon","Homapon","Ilawod","Imperial Court","Kapantayan","Mabinit (Mayon slope)","Oro Site","Pawa","Peñaranda","Rawis","Sagpon","San Roque","Tamaoyan","Taysan","Victory Village"],
      },
      {
        name: 'Daraga',
        coords: [13.15, 123.7],
        barangays: ["Poblacion","Alcala","Bañag","Bascaran","Bigao","Binitayan","Busay (Cagsawa Ruins)","Cullat","De La Paz","Dinoronan","Gapo","Ibaugan","Ilawod","Kilicao","Kimantong","Lacag","Malabog","Maroroy","Mi-isi","Namantao","Pandit","Peñafrancia","Sagpon","Salvacion","San Rafael","San Roque","Tabon-tabon","Tagas"],
      },
      {
        name: 'Ligao City',
        coords: [13.2333, 123.5333],
        barangays: ["Bagumbayan (Poblacion)","Amtic","Bacolod","Baligang","Barangay 1-5","Batang","Binanowan","Binatagan","Cavasi","Dunao","Francia","Guilid","Layon","Mahaba","Nasisi","Paulba","Panday","Ranao-ranao","Santa Cruz","Tagpo","Tandarora","Tinago","Tuburan"],
      },
      {
        name: 'Tabaco City',
        coords: [13.3589, 123.7317],
        barangays: ["Poblacion","Barangay 1-5","Bacolod","Bañadero","Baranghawon","Bogñabong","Bongao","Fatima","Karangahan","Mariroc","Matagbac","Panal","Pawa","Quinale Cabaloa","San Antonio","San Carlos","San Isidro","San Lorenzo","San Ramon","San Roque","Santo Cristo","Tagas","Tayhi"],
      },
      {
        name: 'Camalig',
        coords: [13.1667, 123.65],
        barangays: ["Poblacion","Anoling","Baligbog","Bariw","Binitayan","Bongabong","Cabagñan","Caguiba","Calabidongan","Comun","Cotmon","Del Rosario","Gapo","Ilawod","Libod","Ligban","Maninila","Mina","Palanog","Panoypoy","Quirangay","Salugan","Solong","Sua","Sumlang (Sumlang Lake)","Tagaytay","Taguan","Tinago"],
      },
      {
        name: 'Guinobatan',
        coords: [13.2, 123.6],
        barangays: ["Poblacion","Agpay","Balite","Banao","Calzada","Catomag","Doña Mercedes","Ilawod","Inascan","Iraya","Lower Binogsacan","Malabnig","Malipo","Maninila","Mapaco","Marcial O. Rañola","Masarawag","Mauraro","Minto","Muladbucad Grande","Muladbucad Pequeño","Ongo","Palanas","Quitago","San Bernardo","San Francisco","San Jose","San Rafael","San Roque","Sinungtan","Tandarora","Travesia","Upper Binogsacan"],
      },
    ],
  },
  'Camarines Norte': {
    name: 'Camarines Norte',
    coords: [14.1667, 122.75],
    municipalities: [
      {
        name: 'Daet',
        coords: [14.1122, 122.9553],
        barangays: ["Barangay I-VIII (Poblacion)","Alawihao","Awitan","Bagasbas (Surfing Beach)","Bibirao","Borabod","Calasgasan","Camambugan","Cobangbang","Dogongan","Gahonon","Gubat","Lag-on","Magang","Mancruz","Pamorangon","San Isidro"],
      },
      {
        name: 'Labo',
        coords: [14.15, 122.8333],
        barangays: ["Poblacion","Anahaw","Anameam","Awitan","Baay","Bagador","Bagong Silang I","Bagong Silang II","Bakiad","Bautista","Bayabas","Bayan-bayan","Benit","Bulhao","Cabatuhan","Calamagon","Canapawan","Daguit","Dalas","Dumagmang","Fundado","Guac","Guba","Guinto","Iberica","Lugui","Mabilo I","Mabilo II","Macogon","Mahawan-hawan","Malangcauayan","Malasugui","Malatap","Malawaan","Masalong","Matanag","Nangalisan","Pag-asa","Pangpang","Pinya","San Antonio","San Francisco","Santa Cruz","Submakin","Talabatab","Tigbinan","Tulay na Bato"],
      },
      {
        name: 'Jose Panganiban',
        coords: [14.2833, 122.6833],
        barangays: ["South Poblacion","North Poblacion","Bagong Bayan","Calero","Dahican","Dayhagan","Larap","Luklukan Norte","Luklukan Sur","Motherlode","Nakalaya","Osmeña","Paracale","Plaridel","Salvacion","San Isidro","San Jose","San Martin","San Pedro","San Rafael","Santa Cruz","Santa Elena","Santa Milagrosa","Santa Rosa Norte","Santa Rosa Sur","Tamisan"],
      },
      {
        name: 'Basud',
        coords: [13.9833, 122.9667],
        barangays: ["Poblacion 1","Poblacion 2","Angat","Bactas","Binatagan","Caayunan","Guinatungan","Hinampacan","Langga","Laniton","Lidong","Mampili","Mandazo","Mangcamagong","Manmuntay","Matnog","Mocong","Oliva","Pagsangahan","Pinagwarasan","Plaridel","San Felipe","San Jose","San Pascual","Taba-taba","Togawe","Tuaca"],
      },
      {
        name: 'Mercedes',
        coords: [14.1167, 123.0167],
        barangays: ["Barangay I-VII (Poblacion)","Apuao","Barangay 1","Barangay 2","Caringo","Catandunganon","Cayucyucan","Colasi","Del Rosario","Gumabao","Hamoraon","Hinulid","Lalawigan","Lanot","Mambungalon","Manguisoc","Masalongsalong","Matoogtoog","Pambuhan","Quinapaguian","San Roque","Tarum"],
      },
    ],
  },
  'Camarines Sur': {
    name: 'Camarines Sur',
    coords: [13.6667, 123.3333],
    municipalities: [
      {
        name: 'Naga City',
        coords: [13.6218, 123.1948],
        barangays: ["Centro (Poblacion)","Abella","Bagumbayan Norte","Bagumbayan Sur","Balatas","Calauag","Cariongan","Concepcion Grande","Concepcion Pequeña","Dayangdang","Del Rosario","Dinaga","Igualdad","Lerma","Liboton","Mabolo","Pacol","Panicuason (Mt Isarog)","Peñafrancia","Sabang","San Felipe","San Francisco","San Isidro","Santa Cruz","Tabuco","Tinago","Triangulo"],
      },
      {
        name: 'Iriga City',
        coords: [13.4167, 123.4167],
        barangays: ["San Roque (Poblacion)","San Francisco","San Juan","San Nicolas","Cristo Rey","Del Rosario","Francia","La Anunciacion","La Medalla","La Purisima","La Trinidad","Niño Jesus","Perpetual Help","Sagrada","Salvacion","San Agustin","San Antonio","San Isidro","San Jose","San Miguel","San Pedro","San Rafael","San Ramon","San Vicente Norte","San Vicente Sur","Santa Cruz Norte","Santa Cruz Sur","Santa Elena","Santa Isabel","Santa Maria","Santa Teresita","Santiago","Santo Domingo","Santo Niño"],
      },
      {
        name: 'Pili',
        coords: [13.5833, 123.2833],
        barangays: ["Cadlan (Capitol)","San Agustin (Poblacion)","San Antonio","San Isidro","San Jose","San Juan","San Roque","San Vicente","Anayan","Bagong Sirang","Binanuaanan","Bongoran","Caroyroyan","Curry","Del Rosario","Himaao","La Purisima","New San Roque","Old San Roque","Palestina","Pawili","Sagurong","San Jose","Santiago","Santo Niño","Tagbong","Tinangis"],
      },
      {
        name: 'Caramoan',
        coords: [13.7667, 123.8667],
        barangays: ["Tawog (Poblacion)","Cadag-cagan","Canatan","Capucnasan","Colongcogong","Daraga","Gogon","Ilawod","Illorongan","Malabog","Maligaya","Mampirao","Paniman (Beach)","Patag-Belen","Pili-Centro","Pili-Tabgon","Poblacion","Salvacion","San Roque","Tabgon","Terogo"],
      },
      {
        name: 'Calabanga',
        coords: [13.7, 123.1833],
        barangays: ["San Francisco (Poblacion)","San Antonio","San Isidro","San Pablo","San Pedro","San Vicente","Santa Cruz","Santa Isabel","Balatasan","Balombon","Binanuaanan Grande","Binanuaanan Pequeño","Burabod","Cagsao","Comaguingking","Dominorog","Harubay","La Purisima","Lugsad","Manguiring","Pagatpat","Paolbo","Pinada","Punta Tarawal","Quinale","Sabang","Salvacion-Baybay","San Bernardino","San Lucas","San Miguel","San Roque","Santa Salud","Santo Domingo","Santo Niño","Sibobo","Tomagodtoc"],
      },
    ],
  },
  'Catanduanes': {
    name: 'Catanduanes',
    coords: [13.7833, 124.25],
    municipalities: [
      {
        name: 'Virac',
        coords: [13.5806, 124.2389],
        barangays: ["Concepcion (Poblacion)","Francia","Gogon Centro","Gogon Sirangan","Igang","Lanao","Magnesia del Norte","Magnesia del Sur","Marcelo Alberto","Palnab del Norte","Palnab del Sur","Poblacion","Rawis","Salvacion","San Isidro Village","San Jose","San Pablo","San Pedro","San Roque","San Vicente","Santa Cruz","Santa Elena","Santo Cristo","Santo Domingo","Santo Niño","Simamla","Sipi","Talisoy","Valencia"],
      },
      {
        name: 'Baras',
        coords: [13.6667, 124.3667],
        barangays: ["Eastern Poblacion","Western Poblacion","Abihao","Agban","Batoffag","Benticayan","Buenavista","Caraganan","Danaol","Guba","Macutal","Moning","Nagbalitnin","Osol","Pangilao","Puraran (Majestics Surfing)","Putsan","Quezon","Rizal","Sagrada","Salvacion","San Lorenzo","San Miguel","Santa Maria","Tilod","Tilod"],
      },
      {
        name: 'San Andres (Calolbon)',
        coords: [13.6, 124.1],
        barangays: ["Belmonte (Poblacion)","Bislig","Bonoan","Cabcab","Cabungahan","Catagbacan","Codon","Comagaycay","Datag","Divino Rostro","Esperanza","Hilawan","Lictin","Lubas","Manambrong","Mayngaway","Palawig","Poblacion","Putian","Rizal","Salvacion","San Jose","San Roque","San Vicente","Santa Cruz","Timbaan","Tominawog","Wagdas","Yocto"],
      },
      {
        name: 'Pandan',
        coords: [14.05, 124.1667],
        barangays: ["Poblacion","Bagawang","Balagñonan","Baldoc","Canlubi","Catamban","Cobob","Hiyop","Libod","Lugo","Marilima","Oga","Pangilinan","Porot","San Andres","San Isidro","San Jose","San Rafael","San Roque","Santa Cruz","Santa Maria","Santo Rosario","Tabugoc","Toki","Wagdas"],
      },
    ],
  },
  'Masbate': {
    name: 'Masbate',
    coords: [12.1667, 123.5],
    municipalities: [
      {
        name: 'Masbate City',
        coords: [12.3719, 123.63],
        barangays: ["Bapor (Poblacion)","Centro (Poblacion)","Anas","Asid","Bantigue","Barangay 1-3","Batuhan","Biga","Bolo","Bontod","Buyog","Cagay","Cawayan Exterior","Cawayan Interior","Espinosa","F. Magallanes","Ibingay","Kalipay","Kinamaligan","Malinta","Mapiña","Maynganyane","Pating","Pawa","Sinalongan","Tugbo","Ubungan","Usab"],
      },
      {
        name: 'Aroroy',
        coords: [12.5167, 123.4],
        barangays: ["Ambolong","Amoroy","Amutag","Bagauma","Balawing","Balogo","Bangon","Cabangcalan","Cabitan","Calanay","Capsay","Concepcion","Dayhagan","Don Pablo Dela Rosa","Lanang","Luy-a","Macabug","Malaga","Manamoc","Manlubang","Matalangtalang","Matangad","Matiporon","Moises R. Espinosa","Panique","Poblacion","Puro","San Agustin","San Isidro","San Jose","San Roque","Sawmill","Sohutan","Talabaan","Talentena","Tinago","Tigbao"],
      },
      {
        name: 'Milagros',
        coords: [12.2167, 123.5],
        barangays: ["Poblacion East","Poblacion West","Bacolod","Bangad","Bara","Bonbon","Calasuche","Calumpang","Capcapan","Guiom","Jamorawon","Magsalangi","Matagbac","Narra","Paraiso","San Antonio","San Carlos","San Isidro","San Pedro","Tawad","Tigbao"],
      },
      {
        name: 'Cawayan',
        coords: [11.9333, 123.7667],
        barangays: ["Poblacion","Begia","Cabungahan","Calapayan","Dalandan","Divisoria","Guiom","Itombato","Lamao","Layog","Madbad","Mahayahay","Maihao","Malbug","Palanas","Pin-as","Punta Batsan","San Jose","San Vicente","Taberna","Tuburan"],
      },
    ],
  },
  'Sorsogon': {
    name: 'Sorsogon',
    coords: [12.8333, 123.95],
    municipalities: [
      {
        name: 'Sorsogon City',
        coords: [12.9742, 124.0058],
        barangays: ["Poblacion","Abuyog","Almendras-Cogon","Balogo","Barayong","Basud","Bibincahan","Bitan-o/dalipay","Bucalbucalan","Buhatan","Buenavista","Cabid-an","Cambulaga","Capuy","Macabalo","Marinas","Pamurayan","Pangpang","Piot","Polvorista","Rizal","Salog","Sampaloc","San Isidro","San Juan","Sirangan","Sulucan","Talisay"],
      },
      {
        name: 'Bulan',
        coords: [12.6667, 123.8667],
        barangays: ["Zone 1-8 (Poblacion)","Abad Santos","Aguinaldo","Antipolo","Aquino","Beguin","Benigno S. Aquino","Biclat","Bonga","Butag","Cadandanan","Calomagon","Calpi","Cocok-Milagros","Dancalan","Fabrica","Guinto","Inararan","J.P. Laurel","Libertad","Lajong","Magsaysay","Managanaga","Marinab","Nasuje","Obrero","Osmeña","Otavi","Padre Diaz","Palale","Quezon","R. Gerona","Rector","Sagrada","San Francisco","San Isidro","San Jose","San Juan Bag-o","San Juan Daan","San Rafael","San Ramon","San Vicente","Santa Remedios","Santa Teresita","Sigad","Somag-ongsong","Tarusan","Zone 1","Zone 2","Zone 3","Zone 4","Zone 5","Zone 6","Zone 7","Zone 8"],
      },
      {
        name: 'Gubat',
        coords: [12.9167, 124.1167],
        barangays: ["Manook (Poblacion)","Cota na Daco","Ariman","Bagacay","Balud Del Norte","Balud Del Sur","Benguet","Bentuco","Beriran","Buenavista","Bulacao","Cabigaan","Cabuloan","Caranan","Casili","Dita","Jupi","Lapinig","Malandag","Nato","Nazareno","Ogao","Paco","Panganiban","Paradijon","Patag","Payawin","Rizal","San Ignacio","Santa Ana","Tagaytay","Tigkiw","Tiris","Tugawe","Villareal"],
      },
      {
        name: 'Donsol',
        coords: [12.9, 123.6],
        barangays: ["Poblacion","Alin","Awang","Banday","Banuang Gurang","Baras","Bayawas","Bororan","Cabugao","Central","Cristo","Dancalan (Whaleshark Tourism)","De La Paz","Gimaloto","Gogon","Gura","Komun","Mabini","Malapoc","Malinao","Market Site","New Maguisa","Ogod","Pangpang","Parina","Pawala","Pinamasagan","Punta Waling-waling","Rawis","San Antonio","San Isidro","San Jose","San Rafael","San Ramon","San Vicente","Santa Cruz","Sevilla","Sibago","Sowangan","Tinonan","Tres Marias","Tubigan","Vinisitahan"],
      },
      {
        name: 'Matnog',
        coords: [12.5833, 124.0833],
        barangays: ["Camachiles (Poblacion)","Balocawe","Banogao","Banuangv-daan","Bariis","Bolo","Bon-ot Big","Bon-ot Small","Cabagahan","Calintaan (Subic Beach)","Caloocan","Calpi","Camcamanan","Coron-coron","Culasi","Gadgaron","Genablan Occidental","Genablan Oriental","Laboy","Lajong","Mambajog","Manjumlad","Manurabi","Poblacion","Poropandan","Rizal","Sampao","San Francisco","San Isidro","San Roque","San Vicente","Sinalmacan","Sinanlagan","Sinimbahan","Sua","Sulangan","Tablac","Tabontabon","Tugas"],
      },
    ],
  },
  'Aklan': {
    name: 'Aklan',
    coords: [11.6667, 122.3333],
    municipalities: [
      {
        name: 'Kalibo',
        coords: [11.7081, 122.3644],
        barangays: ["Poblacion","Andagao","Bachao Norte","Bachao Sur","Bakhaw Norte","Bakhaw Sur","Briones","Caano","Estancia","Linabuan Norte","Mabilo","Mobo","New Buswang","Old Buswang","Pook","Tigayon","Tinigaw"],
      },
      {
        name: 'Malay (Boracay)',
        coords: [11.9667, 121.9333],
        barangays: ["Balabag (Boracay Station 1 & 2)","Manoc-Manoc (Boracay Station 3)","Yapak (Boracay Puka Beach)","Poblacion","Argao","Cabebian","Caticlan (Boracay Jetty Port)","Cogon","Cubay Norte","Cubay Sur","Dumlog","Motag","Naasug","Nabaoy","Napaan","Sambiray"],
      },
      {
        name: 'New Washington',
        coords: [11.65, 122.4333],
        barangays: ["Poblacion","Candelaria","Cawayan","Dumaguit","Fatima","Guinbaliwan","Jaliobong","Layog","Mabilo","Mat-i","Mina-a","Ochando","Pinamuk-an","Poblacion","Polo","Pueblo","Tambac"],
      },
      {
        name: 'Ibajay',
        coords: [11.8167, 122.1667],
        barangays: ["Poblacion","Agdugayan","Antipolo","Aparicio","Bacan","Bagacay","Batuan","Buenavista","Bugtongbato","Cabugao","Capilijan","Colongcolong","Laguinbanua","Maloco","Naile","Naisud","Ondoy","Polo","San Isidro","San Jose","Santa Cruz","Tagbaya","Tul-ang","Unat","Yawan"],
      },
    ],
  },
  'Antique': {
    name: 'Antique',
    coords: [10.75, 122],
    municipalities: [
      {
        name: 'San Jose de Buenavista',
        coords: [10.745, 121.9419],
        barangays: ["Barangay 1-8 (Poblacion)","Atabay","Badiang","Barangay 1","Barangay 2","Barangay 3","Barangay 4","Barangay 5","Barangay 6","Barangay 7","Barangay 8","Birinayan","Bono-bono","Cansadan-Tubudan","Durog","Fundado","Igbators","Inabasan","Magcalon","Malaiba","Maybato Norte","Maybato Sur","Mojon","Pantao","San Angel","San Fernando","San Pedro"],
      },
      {
        name: 'Sibalom',
        coords: [10.7833, 122.0167],
        barangays: ["District I-IV (Poblacion)","Alangan","Bacolod","Bongbongan I","Bongbongan II","Bula","Cadolonan","Cala-anan","Catungan I","Catungan II","Catungan III","Esperanza","Iglanot","Igpanolong","Igparas","Imparayan","Indag-an","Initan","Insilayan","Lambayagan","Luna","Luyang","Maasin","Mabini","Millamena","Mojon","Nagdayao","Nazareth","Odiong","Olaga","Pangpang","Pis-anan","Ricarte","San Juan","Solong","Tabongtabong","Tig-Ohot","Villafont"],
      },
      {
        name: 'Hamtic',
        coords: [10.7, 121.9833],
        barangays: ["Poblacion 1-5","Apdo","Asluman","Banebane","Bia-an","Bongbongan I-III","Budasan","Caridad","Carit-an","Casalngan","Dangcalan","Del Pilar","Fabrica","Fundi","General Fullon","Guintas","Igbical","Igbucagay","Inabasan","Linaban","Malandog (First Malay Landing)","Mapatag","Masayo","Piapi I-III","Pu-ao","San Pedro","Villavert-Jimenez"],
      },
      {
        name: 'Culasi',
        coords: [11.4333, 122.05],
        barangays: ["Centro Poblacion","Bagacay","Balac-balac","Batunan Norte","Batunan Sur","Bitadton Norte","Bitadton Sur","Camancijan","Caridad","Condes","Esperanza","Fe","Flores","Jalandoni","Malalison Island","Marubtob","Matinicus","Naba","Nogas","Salde","San Antonio","San Gabriel","San Jose","San Juan","San Pedro","San Roque","San Vicente","Sibalalom","Simun"],
      },
    ],
  },
  'Capiz': {
    name: 'Capiz',
    coords: [11.4167, 122.75],
    municipalities: [
      {
        name: 'Roxas City',
        coords: [11.5853, 122.7511],
        barangays: ["Barangay I-XI (Poblacion)","Adlawan","Bago","Balijuagan","Banica","Barra","Bato","Baybay (Seafood Capital Beach)","Bolo","Cabugao","Cagay","Cogon","Culajao","Culasi (Port)","Dayao","Dinginan","Dumolog","Jumbo","Lawaan","Libas","Lion-g","Loctugan","Lonoy","Milibili","Mongpong","Olutayan Island","Punta Cogon","Punta Tabuc","San Jose","Sibaguan","Talon","Tanque","Tanza"],
      },
      {
        name: 'Panay',
        coords: [11.5583, 122.7917],
        barangays: ["Poblacion Ilawod","Poblacion Ilaya","Poblacion Tabuc","Agbalo","Agbanban","Agojo","Anhawan","Bago Chiquito","Bago Grande","Bahit","Baticados","Cabugao","Calapawan","Calitan","Candual","Cogon","Daga","Ilamnay","Linambasan","Magallanes","Navitas","Pawa","Talasa","Talo-to","Tuntunan"],
      },
      {
        name: 'Pontevedra',
        coords: [11.4833, 122.8333],
        barangays: ["Poblacion","Agbanog","Agdalipe","Ameligan","Bailan","Banban","Bantigue","Binuntucan","Cabugao","Guba","Hypacgaw","Ilaya","Jolongajog","Lantangan","Linampongan","Malocloc Norte","Malocloc Sur","Manapao","Rizal","San Pedro","Solo","Sublangon","Tabuc","Tacas","Yatingan"],
      },
      {
        name: 'Tapaz',
        coords: [11.2667, 122.5333],
        barangays: ["Poblacion","Acuna","Aglupacan","Agpalali","Bagacay","Bato-bato","Camburanan","Candelaria","Carida","Cristina","Da-an Banwa","Garcia","Gebio-an","Hilltop","Katipunan","Lahug","Libertad","Mabini","Malinao","Nayawan","Rizal","Roosevelt","San Antonio","San Jose","San Julian","San Miguel","San Nicolas","San Pedro","San Roque","San Vicente","Santa Ana","Santa Petronila","Santo Niño","Switch","Tabon","Tacas","Wright"],
      },
    ],
  },
  'Guimaras': {
    name: 'Guimaras',
    coords: [10.5833, 122.5833],
    municipalities: [
      {
        name: 'Jordan',
        coords: [10.6583, 122.5958],
        barangays: ["Poblacion","Alaguisoc","Balcon Maravilla","Balcon Melliza","Bugnay","Buluangan","Espinosa","Hosking","Lawigan","Morobuan","Rizal","San Miguel","Sinapsapan","Santa Teresa"],
      },
      {
        name: 'Buenavista',
        coords: [10.6833, 122.6833],
        barangays: ["Agpanike","Bacolod","Baluarte","Banoog","Calumangan","Cansilayan","Dagsa-an","Daragan","East Valencia","Getulio","Mabini","Magsaysay","Montpiller","Navalas","Nazaret","New Poblacion","Old Poblacion","Piña","Rizal","Salvacion","San Fernando","San Isidro","San Miguel","San Pedro","San Roque","Santo Rosario","Sawang","Supang","Tacay","Taminla","Tanag","Tastasan","Tinadtaran","Tubungan","Zaldivar"],
      },
      {
        name: 'Nueva Valencia',
        coords: [10.5167, 122.5167],
        barangays: ["Poblacion","Cabugao","Canhawan","Dolores","Guiwanon","Igang","Igdarapdap","La Paz","Lanipe","Lucmayan","Magamay","Napandong","Oracon Sur","Pandaraonan","Panobolon","Poblacion","San Antonio","San Roque","Santo Domingo","Tando"],
      },
      {
        name: 'San Lorenzo',
        coords: [10.6, 122.6833],
        barangays: ["Cabano","Aguilar","Cabungahan","Constancia","Gaban","Igcawayan","M. Chavez","San Enrique","Sapao","Sebaste","Suclaran","Tamborong"],
      },
      {
        name: 'Sibunag',
        coords: [10.55, 122.6167],
        barangays: ["Dasal","Alegria","Ayangan","Bubog","Concordia","Inampologan","Maabay","Millan","Oracon Norte","Ravina","Sabang","San Isidro","Sebaste","Tanglad"],
      },
    ],
  },
  'Negros Occidental': {
    name: 'Negros Occidental',
    coords: [10.1667, 123],
    municipalities: [
      {
        name: 'Bacolod City',
        coords: [10.6761, 122.9509],
        barangays: ["Barangay 1-41 (Poblacion)","Alangilan","Alijis","Banago","Bata","Cabug","Estefania","Felisa","Granada","Handumanan","Mandalagan","Mansilingan","Montevista","Pahanocoy","Punta Taytay","Singcang-Airport","Sum-ag","Taculing","Tangub","Villamonte","Vista Alegre"],
      },
      {
        name: 'Talisay City',
        coords: [10.7333, 122.9667],
        barangays: ["Zone 1-16 (Poblacion)","Bubog","Cabatangan","Concepcion","Dos Hermanas","Efigenio Lizares","Katilingban","Matab-ang","San Fernando"],
      },
      {
        name: 'Silay City',
        coords: [10.8, 122.9667],
        barangays: ["Barangay I-VI (Poblacion)","Balaring","Bagtic","Eustaquio Lopez","Guimbala-on","Hawaiian","Kapitan Ramon","Lantad","Mambulac","Patag","Rizal"],
      },
      {
        name: 'Bago City',
        coords: [10.5383, 122.8383],
        barangays: ["Poblacion","Abuanan","Alianza","Atipuluan","Bacong-Montilla","Bagroy","Balingasag","Binubuhan","Busay","Calumangan","Caridad","Dulao","Ilijan","Lag-asan","Ma-ao","Mailum","Malingin","Napoles","Pacol","Sagasa","Sampinit","Tabunan","Taloc"],
      },
      {
        name: 'Kabankalan City',
        coords: [9.9833, 122.8167],
        barangays: ["Barangay 1-9 (Poblacion)","Bantayan","Binicuil","Camansi","Camingawan","Carol-an","Daan Banua","Hilamonan","Inapoy","Linao","Locotan","Magballo","Oringao","Orong","Pinaguinpinan","Salong","Tabugon","Tagukon","Talubangi","Tampalon","Tan-awan"],
      },
      {
        name: 'San Carlos City',
        coords: [10.4833, 123.4167],
        barangays: ["Barangay 1-6 (Poblacion)","Bagonbon","Buluangan","Codcod","Ermita","Guadalupe","Nataban","Palampas","Prosperidad","Punao","Quezon","Rizal","San Juan","Sipaway Island (San Jose)"],
      },
      {
        name: 'Cadiz City',
        coords: [10.95, 123.2833],
        barangays: ["Barangay 1-6 (Poblacion)","Andres Bonifacio","Banquerohan","Burgos","Cabahug","Cadiz Viejo","Caduha-an","Celestino Villacin","Daga","Luna","Mabini","Magsaysay","Sicaba","Tiglawigan","Tinampa-an","V. F. Gustilo"],
      },
      {
        name: 'Sagay City',
        coords: [10.9, 123.4167],
        barangays: ["Poblacion 1-2","Baviera","Bulanon","Campo Himoga-an","Colonia Divina","Fabrica","General Luna","Lopez Jaena","Malubon","Molocaboc Island","Old Sagay","Paraiso","Plaridel","Puey","Rizal","Sewahon I","Taba-ao","Tadlong","Vito"],
      },
      {
        name: 'Victorias City',
        coords: [10.9, 123.0833],
        barangays: ["Barangay I-XX (Poblacion)","Gawahon","Estado","Daan Banwa"],
      },
      {
        name: 'Sipalay City',
        coords: [9.75, 122.4],
        barangays: ["Barangay 1-5 (Poblacion)","Camindangan","Canturay","Cartagena","Cayhagan","Gil Montilla","Mambacayao","Manlucahoc","Maricalum","Nauhang","San Jose"],
      },
    ],
  },
  'Negros Oriental': {
    name: 'Negros Oriental',
    coords: [9.5833, 123.1667],
    municipalities: [
      {
        name: 'Dumaguete City',
        coords: [9.3068, 123.3054],
        barangays: ["Poblacion 1-8","Bagacay","Bajumpandan","Balugo","Banilad","Bantayan","Batinguel","Buñao","Cadawinonan","Calindagan","Camanjac","Candau-ay","Cantil-e","Daro","Junob","Looc","Mangnao-Canal","Motong","Piapi","Pulantubig","Tabuctubuc","Taclobo","Talay"],
      },
      {
        name: 'Bayawan City',
        coords: [9.3667, 122.8],
        barangays: ["Ubangon (Poblacion)","Boyco","Tinago","Villareal","Ali-is","Banquerohan","Bugay","Cansumalig","Dawis","Kalamtukan","Kalumboyan","Malabugas","Mandu-ao","Maninihon","Minaba","Nangka","Narra","Pagatban","San Jose","San Miguel","San Roque","Suba","Tabuan","Tayawan"],
      },
      {
        name: 'Bais City',
        coords: [9.5833, 123.1167],
        barangays: ["Barangay I-II (Poblacion)","Capiñahan","Consolacion","Dansulan","Hangyad","La Paz","Lo-oc","Lonoy","Mabunao","Manlipac","Mansangaban","Okiot","Olympia Island","Panala-an","Sab-ahan","San Isidro","San Jose","San Vicente","Santa Cruz","Tagpo","Talungon","Tamisu","Tamogong","Tangculogan","Valencia"],
      },
      {
        name: 'Tanjay City',
        coords: [9.5167, 123.15],
        barangays: ["Barangay 1-9 (Poblacion)","Azagra","Bahi-an","Luca","Manipis","Novallas","Obogon","Pal-ew","Polo","San Isidro","San Jose","San Miguel","Santa Cruz Nuevo","Santa Cruz Viejo","Santo Niño","Tugas"],
      },
      {
        name: 'Guihulngan City',
        coords: [10.1167, 123.2667],
        barangays: ["Poblacion","Bakid","Balogo","Banwague","Basak","Binobohan","Buenavista","Bulado","Calamba","Calupa-an","Hibaiyo","Hilaitan","Humayhumay","Kagawasan","Linantuyan","Mabunga","Magsaysay","Malusay","Planas","Sandayao","Tacpao","Trinidad","Villegas"],
      },
      {
        name: 'Sibulan',
        coords: [9.35, 123.2833],
        barangays: ["Poblacion","Agan-an","Ajong","Balugo","Boloc-boloc","Calabnugan","Cangmating","Campaclan","Looc","Mag-aso","Maningcao","Maslog","Panisihan","San Antonio","Tubigon","Tubtubon"],
      },
      {
        name: 'Valencia (Luzurriaga)',
        coords: [9.2833, 123.25],
        barangays: ["Poblacion","Balayagmanok","Balili","Balimbis","Balolong","Bong-ao","Bongbong","Caidiocan","Calabnugan","Camp Look-out","Dobdob","Jawa","Lico-lico","Liptong","Malabo","Malaunay","Malungcay Dacu","Nasunogan","North Poblacion","Pal-ew","Puhagan","Pulangbato","Sagbang","South Poblacion"],
      },
      {
        name: 'Dauin',
        coords: [9.1833, 123.2667],
        barangays: ["Poblacion I-II","Apo Island (Marine Sanctuary)","Bagacay","Baslay","Batuhon Dacu","Boloc-boloc","Bulak","Bunga","Casile","Lipayo","Mag-aso","Magsaysay","Malongcay Diot","Panubtuban","Tugawe","Tuhian"],
      },
    ],
  },
  'Siquijor': {
    name: 'Siquijor',
    coords: [9.2, 123.5167],
    municipalities: [
      {
        name: 'Siquijor',
        coords: [9.2139, 123.5156],
        barangays: ["Poblacion","Banban","Cang-alwang","Cang-atuyom","Cang-isad","Cang-optoc","Canghunog-hunog","Cangmatnog","Cangmohao","Cantabon (Mt Bandilaan)","Cawayan","Dumanhog","Ibabao","Lambojon","Luyang","Pangi","Panlautan","Pasihagon","Pili","Polangyuta","Ponong","Sabang","San Antonio","Songculan","Tacdog","Tacloban","Tambisan (Port)"],
      },
      {
        name: 'Larena',
        coords: [9.25, 123.5833],
        barangays: ["North Poblacion","South Poblacion","Bagacay","Balolang","Basac","Bintangan","Bontod","Cang-allas","Cang-apa","Cangbagsa","Cangbusngat","Cangomantoc","Canguayan","Catamboan","Nonoc","Ponong","Sabang","Sandugan","Taculing"],
      },
      {
        name: 'Lazi',
        coords: [9.1333, 123.6333],
        barangays: ["Tigbawan (Poblacion)","Campalanas","Cang-allas","Capalasanan","Catamboan","Gabayan","Kimba","Kinamandagan","Lower Cabangcalan","Napo","Nasiad","Po-o","Simacolong","Tagmanocan","Talayong","Upper Cabangcalan","Ytukan"],
      },
      {
        name: 'San Juan',
        coords: [9.1667, 123.4833],
        barangays: ["Poblacion","Can-munag","Cang-actol","Cang-apa","Cangclaran","Cangmunag","Cansayang","Catulayan","Lala-o","Maite","Napo","Paliton (Little Boracay)","Solangon","Tag-ibo","Tambisan","Tubod (Marine Sanctuary)"],
      },
      {
        name: 'Maria',
        coords: [9.1833, 123.6833],
        barangays: ["Poblacion Norte","Poblacion Sur","Bonga","Cabigsing","Calunasan","Candaping A","Candaping B","Canturay","Lico-an","Lilo-an","Logucan","Minda","Nabutay","Olang","Pisong A","Pisong B","Saguing","Sawang","Villanueva"],
      },
      {
        name: 'Enrique Villanueva',
        coords: [9.2333, 123.65],
        barangays: ["Poblacion","Balolong","Bino-ongan","Bolot","Camogao","Cangmangki","Manan-ao","Olave","Parian","Tulapos (Marine Sanctuary)"],
      },
    ],
  },
  'Biliran': {
    name: 'Biliran',
    coords: [11.5, 124.4667],
    municipalities: [
      {
        name: 'Naval',
        coords: [11.5583, 124.3986],
        barangays: ["P.I. Garcia (Poblacion)","Atipolo","Agpangi","Anislagan","Borac","Cabungaan","Calumpang","Capiñahan","Caraycaray","Catmon","Haguikhikan","Imelda","Larrazabal","Libertad","Lico","Lucsoon","Mabini","Poblacion","San Pablo","Santissimo Rosario","Santo Niño","Shop","Smokey Mountain","Talustusan","Villa Caneja","Villa Consuelo"],
      },
      {
        name: 'Almeria',
        coords: [11.6167, 124.3833],
        barangays: ["Poblacion","Caucab","Iyusan","Jamorawon","Looc","Matanggo","Pili","Pulang Bato","Salangi","Sampao","Tabunan","Talahid"],
      },
      {
        name: 'Biliran',
        coords: [11.4667, 124.4833],
        barangays: ["San Roque (Poblacion)","Bato","Burabod","Busali","Hugpa","Julita","Pinangompan","San Isidro","Sanggalang","Villa Enage"],
      },
      {
        name: 'Cabucgayan',
        coords: [11.4833, 124.5833],
        barangays: ["Bunga (Poblacion)","Balaquid","Baso","Caanibongan","Cascada","Esperanza","Langgao","Libertad","Looc","Magbangun","Pawikan","Salawad","Talibong"],
      },
      {
        name: 'Caibiran',
        coords: [11.5667, 124.5833],
        barangays: ["Poblacion","Alegria","Asug","Bari-is","Binohangan","Cabibihan","Kawayanon","Manlabang","Maurang","Palayan","Tomalistis","Union","Uson"],
      },
      {
        name: 'Kawayan',
        coords: [11.6833, 124.3667],
        barangays: ["Poblacion","Baganito","Balacson","Bilwang","Bulalacao","Burabod","Inasuyan","Kansanok","Mada-o","Mapuyo","Masagaosao","Masagongsong","San Lorenzo","Tabunan","Tubig Guinoo","Tucdao"],
      },
      {
        name: 'Maripipi',
        coords: [11.7833, 124.3333],
        barangays: ["Ermita (Poblacion)","Agutayan","Banlas","Bato","Binalayan","Binongto-an","Burabod","Calangaman","Canducan","Casibang","Dana-o","Ol-og","Trabajo","Viga"],
      },
    ],
  },
  'Leyte': {
    name: 'Leyte',
    coords: [10.8333, 124.8333],
    municipalities: [
      {
        name: 'Tacloban City',
        coords: [11.2444, 125.0039],
        barangays: ["Barangay 1-110 (Poblacion)","Abucay","Bagacay","Cabuging","Cabalawan","Caibaan","Calanipawan","Diit","Marasbaras","Naga-naga","New Kawayan","Old Kawayan","Rawis","Sagkahan","San Jose","San Roque","Santo Niño","Taguik","Utap","V&G Subdivision"],
      },
      {
        name: 'Ormoc City',
        coords: [11.005, 124.6075],
        barangays: ["District 1-29 (Poblacion)","Airport","Alegria","Alta Vista","Bagong Buhay","Bantigue","Cabintan","Camp Downes","Can-adieng","Cogon","Concepcion","Curva","Dayhagan","Dolores","Dominador Tan","Don Felipe Larrazabal","Gaas","Ipil","Juaton","Lake Danao","Liloan","Linao","Mabini","Macabug","Malbasag","Milagro","Naungan","Patag","Punta","Quezon, Jr.","Sabang Bao","San Isidro","San Jose","San Pablo","San Vicente","Santo Niño","Tambulilid","Valencia"],
      },
      {
        name: 'Baybay City',
        coords: [10.6769, 124.7989],
        barangays: ["Zone 1-23 (Poblacion)","Altavista","Ambacan","Balao","Banahao","Biasong","Bitanhuan","Bubon","Buenavista","Candoon","Caridad","Ciabu","Gabas (VSU Campus)","Gaas","Guintorjan","Hibunawan","Higuloan","Hilapnitan","Kansungka","Kantagnos","Maitum","Makinhas","Mapgap","Maybog","Monteverde","Pangasugan","Patag","Plaridel","Pomponan","San Agustin","San Isidro","Santa Cruz","Santo Rosario","Villa"],
      },
      {
        name: 'Palo',
        coords: [11.1583, 124.9917],
        barangays: ["Baras (MacArthur Leyte Landing)","Buntay (Poblacion)","Campetic","Candahug","Cangumbang","Canhidoc","Capirawan","Cavite East","Cavite West","Gacao","Guindapunan","Luntad","Naga-naga","Pawing","Salvacion","San Agustin","San Antonio","San Isidro","San Joaquin","San Jose","San Miguel","San Roque","Santa Cruz","Tacuranga","Teraza"],
      },
      {
        name: 'Tanauan',
        coords: [11.1167, 125.0167],
        barangays: ["Poblacion 1-6","Ada","Amanluran","Bahay","Balud","Bangon","Buntay","Cabuynan","Cahumayhumayan","Calogcog","Canramos","Guindag-an","Hilagpad","Kiling","Limbuhan","Malaguicay","Maribi","Mohon","Pikas","Sacme","San Agustin","San Roque","Santa Cruz","Santa Elena","Santo Niño","Talolora","Tugop"],
      },
      {
        name: 'Carigara',
        coords: [11.3, 124.6833],
        barangays: ["Ponong (Poblacion)","Sawang","Jugaban","Baybay","Barugohay Central","Barugohay Norte","Barugohay Sur","Camansi","Canfabi","Canlampay","Guindapunan East","Guindapunan West","Libertad","Macalpe","Manloy","Nauguisan","Pangna","San Juan","Santa Fe","Sogod","Tagak","Tinagaban","Uyawan"],
      },
      {
        name: 'Abuyog',
        coords: [10.7456, 125.0117],
        barangays: ["Barangay 1-10 (Poblacion)","Bagacay","Balocawe","Bito","Buaya","Cadac-an","Can-aporong","Canmarating","Combis","Dingle","Guintagbucan","Libertad","Loyonsawang","Malinao","Nalibunan","New Taligue","Old Taligue","Pilar","San Isidro","San Roque","Santa Fe","Santo Niño","Tadoc","Tib-o","Tula-tula"],
      },
    ],
  },
  'Eastern Samar': {
    name: 'Eastern Samar',
    coords: [11.6667, 125.4333],
    municipalities: [
      {
        name: 'Borongan City',
        coords: [11.6083, 125.4319],
        barangays: ["Barangay A-H (Poblacion)","Alang-alang","Amantacop","Balacdas","Balogo","Bato","Bugas","Cabong","Cagbonga","Campesao","Can-abong","Can-kato","Canlaray","Canyabao","Divinubo Island","Hebloc","Hindang","Lalawigan","Locso-on","Maybacong","Maydolong","Punta Maria","Sabang North","Sabang South","San Gabriel","San Jose","San Mateo","San Saturnino","Santa Fe","Siha","Songco","Suribao","Taboc","Tabunan","Tamoso"],
      },
      {
        name: 'Guiuan',
        coords: [11.0333, 125.725],
        barangays: ["Barangay 1-12 (Poblacion)","Alingarog","Bagua","Banaag","Baras","Bitaugan","Bungtod","Caghilot","Calicoan Island (Surfing Capital)","Campoyong","Cantahay","Casuguran","Cogon","Gahoy","Habag","Homonhon Island (Magellan Landing)","Linao","Lupok","Mayana","Ngolos","Pagnamitan","Sapao","Sulangan","Suluan Island","Tagpuro","Taytay","Trinidad","Victoria"],
      },
      {
        name: 'Balangiga',
        coords: [11.1167, 125.3833],
        barangays: ["Poblacion Barangay 1-6","Bagonbanua","Cag-olango","Cansumucao","Guinmaayohan","Maybunga","San Miguel","Santa Rosa"],
      },
      {
        name: 'Dolores',
        coords: [12.0333, 125.4833],
        barangays: ["Barangay 1-15 (Poblacion)","Aroganga","Bonghon","Buenavista","Caglao-an","Cagsumje","Dap-dap","Del Pilar","Denigpian","Gapas-gapas","Hinolaso","Libertad","Magongbong","Malayog","Moctan","Rizal","San Isidro","San Pascual","San Roque","San Vicente","Santa Cruz","Santo Niño","Tan-awan","Tikling"],
      },
    ],
  },
  'Northern Samar': {
    name: 'Northern Samar',
    coords: [12.4167, 124.6667],
    municipalities: [
      {
        name: 'Catarman',
        coords: [12.4986, 124.6375],
        barangays: ["Acacia (Poblacion)","Airport Village","Bangkerohan","Baybay","Bocboc","Cawayan","Casoy","Dalakit","Galutan","Gebalagnan","Geparayan","Hinundayan","Ipil-ipil","Jose Abad Santos","Kasanyangan","Libertad","Macagtas","Mckinley","Narra","New Rizal","Old Rizal","Poblacion","Polangi","Quezon","Salvacion","San Agustin","San Isidro","San Pascual","San Roque","Santol","Somoroy","Trinidad","UEP (Univ of Eastern Phils) Zone 1-3"],
      },
      {
        name: 'Allen',
        coords: [12.5, 124.2833],
        barangays: ["Kinabranan Zone I-II (Poblacion)","Sabang Zone I-II (Port)","Alejandro Village","Bonifacio","Cabacungan","Calumpit","Freedoms","Guin-arayan","Imelda","Jubasan","Lipata","London","Lo-oc","Santiago","Tasik-retiro","Victoria"],
      },
      {
        name: 'Laoang',
        coords: [12.5667, 125.0167],
        barangays: ["Barangay 1-6 (Poblacion)","Arawane","Bagong Bayan","Batag Island","Bawa","Cabadiangan","Cagsuming","Canyomanao","Gulang-gulang","La Perla","Magsaysay","Marubay","Muñoz","Oleras","Rawis","San Agustin","San Antonio","San Isidro","San Miguel","San Roque","Suba","Tandug","Tinublan","Vigo"],
      },
      {
        name: 'Bobon',
        coords: [12.5167, 124.5667],
        barangays: ["General Lucban (Poblacion)","Salvacion","San Agustin","San Isidro","San Jose","San Juan","Santander","Somoroy","Trojillo"],
      },
    ],
  },
  'Samar (Western Samar)': {
    name: 'Samar (Western Samar)',
    coords: [11.8333, 124.9667],
    municipalities: [
      {
        name: 'Catbalogan City',
        coords: [11.7753, 124.8861],
        barangays: ["Barangay 1-13 (Poblacion)","Bagong Bayan","Bunuanan","Cabugawan","Cagpupuma","Canlapwas","Cawayan","Cinco","Darahuway Daco","Darahuway Guti","Guinsorongan","Ibol","Lagundi","Maulong","Mercedes","Muñoz","Palale","Pangdan","Payao","San Andres","San Pablo","San Roque","San Vicente","Silanga","Socorro","Ubanon-Boao"],
      },
      {
        name: 'Calbayog City',
        coords: [12.0675, 124.595],
        barangays: ["Central (Poblacion)","Acacio","Aguit-itan","Bagacay","Balud","Basud","Capoocan","Carayman","Dagum","East Awang","Gadgaran","Hamorawon","Matobato","Nijaga","Obrero","Payahan","Rawis","Roxas","Sabang","San Policarpo","Tabawan","Trinidad","West Awang"],
      },
      {
        name: 'Basey',
        coords: [11.2833, 125.0667],
        barangays: ["Baybay (Poblacion)","Buscada","Dolores","Loyojon","Magallanes","Mercado","Palaypay","Sulod","Amandayehan","Anglit","Balante","Baloog","Basiao","Bulao","Buenavista","Cabaranyogan","Cancaiyas","Can-abay","Can-曼-aw","Guirang","Iba","Mabini","Old San Agustin","Panugmonon","Roxas","San Antonio","San Fernando","Serum","Sohoton (Sohoton Caves)","Tingib","Villa Aurora"],
      },
      {
        name: 'Gandara',
        coords: [12.0167, 124.8167],
        barangays: ["Poblacion","Adela Heights","Bocboc","Buenavista","Burabod I","Burabod II","Casandig","Catorse De Agosto","Concepcion","Diaz","El Cano","Gereganan","Hetebac","Hima-ao","Hinugacan","Mabuhay","Minda","Nacube","Palamrag","Rawis","San Agustin","San Antonio","San Francisco","San Isidro","San Jose","San Miguel","San Ramon","Santa Elena","Santo Niño","Tawiran"],
      },
    ],
  },
  'Southern Leyte': {
    name: 'Southern Leyte',
    coords: [10.3333, 125],
    municipalities: [
      {
        name: 'Maasin City',
        coords: [10.1336, 124.8436],
        barangays: ["Abgao (Poblacion)","Combado","Ibarra","Lib-og","Mantahan","Matingbe","Asuncion","Bactul I","Bactul II","Bilibol","Bogo","Cantuhaon","Guadalupe","Hanginan","Isagani","Laboon","Lunas","Malapoc Norte","Malapoc Sur","Mambajao","Nonok Norte","Nonok Sur","Panan-awan","Pasay","Rizal","San Jose","San Rafael","Santo Niño","Santo Rosario","Soro-soro","Tagnipa","Tam-is","Tawid","Tigbawan"],
      },
      {
        name: 'Sogod',
        coords: [10.3833, 124.9833],
        barangays: ["Zone I-V (Poblacion)","Consolacion","Dampulan","Hibod-hibod","Kahupian","Libas","Lumao","Mabini","Magatas","Mahayahay","Malinao","Maria Plana","Milagroso","Pancho Villa","Pandan","Rizal","San Isidro","San Jose","San Juan","San Miguel","San Pedro","San Roque","San Vicente","Santa Maria","Suba","Tampacon I","Tampacon II"],
      },
      {
        name: 'Macrohon',
        coords: [10.0833, 124.95],
        barangays: ["Poblacion","Aguinaldo","Amparo","Buscayan","Cambaro","Canlusay","Flordeliz","Ichon","Ilihan","Laray","Mabini","Mohon","Molopolo","Rizal","Salvacion","San Isidro","San Joaquin","San Roque","Sindangan","Upper Ichon"],
      },
      {
        name: 'Limasawa',
        coords: [9.9167, 125.0667],
        barangays: ["Cabulusan","Lugsongan","Magallanes (First Catholic Mass in the Philippines)","San Agustin","San Bernardo","Triana"],
      },
      {
        name: 'Hinunangan',
        coords: [10.4, 125.2],
        barangays: ["Poblacion","Bacolod","Badiangon","Bangcas A","Bangcas B","Biasong","Bugho","Calag-itan","Calinao","Canipaan","Catublian","Ilag","Ingan","Labrador","Lumbog","Manalog","Nava","Nueva Esperanza","Otikon","Palale","Pondol","Salog","San Bernardo","San Isidro","San Jose","San Roque","Santo Niño","Talisay","Tuburan"],
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
  'Purok 8',
  'Purok 9',
  'Purok 10',
  'Purok Centro',
  'Purok Pag-asa',
  'Purok Riverside',
  'Purok Masagana',
  'Sitio Centro',
  'Sitio Riverside',
  'Sitio Upper',
  'Sitio Lower',
  'Sitio Crossing',
  'Sitio Maligaya',
  'Sitio San Isidro',
  'Sitio Highway',
  'Sitio Bagong Silang',
  'Sitio Proper',
];

/**
 * Helper to retrieve all province names sorted
 */
export const getProvinceNames = (): string[] => Object.keys(PH_PROVINCES);

/**
 * Helper to retrieve municipalities for a given province name
 */
export const getMunicipalitiesForProvince = (provinceName: string): MunicipalityInfo[] => {
  return PH_PROVINCES[provinceName]?.municipalities || [];
};

/**
 * Helper to retrieve barangays for a given province and municipality
 */
export const getBarangaysForMunicipality = (provinceName: string, municipalityName: string): string[] => {
  const prov = PH_PROVINCES[provinceName];
  if (!prov) return [];
  const muni = prov.municipalities.find((m) => m.name === municipalityName);
  return muni ? muni.barangays : [];
};
