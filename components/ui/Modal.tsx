import React from 'react';
import { Modal as RNModal, Text, View } from 'react-native';
import { Button } from './Button';

interface ModalProps {
    visible: boolean;
    title: string;
    message: string;
    actionLabel: string;
    onAction: () => void;
}

export const Modal: React.FC<ModalProps> = ({ visible, title, message, actionLabel, onAction }) => {
    return (
        <RNModal transparent visible={visible} animationType="fade">
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            }}>
                <View style={{
                    backgroundColor: '#f3e5ab', // Parchment/museum plaque
                    padding: 32,
                    borderRadius: 12,
                    width: '100%',
                    maxWidth: 400,
                    borderWidth: 6,
                    borderColor: '#78350f', // amber-900
                    borderBottomWidth: 8,
                    borderRightWidth: 7,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.6,
                    shadowRadius: 20,
                    elevation: 20,
                }}>
                    <Text style={{
                        fontSize: 28,
                        fontFamily: 'serif',
                        fontWeight: 'bold',
                        color: '#78350f',
                        marginBottom: 12,
                        textAlign: 'center',
                        letterSpacing: 2,
                    }}>{title}</Text>
                    <Text style={{
                        fontSize: 16,
                        fontFamily: 'serif',
                        color: '#78350f',
                        textAlign: 'center',
                        marginBottom: 24,
                        opacity: 0.9,
                    }}>{message}</Text>

                    <Button title={actionLabel} onPress={onAction} />
                </View>
            </View>
        </RNModal>
    );
};
