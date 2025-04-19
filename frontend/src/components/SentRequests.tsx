const SentRequests = ({
                          outgoingRequests,
                          users,
                      }: {
    outgoingRequests: any[];
    users: any[];
}) => {
    if (outgoingRequests.length === 0) return null;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Wysłane zaproszenia</h2>
            <ul className="space-y-2">
                {outgoingRequests.map((req) => {
                    const receiver = users.find((u) => u.id === req.friend_id);
                    return receiver ? (
                        <li key={receiver.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                                <p className="font-medium">{receiver.full_name || "Nieznany użytkownik"}</p>
                                <p className="text-sm text-gray-500">@{receiver.username}</p>
                                <p className="text-sm text-gray-400">{receiver.email}</p>
                            </div>
                            <span className="text-yellow-500 font-medium">⌛ Oczekuje</span>
                        </li>
                    ) : null;
                })}
            </ul>
        </div>
    );
};

export default SentRequests;
