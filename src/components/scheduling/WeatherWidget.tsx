import { Cloud, CloudRain, Sun, CloudSun, Wind, Droplets, ThermometerSun } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { WeatherData, WeatherForecast } from "@/types/task.types";

interface WeatherWidgetProps {
  weather: WeatherData | null;
  isLoading?: boolean;
  compact?: boolean;
}

const getWeatherIcon = (condition: string, className?: string) => {
  const iconClass = cn("h-5 w-5", className);
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return <CloudRain className={iconClass} />;
  }
  if (lowerCondition.includes('cloud') && lowerCondition.includes('sun')) {
    return <CloudSun className={iconClass} />;
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <Cloud className={iconClass} />;
  }
  return <Sun className={iconClass} />;
};

export function WeatherWidget({ weather, isLoading, compact }: WeatherWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-4 shadow-sm animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-muted rounded-lg" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Cloud className="h-8 w-8" />
          <div>
            <p className="text-sm font-medium">Weather Unavailable</p>
            <p className="text-xs">Unable to fetch weather data</p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl border p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getWeatherIcon(weather.condition, "h-6 w-6 text-blue-500")}
            <div>
              <span className="text-lg font-bold">{weather.temperature}°C</span>
              <p className="text-xs text-muted-foreground">{weather.location}</p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              {weather.humidity}%
            </div>
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3" />
              {weather.windSpeed} km/h
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl border shadow-sm overflow-hidden">
      {/* Current Weather */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{weather.location}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{weather.temperature}°</span>
              <span className="text-lg text-muted-foreground">C</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{weather.condition}</p>
          </div>
          <div className="text-right">
            {getWeatherIcon(weather.condition, "h-14 w-14 text-blue-500")}
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ThermometerSun className="h-4 w-4" />
            <span>Feels like {weather.temperature + 2}°</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplets className="h-4 w-4" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="h-4 w-4" />
            <span>{weather.windSpeed} km/h</span>
          </div>
        </div>
      </div>

      {/* Forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="border-t bg-background/50 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">7-Day Forecast</p>
          <div className="grid grid-cols-7 gap-2">
            {weather.forecast.slice(0, 7).map((day, index) => (
              <ForecastDay key={index} forecast={day} isToday={index === 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ForecastDay({ forecast, isToday }: { forecast: WeatherForecast; isToday: boolean }) {
  return (
    <div className={cn(
      "text-center p-2 rounded-lg",
      isToday && "bg-primary/10"
    )}>
      <p className="text-xs font-medium">
        {isToday ? "Today" : format(new Date(forecast.date), "EEE")}
      </p>
      <div className="my-1.5">
        {getWeatherIcon(forecast.condition, "h-4 w-4 mx-auto text-muted-foreground")}
      </div>
      <div className="text-xs">
        <span className="font-medium">{forecast.tempHigh}°</span>
        <span className="text-muted-foreground ml-1">{forecast.tempLow}°</span>
      </div>
      {forecast.precipitation > 0 && (
        <p className="text-[10px] text-blue-500 mt-0.5">{forecast.precipitation}%</p>
      )}
    </div>
  );
}
