import React from 'react'
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Modal } from '@/components/ui/Modal'
import { CTA_BUTTON_VISIBLE_IMAGE_STYLE } from '@/components/ui/buttonArt'
import { boxShadow } from '@/constants/styleEffects'
import { urPanelColors, urTextColors, urTextVariants, urTheme } from '@/constants/urTheme'
import { HOME_FREDOKA_FONT_FAMILY, HOME_GROBOLD_FONT_FAMILY } from '@/src/home/homeTheme'
import { useAuth } from '@/src/auth/useAuth'
import { submitFeedback } from '@/services/feedback'
import {
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_TYPES,
  type FeedbackMatchContext,
  type FeedbackReportedUser,
  type FeedbackSourcePage,
  type FeedbackType,
} from '@/shared/feedback'

const ctaButtonArt = require('../../assets/buttons/cta_button.png')
const lightButtonArt = require('../../assets/buttons/button_light_cropped.png')

const BUTTON_HEIGHT = 54
const BUTTON_CORNER_RADIUS = Math.round(BUTTON_HEIGHT * 0.34)

type FeedbackComposerModalProps = {
  visible: boolean
  sourcePage: FeedbackSourcePage
  onClose: () => void
  initialType?: FeedbackType | null
  matchContext?: FeedbackMatchContext | null
  reportedUser?: FeedbackReportedUser | null
}

const FEEDBACK_TYPE_HINTS: Record<FeedbackType, string> = {
  bug: 'Something broke or behaved oddly.',
  feature_request: 'A quality-of-life idea or new capability.',
  player_report: 'A conduct issue, exploit, or abuse report.',
}

