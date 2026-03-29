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
  const reelNode = screen.getByTestId(`slot-die-${index}`);
  const accessibleStep = reelNode.props.accessibilityValue?.now;

  if (typeof accessibleStep === 'number') {
    return accessibleStep;
  }

  const stripStyle = StyleSheet.flatten(screen.getByTestId(`slot-die-strip-${index}`).props.style) as {
    transform?: { translateY?: number | { __getValue?: () => number } }[];
  };
  const reelStyle = StyleSheet.flatten(reelNode.props.style) as {
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

  it('uses the same fill viewport for the static face and the landed strip', () => {
    const view = render(
      <SlotDiceScene
        playbackId={30}
        durationMs={720}
        rollValue={null}
        variant="start"
      />,
    );

    const viewportStyle = StyleSheet.flatten(screen.getByTestId('slot-die-viewport-0').props.style) as {
      bottom?: number;
      left?: number;
      position?: string;
      right?: number;
      top?: number;
    };
    const faceStyle = StyleSheet.flatten(screen.getByTestId('slot-die-face-0').props.style) as {
      bottom?: number;
      left?: number;
      position?: string;
      right?: number;
      top?: number;
    };

    expect(viewportStyle.position).toBe('absolute');
    expect(viewportStyle.top).toBe(0);
    expect(viewportStyle.right).toBe(0);
    expect(viewportStyle.bottom).toBe(0);
    expect(viewportStyle.left).toBe(0);
    expect(faceStyle.position).toBe('absolute');
    expect(faceStyle.top).toBe(0);
    expect(faceStyle.right).toBe(0);
    expect(faceStyle.bottom).toBe(0);
    expect(faceStyle.left).toBe(0);

    view.rerender(
      <SlotDiceScene
        playbackId={30}
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
      width?: string;
    };
    const stripCellStyle = StyleSheet.flatten(
      screen.getByTestId('slot-die-strip-cell-0-0').props.style,
    ) as {
      width?: string;
    };

    expect(stripStyle.position).toBe('absolute');
    expect(stripStyle.top).toBe(0);
    expect(stripStyle.left).toBe(0);
    expect(stripStyle.right).toBe(0);
    expect(stripStyle.width).toBe('100%');
    expect(stripCellStyle.width).toBe('100%');
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

  it('can lay the stage reels out in a true vertical stack without rotating strip motion', () => {
    render(
      <SlotDiceScene
        playbackId={25}
        durationMs={720}
        orientation="vertical"
        presentation="stage"
        rollValue={2}
        variant="settled"
      />,
    );

    fireEvent(screen.getByTestId('slot-dice-scene-root'), 'layout', {
      nativeEvent: {
        layout: {
          width: 76,
          height: 148,
        },
      },
    });

    const stackStyle = StyleSheet.flatten(screen.getByTestId('slot-dice-scene-reel-stack').props.style) as {
      flexDirection?: string;
    };
    const stripStyle = StyleSheet.flatten(screen.getByTestId('slot-die-strip-0').props.style) as {
      transform?: { translateY?: number | { __getValue?: () => number } }[];
    };

    expect(stackStyle.flexDirection).toBe('column');
    expect(stripStyle.transform?.some((transform) => 'translateY' in transform)).toBe(true);
  });

  it('can enlarge the reel boxes without enlarging the dice art', () => {
    const view = render(
      <SlotDiceScene
        playbackId={26}
        durationMs={720}
        orientation="vertical"
        presentation="stage"
        rollValue={2}
        variant="settled"
      />,
    );

    fireEvent(screen.getByTestId('slot-dice-scene-root'), 'layout', {
      nativeEvent: {
        layout: {
          width: 76,
          height: 148,
        },
      },
    });

    const baselineReelStyle = StyleSheet.flatten(screen.getByTestId('slot-die-0').props.style) as {
      height: number;
      width: number;
    };
    const baselineImageStyle = StyleSheet.flatten(
      screen.getByTestId('slot-die-strip-image-0-0').props.style,
    ) as {
      height: number;
      width: number;
    };

    view.rerender(
      <SlotDiceScene
        playbackId={26}
        diceImageScale={1 / 1.2}
        durationMs={720}
        orientation="vertical"
        presentation="stage"
        rollValue={2}
        variant="settled"
      />,
    );

    fireEvent(screen.getByTestId('slot-dice-scene-root'), 'layout', {
      nativeEvent: {
        layout: {
          width: 91,
          height: 178,
        },
      },
    });

    const enlargedReelStyle = StyleSheet.flatten(screen.getByTestId('slot-die-0').props.style) as {
      height: number;
      width: number;
    };
    const preservedImageStyle = StyleSheet.flatten(
      screen.getByTestId('slot-die-strip-image-0-0').props.style,
    ) as {
      height: number;
      width: number;
    };

    expect(enlargedReelStyle.width).toBeGreaterThan(baselineReelStyle.width);
    expect(enlargedReelStyle.height).toBeGreaterThan(baselineReelStyle.height);
    expect(Math.abs(preservedImageStyle.width - baselineImageStyle.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(preservedImageStyle.height - baselineImageStyle.height)).toBeLessThanOrEqual(1);
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

  it('keeps every reel on the same landing step when animated playback is promoted to settled', () => {
    const view = render(
      <SlotDiceScene
        playbackId={29}
        durationMs={720}
        rollValue={2}
        variant="animated"
      />,
    );

    act(() => {
      jest.advanceTimersByTime(animatedLandingDurationMs);
    });

    const landingSteps = Array.from({ length: 4 }, (_, index) => getStripStep(index));

    view.rerender(
      <SlotDiceScene
        playbackId={29}
        durationMs={720}
        rollValue={2}
        variant="settled"
      />,
    );

    Array.from({ length: 4 }, (_, index) => {
      expect(getStripStep(index)).toBeCloseTo(landingSteps[index] ?? 0, 5);
    });
    expect(getMarkedCount()).toBe(2);
  });
});
