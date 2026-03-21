import { useContext } from 'react';

import { EloContext } from './EloContext';

export const useEloRating = () => {
  const eloContext = useContext(EloContext);

  if (!eloContext) {
    throw new Error('useEloRating must be used within an EloRatingProvider.');
  }

  return eloContext;
};
