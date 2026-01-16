'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useStructureStore, StructureStore } from './structureStore';

// Create standard context
const StructureContext = createContext<StructureStore | null>(null);

export function StructureProvider({ children }: { children: ReactNode }) {
    // Initialize the store hook once at the top level
    const store = useStructureStore();

    return (
        <StructureContext.Provider value={store}>
            {children}
        </StructureContext.Provider>
    );
}

export function useStructure() {
    const context = useContext(StructureContext);
    if (!context) {
        throw new Error('useStructure must be used within a StructureProvider');
    }
    return context;
}
