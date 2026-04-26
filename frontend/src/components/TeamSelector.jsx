const TeamSelector = ({ teams = [], teamId, setTeam }) => {

  return (
    <div>
      <label>Select Team</label>
      <select value={teamId} onChange={(e) => setTeam(e.target.value)}>
        <option value="">-- Select Team --</option>
        {teams.map(team => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TeamSelector;