export function FeedbackComposerModal({
  visible,
  sourcePage,
  onClose,
  initialType = null,
  matchContext = null,
  reportedUser = null,
}: FeedbackComposerModalProps) {
  const { user } = useAuth()
  const [type, setType] = React.useState<FeedbackType | null>(initialType)
  const [message, setMessage] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!visible) {
      return
    }

    setType(initialType)
    setMessage('')
    setErrorMessage(null)
    setIsSubmitting(false)
  }, [visible, initialType, matchContext?.matchId, reportedUser?.userId, sourcePage])

  const trimmedMessage = message.trim()

  const handleSubmit = async () => {
    if (!user) {
      setErrorMessage('You need to be signed in to send feedback.')
      return
    }

    if (!type) {
      setErrorMessage('Pick a category before sending.')
      return
    }

    if (!trimmedMessage) {
      setErrorMessage('Write a message before sending.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await submitFeedback({
        type,
        message: trimmedMessage,
        sourcePage,
        matchContext,
        reportedUser,
        submitter: {
          userId: user.id,
          username: user.username,
          provider: user.provider,
          nakamaUserId: user.nakamaUserId ?? null,
        },
      })
      onClose()
    } catch (submissionError) {
      setErrorMessage(
        submissionError instanceof Error ? submissionError.message : 'Unable to send feedback right now.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} title="Send Feedback" maxWidth={480}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.chipRow}>
            {FEEDBACK_TYPES.map((option) => {
              const selected = option === type

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setType(option)
                    setErrorMessage(null)
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                    {FEEDBACK_TYPE_LABELS[option]}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          {type ? <Text style={styles.categoryHint}>{FEEDBACK_TYPE_HINTS[type]}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Message</Text>
          <TextInput
            accessibilityLabel="Feedback message"
            placeholder="Tell us what happened or what you'd like to see."
            placeholderTextColor="rgba(230, 211, 163, 0.32)"
            multiline
            value={message}
            onChangeText={(text) => {
              setMessage(text)
              if (errorMessage) {
                setErrorMessage(null)
              }
            }}
            style={styles.textArea}
            textAlignVertical="top"
          />
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {user ? (
          <Text style={styles.submitterNote}>Sending as {user.username}</Text>
        ) : null}

        <View style={styles.buttonStack}>
          {/* Send — CTA button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send feedback"
            disabled={isSubmitting}
            onPress={() => { void handleSubmit() }}
            style={({ pressed, hovered }) => [
              styles.button,
              hovered && !isSubmitting ? styles.buttonHovered : null,
              pressed && !isSubmitting ? styles.buttonPressed : null,
              isSubmitting ? styles.buttonDisabled : null,
            ]}
          >
            {({ pressed }) => (
              <ImageBackground
                source={ctaButtonArt}
                resizeMode="stretch"
                style={styles.buttonFrame}
                imageStyle={[
                  styles.ctaButtonImage,
                  pressed && !isSubmitting ? styles.buttonImagePressed : null,
                  isSubmitting ? styles.buttonImageDisabled : null,
                ]}
              >
                {isSubmitting ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color={urTheme.colors.ivory} size="small" />
                    <Text style={styles.ctaLabel}>Sending…</Text>
                  </View>
                ) : (
                  <Text style={styles.ctaLabel}>Send Feedback</Text>
                )}
              </ImageBackground>
            )}
          </Pressable>

          {/* Cancel — light stone button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            style={({ pressed, hovered }) => [
              styles.button,
              hovered ? styles.buttonHovered : null,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            {({ pressed }) => (
              <ImageBackground
                source={lightButtonArt}
                resizeMode="stretch"
                style={styles.buttonFrame}
                imageStyle={[
                  styles.lightButtonImage,
                  pressed ? styles.buttonImagePressed : null,
                ]}
              >
                <Text style={styles.lightLabel}>Cancel</Text>
              </ImageBackground>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const buttonWebStyle = Platform.select({
  web: {
    cursor: 'pointer' as const,
    transitionDuration: '160ms',
    transitionProperty: 'transform, opacity',
    userSelect: 'none' as const,
    willChange: 'transform',
  },
  default: {},
}) ?? {}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    gap: urTheme.spacing.md,
  },
  section: {
    gap: urTheme.spacing.xs,
  },
  sectionLabel: {
    fontFamily: HOME_GROBOLD_FONT_FAMILY,
    ...urTextVariants.caption,
    color: urTextColors.captionOnScene,
    fontSize: 11,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: urPanelColors.darkBorder,
    backgroundColor: urPanelColors.darkSurfaceSoft,
    ...boxShadow({
      color: '#000',
      opacity: 0.18,
      offset: { width: 0, height: 2 },
      blurRadius: 4,
      elevation: 2,
    }),
  },
  chipSelected: {
    backgroundColor: 'rgba(244, 197, 66, 0.14)',
    borderColor: urPanelColors.darkBorderStrong,
  },
  chipPressed: {
    transform: [{ translateY: 1 }],
  },
  chipLabel: {
    fontFamily: HOME_GROBOLD_FONT_FAMILY,
    ...urTextVariants.buttonLabel,
    color: 'rgba(230, 211, 163, 0.6)',
    fontSize: 11,
    lineHeight: 13,
  },
  chipLabelSelected: {
    color: urTextColors.captionOnScene,
  },
  categoryHint: {
    fontFamily: HOME_FREDOKA_FONT_FAMILY,
    color: 'rgba(230, 211, 163, 0.62)',
    fontSize: 13,
    lineHeight: 18,
  },
  textArea: {
    minHeight: 120,
    borderRadius: urTheme.radii.md,
    borderWidth: 1.5,
    borderColor: urPanelColors.darkBorder,
    backgroundColor: 'rgba(21, 15, 8, 0.52)',
    color: urTextColors.bodyOnScene,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    fontFamily: HOME_FREDOKA_FONT_FAMILY,
    fontSize: 15,
    lineHeight: 21,
  },
  errorText: {
    fontFamily: HOME_FREDOKA_FONT_FAMILY,
    color: urTextColors.statusDanger,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitterNote: {
    fontFamily: HOME_FREDOKA_FONT_FAMILY,
    color: 'rgba(230, 211, 163, 0.44)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  buttonStack: {
    gap: urTheme.spacing.sm,
    marginTop: urTheme.spacing.xs,
  },
  button: {
    width: 220,
    alignSelf: 'center',
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_CORNER_RADIUS,
    ...buttonWebStyle,
  },
  buttonHovered: {
    transform: [{ translateY: -1 }],
  },
  buttonPressed: {
    transform: [{ translateY: 2 }],
  },
  buttonDisabled: {
    opacity: 0.68,
  },
  buttonFrame: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.md,
    borderRadius: BUTTON_CORNER_RADIUS,
    overflow: 'hidden',
  },
  ctaButtonImage: {
    ...CTA_BUTTON_VISIBLE_IMAGE_STYLE,
    borderRadius: BUTTON_CORNER_RADIUS,
  },
  lightButtonImage: {
    width: '100%',
    height: '100%',
    borderRadius: BUTTON_CORNER_RADIUS,
  },
  buttonImagePressed: {
    opacity: 0.96,
  },
  buttonImageDisabled: {
    opacity: 0.62,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: urTheme.spacing.xs,
  },
  ctaLabel: {
    fontFamily: HOME_GROBOLD_FONT_FAMILY,
    ...urTextVariants.buttonLabel,
    color: urTheme.colors.ivory,
    fontSize: 15,
    lineHeight: 17,
    textShadowColor: 'rgba(86, 42, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1.5,
  },
  lightLabel: {
    fontFamily: HOME_GROBOLD_FONT_FAMILY,
    ...urTextVariants.buttonLabel,
    color: urTheme.colors.ivory,
    fontSize: 15,
    lineHeight: 17,
  },
})
