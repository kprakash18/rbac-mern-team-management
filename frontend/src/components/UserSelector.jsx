import { useMemo, useState } from "react";

const UserSelector = ({ users = [], userId, setUser }) => {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [user.name, user.email].some((field) =>
        String(field || "").toLowerCase().includes(query)
      )
    );
  }, [search, users]);

  return (
    <div>
      <label htmlFor="userSearch">Search User</label>
      <input
        id="userSearch"
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <label htmlFor="userSelect">Select User</label>
      <select id="userSelect" value={userId} onChange={(event) => setUser(event.target.value)}>
        <option value="">-- Select User --</option>
        {filteredUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
    </div>
  );
};

export default UserSelector;
