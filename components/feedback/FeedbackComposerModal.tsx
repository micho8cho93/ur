import React from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Modal } from '@/components/ui/Modal'
import { boxShadow } from '@/constants/styleEffects'
import { urPanelColors, urTextColors, urTextVariants, urTheme } from '@/constants/urTheme'
import { useAuth } from '@/src/auth/useAuth'
import { submitFeedback } from '@/services/feedback'
import {
  FEEDBACK_SOURCE_PAGE_LABELS,
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_TYPES,
  type FeedbackMatchContext,
  type FeedbackReportedUser,
  type FeedbackSourcePage,
  type FeedbackType,
} from '@/shared/feedback'

type FeedbackComposerModalProps = {
  visible: boolean
  sourcePage: FeedbackSourcePage
  onClose: () => void
  initialType?: FeedbackType | null
  matchContext?: FeedbackMatchContext | null
  reportedUser?: FeedbackReportedUser | null
}

const FEEDBACK_TYPE_HINTS: Record<FeedbackType, string> = {
  bug: 'Something broke, behaved oddly, or blocked play.',
  feature_request: 'A quality-of-life idea or a new capability.',
  player_report: 'A player conduct issue, exploit, or abuse report.',
}

const getCategoryChipLabel = (type: FeedbackType) => FEEDBACK_TYPE_LABELS[type]

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

  const sourceLabel = FEEDBACK_SOURCE_PAGE_LABELS[sourcePage]
  const trimmedMessage = message.trim()

  const handleSubmit = async () => {
    if (!user) {
      setErrorMessage('You need to be signed in to send feedback.')
      return
    }

    if (!type) {
      setErrorMessage('Pick a feedback category before sending.')
      return
    }

    if (!trimmedMessage) {
      setErrorMessage('Write a message before sending feedback.')
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

  const renderedContextItems = [
    { label: 'Source', value: sourceLabel },
    matchContext ? { label: 'Match', value: matchContext.matchId } : null,
    reportedUser ? { label: 'Reported user', value: reportedUser.username } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <Modal
      visible={visible}
      title="Send Feedback"
      message="Share a bug, suggest a feature, or file a player report. Match context is attached automatically when you open this from a live game."
      actionLabel="Send feedback"
      actionLoading={isSubmitting}
      onAction={() => {
        void handleSubmit()
      }}
      secondaryActionLabel="Cancel"
      onSecondaryAction={onClose}
      maxWidth={520}
    >
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <Text style={styles.sectionHint}>Required</Text>
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
                    {getCategoryChipLabel(option)}
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
            placeholder="Tell us what happened, what you expected, or what should improve."
            placeholderTextColor="rgba(75, 85, 99, 0.72)"
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

        <View style={styles.contextSection}>
          <Text style={styles.contextTitle}>Context</Text>
          <View style={styles.contextCard}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contextChipRow}
            >
              {renderedContextItems.map((item) => (
                <View key={item.label} style={styles.contextChip}>
                  <Text style={styles.contextChipLabel}>{item.label}</Text>
                  <Text numberOfLines={1} style={styles.contextChipValue}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {user ? (
          <Text style={styles.submitterNote}>
            Sending as {user.username}
            {user.nakamaUserId ? ` · ${user.nakamaUserId}` : ''}
          </Text>
        ) : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    gap: urTheme.spacing.md,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    ...urTextVariants.body,
    color: urTextColors.titleOnScene,
    fontWeight: '700',
  },
  sectionHint: {
    marginTop: -4,
    color: 'rgba(85, 63, 33, 0.68)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(141, 103, 47, 0.3)',
    backgroundColor: 'rgba(255, 247, 225, 0.72)',
  },
  chipPressed: {
    transform: [{ translateY: 1 }],
  },
  chipSelected: {
    backgroundColor: 'rgba(200, 152, 32, 0.16)',
    borderColor: 'rgba(200, 152, 32, 0.86)',
  },
  chipLabel: {
    ...urTextVariants.buttonLabel,
    color: '#5A4420',
    fontSize: 12,
    lineHeight: 14,
  },
  chipLabelSelected: {
    color: '#40290E',
  },
  categoryHint: {
    color: 'rgba(75, 63, 39, 0.82)',
    fontSize: 13,
    lineHeight: 18,
  },
  textArea: {
    minHeight: 140,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(141, 103, 47, 0.22)',
    backgroundColor: '#FFF8EA',
    color: '#311E0D',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 21,
  },
  contextSection: {
    gap: 8,
  },
  contextTitle: {
    ...urTextVariants.body,
    color: urTextColors.titleOnScene,
    fontWeight: '700',
  },
  contextCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: urPanelColors.darkBorder,
    backgroundColor: 'rgba(255, 249, 236, 0.82)',
    padding: 12,
    ...boxShadow({
      color: '#000',
      opacity: 0.08,
      offset: { width: 0, height: 4 },
      blurRadius: 8,
      elevation: 2,
    }),
  },
  contextChipRow: {
    gap: 10,
  },
  contextChip: {
    minWidth: 110,
    maxWidth: 180,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(200, 152, 32, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200, 152, 32, 0.18)',
    gap: 2,
  },
  contextChipLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: 'rgba(75, 63, 33, 0.7)',
  },
  contextChipValue: {
    color: '#311E0D',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#9B1C1C',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  submitterNote: {
    color: 'rgba(75, 63, 33, 0.68)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
})
