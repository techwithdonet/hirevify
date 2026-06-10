/**
 * Demo Enhanced ATS Scanner - Standalone Demo Page
 * Phase 1 Implementation Showcase
 */

import React from 'react';
import { EnhancedProductionATSScanner } from './components/EnhancedProductionATSScanner';
import { Toaster } from './components/ui/sonner';

export default function DemoEnhancedATS() {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedProductionATSScanner />
      <Toaster />
    </div>
  );
}