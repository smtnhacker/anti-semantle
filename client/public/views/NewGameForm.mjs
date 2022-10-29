export default function NewGameForm() {
    return /* html */`
        <form id="new-game-form">
            <h1>New Game</h1>
            <div class="form-group">
                <label>
                    Your Nickname
                </label>
                <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    required 
                />
            </div>
            <div class="form-group">
                <label>Room Name</label>
                <input type="text" id="roomname" name="roomname" required />
            </div>
            <div id="room-settings">
                <strong>Room Settings</strong>
                <div class="form-group">
                    <div class="checkbox-group">
                        <label>Public</label>
                        <input type="checkbox" id="public" name="public" />
                        <div class="subtitle">This will make the room appear in the public lobbies.</div>
                    </div>
                </div>
            </div>
            <div class="form-group-center">
                <input type="submit" value="Create Game" class="btn" />
            </div>
        </form>
    `
}