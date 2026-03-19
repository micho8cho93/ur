import { useContext } from 'react';

import { ProgressionContext } from './ProgressionContext';

export const useProgression = () => {
  const progressionContext = useContext(ProgressionContext);

  if (!progressionContext) {
    throw new Error('useProgression must be used within a ProgressionProvider.');
  }

  return progressionContext;
};
