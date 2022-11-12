export default function JoinLobby(publicLobbies) {
    const patternErrorMessage = "Only alphanumeric characters, as well as spaces, dashes, and underscores are allowed."

    return /* html */`
        <div id="join-lobby-container">
            <form id="joinLobbyForm">
                <h1>Join Lobby</h1>
                <div class="form-group">
                    <label>Name</label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        pattern="[A-Za-z0-9 _-]+"
                        maxlength="20"
                        title="${patternErrorMessage}"
                        required />
                </div>
                <div class="form-group">
                    <label>Lobby Code</label>
                    <input 
                        type="text" 
                        id="roomID" 
                        name="roomID" 
                        required />
                </div>
                <div class="form-group-center">
                    <input class="btn btn-wide" type="submit" value="Join" />
                    <button id="backBtn" class="btn">Back</button>
                </div>
            </form>
            <div id="public-container">
                <h1>Public Lobbies</h1>
                <div id="public-list">
                    ${
                        publicLobbies.reduce((total, roomID) => {
                            return total + "\n" + /* html */`
                                <div class="public-list-item">
                                    <code>${roomID}</code>
                                </div>
                            `
                        }, "")
                    }
                </div>
            </div>
        </div>
    `
}