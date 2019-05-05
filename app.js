const express = require("express");
const logger = require("morgan");
const uuid = require("uuid");
const path = require("path");
const cors = require("cors");

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http)

app.use(logger("dev"));

app.use((req,res,next) => {
    res.sendFile(path.join(__dirname + "/index.html"));
})
app.use(cors())
let canvas_info = { height: 463, width: 870}

const rect_rect_collision = (rect1,rect2) => {
    if (rect1 && rect2) {
        var rect1_over_rect2_vertical = (rect1.y + rect1.h < rect2.y)
        var rect1_below_rect2_vertical = (rect1.y > rect2.y + rect2.h)
        var rect1_over_rect2_horizontal = (rect1.x + rect1.w < rect2.x)
        var rect1_below_rect2_horizontal = (rect1.x > rect2.x + rect2.w)
        if (!(rect1_over_rect2_vertical || rect1_below_rect2_vertical ||
            rect1_over_rect2_horizontal || rect1_below_rect2_horizontal)) {
            return true;
        } else {
            return false;
        }
    }
}
let players = {}

const SWEARS = [
    "YOU SUCK!",
    "LoL",
    "Kiddo go somewhere else",
    "YOU SUCK!",
    "LoL",
    "Kiddo go somewhere else",
    "YOU SUCK!",
    "LoL",
    "Kiddo go somewhere else",
    "YOU SUCK!"
]

const CONGRATULATIONS = [
    "YOU ROCK",
    "GOOD JOB",
    "Lol, at least let him breathe",
    "Don't feel BAD, bullies get the bitches",
    "YOU ROCK",
    "GOOD JOB",
    "Lol, at least let him breathe",
    "Don't feel BAD, bullies get the bitches"
]
const speed = 10;
const max_bullets = 5;

setInterval(() => {
    for (var x in players){
        let player = players[x];
        if (player.controls["ArrowRight"]) player.position.x += speed;
        if (player.controls["ArrowLeft"]) player.position.x -= speed;
        if (player.controls["ArrowUp"]) player.position.y -= speed;
        if (player.controls["ArrowDown"]) player.position.y += speed;
        if (player.controls["a"] || player.controls["d"]) {
            if (player.bullets.length < max_bullets){
                player.bullets.push({
                    x: player.position.x,
                    y: player.position.y,
                    h: 5,
                    w: 5,
                    velocity_x: player.controls["a"] ? -speed*3 : speed*3,
                    velocity_y: 0
                })
            }
        }
        for (var x in player.bullets) {
            let current_bullet = player.bullets[x]
            for (var y in players){
                if (players[y].id !== player.id){
                    player_rect = {
                        ...players[y], ...players[y].position
                    }
                    if (rect_rect_collision(player_rect,current_bullet)){
                        let congrats_random_index = Math.round(Math.random() * CONGRATULATIONS.length)
                        let swears_random_index = Math.round(Math.random() * SWEARS.length)
                        if (!players[y].congratulations.length){
                            let add_swear = {
                                message: SWEARS[swears_random_index],
                                x: Math.random() * canvas_info.width,
                                y: Math.random() * canvas_info.height
                            } 
                            players[y].swears.push(add_swear)
                        } else {
                            players[y].congratulations.splice(player.congratulations.length - 1);
                        }
                        if (!player.swears.length){
                            let current_congratulations = player.congratulations;
                            let add_congratulation = {
                                message: CONGRATULATIONS[congrats_random_index],
                                x: Math.random() * canvas_info.width,
                                y: Math.random() * canvas_info.height
                            }
                            player.congratulations.push(add_congratulation);
                        } else {
                            console.log(player.swears);
                            player.swears.splice(player.swears.length - 1);
                            console.log(player.swears);
                        }
                    }
                }
            }
            if (current_bullet){
                if (current_bullet.x > canvas_info.width ||
                    current_bullet.x < 0
                ){
                    player.bullets = player.bullets.filter(
                        bullet => bullet.x !== current_bullet.x && bullet.y !== current_bullet.y
                    )
                } else {
                    current_bullet.x += current_bullet.velocity_x;
                    current_bullet.x += current_bullet.velocity_y;
                }
            }
        }

        let date = player.last_prevented_timeout
        let current = new Date();
        let clone = new Date(date);
        clone.setSeconds( clone.getSeconds() + 15);
        if (clone.getTime() < current.getTime()){
            console.log("KILLLL")
            delete players[x];  
        }
    }
    io.emit("players_info", players)
},50)

io.on("connection",socket => {
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    console.log("connected");
    socket.use((packet,next) => {
        next();
    })
    socket.on("prevent_timeout",data => {
        if (players[data.id]){
            players[data.id]["last_prevented_timeout"] = new Date();
        }
    })
    socket.on("join_game",data => {
        players_length = Object.keys(players).length
        let player = {
            id: uuid(), h: 20, w: 20,
            swears: [], congratulations:[],
            position: { 
                x: 50 + (50 * players_length),
                y: 150,
        },controls:{},last_prevented_timeout:new Date(),bullets:[]}
        players[player.id] = player
        io.emit("player_info",player);    
    })
    socket.on("get_players_info", () => {
        io.emit("players_info", players)
    })
    socket.on("ArrowRight", data => {
        let player_id = data.player.id
        players[player_id]["controls"][data.key] = data.type === "keydown" ? true : false
        io.emit("players_info", players)
    })
    socket.on("ArrowLeft", data => {
        let player_id = data.player.id
        players[player_id]["controls"][data.key] = data.type === "keydown" ? true : false
        io.emit("players_info", players)
    })
    socket.on("ArrowUp", data => {
        let player_id = data.player.id
        players[player_id]["controls"][data.key] = data.type === "keydown" ? true : false
        io.emit("players_info", players)
    })
    socket.on("ArrowDown", data => {
        let player_id = data.player.id
        players[player_id]["controls"][data.key] = data.type === "keydown" ? true : false
        io.emit("players_info", players)
    })
    socket.on("a", data => {
        let player_id = data.player.id;
        players[player_id]["controls"]["a"] = data.type === "keydown" ? true : false
    })
    socket.on("d", data => {
        let player_id = data.player.id;
        players[player_id]["controls"]["d"] = data.type === "keydown" ? true : false
    })
    socket.on("send_message", data => {
        io.emit("new_message",data);
    })
})

const PORT = 8000
let server = http.listen(PORT,() => console.log(`running on port ${PORT}`));