export interface City {
  name_he: string;
  name_en: string;
  lat: number;
  lng: number;
  region: "north" | "center" | "south" | "jerusalem" | "judea_samaria";
  shelterTime: number; // seconds to reach shelter
}

export const cities: Record<string, City> = {
  "תל אביב": { name_he: "תל אביב", name_en: "Tel Aviv", lat: 32.0853, lng: 34.7818, region: "center", shelterTime: 90 },
  "חיפה": { name_he: "חיפה", name_en: "Haifa", lat: 32.7940, lng: 34.9896, region: "north", shelterTime: 60 },
  "ירושלים": { name_he: "ירושלים", name_en: "Jerusalem", lat: 31.7683, lng: 35.2137, region: "jerusalem", shelterTime: 90 },
  "באר שבע": { name_he: "באר שבע", name_en: "Beer Sheva", lat: 31.2530, lng: 34.7915, region: "south", shelterTime: 60 },
  "אשדוד": { name_he: "אשדוד", name_en: "Ashdod", lat: 31.8040, lng: 34.6553, region: "south", shelterTime: 45 },
  "אשקלון": { name_he: "אשקלון", name_en: "Ashkelon", lat: 31.6688, lng: 34.5743, region: "south", shelterTime: 30 },
  "נתניה": { name_he: "נתניה", name_en: "Netanya", lat: 32.3215, lng: 34.8532, region: "center", shelterTime: 90 },
  "הרצליה": { name_he: "הרצליה", name_en: "Herzliya", lat: 32.1629, lng: 34.8441, region: "center", shelterTime: 90 },
  "פתח תקווה": { name_he: "פתח תקווה", name_en: "Petah Tikva", lat: 32.0868, lng: 34.8867, region: "center", shelterTime: 90 },
  "ראשון לציון": { name_he: "ראשון לציון", name_en: "Rishon LeZion", lat: 31.9730, lng: 34.7925, region: "center", shelterTime: 90 },
  "רחובות": { name_he: "רחובות", name_en: "Rehovot", lat: 31.8928, lng: 34.8113, region: "center", shelterTime: 90 },
  "חולון": { name_he: "חולון", name_en: "Holon", lat: 32.0158, lng: 34.7797, region: "center", shelterTime: 90 },
  "בת ים": { name_he: "בת ים", name_en: "Bat Yam", lat: 32.0231, lng: 34.7503, region: "center", shelterTime: 90 },
  "רמת גן": { name_he: "רמת גן", name_en: "Ramat Gan", lat: 32.0700, lng: 34.8237, region: "center", shelterTime: 90 },
  "בני ברק": { name_he: "בני ברק", name_en: "Bnei Brak", lat: 32.0838, lng: 34.8343, region: "center", shelterTime: 90 },
  "גבעתיים": { name_he: "גבעתיים", name_en: "Givatayim", lat: 32.0716, lng: 34.8124, region: "center", shelterTime: 90 },
  "כפר סבא": { name_he: "כפר סבא", name_en: "Kfar Saba", lat: 32.1751, lng: 34.9077, region: "center", shelterTime: 90 },
  "רעננה": { name_he: "רעננה", name_en: "Ra'anana", lat: 32.1836, lng: 34.8708, region: "center", shelterTime: 90 },
  "הוד השרון": { name_he: "הוד השרון", name_en: "Hod HaSharon", lat: 32.1500, lng: 34.8878, region: "center", shelterTime: 90 },
  "שדרות": { name_he: "שדרות", name_en: "Sderot", lat: 31.5250, lng: 34.5959, region: "south", shelterTime: 15 },
  "עוטף עזה": { name_he: "עוטף עזה", name_en: "Gaza Envelope", lat: 31.4500, lng: 34.4500, region: "south", shelterTime: 15 },
  "קריית שמונה": { name_he: "קריית שמונה", name_en: "Kiryat Shmona", lat: 33.2073, lng: 35.5718, region: "north", shelterTime: 15 },
  "נהריה": { name_he: "נהריה", name_en: "Nahariya", lat: 33.0039, lng: 35.0984, region: "north", shelterTime: 30 },
  "עכו": { name_he: "עכו", name_en: "Acre", lat: 32.9263, lng: 35.0764, region: "north", shelterTime: 45 },
  "צפת": { name_he: "צפת", name_en: "Safed", lat: 32.9646, lng: 35.4960, region: "north", shelterTime: 30 },
  "טבריה": { name_he: "טבריה", name_en: "Tiberias", lat: 32.7942, lng: 35.5311, region: "north", shelterTime: 45 },
  "כרמיאל": { name_he: "כרמיאל", name_en: "Karmiel", lat: 32.9192, lng: 35.3006, region: "north", shelterTime: 45 },
  "עפולה": { name_he: "עפולה", name_en: "Afula", lat: 32.6100, lng: 35.2900, region: "north", shelterTime: 60 },
  "מודיעין": { name_he: "מודיעין", name_en: "Modi'in", lat: 31.8977, lng: 35.0105, region: "center", shelterTime: 90 },
  "בית שמש": { name_he: "בית שמש", name_en: "Beit Shemesh", lat: 31.7473, lng: 34.9877, region: "jerusalem", shelterTime: 60 },
  "אילת": { name_he: "אילת", name_en: "Eilat", lat: 29.5569, lng: 34.9517, region: "south", shelterTime: 90 },
  "דימונה": { name_he: "דימונה", name_en: "Dimona", lat: 31.0688, lng: 35.0330, region: "south", shelterTime: 60 },
  "ערד": { name_he: "ערד", name_en: "Arad", lat: 31.2590, lng: 35.2130, region: "south", shelterTime: 60 },
  "מצפה רמון": { name_he: "מצפה רמון", name_en: "Mitzpe Ramon", lat: 30.6088, lng: 34.8013, region: "south", shelterTime: 90 },
  "נתיבות": { name_he: "נתיבות", name_en: "Netivot", lat: 31.4221, lng: 34.5893, region: "south", shelterTime: 30 },
  "אופקים": { name_he: "אופקים", name_en: "Ofakim", lat: 31.3158, lng: 34.6201, region: "south", shelterTime: 30 },
  "קריית גת": { name_he: "קריית גת", name_en: "Kiryat Gat", lat: 31.6100, lng: 34.7642, region: "south", shelterTime: 45 },
  "יבנה": { name_he: "יבנה", name_en: "Yavne", lat: 31.8770, lng: 34.7394, region: "center", shelterTime: 60 },
  "לוד": { name_he: "לוד", name_en: "Lod", lat: 31.9503, lng: 34.8891, region: "center", shelterTime: 90 },
  "רמלה": { name_he: "רמלה", name_en: "Ramla", lat: 31.9275, lng: 34.8684, region: "center", shelterTime: 90 },
  "מגדל העמק": { name_he: "מגדל העמק", name_en: "Migdal HaEmek", lat: 32.6789, lng: 35.2401, region: "north", shelterTime: 60 },
  "נצרת": { name_he: "נצרת", name_en: "Nazareth", lat: 32.6997, lng: 35.3035, region: "north", shelterTime: 60 },
  "קריית אתא": { name_he: "קריית אתא", name_en: "Kiryat Ata", lat: 32.8064, lng: 35.1093, region: "north", shelterTime: 60 },
  "קריית ביאליק": { name_he: "קריית ביאליק", name_en: "Kiryat Bialik", lat: 32.8272, lng: 35.0830, region: "north", shelterTime: 60 },
  "קריית מוצקין": { name_he: "קריית מוצקין", name_en: "Kiryat Motzkin", lat: 32.8375, lng: 35.0756, region: "north", shelterTime: 60 },
  "נשר": { name_he: "נשר", name_en: "Nesher", lat: 32.7716, lng: 35.0396, region: "north", shelterTime: 60 },
  "טירת כרמל": { name_he: "טירת כרמל", name_en: "Tirat Carmel", lat: 32.7588, lng: 34.9700, region: "north", shelterTime: 60 },
  "יקנעם": { name_he: "יקנעם", name_en: "Yokneam", lat: 32.6593, lng: 35.1093, region: "north", shelterTime: 60 },
  "מעלות תרשיחא": { name_he: "מעלות תרשיחא", name_en: "Ma'alot-Tarshiha", lat: 33.0167, lng: 35.2667, region: "north", shelterTime: 30 },
  "שלומי": { name_he: "שלומי", name_en: "Shlomi", lat: 33.0750, lng: 35.1436, region: "north", shelterTime: 15 },
};

export function getCityByName(name: string): City | undefined {
  return cities[name];
}

export function getCitiesByRegion(region: City["region"]): City[] {
  return Object.values(cities).filter((c) => c.region === region);
}

// Threat origin directions for missile arc animations
export const threatOrigins = {
  gaza: { lat: 31.3547, lng: 34.3088, label_en: "Gaza", label_he: "עזה" },
  lebanon: { lat: 33.8547, lng: 35.8623, label_en: "Lebanon", label_he: "לבנון" },
  syria: { lat: 33.5102, lng: 36.2913, label_en: "Syria", label_he: "סוריה" },
  iran: { lat: 35.6892, lng: 51.3890, label_en: "Iran", label_he: "איראן" },
  yemen: { lat: 15.3694, lng: 44.1910, label_en: "Yemen", label_he: "תימן" },
  iraq: { lat: 33.3128, lng: 44.3615, label_en: "Iraq", label_he: "עיראק" },
};
