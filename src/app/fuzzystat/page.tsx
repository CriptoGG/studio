
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FuzzyStatHeader } from '@/components/FuzzyStat/Header';
import { CurrentReadingsCard } from '@/components/FuzzyStat/CurrentReadingsCard';
import { TemperatureControlCard } from '@/components/FuzzyStat/TemperatureControlCard';
import { OutputVisualizationCard } from '@/components/FuzzyStat/OutputVisualizationCard';
import { ScheduleCard } from '@/components/FuzzyStat/ScheduleCard/ScheduleCard';
import type { ScheduleEntry } from '@/components/FuzzyStat/ScheduleCard/types';
import { FuzzyLogicDisplayCard } from '@/components/FuzzyStat/FuzzyLogicDisplayCard';
import { ClockCard } from '@/components/FuzzyStat/ClockCard';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { fetchCurrentWeather } from '@/services/weatherService';
import type { WeatherData } from '@/services/weatherService';

export default function FuzzyStatDemoPage() {
  const [currentTemperature, setCurrentTemperature] = useState(22);
  const [currentHumidity, setCurrentHumidity] = useState(45);
  const [desiredTemperature, setDesiredTemperature] = useState(20);
  
  const [heatingOutput, setHeatingOutput] = useState(0);
  const [coolingOutput, setCoolingOutput] = useState(0);
  const [systemReasoning, setSystemReasoning] = useState<string | null>(null);
  
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  const [perceivedTemperatureDisplay, setPerceivedTemperatureDisplay] = useState<number | null>(currentTemperature);
  const [temperatureDifferenceDisplay, setTemperatureDifferenceDisplay] = useState<number | null>(desiredTemperature - currentTemperature);
  const [humidityEffectReasoningDisplay, setHumidityEffectReasoningDisplay] = useState<string | null>("Humidity is in the ideal range (40-60%). No perceived temperature adjustment.");
  const deadband = 0.5; 

  const [dataSource, setDataSource] = useState<'manual' | 'open-meteo'>('manual');
  const [locationQuery, setLocationQuery] = useState<string>("Vienna");
  const [fetchedLocationName, setFetchedLocationName] = useState<string | null>(null);
  const [isFetchingWeatherData, setIsFetchingWeatherData] = useState<boolean>(false);
  const [weatherApiError, setWeatherApiError] = useState<string | null>(null);

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const desiredTemperatureRef = useRef(desiredTemperature); 

  useEffect(() => {
    desiredTemperatureRef.current = desiredTemperature;
  }, [desiredTemperature]);

  const calculateSystemOutput = useCallback((temp: number, humidity: number, targetTemp: number) => {
    let perceivedTemp = temp;
    let humidityEffectReasoning = "";

    if (humidity > 60) {
      const adjustment = (humidity - 60) * 0.05; 
      perceivedTemp -= adjustment; 
      humidityEffectReasoning = `Feels ${adjustment.toFixed(1)}°C warmer due to high humidity (${humidity}%)`;
    } else if (humidity < 40) {
      const adjustment = (40 - humidity) * 0.05;
      perceivedTemp += adjustment; 
      humidityEffectReasoning = `Feels ${adjustment.toFixed(1)}°C cooler due to low humidity (${humidity}%)`;
    } else {
       humidityEffectReasoning = "Humidity is in the ideal range (40-60%). No perceived temperature adjustment.";
    }

    const tempDiff = targetTemp - perceivedTemp; 
    let newHeatingOutput = 0;
    let newCoolingOutput = 0;
    let newReasoning = "";

    if (tempDiff > deadband) { 
      newHeatingOutput = Math.min(100, Math.max(0, (tempDiff - deadband) * 25)); 
      newCoolingOutput = 0;
      newReasoning = `Heating: Effective temperature ${perceivedTemp.toFixed(1)}°C is below the target of ${targetTemp.toFixed(1)}°C by more than the ${deadband}°C deadband.`;
    } else if (tempDiff < -deadband) { 
      newHeatingOutput = 0;
      newCoolingOutput = Math.min(100, Math.max(0, (Math.abs(tempDiff) - deadband) * 25)); 
      newReasoning = `Cooling: Effective temperature ${perceivedTemp.toFixed(1)}°C is above the target of ${targetTemp.toFixed(1)}°C by more than the ${deadband}°C deadband.`;
    } else { 
      newHeatingOutput = 0;
      newCoolingOutput = 0;
      newReasoning = `Idle: Effective temperature ${perceivedTemp.toFixed(1)}°C is within ±${deadband}°C of the target ${targetTemp.toFixed(1)}°C.`;
    }

    setHeatingOutput(newHeatingOutput);
    setCoolingOutput(newCoolingOutput);
    setSystemReasoning(newReasoning);

    setPerceivedTemperatureDisplay(perceivedTemp);
    setTemperatureDifferenceDisplay(tempDiff);
    setHumidityEffectReasoningDisplay(humidityEffectReasoning.trim() ? humidityEffectReasoning : "Humidity is in the ideal range (40-60%). No perceived temperature adjustment.");

  }, []); 

  useEffect(() => {
    calculateSystemOutput(currentTemperature, currentHumidity, desiredTemperature);
  }, [currentTemperature, currentHumidity, desiredTemperature, calculateSystemOutput]);

  const getWeatherData = useCallback(async (city: string) => {
    setIsFetchingWeatherData(true);
    setWeatherApiError(null);
    setFetchedLocationName(null);
    try {
      const data: WeatherData = await fetchCurrentWeather(city);
      setCurrentTemperature(data.temperature);
      setCurrentHumidity(data.humidity);
      setFetchedLocationName(data.fetchedLocationName);
      toast({
        title: "Live Weather Fetched",
        description: `Temp: ${data.temperature}°C, Hum: ${data.humidity}% (${data.fetchedLocationName})`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch live weather data.";
      setWeatherApiError(errorMessage);
      toast({
        title: "Error Fetching Weather",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFetchingWeatherData(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (dataSource === 'open-meteo') {
      if (locationQuery.trim() === "") {
        setWeatherApiError("Please enter a city name.");
        toast({
          title: "Input Required",
          description: "City name cannot be empty to fetch live weather.",
          variant: "destructive",
        });
        return;
      }
      getWeatherData(locationQuery);
    }
  }, [dataSource, locationQuery, getWeatherData, toast]);


  useEffect(() => {
    const applySchedule = () => {
      if (schedule.length === 0 || isSimulating) return; // Don't apply schedule during simulation
      
      const now = new Date();
      const currentTimeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      let activeEntry: ScheduleEntry | null = null;
      const sortedSchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time));

      for (const entry of sortedSchedule) {
        if (currentTimeString >= entry.time) {
          activeEntry = entry;
        } else {
          break; 
        }
      }
      
      if (!activeEntry && sortedSchedule.length > 0) {
          const firstScheduleTime = sortedSchedule[0].time;
          if (currentTimeString < firstScheduleTime) {
              activeEntry = sortedSchedule[sortedSchedule.length -1];
          }
      }

      if (activeEntry && activeEntry.temperature !== desiredTemperatureRef.current) {
        setDesiredTemperature(activeEntry.temperature);
        toast({
          title: "Schedule Applied",
          description: `Temperature set to ${activeEntry.temperature}°C by '${activeEntry.name}' schedule.`,
        });
      }
    };

    applySchedule(); 
    const intervalId = setInterval(applySchedule, 60000); 

    return () => clearInterval(intervalId);
  }, [schedule, toast, isSimulating]);


  const handleAddSchedule = (data: Omit<ScheduleEntry, "id">) => {
    const newEntry: ScheduleEntry = { ...data, id: crypto.randomUUID() };
    setSchedule((prev) => [...prev, newEntry]);
    toast({ title: "Schedule Added", description: `'${newEntry.name}' schedule created.`});
  };

  const handleUpdateSchedule = (updatedEntry: ScheduleEntry) => {
    setSchedule((prev) => prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)));
    toast({ title: "Schedule Updated", description: `'${updatedEntry.name}' schedule modified.`});
  };

  const handleDeleteSchedule = (id: string) => {
    const entryToDelete = schedule.find(s => s.id === id);
    setSchedule((prev) => prev.filter((e) => e.id !== id));
    if (entryToDelete) {
      toast({ title: "Schedule Deleted", description: `'${entryToDelete.name}' schedule removed.`, variant: "destructive" });
    }
  };

  const handleToggleSimulation = () => {
    if (isSimulating) {
        setIsSimulating(false); // This will trigger the useEffect cleanup for the interval
    } else {
        if (dataSource === 'manual') {
            if (Math.abs(currentTemperature - desiredTemperatureRef.current) < 0.1) {
                toast({
                    title: "Already at Target",
                    description: "Current temperature is already at the desired temperature.",
                });
                return;
            }
            setIsSimulating(true);
        }
    }
  };

  useEffect(() => {
    if (isSimulating && dataSource === 'manual') {
      simulationIntervalRef.current = setInterval(() => {
        setCurrentTemperature(prevTemp => {
          const targetTemp = desiredTemperatureRef.current;
          const diff = targetTemp - prevTemp;
          const step = 0.1; // Simulation step for temperature change

          if (Math.abs(diff) < step) { // Target reached
            setIsSimulating(false); 
            return targetTemp;
          }
          return parseFloat((prevTemp + (diff > 0 ? step : -step)).toFixed(1));
        });
      }, 500); // Simulation speed (milliseconds)
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    }

    return () => { // Cleanup
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isSimulating, dataSource, setCurrentTemperature]);


  const resetDemoValues = () => {
    setIsSimulating(false); // Stop simulation if active
    if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
    }
    setCurrentTemperature(22);
    setCurrentHumidity(45);
    setDesiredTemperature(20);
    setSchedule([]); 
    setDataSource('manual');
    setLocationQuery("Vienna");
    setFetchedLocationName(null);
    setIsFetchingWeatherData(false);
    setWeatherApiError(null);
    toast({ title: "Demo Reset", description: "All values reset to defaults." });
    if (dataSource === 'open-meteo') {
        getWeatherData("Vienna");
    }
  };
  
  // Initial calculation on mount
  useEffect(() => {
    calculateSystemOutput(currentTemperature, currentHumidity, desiredTemperature);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <FuzzyStatHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-6"> {/* Column 1 */}
                <CurrentReadingsCard
                  temperature={currentTemperature}
                  humidity={currentHumidity}
                  dataSource={dataSource}
                  onDataSourceChange={(newSource) => {
                    if (isSimulating) setIsSimulating(false); // Stop simulation if changing source
                    setDataSource(newSource);
                  }}
                  isFetchingWeatherData={isFetchingWeatherData}
                  weatherApiError={weatherApiError}
                  locationQuery={locationQuery}
                  onLocationQueryChange={setLocationQuery}
                  fetchedLocationName={fetchedLocationName}
                />
                <div className="flex space-x-2 justify-center">
                    <Button onClick={() => setCurrentTemperature(t => t + 0.5)} size="sm" disabled={dataSource === 'open-meteo' || isFetchingWeatherData || isSimulating}>Temp +</Button>
                    <Button onClick={() => setCurrentTemperature(t => t - 0.5)} size="sm" disabled={dataSource === 'open-meteo' || isFetchingWeatherData || isSimulating}>Temp -</Button>
                    <Button onClick={() => setCurrentHumidity(h => Math.min(100, h + 5))} size="sm" disabled={dataSource === 'open-meteo' || isFetchingWeatherData || isSimulating}>Hum +</Button>
                    <Button onClick={() => setCurrentHumidity(h => Math.max(0, h - 5))} size="sm" disabled={dataSource === 'open-meteo' || isFetchingWeatherData || isSimulating}>Hum -</Button>
                </div>
                {dataSource === 'manual' && (
                  <div className="mt-4 flex justify-center">
                    <Button onClick={handleToggleSimulation} variant="outline" disabled={isFetchingWeatherData || (dataSource === 'open-meteo')}>
                      {isSimulating ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {isSimulating ? "Stop Simulation" : "Start Temp Simulation"}
                    </Button>
                  </div>
                )}
                 <OutputVisualizationCard
                  heatingOutput={heatingOutput}
                  coolingOutput={coolingOutput}
                  reasoning={systemReasoning}
                />
              </div>
              <div className="space-y-6"> {/* Column 2 */}
                <TemperatureControlCard
                  desiredTemperature={desiredTemperature}
                  onDesiredTemperatureChange={setDesiredTemperature}
                  isDisabled={isSimulating || dataSource === 'open-meteo'}
                />
                <ScheduleCard
                  schedule={schedule}
                  onAddSchedule={handleAddSchedule}
                  onUpdateSchedule={handleUpdateSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                />
                <ClockCard />
              </div>
            </div>
          </div>

          <div className="lg:w-1/3">
            <FuzzyLogicDisplayCard
              currentTemperature={currentTemperature}
              currentHumidity={currentHumidity}
              targetTemperature={desiredTemperature}
              perceivedTemperatureDisplay={perceivedTemperatureDisplay}
              temperatureDifferenceDisplay={temperatureDifferenceDisplay}
              humidityEffectReasoningDisplay={humidityEffectReasoningDisplay}
              heatingOutput={heatingOutput}
              coolingOutput={coolingOutput}
              finalReasoning={systemReasoning}
              deadband={deadband}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={resetDemoValues}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Demo
          </Button>
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FuzzyStat. Logic by Rules.</p>
      </footer>
    </div>
  );
}

    