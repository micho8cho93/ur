import { create } from 'zustand';

type TournamentUiStore = {
  revision: number;
  bumpRevision: () => void;
};

export const useTournamentUiStore = create<TournamentUiStore>((set) => ({
  revision: 0,
  bumpRevision: () =>
    set((state) => ({
      revision: state.revision + 1,
    })),
}));
