import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';

type FilterValue = 'all' | 'completed' | 'pending';

interface FilterOption {
    label: string;
    value: FilterValue;
}

interface TaskFilterProps {
    selectedFilter: FilterValue;
    onFilterChange: (filter: FilterValue) => void;
}

const filterOptions: FilterOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
];

const TaskFilter: React.FC<TaskFilterProps> = ({ selectedFilter, onFilterChange }) => {
    const [modalVisible, setModalVisible] = useState(false);

    const selectedLabel = filterOptions.find((opt: FilterOption) => opt.value === selectedFilter)?.label || 'All';

    const handleSelect = (value: FilterValue): void => {
        onFilterChange(value);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Filter Tasks:</Text>
            <Pressable
                style={styles.picker}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.pickerText}>{selectedLabel}</Text>
            </Pressable>
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <FlatList
                            data={filterOptions}
                            keyExtractor={(item: FilterOption) => item.value}
                            renderItem={({ item }: { item: FilterOption }) => (
                                <Pressable
                                    style={[
                                        styles.option,
                                        item.value === selectedFilter && styles.optionSelected,
                                    ]}
                                    onPress={() => handleSelect(item.value)}
                                >
                                    <Text style={styles.optionText}>{item.label}</Text>
                                </Pressable>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    picker: {
        height: 50,
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    pickerText: {
        fontSize: 16,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        minWidth: 200,
    },
    option: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    optionSelected: {
        backgroundColor: '#e0e0e0',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
});

export default TaskFilter;