import { FC } from "react";

interface ConfirmationModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const ConfirmationModal: FC<ConfirmationModalProps> = ({
                                                           message,
                                                           onConfirm,
                                                           onCancel,
                                                           loading,
                                                       }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-md max-w-md w-full">
                <p className="mb-4 text-center">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded"
                        disabled={loading}
                    >
                        Zamknij
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded"
                        disabled={loading}
                    >
                        {loading ? "Usuwanie..." : "Potwierdź"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
