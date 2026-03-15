import { createContext, useContext, useState } from 'react';

const ScenarioContext = createContext(null);

export function ScenarioProvider({ children }) {
    const [scenario, setScenarioState] = useState(
        () => localStorage.getItem('vbl_scenario') || 'strategic'
    );

    const setScenario = (newScenario) => {
        localStorage.setItem('vbl_scenario', newScenario);
        setScenarioState(newScenario);
    };

    return (
        <ScenarioContext.Provider value={{ scenario, setScenario }}>
            {children}
        </ScenarioContext.Provider>
    );
}

export function useScenario() {
    return useContext(ScenarioContext);
}
