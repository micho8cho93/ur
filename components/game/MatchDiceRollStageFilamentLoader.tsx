/* eslint-disable @typescript-eslint/no-require-imports */

import React, { useEffect, useRef } from 'react';
import { Platform, TurboModuleRegistry } from 'react-native';
import type { MatchDiceRollStageFilamentProps } from './MatchDiceRollStageFilament.shared';

type FilamentStageComponent = React.ComponentType<MatchDiceRollStageFilamentProps>;

type FilamentStageResolution = {
  component: FilamentStageComponent;
  error: Error | null;
};

const NullFilamentStage: FilamentStageComponent = () => null;

let cachedResolution: FilamentStageResolution | null = null;

const missingNativeModuleError = (moduleName: 'FilamentModule' | 'Worklets') =>
  new Error(
    `Filament dice renderer unavailable because the native ${moduleName} module is missing from this ${Platform.OS} binary.`,
  );

const getTurboModule = (moduleName: string) => {
  try {
    return TurboModuleRegistry.get(moduleName);
  } catch {
    return null;
  }
};

export const hasNativeMatchDiceRollStageSupport = () =>
  Platform.OS === 'ios' && !!getTurboModule('Worklets') && !!getTurboModule('FilamentModule');

const resolveFilamentStage = (): FilamentStageResolution => {
  if (cachedResolution) {
    return cachedResolution;
  }

  if (Platform.OS !== 'ios') {
    cachedResolution = {
      component: NullFilamentStage,
      error: new Error('Filament dice renderer is only enabled on iOS.'),
    };
    return cachedResolution;
  }

  if (!getTurboModule('Worklets')) {
    cachedResolution = {
      component: NullFilamentStage,
      error: missingNativeModuleError('Worklets'),
    };
    return cachedResolution;
  }

  if (!getTurboModule('FilamentModule')) {
    cachedResolution = {
      component: NullFilamentStage,
      error: missingNativeModuleError('FilamentModule'),
    };
    return cachedResolution;
  }

  try {
    const module = require('./MatchDiceRollStageFilament.ios') as {
      MatchDiceRollStageFilament?: FilamentStageComponent;
    };
    const component = module.MatchDiceRollStageFilament ?? NullFilamentStage;

    cachedResolution = {
      component,
      error:
        component === NullFilamentStage
          ? new Error('Filament dice renderer did not export a usable component.')
          : null,
    };
  } catch (error) {
    cachedResolution = {
      component: NullFilamentStage,
      error: error instanceof Error ? error : new Error('Failed to load the Filament dice renderer.'),
    };
  }

  return cachedResolution;
};

export const MatchDiceRollStageFilament: React.FC<MatchDiceRollStageFilamentProps> = (props) => {
  const { onError } = props;
  const resolutionRef = useRef(resolveFilamentStage());
  const hasReportedRef = useRef(false);

  useEffect(() => {
    if (hasReportedRef.current || !resolutionRef.current.error) {
      return;
    }

    hasReportedRef.current = true;
    onError(resolutionRef.current.error);
  }, [onError]);

  const Component = resolutionRef.current.component;
  return <Component {...props} />;
};
