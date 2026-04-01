import { act, renderHook, screen } from '@testing-library/react-native';
import React from 'react';

import { ScreenTransitionProvider, useScreenTransition } from './ScreenTransitionContext';

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
};

describe('ScreenTransitionProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs the action after the configured countdown and keeps the overlay visible while counting down', async () => {
    const action = jest.fn();
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <ScreenTransitionProvider>{children}</ScreenTransitionProvider>
    );
    const { result } = renderHook(() => useScreenTransition(), { wrapper });
    let transitionPromise: Promise<boolean> | null = null;

    await act(async () => {
      transitionPromise = result.current({
        title: 'Preparing Board',
        message: 'Opening the next match.',
        countdownSeconds: 3,
        preActionDelayMs: 0,
        postActionDelayMs: 0,
        action,
      });
      await Promise.resolve();
    });

    expect(screen.getByText('Preparing Board')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1_000);
      await Promise.resolve();
    });

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText('2')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1_000);
      await Promise.resolve();
    });

    expect(screen.getByText('1')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1_000);
      await Promise.resolve();
    });

    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(260);
      await Promise.resolve();
    });

    await act(async () => {
      await transitionPromise;
    });
  });

  it('stays mounted through an async action and hides after the action resolves', async () => {
    const action = jest.fn();
    const deferred = createDeferred<void>();
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <ScreenTransitionProvider>{children}</ScreenTransitionProvider>
    );
    const { result } = renderHook(() => useScreenTransition(), { wrapper });

    let transitionPromise: Promise<boolean> | null = null;

    await act(async () => {
      transitionPromise = result.current({
        title: 'Returning Home',
        message: 'Closing the board.',
        preActionDelayMs: 0,
        postActionDelayMs: 0,
        action: () => {
          action();
          return deferred.promise;
        },
      });
      await Promise.resolve();
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Returning Home')).toBeTruthy();

    await act(async () => {
      deferred.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Returning Home')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(260);
    });

    await act(async () => {
      await transitionPromise;
    });

    expect(screen.queryByText('Returning Home')).toBeNull();
  });

  it('ignores overlapping transition requests while one is already active', async () => {
    const deferred = createDeferred<void>();
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <ScreenTransitionProvider>{children}</ScreenTransitionProvider>
    );
    const { result } = renderHook(() => useScreenTransition(), { wrapper });
    let firstTransitionPromise: Promise<boolean> | null = null;

    await act(async () => {
      firstTransitionPromise = result.current({
        title: 'Opening Private Table',
        message: 'Seating both players.',
        preActionDelayMs: 0,
        postActionDelayMs: 0,
        action: () => deferred.promise,
      });
      await Promise.resolve();
    });

    let didRun = true;

    await act(async () => {
      didRun = await result.current({
        title: 'Match Found',
        message: 'Preparing the board.',
        preActionDelayMs: 0,
        postActionDelayMs: 0,
      });
    });

    expect(didRun).toBe(false);

    await act(async () => {
      deferred.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(260);
      await firstTransitionPromise;
    });
  });
});
