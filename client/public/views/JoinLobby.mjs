export default function JoinLobby(publicLobbies) {
    return /* html */`
        <div id="join-lobby-container">
            <form id="joinLobbyForm">
                <h1>Join Lobby</h1>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="username" name="username" required />
                </div>
                <div class="form-group">
                    <label>Lobby Code</label>
                    <input type="text" id="roomID" name="roomID" required />
                </div>
                <div class="form-group-center">
                    <input class="btn btn-wide" type="submit" value="Join" />
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