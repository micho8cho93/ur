import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'

import { SketchButton } from '@/components/ui/SketchButton'

type FeedbackFloatingButtonProps = {
  onPress: () => void
  accessibilityLabel?: string
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function FeedbackFloatingButton({
  onPress,
  accessibilityLabel = 'Send feedback',
  disabled = false,
  style,
}: FeedbackFloatingButtonProps) {
  return (
    <SketchButton
      label=""
      accessibilityLabel={accessibilityLabel}
      iconName="flag"
      iconOnly
      sizeScale={1}
      disabled={disabled}
      onPress={onPress}
      style={style}
    />
  )
}
