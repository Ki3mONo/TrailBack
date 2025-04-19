import React from 'react';

interface ConfirmationModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-md">
                <p className="mb-4">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Zamknij</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded">Potwierdź</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
