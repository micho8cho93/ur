import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SlotDiceScene } from './SlotDiceScene';
import {
  buildSlotDiceFaces,
  SLOT_DICE_TOTAL_STOP_MS,
} from './slotDiceShared';

const animatedLandingDurationMs = SLOT_DICE_TOTAL_STOP_MS + 240;

const getMarkedCount = () =>
  Array.from({ length: 4 }, (_, index) => screen.getByTestId(`slot-die-${index}`))
    .filter((node) => node.props.accessibilityValue?.text === 'marked')
    .length;

const getStripStep = (index: number) => {
  const stripStyle = StyleSheet.flatten(screen.getByTestId(`slot-die-strip-${index}`).props.style) as {
    transform?: { translateY?: number | { __getValue?: () => number } }[];
  };
  const reelStyle = StyleSheet.flatten(screen.getByTestId(`slot-die-${index}`).props.style) as {
    height: number;
  };
  const translateYValue = stripStyle.transform?.find(
    (transform) => 'translateY' in transform,
  )?.translateY;
  const translateY =
    typeof translateYValue === 'number'
      ? translateYValue
      : typeof translateYValue?.__getValue === 'function'
        ? translateYValue.__getValue()
        : 0;

  return -translateY / reelStyle.height;
};

describe('SlotDiceScene', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([0, 1, 2, 3, 4])('maps roll %s to the correct number of marked dice', (rollValue) => {
    const faces = buildSlotDiceFaces({
      playbackId: 17,
      rollValue,
    });

    expect(faces.filter(Boolean)).toHaveLength(rollValue);
    expect(faces).toHaveLength(4);
  });

  it('keeps the marked layout deterministic for the same playback and roll', () => {
    const first = buildSlotDiceFaces({
      playbackId: 42,
      rollValue: 3,
    });
    const second = buildSlotDiceFaces({
      playbackId: 42,
      rollValue: 3,
    });

    expect(second).toEqual(first);
  });

  it('can start spinning without a result and later settle on the resolved roll', () => {
    const view = render(
      <SlotDiceScene
        playbackId={7}
        durationMs={720}
        rollValue={null}
        variant="animated"
      />,
    );

    expect(getMarkedCount()).toBe(0);

    act(() => {
      jest.advanceTimersByTime(220);
    });

    const spinningCount = getMarkedCount();
    expect(spinningCount).toBeGreaterThan(0);

    view.rerender(
      <SlotDiceScene
        playbackId={7}
        durationMs={720}
        rollValue={2}
        variant="animated"
      />,
    );

    act(() => {
      jest.advanceTimersByTime(animatedLandingDurationMs);
    });

    expect(getMarkedCount()).toBe(2);
  });

  it('notifies once when the reels finish settling on the resolved roll', () => {
    const onSettled = jest.fn();
    const view = render(
      <SlotDiceScene
        playbackId={11}
        durationMs={720}
        rollValue={null}
        variant="animated"
        onSettled={onSettled}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(220);
    });

    view.rerender(
      <SlotDiceScene
        playbackId={11}
        durationMs={720}
        rollValue={3}
        variant="animated"
        onSettled={onSettled}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(animatedLandingDurationMs);
    });

    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('keeps rendering the strip after an animated result lands', () => {
    render(
      <SlotDiceScene
        playbackId={19}
        durationMs={720}
        rollValue={2}
        variant="animated"
      />,
    );

    act(() => {
      jest.advanceTimersByTime(animatedLandingDurationMs);
    });

    expect(screen.getByTestId('slot-die-strip-0')).toBeTruthy();
    expect(screen.queryByTestId('slot-die-face-0')).toBeNull();
  });

  it('anchors the reel strip to the top edge so stop offsets land on full faces', () => {
    render(
      <SlotDiceScene
        playbackId={21}
        durationMs={720}
        rollValue={2}
        variant="settled"
      />,
    );

    const stripStyle = StyleSheet.flatten(screen.getByTestId('slot-die-strip-0').props.style) as {
      left?: number;
      position?: string;
      right?: number;
      top?: number;
    };

    expect(stripStyle.position).toBe('absolute');
    expect(stripStyle.top).toBe(0);
    expect(stripStyle.left).toBe(0);
    expect(stripStyle.right).toBe(0);
  });

  it('keeps the reel window transparent while enlarging the die art and border treatment', () => {
    render(
      <SlotDiceScene
        playbackId={22}
        durationMs={720}
        rollValue={null}
        variant="start"
      />,
    );

    const reelStyle = StyleSheet.flatten(screen.getByTestId('slot-die-0').props.style) as {
      backgroundColor?: string;
      borderWidth?: number;
      height: number;
      width: number;
    };
    const imageStyle = StyleSheet.flatten(screen.getByTestId('slot-die-image-0').props.style) as {
      height: number;
      width: number;
    };

    expect(reelStyle.backgroundColor).toBe('transparent');
    expect(reelStyle.borderWidth).toBe(3.2);
    expect(reelStyle.height).toBeGreaterThan(56);
    expect(reelStyle.width).toBeGreaterThan(56);
    expect(imageStyle.height).toBe(72);
    expect(imageStyle.width).toBe(72);
  });

  it('scales the stage reels down to fit a narrow board-gap lane', () => {
    render(
      <SlotDiceScene
        playbackId={24}
        durationMs={720}
        presentation="stage"
        rollValue={2}
        variant="settled"
      />,
    );

    fireEvent(screen.getByTestId('slot-dice-scene-root'), 'layout', {
      nativeEvent: {
        layout: {
          width: 148,
          height: 76,
        },
      },
    });

    const reelStyle = StyleSheet.flatten(screen.getByTestId('slot-die-0').props.style) as {
      height: number;
      width: number;
    };

    expect(reelStyle.width).toBeLessThanOrEqual(36);
    expect(reelStyle.height).toBeLessThanOrEqual(36);
  });

  it('keeps the strip render path when an animated roll transitions into settled state', () => {
    const view = render(
      <SlotDiceScene
        playbackId={23}
        durationMs={720}
        rollValue={2}
        variant="animated"
      />,
    );

    act(() => {
      jest.advanceTimersByTime(animatedLandingDurationMs);
    });

    view.rerender(
      <SlotDiceScene
        playbackId={23}
        durationMs={720}
        rollValue={2}
        variant="settled"
      />,
    );

    expect(screen.getByTestId('slot-die-strip-0')).toBeTruthy();
    expect(screen.queryByTestId('slot-die-face-0')).toBeNull();
  });

  it('snaps every reel to a whole-face stop when animated playback is promoted to settled', () => {
    const view = render(
      <SlotDiceScene
        playbackId={29}
        durationMs={720}
        rollValue={2}
        variant="animated"
      />,
    );

    view.rerender(
      <SlotDiceScene
        playbackId={29}
        durationMs={720}
        rollValue={2}
        variant="settled"
      />,
    );

    Array.from({ length: 4 }, (_, index) => {
      expect(getStripStep(index)).toBeGreaterThanOrEqual(16);
      expect(getStripStep(index)).toBeLessThanOrEqual(17);
    });
    expect(getMarkedCount()).toBe(2);
  });
});
