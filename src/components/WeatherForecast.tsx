import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Cloud, CloudRain, Sun, CloudSun, CloudLightning, Snowflake } from "lucide-react";

interface WeatherForecastProps {
  location: string;
  /** Data ISO (YYYY-MM-DD) do jogo. */
  date?: string;
}

interface DayForecast {
  tempMax: number;
  tempMin: number;
  precipitationChance: number;
  weatherCode: number;
}

// Geocodifica e busca a previsão só uma vez por local+data durante a sessão —
// Nominatim/Open-Meteo são gratuitos e sem chave, mas merecem cache local.
const geocodeCache = new Map<string, { lat: number; lon: number } | null>();
const forecastCache = new Map<string, DayForecast | null>();

async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  if (geocodeCache.has(location)) return geocodeCache.get(location)!;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { "Accept-Language": "pt-BR" } }
    );
    const data = await res.json();
    const result = data?.[0] ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
    geocodeCache.set(location, result);
    return result;
  } catch {
    geocodeCache.set(location, null);
    return null;
  }
}

async function fetchForecast(lat: number, lon: number, date: string): Promise<DayForecast | null> {
  const cacheKey = `${lat},${lon},${date}`;
  if (forecastCache.has(cacheKey)) return forecastCache.get(cacheKey)!;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&start_date=${date}&end_date=${date}`
    );
    const data = await res.json();
    const daily = data?.daily;
    const result: DayForecast | null = daily?.time?.[0]
      ? {
          tempMax: Math.round(daily.temperature_2m_max[0]),
          tempMin: Math.round(daily.temperature_2m_min[0]),
          precipitationChance: daily.precipitation_probability_max?.[0] ?? 0,
          weatherCode: daily.weathercode?.[0] ?? 0,
        }
      : null;
    forecastCache.set(cacheKey, result);
    return result;
  } catch {
    forecastCache.set(cacheKey, null);
    return null;
  }
}

function weatherIcon(code: number) {
  if (code === 0) return <Sun className="h-4 w-4 text-yellow-400" />;
  if (code <= 3) return <CloudSun className="h-4 w-4 text-yellow-300" />;
  if (code >= 95) return <CloudLightning className="h-4 w-4 text-purple-400" />;
  if (code >= 71 && code <= 86) return <Snowflake className="h-4 w-4 text-blue-200" />;
  if (code >= 51) return <CloudRain className="h-4 w-4 text-blue-400" />;
  return <Cloud className="h-4 w-4 text-muted-foreground" />;
}

// Open-Meteo só cobre ~16 dias para a frente — fora disso, não mostramos nada.
function isWithinForecastRange(dateStr: string): boolean {
  const target = new Date(`${dateStr}T00:00:00`);
  const diffDays = (target.getTime() - Date.now()) / 86400000;
  return diffDays >= -1 && diffDays <= 16;
}

export function WeatherForecast({ location, date }: WeatherForecastProps) {
  const [forecast, setForecast] = useState<DayForecast | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!location || !date || !isWithinForecastRange(date)) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const coords = await geocodeLocation(location);
      if (!coords || cancelled) { setLoaded(true); return; }
      const result = await fetchForecast(coords.lat, coords.lon, date);
      if (!cancelled) {
        setForecast(result);
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [location, date]);

  if (!loaded || !forecast) return null;

  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      {weatherIcon(forecast.weatherCode)}
      {forecast.tempMin}°–{forecast.tempMax}°C
      {forecast.precipitationChance > 30 && (
        <span className="text-blue-400">· {forecast.precipitationChance}% chuva</span>
      )}
    </Badge>
  );
}
