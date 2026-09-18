import React, { useState, useEffect, useMemo, useRef } from "react";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";
import { MapPin, ChevronDown, Check, Search, Globe2 } from "lucide-react";

export interface LocationSelection {
  countryCode: string;
  countryName: string;
  stateCode: string;
  stateName: string;
  cityName: string; // "" or "All Cities" or specific city
  formatted: string;
}

interface LocationSelectorProps {
  value?: Partial<LocationSelection>;
  onChange: (selection: LocationSelection) => void;
  className?: string;
  label?: string;
  compact?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  className = "",
  label = "Target Geographic Market",
  compact = false,
}) => {
  // Pre-load country list once
  const countries = useMemo(() => Country.getAllCountries(), []);

  // Selection states
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(value?.countryCode || "IN");
  const [selectedStateCode, setSelectedStateCode] = useState<string>(value?.stateCode || "MH");
  const [selectedCityName, setSelectedCityName] = useState<string>(value?.cityName || "Mumbai");

  // Dropdown open states
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  // Search filter query states
  const [countryQuery, setCountryQuery] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");

  const countryRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setCountryOpen(false);
      }
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) {
        setStateOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setCityOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute states for current country
  const states = useMemo(() => {
    if (!selectedCountryCode) return [];
    return State.getStatesOfCountry(selectedCountryCode);
  }, [selectedCountryCode]);

  // Compute cities for current country + state
  const cities = useMemo(() => {
    if (!selectedCountryCode || !selectedStateCode) return [];
    return City.getCitiesOfState(selectedCountryCode, selectedStateCode);
  }, [selectedCountryCode, selectedStateCode]);

  // Filtered lists
  const filteredCountries = useMemo(() => {
    if (!countryQuery.trim()) return countries;
    const q = countryQuery.toLowerCase();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.isoCode.toLowerCase().includes(q)
    );
  }, [countries, countryQuery]);

  const filteredStates = useMemo(() => {
    if (!stateQuery.trim()) return states;
    const q = stateQuery.toLowerCase();
    return states.filter(
      (s) => s.name.toLowerCase().includes(q) || s.isoCode.toLowerCase().includes(q)
    );
  }, [states, stateQuery]);

  const filteredCities = useMemo(() => {
    if (!cityQuery.trim()) return cities;
    const q = cityQuery.toLowerCase();
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, cityQuery]);

  // Current selected objects
  const currentCountry = useMemo(
    () => countries.find((c) => c.isoCode === selectedCountryCode),
    [countries, selectedCountryCode]
  );

  const currentState = useMemo(
    () => states.find((s) => s.isoCode === selectedStateCode),
    [states, selectedStateCode]
  );

  // Sync to parent whenever values change
  const notifyChange = (cCode: string, sCode: string, cName: string) => {
    const cObj = countries.find((c) => c.isoCode === cCode);
    const sObj = State.getStateByCodeAndCountry(sCode, cCode);
    
    let parts: string[] = [];
    if (cName && cName !== "All Cities") parts.push(cName);
    if (sObj?.name) parts.push(sObj.name);
    if (cObj?.name) parts.push(cObj.name);

    onChange({
      countryCode: cCode,
      countryName: cObj?.name || "",
      stateCode: sCode,
      stateName: sObj?.name || "",
      cityName: cName,
      formatted: parts.join(", "),
    });
  };

  const handleSelectCountry = (c: ICountry) => {
    setSelectedCountryCode(c.isoCode);
    setCountryOpen(false);
    setCountryQuery("");

    // Reset state and city
    const newStates = State.getStatesOfCountry(c.isoCode);
    const defaultState = newStates[0]?.isoCode || "";
    setSelectedStateCode(defaultState);

    let defaultCity = "All Cities";
    if (defaultState) {
      const newCities = City.getCitiesOfState(c.isoCode, defaultState);
      if (newCities.length > 0) defaultCity = newCities[0].name;
    }
    setSelectedCityName(defaultCity);

    notifyChange(c.isoCode, defaultState, defaultCity);
  };

  const handleSelectState = (s: IState) => {
    setSelectedStateCode(s.isoCode);
    setStateOpen(false);
    setStateQuery("");

    const newCities = City.getCitiesOfState(selectedCountryCode, s.isoCode);
    const defaultCity = newCities.length > 0 ? newCities[0].name : "All Cities";
    setSelectedCityName(defaultCity);

    notifyChange(selectedCountryCode, s.isoCode, defaultCity);
  };

  const handleSelectCity = (cName: string) => {
    setSelectedCityName(cName);
    setCityOpen(false);
    setCityQuery("");

    notifyChange(selectedCountryCode, selectedStateCode, cName);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-text-secondary flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span>{label}</span>
          </label>
          <span className="text-[11px] font-mono text-text-tertiary">
            {selectedCityName ? `${selectedCityName}, ` : ""}{currentState?.name || ""}, {currentCountry?.name || ""}
          </span>
        </div>
      )}

      <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-3" : "md:grid-cols-3"} gap-2.5`}>
        {/* 1. Country Selector */}
        <div className="relative" ref={countryRef}>
          <button
            type="button"
            onClick={() => setCountryOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-bg-surface border border-border-default hover:border-border-subtle text-xs font-medium text-text-primary transition-colors focus:outline-none focus:border-accent"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-base leading-none">{currentCountry?.flag || "🌐"}</span>
              <span className="truncate">{currentCountry?.name || "Select Country"}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-tertiary shrink-0 ml-1" />
          </button>

          {countryOpen && (
            <div className="absolute z-50 mt-1 w-full max-h-64 rounded-md bg-bg-surface border border-border-default shadow-lg flex flex-col overflow-hidden">
              <div className="p-2 border-b border-border-subtle flex items-center gap-2 bg-bg-base">
                <Search className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <input
                  type="text"
                  placeholder="Filter countries..."
                  value={countryQuery}
                  onChange={(e) => setCountryQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-border-subtle">
                {filteredCountries.map((c) => (
                  <button
                    key={c.isoCode}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className="w-full px-3 py-2 flex items-center justify-between text-xs text-left hover:bg-bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="text-text-primary truncate">{c.name}</span>
                    </div>
                    {c.isoCode === selectedCountryCode && (
                      <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. State / Region Selector */}
        <div className="relative" ref={stateRef}>
          <button
            type="button"
            disabled={!selectedCountryCode || states.length === 0}
            onClick={() => setStateOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-bg-surface border border-border-default hover:border-border-subtle text-xs font-medium text-text-primary transition-colors focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="truncate">
              {currentState?.name || (states.length === 0 ? "No states" : "Select State")}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-tertiary shrink-0 ml-1" />
          </button>

          {stateOpen && (
            <div className="absolute z-50 mt-1 w-full max-h-64 rounded-md bg-bg-surface border border-border-default shadow-lg flex flex-col overflow-hidden">
              <div className="p-2 border-b border-border-subtle flex items-center gap-2 bg-bg-base">
                <Search className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <input
                  type="text"
                  placeholder="Filter states..."
                  value={stateQuery}
                  onChange={(e) => setStateQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-border-subtle">
                {filteredStates.map((s) => (
                  <button
                    key={s.isoCode}
                    type="button"
                    onClick={() => handleSelectState(s)}
                    className="w-full px-3 py-2 flex items-center justify-between text-xs text-left hover:bg-bg-surface-hover transition-colors"
                  >
                    <span className="text-text-primary truncate">{s.name}</span>
                    {s.isoCode === selectedStateCode && (
                      <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. City Selector */}
        <div className="relative" ref={cityRef}>
          <button
            type="button"
            disabled={!selectedStateCode}
            onClick={() => setCityOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-bg-surface border border-border-default hover:border-border-subtle text-xs font-medium text-text-primary transition-colors focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="truncate">
              {selectedCityName || "All Cities"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-tertiary shrink-0 ml-1" />
          </button>

          {cityOpen && (
            <div className="absolute z-50 mt-1 w-full max-h-64 rounded-md bg-bg-surface border border-border-default shadow-lg flex flex-col overflow-hidden">
              <div className="p-2 border-b border-border-subtle flex items-center gap-2 bg-bg-base">
                <Search className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <input
                  type="text"
                  placeholder="Filter cities..."
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-border-subtle">
                <button
                  type="button"
                  onClick={() => handleSelectCity("All Cities")}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs text-left font-medium text-accent hover:bg-bg-surface-hover transition-colors"
                >
                  <span>All Cities in {currentState?.name || "State"}</span>
                  {selectedCityName === "All Cities" && (
                    <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-1" />
                  )}
                </button>

                {filteredCities.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleSelectCity(c.name)}
                    className="w-full px-3 py-2 flex items-center justify-between text-xs text-left hover:bg-bg-surface-hover transition-colors"
                  >
                    <span className="text-text-primary truncate">{c.name}</span>
                    {c.name === selectedCityName && (
                      <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-1" />
                    )}
                  </button>
                ))}

                {filteredCities.length === 0 && (
                  <div className="p-3 text-center text-xs text-text-tertiary">
                    No cities found matching query.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
