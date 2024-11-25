// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Permitir todas las solicitudes, o especifica la URL del front-end
        methods: ["GET", "POST"]
    }
});

// Sirve archivos estáticos desde la carpeta "public"
app.use(express.static("public"));

// Objeto para almacenar los datos de las salas de juego
const rooms = {};

// Ejemplo de categorías y palabras en server.js
const categories = {
  "Tecnología": ["Ordenador", "Teléfono", "Tablet", "Televisión", "Cámara", "Impresora", "Consola", "Router", "Monitor", "Teclado", "Smartwatch", "Altavoz inteligente", "Dron", "Proyector", "Escáner", "Disco duro", "Memoria USB", "Smart TV", "Cámara de seguridad", "Termostato inteligente"],
  "Animales": ["Perro", "Gato", "Elefante", "León", "Tigre", "Caballo", "Oso", "Conejo", "Delfín", "Águila", "Jirafa", "Cebra", "Pingüino", "Canguro", "Koala", "Rinoceronte", "Hipopótamo", "Lobo", "Zorro", "Tortuga"],
  "Frutas": ["Manzana", "Plátano", "Naranja", "Fresa", "Uva", "Mango", "Piña", "Sandía", "Melón", "Kiwi", "Pera", "Cereza", "Papaya", "Durazno", "Granada", "Frambuesa", "Mora", "Limón", "Lima", "Coco"],
  "Países": ["Estados Unidos", "Canadá", "Brasil", "India", "China", "Japón", "Alemania", "Francia", "Italia", "Australia", "España", "México", "Argentina", "Rusia", "Sudáfrica", "Egipto", "Turquía", "Grecia", "Suecia", "Noruega"],
  "Profesiones": ["Doctor", "Ingeniero", "Maestro", "Abogado", "Enfermera", "Arquitecto", "Policía", "Bombero", "Chef", "Piloto", "Dentista", "Veterinario", "Electricista", "Carpintero", "Plomero", "Contador", "Diseñador", "Fotógrafo", "Escritor", "Psicólogo"],
  "Deportes": ["Fútbol", "Baloncesto", "Tenis", "Natación", "Atletismo", "Voleibol", "Béisbol", "Golf", "Boxeo", "Ciclismo", "Rugby", "Esquí", "Surf", "Patinaje", "Hockey", "Esgrima", "Gimnasia", "Remo", "Escalada", "Karate"],
  "Comida": ["Pizza", "Hamburguesa", "Sushi", "Pasta", "Ensalada", "Tacos", "Pan", "Sopa", "Helado", "Chocolate", "Burrito", "Paella", "Curry", "Empanada", "Quiche", "Risotto", "Ceviche", "Falafel", "Galleta", "Crepe"],
  "Vehículos": ["Coche", "Bicicleta", "Motocicleta", "Autobús", "Tren", "Avión", "Barco", "Camión", "Helicóptero", "Submarino", "Tractor", "Patinete", "Yate", "Monopatín", "Caravana", "Globo aerostático", "Limusina", "Tranvía", "Scooter", "Nave espacial"],
  "Instrumentos Musicales": ["Guitarra", "Piano", "Violín", "Batería", "Flauta", "Saxofón", "Trompeta", "Arpa", "Acordeón", "Clarinete", "Ukelele", "Banjo", "Mandolina", "Oboe", "Trombón", "Tuba", "Marimba", "Xilófono", "Cítara", "Laúd"]
};

// Maneja la conexión de nuevos usuarios
io.on("connection", (socket) => {
    console.log("Nuevo usuario conectado:", socket.id);

    // Crear una nueva sala
    socket.on("createRoom", (callback) => {
        const roomCode = Math.random().toString(36).slice(2, 6).toUpperCase();
        console.log(`Sala creada con código: ${roomCode}`);
        callback(roomCode);
    });

    // Unirse a una sala existente
    socket.on("joinRoom", (roomCode, playerName, callback) => {
        console.log("Evento joinRoom recibido. Código de sala:", roomCode, "Nombre del jugador:", playerName);

        // Verificar si la sala existe
        if (rooms[roomCode]) { 
            const room = rooms[roomCode];
               // Verificar si el jugador ya está en la sala
            const playerExists = room.players.some(player => player.id === socket.id);
        if (!playerExists) {
            // Agregar el jugador a la sala
            room.players.push({ id: socket.id, name: playerName });
            socket.join(roomCode);

            // Emitir lista actualizada de jugadores
            io.in(roomCode).emit("updatePlayers", room.players);
            console.log("Jugador añadido:", playerName, "a la sala:", roomCode);
            callback(true); // Respuesta de éxito
        } else {
            console.warn("El jugador ya está en la sala.");
            callback(false); // Jugador ya registrado
        }
    } else {
        console.error("Sala no encontrada:", roomCode);
        callback(false); // Sala no encontrada
    }
});
    
    // Iniciar el juego
    socket.on("startGame", (roomCode) => {
      const room = rooms[roomCode];
      if (room && room.players.length >= 5) {
          // Selecciona una categoría y una palabra al azar
          const category = Object.keys(categories)[Math.floor(Math.random() * Object.keys(categories).length)];
          const word = categories[category][Math.floor(Math.random() * categories[category].length)];
  
          // Selecciona aleatoriamente al "Fake Artist"
          room.fakeArtist = Math.floor(Math.random() * room.players.length);
  
          // Envía la categoría y palabra a todos los jugadores excepto al "Fake Artist"
          room.players.forEach((player, index) => {
              if (index === room.fakeArtist) {
                  // Envía solo la categoría al Fake Artist
                  io.to(player.id).emit("assignRole", { category, isFakeArtist: true });
              } else {
                  // Envía la categoría y la palabra a los demás jugadores
                  io.to(player.id).emit("assignRole", { category, word, isFakeArtist: false });
              }
          });
  
          // Emitir evento para indicar que el juego ha comenzado
          io.in(roomCode).emit("gameStarted", room.fakeArtist);
      }
  });
  

    // Manejar la desconexión de un jugador
    socket.on("disconnect", () => {
        console.log("Usuario desconectado:", socket.id);
        for (let roomCode in rooms) {
            rooms[roomCode].players = rooms[roomCode].players.filter(
                (player) => player.id !== socket.id
            );
            io.in(roomCode).emit("updatePlayers", rooms[roomCode].players);
        }
    });
});

const PORT = process.env.PORT || 3000; // Usar el puerto que Render asigna
server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

