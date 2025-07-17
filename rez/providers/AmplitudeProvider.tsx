import React, { createContext, useContext, useEffect, useRef } from 'react';
import * as amplitude from '@amplitude/analytics-browser';

interface AmplitudeContextType {
  amplitude: typeof amplitude | null;
}

const AmplitudeContext = createContext<AmplitudeContextType>({ amplitude: null });

interface AmplitudeProviderProps {
  children: React.ReactNode;
}

export const AmplitudeProvider: React.FC<AmplitudeProviderProps> = ({ children }) => {
  const amplitudeRef = useRef<typeof amplitude | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

  useEffect(() => {
    if (!amplitudeRef.current && apiKey) {
      amplitude.init(apiKey, {autocapture: true});
      amplitudeRef.current = amplitude;
    }
  }, [apiKey]);

  return (
    <AmplitudeContext.Provider value={{ amplitude: amplitudeRef.current }}>
      {children}
    </AmplitudeContext.Provider>
  );
};

export const useAmplitude = () => useContext(AmplitudeContext); 