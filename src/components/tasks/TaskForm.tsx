import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Input from '../common/Input';
import Button from '../common/Button';

interface TaskFormValues {
    title: string;
    description: string;
}

interface TaskFormProps {
    onSubmit: (values: TaskFormValues) => void;
    initialValues?: TaskFormValues;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, initialValues }) => {
    const [title, setTitle] = useState(initialValues ? initialValues.title : '');
    const [description, setDescription] = useState(initialValues ? initialValues.description : '');

    const handleSubmit = () => {
        onSubmit({ title, description });
        setTitle('');
        setDescription('');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Task Form</Text>
            <Input
                placeholder="Task Title"
                value={title}
                onChangeText={setTitle}
            />
            <Input
                placeholder="Task Description"
                value={description}
                onChangeText={setDescription}
            />
            <Button label="Submit" onPress={handleSubmit} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});

export default TaskForm;