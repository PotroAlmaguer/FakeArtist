const socket = io();

window.onload = function() {
    changeScreen("home");
};

// Función para cambiar a la pantalla de Crear Sala
function goToCreateRoom() {
    socket.emit("createRoom", (roomCode) => {
        document.getElementById("new-room-code").innerText = roomCode;
        changeScreen("create-room");
    });
}

// Función para cambiar a la pantalla de Unirse a Sala
function goToJoinRoom() {
    changeScreen("join-room");
}

// Función para volver a la pantalla de Inicio
function goHome() {
    changeScreen("home");
}

// Función para registrar el primer jugador en la sala después de crearla
function registerInRoom() {
    const playerName = document.getElementById("create-name").value;
    const roomCode = document.getElementById("new-room-code").innerText;
    socket.emit("joinRoom", roomCode, playerName, (success) => {
        if (success) {
            document.getElementById("room-code").innerText = roomCode;
            changeScreen("lobby");
        } else {
            alert("Error al registrarse en la sala.");
        }
    });
}

// Función para unirse a una sala existente
function joinRoom() {
    const roomCode = document.getElementById("join-code").value;
    const playerName = document.getElementById("join-name").value;
    socket.emit("joinRoom", roomCode, playerName, (success) => {
        if (success) {
            document.getElementById("room-code").innerText = roomCode;
            changeScreen("lobby");
        } else {
            alert("No se pudo unir a la sala.");
        }
    });
}

// Escucha el evento "assignRole" para asignar el rol y la palabra o categoría
socket.on("assignRole", ({ category, word, isFakeArtist }) => {
    changeScreen("draw");

    const roleMessage = document.getElementById("role-message");
    const wordMessage = document.getElementById("word-message");

    if (isFakeArtist) {
        roleMessage.textContent = "Tú eres el Fake Artist";
        wordMessage.textContent = `Categoría: ${category}`;
    } else {
        roleMessage.textContent = "Tú eres un Artista";
        wordMessage.textContent = `Categoría: ${category}, Palabra: ${word}`;
    }
});

// Escucha el evento "updatePlayers" para actualizar la lista de jugadores
socket.on("updatePlayers", (players) => {
    const playersList = document.getElementById("players-list");
    playersList.innerHTML = ""; // Limpia la lista actual
    
    players.forEach((player) => {
        const listItem = document.createElement("li");
        listItem.textContent = player.name;
        playersList.appendChild(listItem);
    });
    
    document.getElementById("start-btn").disabled = players.length < 5;
});

// Función para iniciar el juego
function startGame() {
    const roomCode = document.getElementById("room-code").innerText;
    socket.emit("startGame", roomCode);
}

// Cambia la pantalla visible
function changeScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
    document.getElementById(screenId + "-screen").classList.add("active");
}
